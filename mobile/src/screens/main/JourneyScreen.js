import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { journeyApi, checkinApi } from '../../api/otherApis';
import { COLORS } from '../../theme/colors';

export default function JourneyScreen() {
  const { latitude = 18.5204, longitude = 73.8567 } = useSelector((state) => state.location);
  const [activeTab, setActiveTab] = useState('JOURNEY');
  const [journey, setJourney] = useState(null);
  const [checkin, setCheckin] = useState(null);

  // Journey state
  const [destination, setDestination] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [isCustomMinutes, setIsCustomMinutes] = useState(false);
  const [loading, setLoading] = useState(false);

  // Checkin state
  const [checkinInterval, setCheckinInterval] = useState('15');
  const [isCustomCheckin, setIsCustomCheckin] = useState(false);

  useEffect(() => {
    loadActiveJourney();
    loadActiveCheckin();
  }, []);

  const loadActiveJourney = async () => {
    try {
      const res = await journeyApi.getActiveJourney();
      setJourney(res.journey);
    } catch (e) {}
  };

  const loadActiveCheckin = async () => {
    try {
      const res = await checkinApi.getActiveCheckin();
      setCheckin(res.checkin);
    } catch (e) {}
  };

  const handleStartJourney = async () => {
    if (!destination || !minutes || Number(minutes) <= 0) {
      Alert.alert('Required', 'Please enter a valid destination and travel duration.');
      return;
    }
    setLoading(true);
    try {
      const res = await journeyApi.startJourney({
        destinationName: destination,
        originLat: latitude || 18.5204,
        originLng: longitude || 73.8567,
        destLat: 18.5355,
        destLng: 73.8910,
        minutesToArrive: minutes,
      });
      setJourney(res.journey);
    } catch (e) {
      Alert.alert('Error', 'Failed to start journey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJourney = async () => {
    Alert.alert('Journey Complete', 'Confirm that you\'ve arrived safely?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes, I Arrived!', style: 'default', onPress: async () => {
          try {
            await journeyApi.completeJourney(journey.id);
            setJourney(null);
          } catch (e) {}
        }
      }
    ]);
  };

  const handleStartCheckin = async () => {
    if (!checkinInterval || Number(checkinInterval) <= 0) {
      Alert.alert('Required', 'Please enter a valid check-in interval in minutes.');
      return;
    }
    setLoading(true);
    try {
      const res = await checkinApi.startCheckin(checkinInterval);
      setCheckin(res.checkin);
    } catch (e) {
      Alert.alert('Error', 'Failed to start safety check. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSafe = async () => {
    try {
      await checkinApi.confirmSafe(checkin.id);
      setCheckin(null);
    } catch (e) {}
  };

  const JOURNEY_PRESETS = ['15', '30', '45', '60'];
  const CHECKIN_PRESETS = [
    { val: '15', label: '15 Mins' },
    { val: '30', label: '30 Mins' },
    { val: '60', label: '1 Hour' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="navigate" size={28} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Stay Protected</Text>
          <Text style={styles.subtitle}>Real-time GPS trip tracking & custom safety check-in timer alarms</Text>
        </View>

        {/* TAB SWITCHER */}
        <View style={styles.tabBar}>
          {[
            { key: 'JOURNEY', label: 'Track Journey', icon: 'navigate' },
            { key: 'CHECKIN', label: 'Check On Me', icon: 'time' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              activeOpacity={0.85}
            >
              <Ionicons name={tab.icon} size={16} color={activeTab === tab.key ? '#fff' : COLORS.textMuted} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TAB 1 — TRACK JOURNEY */}
        {activeTab === 'JOURNEY' && (
          <View style={styles.card}>
            {journey ? (
              <View style={{ gap: 16 }}>
                <View style={styles.activeHeader}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeTitle}>Protected Journey Active</Text>
                  <Text style={styles.etaChip}>
                    ETA {new Date(journey.expectedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.routeCard}>
                  <View style={styles.routeRow}>
                    <View style={styles.routeDotStart} />
                    <View>
                      <Text style={styles.routeLabel}>Starting Point</Text>
                      <Text style={styles.routeValue}>{journey.originName || 'Current GPS Location'}</Text>
                    </View>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={styles.routeDotEnd} />
                    <View>
                      <Text style={styles.routeLabel}>Destination</Text>
                      <Text style={styles.routeValue}>{journey.destinationName}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.successBtn} onPress={handleCompleteJourney} activeOpacity={0.85}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.successBtnText}>I'VE ARRIVED SAFELY</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.cardTitle}>Start Protected Journey</Text>
                  <Text style={styles.cardSub}>Your trusted guardians can track your live progress. An alert fires if you don't arrive on time.</Text>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Where are you heading?</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="location" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Home, Office, Metro Station"
                      placeholderTextColor={COLORS.primaryBorder}
                      value={destination}
                      onChangeText={setDestination}
                    />
                  </View>
                </View>

                <View>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>Travel Duration (Minutes)</Text>
                    <TouchableOpacity onPress={() => setIsCustomMinutes(!isCustomMinutes)}>
                      <Text style={styles.customToggle}>{isCustomMinutes ? 'Use Presets' : 'Custom Duration'}</Text>
                    </TouchableOpacity>
                  </View>
                  {isCustomMinutes ? (
                    <View style={styles.inputRow}>
                      <Ionicons name="time" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter minutes (e.g. 10, 25, 90)"
                        placeholderTextColor={COLORS.primaryBorder}
                        keyboardType="numeric"
                        value={minutes}
                        onChangeText={setMinutes}
                      />
                    </View>
                  ) : (
                    <View style={styles.presetsRow}>
                      {JOURNEY_PRESETS.map(m => (
                        <TouchableOpacity key={m} onPress={() => setMinutes(m)}
                          style={[styles.preset, minutes === m && styles.presetActive]}>
                          <Text style={[styles.presetText, minutes === m && styles.presetTextActive]}>
                            {m === '60' ? '1 Hour' : `${m} Mins`}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, (loading || !destination) && styles.primaryBtnDisabled]}
                  onPress={handleStartJourney}
                  disabled={loading || !destination}
                  activeOpacity={0.85}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <Ionicons name="navigate" size={18} color="#fff" />
                      <Text style={styles.primaryBtnText}>START JOURNEY ({minutes || '30'} MINS)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TAB 2 — CHECK ON ME */}
        {activeTab === 'CHECKIN' && (
          <View style={styles.card}>
            {checkin ? (
              <View style={{ gap: 16, alignItems: 'center' }}>
                <View style={styles.checkinIconWrap}>
                  <Ionicons name="time" size={36} color={COLORS.primary} />
                </View>
                <Text style={styles.cardTitle}>Safety Timer Running</Text>
                <Text style={styles.cardSub}>You'll be asked to confirm safety at:</Text>
                <Text style={styles.checkinTime}>
                  {new Date(checkin.triggerAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>If you don't respond by the scheduled time, your trusted contacts will be automatically notified.</Text>
                </View>
                <TouchableOpacity style={styles.successBtn} onPress={handleConfirmSafe} activeOpacity={0.85}>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.successBtnText}>YES, I'M SAFE NOW</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={styles.cardTitle}>Safety Check-In Timer</Text>
                  <Text style={styles.cardSub}>Set a timer. We'll ask if you're safe. No response triggers automatic escalation to your trusted contacts.</Text>
                </View>

                <View>
                  <View style={styles.fieldHeaderRow}>
                    <Text style={styles.fieldLabel}>Check-in Interval (Minutes)</Text>
                    <TouchableOpacity onPress={() => setIsCustomCheckin(!isCustomCheckin)}>
                      <Text style={styles.customToggle}>{isCustomCheckin ? 'Use Presets' : 'Custom Interval'}</Text>
                    </TouchableOpacity>
                  </View>
                  {isCustomCheckin ? (
                    <View style={styles.inputRow}>
                      <Ionicons name="time" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter custom check-in minutes"
                        placeholderTextColor={COLORS.primaryBorder}
                        keyboardType="numeric"
                        value={checkinInterval}
                        onChangeText={setCheckinInterval}
                      />
                    </View>
                  ) : (
                    <View style={styles.presetsRow}>
                      {CHECKIN_PRESETS.map(opt => (
                        <TouchableOpacity key={opt.val} onPress={() => setCheckinInterval(opt.val)}
                          style={[styles.preset, checkinInterval === opt.val && styles.presetActive]}>
                          <Text style={[styles.presetText, checkinInterval === opt.val && styles.presetTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                  onPress={handleStartCheckin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                    <>
                      <Ionicons name="time" size={18} color="#fff" />
                      <Text style={styles.primaryBtnText}>START SAFETY CHECK ({checkinInterval || '15'} MINS)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* INFO NOTE */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardIcon}>
            <Ionicons name="information-circle" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.infoCardText}>
            {activeTab === 'JOURNEY'
              ? 'Journey tracking continuously updates your location every 30 seconds. Your trusted contacts can view live progress via the shared tracking link.'
              : 'Safety timer sends automatic alerts to your trusted contacts if you don\'t confirm your safety in time.'}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 14 },

  header: { alignItems: 'center', gap: 8, paddingBottom: 4 },
  headerIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 5 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, maxWidth: 300 },

  tabBar: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, padding: 6, borderRadius: 18 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder, backgroundColor: COLORS.surface },
  tabActive: { backgroundColor: COLORS.primary, borderColor: 'transparent', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.38, shadowRadius: 10, elevation: 6 },
  tabText: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActive: { color: '#fff' },

  card: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, borderRadius: 24, padding: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 20, elevation: 6 },
  cardTitle: { fontSize: 17, fontWeight: '900', color: COLORS.textDark, marginBottom: 4 },
  cardSub: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, lineHeight: 18 },

  activeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  activeTitle: { flex: 1, fontSize: 14, fontWeight: '900', color: COLORS.textDark },
  etaChip: { fontSize: 11, fontWeight: '900', color: COLORS.primary, backgroundColor: COLORS.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: COLORS.primaryBorder },

  routeCard: { backgroundColor: COLORS.primaryBg, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: COLORS.primaryBorder },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  routeDotStart: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primaryLight, marginTop: 4 },
  routeDotEnd: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, marginTop: 4 },
  routeLine: { width: 1.5, height: 24, backgroundColor: COLORS.primaryBorder, marginLeft: 5.5 },
  routeLabel: { fontSize: 9, fontWeight: '900', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  routeValue: { fontSize: 13, fontWeight: '900', color: COLORS.textDark, marginTop: 2 },

  fieldLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  customToggle: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 13 },
  input: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  presetsRow: { flexDirection: 'row', gap: 8 },
  preset: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primaryBorder, backgroundColor: COLORS.surface, alignItems: 'center' },
  presetActive: { backgroundColor: COLORS.primary, borderColor: 'transparent', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  presetText: { fontSize: 11, fontWeight: '900', color: COLORS.textDark },
  presetTextActive: { color: '#fff' },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 18, elevation: 8 },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

  successBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.success, borderRadius: 999, paddingVertical: 16, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6 },
  successBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },

  checkinIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  checkinTime: { fontSize: 40, fontWeight: '900', color: COLORS.primary, fontVariant: ['tabular-nums'] },
  infoBox: { backgroundColor: COLORS.primaryBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.primaryBorder, width: '100%' },
  infoText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },

  infoCard: { flexDirection: 'row', gap: 10, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 18, padding: 14 },
  infoCardIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  infoCardText: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.textMuted, lineHeight: 18 },
});
