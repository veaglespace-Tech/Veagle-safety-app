import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sosApi } from '../api/sosApi.js';

export const startEmergencySos = createAsyncThunk(
  'sos/startEmergencySos',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await sosApi.startSos(payload);
      return data.sosSession;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to activate Emergency SOS');
    }
  }
);

export const resolveEmergencySos = createAsyncThunk(
  'sos/resolveEmergencySos',
  async (sosSessionId, { rejectWithValue }) => {
    try {
      const data = await sosApi.resolveSos(sosSessionId);
      return data.session;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to resolve Emergency SOS');
    }
  }
);

export const checkActiveSos = createAsyncThunk(
  'sos/checkActiveSos',
  async (_, { rejectWithValue }) => {
    try {
      const data = await sosApi.fetchActiveSos();
      return data.session;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch active session');
    }
  }
);

const sosSlice = createSlice({
  name: 'sos',
  initialState: {
    activeSession: null,
    isTriggering: false,
    isResolving: false,
    isAlarmPlaying: false,
    mutedSosIds: [],
    error: null,
  },
  reducers: {
    clearSosState: (state) => {
      state.activeSession = null;
      state.isTriggering = false;
      state.isResolving = false;
      state.error = null;
    },
    toggleSosMute: (state, action) => {
      const id = String(action.payload);
      if (state.mutedSosIds.includes(id)) {
        state.mutedSosIds = state.mutedSosIds.filter(x => x !== id);
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
        state.error = null;
      })
      .addCase(startEmergencySos.fulfilled, (state, action) => {
        state.isTriggering = false;
        state.activeSession = action.payload;
        state.isAlarmPlaying = true;
      })
      .addCase(startEmergencySos.rejected, (state, action) => {
        state.isTriggering = false;
        state.error = action.payload;
      })

      .addCase(resolveEmergencySos.pending, (state) => {
        state.isResolving = true;
        state.error = null;
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
