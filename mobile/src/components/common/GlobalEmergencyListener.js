import React, { useEffect, useState, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Linking, Platform, Vibration,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../../utils/constants';
import { COLORS } from '../../theme/colors';
import { playEmergencySiren, stopEmergencySiren } from '../../utils/soundPlayer';
import { clearSosState, checkActiveSos } from '../../redux/slices/sosSlice';

export default function GlobalEmergencyListener() {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [alarmData, setAlarmData] = useState(null);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const socketRef = useRef(null);
  const dismissedSosIdsRef = useRef(new Set());

  useEffect(() => {
    if (!user) return;

    const serverUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(serverUrl, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      timeout: 10000,
    });
    socketRef.current = socket;

    const registerRooms = () => {
      const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : null;
      const userEmail = user.email ? user.email.trim().toLowerCase() : null;
      const role = String(user.role || '').toUpperCase();

      socket.emit('register-user', {
        email: userEmail,
        phone: cleanPhone,
        role: user.role,
      });

      if (userEmail) {
        socket.emit('join-room', `user:${userEmail}`);
      }
      if (cleanPhone) {
        socket.emit('join-room', `user:${cleanPhone}`);
        if (cleanPhone.length >= 10) {
          socket.emit('join-room', `user:${cleanPhone.slice(-10)}`);
        }
      }
      if (role.includes('ADMIN') || role.includes('SUPER_ADMIN')) {
        socket.emit('join-room', 'admin-ops');
      }
      if (user.organizationId) {
        socket.emit('join-room', `org_${user.organizationId}`);
      }
    };

    socket.on('connect', () => {
      registerRooms();
    });

    socket.on('reconnect', () => {
      registerRooms();
    });

    socket.on('connect_error', () => {
      // Graceful error silencing
    });

    // 🚨 WHEN ANYONE TRIGGERS SOS:
    socket.on('SOS_ALARM_BROADCAST', (data) => {
      const sosId = data?.sosId || data?.id || data?.sosSessionId;
      if (sosId && dismissedSosIdsRef.current.has(String(sosId))) {
        return;
      }

      // Suppress siren for victim who triggered SOS (self-safety)
      const currentId = user?.id || user?._id;
      const victimId = data?.victimId;
      const victimEmail = (data?.victimEmail || '').trim().toLowerCase();
      const victimPhone = (data?.victimPhone || '').replace(/\D/g, '');
      const userEmail = (user?.email || '').trim().toLowerCase();
      const userPhone = (user?.phone || '').replace(/\D/g, '');

      const isVictim =
        (currentId && victimId && String(currentId) === String(victimId)) ||
        (userEmail && victimEmail && userEmail === victimEmail) ||
        (userPhone && victimPhone && userPhone.slice(-10) === victimPhone.slice(-10));

      if (isVictim) {
        return;
      }

      setAlarmData(data);
      setIsSirenPlaying(true);
      playEmergencySiren(true);
    });

    // 🛑 WHEN SOS IS RESOLVED / STOPPED:
    socket.on('SOS_ALARM_STOP', () => {
      stopEmergencySiren();
      setIsSirenPlaying(false);
      setAlarmData(null);
      dispatch(clearSosState());
      dispatch(checkActiveSos());
    });

    // 👨‍👩‍👧 WHEN PARENT SENDS A SAFETY CHECK-IN PING:
    socket.on('PARENT_CHECKIN_PING', (data) => {
      Alert.alert(
        '🛡️ Safety Check-in Request',
        `${data?.parentName || 'Your Parent'} sent a safety check-in request. Please confirm you are safe.`,
        [{ text: 'I AM SAFE & OK', style: 'default' }]
      );
    });

    // 📍 WHEN LIVE LOCATION COORDINATES UPDATE FOR ACTIVE SOS:
    socket.on('SOS_LOCATION_UPDATE', (data) => {
      if (!data?.sosSessionId) return;
      setAlarmData((prev) => {
        if (!prev) return prev;
        const currentSosId = prev.sosId || prev.id || prev.sosSessionId;
        if (currentSosId && parseInt(currentSosId, 10) === parseInt(data.sosSessionId, 10)) {
          return {
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy || 10,
          };
        }
        return prev;
      });
    });


    return () => {
      socket.disconnect();
      stopEmergencySiren();
    };
  }, [user, dispatch]);

  const handleToggleSiren = () => {
    if (isSirenPlaying) {
      stopEmergencySiren();
      setIsSirenPlaying(false);
    } else {
      playEmergencySiren(true);
      setIsSirenPlaying(true);
    }
  };

  const handleDismiss = () => {
    stopEmergencySiren();
    setIsSirenPlaying(false);
    const sosId = alarmData?.sosId || alarmData?.id;
    if (sosId) {
      dismissedSosIdsRef.current.add(String(sosId));
    }
    setAlarmData(null);
  };

  const handleOpenMap = () => {
    if (alarmData?.latitude && alarmData?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${alarmData.latitude},${alarmData.longitude}`;
      Linking.openURL(url).catch(() => {});
    } else if (alarmData?.trackingUrl) {
      Linking.openURL(alarmData.trackingUrl).catch(() => {});
    }
  };

  if (!alarmData) return null;

  const victimName = alarmData.victimName || alarmData.userName || 'Member';
  const victimPhone = alarmData.victimPhone || alarmData.phone || '—';

  return (
    <Modal
      visible={!!alarmData}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* TOP ACCENT LINE */}
          <LinearGradient
            colors={['#FF2A6D', '#FF5C8A', '#E01A4F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accentBar}
          />

          {/* DISMISS BUTTON */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
            <Ionicons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* ICON & TITLE */}
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#FF2A6D', '#D91B55']}
              style={styles.iconCircle}
            >
              <Ionicons name="warning" size={38} color="#fff" />
            </LinearGradient>
          </View>

          <View style={styles.badge}>
            <Ionicons name="flash" size={12} color="#fff" />
            <Text style={styles.badgeText}>CRITICAL EMERGENCY BROADCAST</Text>
          </View>

          <Text style={styles.title}>EMERGENCY SOS ALERT!</Text>
          <Text style={styles.subtitle}>
            <Text style={{ fontWeight: '900', color: COLORS.textDark }}>{victimName}</Text> has triggered an emergency SOS panic button!
          </Text>

          {/* DETAILS BOX */}
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Victim Name:</Text>
              <Text style={styles.detailVal}>{victimName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Contact Phone:</Text>
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${victimPhone}`)}>
                <Text style={[styles.detailVal, { color: COLORS.primary }]}>📞 {victimPhone}</Text>
              </TouchableOpacity>
            </View>
            {alarmData.latitude && alarmData.longitude && (
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.detailLabel}>GPS Coordinates:</Text>
                <Text style={styles.detailVal}>
                  {Number(alarmData.latitude).toFixed(4)}, {Number(alarmData.longitude).toFixed(4)}
                </Text>
              </View>
            )}
          </View>

          {/* ACTIONS */}
          <View style={styles.btnCol}>
            <TouchableOpacity
              style={[styles.actionBtn, isSirenPlaying ? styles.muteBtn : styles.unmuteBtn]}
              onPress={handleToggleSiren}
              activeOpacity={0.85}
            >
              <Ionicons name={isSirenPlaying ? "volume-mute" : "volume-high"} size={18} color="#fff" />
              <Text style={styles.btnText}>
                {isSirenPlaying ? 'MUTE SIREN SOUND' : 'PLAY EMERGENCY SIREN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapBtn}
              onPress={handleOpenMap}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={18} color="#fff" />
              <Text style={styles.btnText}>OPEN LIVE LOCATION TRACK</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={handleDismiss}
              activeOpacity={0.85}
            >
              <Text style={styles.dismissBtnText}>DISMISS ALERT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 8, 38, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 20,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrap: {
    marginTop: 8,
    marginBottom: 12,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FF2A6D',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  btnCol: {
    width: '100%',
    gap: 10,
  },
  actionBtn: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  muteBtn: {
    backgroundColor: '#059669',
  },
  unmuteBtn: {
    backgroundColor: '#FF2A6D',
  },
  mapBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  dismissBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
});
