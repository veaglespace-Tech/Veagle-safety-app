import { Platform } from 'react-native';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sosApi } from '../../api/sosApi';
import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from '../../services/backgroundLocationService';
import { sendEmergencySmsToAll } from '../../services/smsService';

// Identical thunks as web app's sosSlice with resilient Offline SOS Fallback
export const startEmergencySos = createAsyncThunk('sos/startEmergencySos', async (payload, { rejectWithValue, getState }) => {
  try {
    const data = await sosApi.startSos(payload);
    const session = data?.sosSession || data?.session || data?.data || data?.sos || data;

    // Start GPS background tracking immediately
    if (session?.id) {
      startBackgroundLocationTracking(session.id).catch(() => {});
    }

    // Fire & forget: Send background SMS from device SIM to all emergency contacts
    // This runs in parallel — does NOT block SOS activation or UI
    if (session?.emergencyContacts && session.emergencyContacts.length > 0) {
      sendEmergencySmsToAll({
        emergencyContacts: session.emergencyContacts,
        victimName: session.victimName || payload?.victimName || '',
        trackingUrl: session.trackingUrl || '',
        latitude: session.latitude || payload?.initialLat || null,
        longitude: session.longitude || payload?.initialLng || null,
        delayMs: Platform.OS === 'ios' ? 4500 : 0,
      }).then((result) => {
        console.log(`📱 [SOS] Emergency SMS dispatch result: ${result?.sent || 0} sent, ${result?.failed || 0} failed`);
      }).catch((err) => {
        console.warn('[SOS] Emergency SMS dispatch error (non-critical):', err?.message);
      });
    }

    return session;
  } catch (err) {
    const isNetworkError = !err?.response || String(err?.message || '').toLowerCase().includes('network') || err?.code === 'ERR_NETWORK';
    if (isNetworkError) {
      console.warn('⚠️ [SOS] Network offline — activating Emergency Offline SOS Fallback via native SIM SMS...');
      const state = getState();
      const localContacts = state?.contacts?.contacts || [];
      const currentUser = state?.auth?.user;
      const lastLat = payload?.initialLat || state?.location?.latitude || 18.5204;
      const lastLng = payload?.initialLng || state?.location?.longitude || 73.8567;
      const victimName = currentUser?.fullName || currentUser?.name || payload?.victimName || 'Sakhi Member';

      const offlineContacts = localContacts.length > 0
        ? localContacts.map((c) => ({ name: c.name, phone: c.phone }))
        : (currentUser?.emergencyContactPhone ? [{ name: currentUser.emergencyContactName || 'Guardian', phone: currentUser.emergencyContactPhone }] : []);

      const offlineGmapUrl = `https://www.google.com/maps?q=${lastLat},${lastLng}`;

      if (offlineContacts.length > 0) {
        sendEmergencySmsToAll({
          emergencyContacts: offlineContacts,
          victimName: `${victimName} [OFFLINE SOS]`,
          trackingUrl: offlineGmapUrl,
          latitude: lastLat,
          longitude: lastLng,
          delayMs: Platform.OS === 'ios' ? 2500 : 0,
        }).catch((smsErr) => console.warn('[OfflineSOS] SMS dispatch notice:', smsErr?.message));
      }

      const offlineSession = {
        id: `offline-${Date.now()}`,
        isOffline: true,
        status: 'ACTIVE',
        isSilent: !!payload?.isSilent,
        startedAt: new Date().toISOString(),
        trackingUrl: offlineGmapUrl,
        googleMapsUrl: offlineGmapUrl,
        latitude: lastLat,
        longitude: lastLng,
        victimName,
        emergencyContacts: offlineContacts,
      };

      startBackgroundLocationTracking(offlineSession.id).catch(() => {});
      return offlineSession;
    }

    return rejectWithValue(err.response?.data?.error || 'Failed to activate Emergency SOS');
  }
});

export const resolveEmergencySos = createAsyncThunk('sos/resolveEmergencySos', async (sosSessionId, { rejectWithValue, getState }) => {
  try {
    const state = getState();
    if (state?.sos?.activeSession?.isOffline || String(sosSessionId).startsWith('offline-')) {
      stopBackgroundLocationTracking().catch(() => {});
      return { id: sosSessionId, status: 'RESOLVED', isOffline: true };
    }
    const data = await sosApi.resolveSos(sosSessionId);
    stopBackgroundLocationTracking().catch(() => {});
    return data?.session || data?.sosSession || data?.data || data;
  } catch (err) {
    stopBackgroundLocationTracking().catch(() => {});
    return { id: sosSessionId, status: 'RESOLVED', isOffline: true };
  }
});

export const checkActiveSos = createAsyncThunk('sos/checkActiveSos', async (_, { rejectWithValue }) => {
  try {
    const data = await sosApi.fetchActiveSos();
    const session = data?.session || data?.sosSession || data?.data || data?.sos || data;
    return session?.id ? session : (data?.id ? data : null);
  } catch (err) {
    return rejectWithValue(null);
  }
});

const sosSlice = createSlice({
  name: 'sos',
  initialState: {
    activeSession: null,
    isTriggering: false,
    isResolving: false,
    isAlarmPlaying: false,
    lastTriggeredAt: null,
    mutedSosIds: [],
    error: null,
  },
  reducers: {
    clearSosState: (state) => {
      state.activeSession = null;
      state.isTriggering = false;
      state.isResolving = false;
      state.isAlarmPlaying = false;
      state.error = null;
    },
    toggleSosMute: (state, action) => {
      const id = String(action.payload);
      if (state.mutedSosIds.includes(id)) {
        state.mutedSosIds = state.mutedSosIds.filter((x) => x !== id);
      } else {
        state.mutedSosIds.push(id);
      }
    },
    muteSos: (state, action) => {
      const id = String(action.payload);
      if (!state.mutedSosIds.includes(id)) {
        state.mutedSosIds.push(id);
      }
    },
    toggleAlarm: (state) => {
      state.isAlarmPlaying = !state.isAlarmPlaying;
    },
    setAlarmState: (state, action) => {
      state.isAlarmPlaying = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startEmergencySos.pending, (state) => {
        state.isTriggering = true;
        state.lastTriggeredAt = Date.now();
        state.error = null;
      })
      .addCase(startEmergencySos.fulfilled, (state, action) => {
        state.isTriggering = false;
        state.activeSession = action.payload;
        state.isAlarmPlaying = false;
        state.lastTriggeredAt = Date.now();
      })
      .addCase(startEmergencySos.rejected, (state, action) => {
        state.isTriggering = false;
        state.error = action.payload;
      })
      .addCase(resolveEmergencySos.pending, (state) => {
        state.isResolving = true;
      })
      .addCase(resolveEmergencySos.fulfilled, (state) => {
        state.isResolving = false;
        state.activeSession = null;
        state.isAlarmPlaying = false;
      })
      .addCase(resolveEmergencySos.rejected, (state, action) => {
        state.isResolving = false;
        state.error = action.payload;
      })
      .addCase(checkActiveSos.fulfilled, (state, action) => {
        state.activeSession = action.payload;
      });
  },
});

export const { clearSosState, toggleSosMute, muteSos, toggleAlarm, setAlarmState } = sosSlice.actions;
export default sosSlice.reducer;
