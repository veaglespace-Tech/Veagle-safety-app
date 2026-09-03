import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Alert, ActivityIndicator, Share, Modal, Vibration,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as Clipboard from 'expo-clipboard';
import { resolveEmergencySos, toggleAlarm } from '../../redux/slices/sosSlice';
import { COLORS } from '../../theme/colors';

export default function ActiveSOSScreen({ navigation }) {
  const dispatch = useDispatch();
  const { activeSession, isAlarmPlaying, isResolving } = useSelector((state) => state.sos);
  const { latitude = 18.5204, longitude = 73.8567, accuracy = 10 } = useSelector((state) => state.location);
  const { user } = useSelector((state) => state.auth);

  const [elapsed, setElapsed] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const hasOpenedWhatsApp = useRef(false);

    useEffect(() => {
    if (!activeSession) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
      return;
    }

    const startTime = new Date(activeSession.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [activeSession]);

  if (!activeSession) return null;

  const formatElapsed = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleMarkSafe = async () => {
    try {
      await dispatch(resolveEmergencySos(activeSession.id)).unwrap();
      setShowConfirmModal(false);
    } catch (e) {
      Alert.alert("Error", e?.message || e || "Failed to resolve SOS");
      setShowConfirmModal(false);
    }
  };

  const copyTrackingLink = async () => {
    if (activeSession?.trackingUrl) {
      await Clipboard.setStringAsync(activeSession.trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareOnWhatsApp = () => {
    const victimName = user?.fullName || 'Sakhi Member';
    const victimPhone = user?.phone || '';
    const gmapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const message = `🚨 SAKHI EMERGENCY SOS ALERT!\n\nVictim: ${victimName}\nPhone: ${victimPhone}\n\n📍 GPS Coordinates:\nLat: ${latitude}, Lng: ${longitude}\n\n👉 Live Location Tracking:\n${activeSession?.trackingUrl || ''}\n\n🌐 Google Maps:\n${gmapUrl}`;
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Share.share({ message });
    });
  };

  const firstName = (user?.fullName || user?.name || 'User').split(' ')[0];

  return (
    <SafeAreaView style={styles.safe}>
      {/* EMERGENCY TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Ionicons name="warning" size={22} color="#fff" />
          <View>
            <Text style={styles.topBarTitle}>🚨 SOS ACTIVE</Text>
            <Text style={styles.topBarSub}>Alerting trusted contacts</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.timerChip}>
            <Ionicons name="time" size={12} color="#fff" />
            <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* LIVE TRACKING MAP */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={{
              latitude: latitude || 18.5204,
              longitude: longitude || 73.8567,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
            pitchEnabled={false}
          >
            <Marker coordinate={{ latitude: latitude || 18.5204, longitude: longitude || 73.8567 }}>
              <View style={styles.mapMarker}>
                <Ionicons name="warning" size={16} color="#fff" />
              </View>
            </Marker>
            <Circle
              center={{ latitude: latitude || 18.5204, longitude: longitude || 73.8567 }}
              radius={accuracy || 10}
              fillColor="rgba(255, 42, 109, 0.2)"
              strokeColor="rgba(255, 42, 109, 0.8)"
            />
          </MapView>
          <View style={styles.mapOverlayPill}>
            <View style={styles.liveDot} />
            <Text style={styles.mapOverlayText}>LIVE TRACKING ENABLED</Text>
          </View>
        </View>

        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          {[
            { icon: 'location', label: 'GPS Accuracy', value: `±${accuracy || '--'}m` },
            { icon: 'people', label: 'Notified', value: '3 Contacts' },
            { icon: 'time', label: 'Duration', value: formatElapsed(elapsed) },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Ionicons name={stat.icon} size={18} color={COLORS.primary} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* LIVE TRACKING LINK */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Tracking Link</Text>
          <View style={styles.trackingRow}>
            <Text style={styles.trackingUrl} numberOfLines={1}>{activeSession.trackingUrl}</Text>
            <TouchableOpacity
              onPress={copyTrackingLink}
              style={[styles.copyBtn, copied && styles.copyBtnCopied]}
              activeOpacity={0.85}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={15} color="#fff" />
              <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          {/* WHATSAPP SHARE */}
          <TouchableOpacity style={styles.whatsappBtn} onPress={shareOnWhatsApp} activeOpacity={0.85}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.whatsappBtnText}>SHARE SOS DETAILS ON WHATSAPP</Text>
            <Ionicons name="share-outline" size={16} color="#fff" />
          </TouchableOpacity>

          {/* Individual WhatsApp alerts */}
          {activeSession?.whatsappAlerts?.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.waDirectTitle}>Direct WhatsApp to Guardians:</Text>
              <View style={styles.waChips}>
                {activeSession.whatsappAlerts.map((wa, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.waChip}
                    onPress={() => Linking.openURL(wa.whatsappUrl)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="logo-whatsapp" size={13} color={COLORS.whatsapp} />
                    <Text style={styles.waChipText}>Send to {wa.contactName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* EMERGENCY ACTIONS */}
        <View style={styles.twoCol}>
          <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL('tel:112')} activeOpacity={0.85}>
            <Ionicons name="call" size={26} color="#fff" />
            <Text style={styles.callBtnNum}>CALL 112</Text>
            <Text style={styles.callBtnSub}>National Emergency</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactsBtn} onPress={() => Linking.openURL('tel:1091')} activeOpacity={0.85}>
            <Ionicons name="people" size={26} color={COLORS.primaryLight} />
            <Text style={styles.contactsBtnText}>CALL 1091</Text>
            <Text style={styles.contactsBtnSub}>Women Helpline</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.twoCol}>
          <TouchableOpacity
            style={[styles.alarmBtn, isAlarmPlaying && styles.alarmBtnActive]}
            onPress={() => dispatch(toggleAlarm())}
            activeOpacity={0.85}
          >
            <Ionicons name={isAlarmPlaying ? 'volume-mute' : 'volume-high'} size={20} color={isAlarmPlaying ? '#fff' : COLORS.primary} />
            <Text style={[styles.alarmBtnText, isAlarmPlaying && { color: '#fff' }]}>
              {isAlarmPlaying ? 'STOP ALARM' : 'SOUND ALARM'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.safeBtn}
            onPress={() => setShowConfirmModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
            <Text style={styles.safeBtnText}>I'M SAFE NOW</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* CONFIRM SAFE MODAL */}
      <Modal visible={showConfirmModal} transparent animationType="fade" onRequestClose={() => setShowConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm You're Safe</Text>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.safeIconWrap}>
                <Ionicons name="shield-checkmark" size={36} color={COLORS.success} />
              </View>
              <Text style={styles.modalConfirmTitle}>Are you completely safe?</Text>
              <Text style={styles.modalConfirmSub}>
                This will stop live location tracking, deactivate the emergency link, and send a "safe" notification to all your trusted contacts.
              </Text>

              <TouchableOpacity
                style={[styles.confirmSafeBtn, isResolving && styles.confirmSafeBtnDisabled]}
                onPress={handleMarkSafe}
                disabled={isResolving}
                activeOpacity={0.85}
              >
                {isResolving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmSafeBtnText}>YES — I'M SAFE NOW</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.cancelSafeBtn}>
                <Text style={styles.cancelSafeBtnText}>Cancel — Keep Tracking Active</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF5F7' },

  // TOP BAR
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 14 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarTitle: { fontSize: 14, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  topBarSub: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  timerText: { fontSize: 12, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'] },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 12 },

  // MAP
  mapContainer: { width: '100%', height: 220, borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: COLORS.primaryBorder, backgroundColor: '#fff', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  map: { flex: 1 },
  mapMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 5 },
  mapOverlayPill: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  mapOverlayText: { fontSize: 10, fontWeight: '800', color: COLORS.textDark, letterSpacing: 0.5 },

  // STATS
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 16, padding: 12, alignItems: 'center', gap: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  statValue: { fontSize: 13, fontWeight: '900', color: COLORS.textDark },
  statLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  // CARD
  card: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 20, padding: 16, gap: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  cardTitle: { fontSize: 12, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.5 },

  // TRACKING
  trackingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  trackingUrl: { flex: 1, fontSize: 11, fontWeight: '600', color: COLORS.textMuted, fontVariant: ['tabular-nums'] },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#2A0826', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  copyBtnCopied: { backgroundColor: COLORS.success },
  copyBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // WHATSAPP
  whatsappBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 14 },
  whatsappBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  waDirectTitle: { fontSize: 9, fontWeight: '900', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  waChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  waChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(37,211,102,0.1)', borderWidth: 1, borderColor: 'rgba(37,211,102,0.4)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  waChipText: { fontSize: 11, fontWeight: '700', color: '#128C7E' },

  // 2 COL
  twoCol: { flexDirection: 'row', gap: 10 },
  callBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 18, padding: 18, alignItems: 'center', gap: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },
  callBtnNum: { fontSize: 15, fontWeight: '900', color: '#fff' },
  callBtnSub: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  contactsBtn: { flex: 1, backgroundColor: '#2A0826', borderRadius: 18, padding: 18, alignItems: 'center', gap: 4, shadowColor: '#2A0826', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  contactsBtnText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  contactsBtnSub: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  alarmBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 18, padding: 16, alignItems: 'center', gap: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  alarmBtnActive: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
  alarmBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  safeBtn: { flex: 1, backgroundColor: COLORS.success, borderRadius: 18, padding: 16, alignItems: 'center', gap: 4, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 7 },
  safeBtnText: { fontSize: 12, fontWeight: '900', color: '#fff' },

  // MODAL
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', borderRadius: 28, width: '100%', maxWidth: 380, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  modalTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  modalBody: { padding: 20, alignItems: 'center', gap: 12 },
  safeIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F0FDF4', borderWidth: 2, borderColor: '#86EFAC', alignItems: 'center', justifyContent: 'center' },
  modalConfirmTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, textAlign: 'center' },
  modalConfirmSub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  confirmSafeBtn: { width: '100%', backgroundColor: COLORS.success, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  confirmSafeBtnDisabled: { opacity: 0.65 },
  confirmSafeBtnText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  cancelSafeBtn: { paddingVertical: 10 },
  cancelSafeBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
});
