import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Alert, Linking, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import * as Haptics from 'expo-haptics';
import { fetchContacts } from '../../redux/slices/contactsSlice';
import { checkActiveSos, startEmergencySos } from '../../redux/slices/sosSlice';
import { fetchUser } from '../../redux/slices/authSlice';
import { journeyApi } from '../../api/journeyApi';
import { COLORS } from '../../theme/colors';
import SOSHeroButton from '../../components/sos/SOSHeroButton';

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeSession, isTriggering } = useSelector((state) => state.sos);
  const { contacts = [] } = useSelector((state) => state.contacts);
  const { status = 'LIVE', accuracy = 10, latitude, longitude } = useSelector((state) => state.location);
  const [activeJourney, setActiveJourney] = useState(null);

  useEffect(() => {
    dispatch(fetchUser());
    dispatch(fetchContacts());
    dispatch(checkActiveSos());
    loadActiveJourney();
  }, [dispatch]);

  useEffect(() => {
    if (activeSession) {
      navigation.navigate('ActiveSOS');
    }
  }, [activeSession]);

  const loadActiveJourney = async () => {
    try {
      const res = await journeyApi.getActiveJourney();
      setActiveJourney(res.journey);
    } catch (e) { }
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return { text: 'Good Morning', icon: '☀️' };
    if (h < 17) return { text: 'Good Afternoon', icon: '🌤️' };
    return { text: 'Good Evening', icon: '🌙' };
  };

  const firstName = (user?.fullName || user?.name || 'User').split(' ')[0];
  const greeting = getGreeting();

  const locStatusInfo = {
    LIVE: { label: 'GPS Live', color: COLORS.success, dot: COLORS.success },
    STALE: { label: 'GPS Updating', color: COLORS.warning, dot: COLORS.warning },
    DENIED: { label: 'Location Denied', color: COLORS.primary, dot: COLORS.primary },
    OFFLINE: { label: 'Offline', color: COLORS.textMuted, dot: COLORS.textMuted },
  };
  const locInfo = locStatusInfo[status] || locStatusInfo.LIVE;

  const readinessScore = contacts.length >= 3 && status === 'LIVE' ? 100 : contacts.length > 0 ? 85 : 45;

  const readinessScore = contacts.length >= 3 && status === 'LIVE' ? 100 : contacts.length > 0 ? 85 : 45;

  const QUICK_ACTIONS = [
    { icon: 'navigate', label: 'Track Journey', sub: 'Share Live Route', onPress: () => navigation.navigate('Journey') },
    { icon: 'time', label: 'Check On Me', sub: 'Safety Timer', onPress: () => navigation.navigate('Journey') },
    { icon: 'people', label: 'Guardians', sub: `${contacts.length} Trusted`, onPress: () => navigation.navigate('Contacts') },
    { icon: 'call', label: 'Helplines', sub: '112 & 1091', onPress: () => navigation.navigate('Helplines') },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ACTIVE SOS ALERT BANNER */}
        {activeSession && (
          <TouchableOpacity style={styles.sosBanner} onPress={() => navigation.navigate('ActiveSOS')} activeOpacity={0.9}>
            <View style={styles.sosBannerLeft}>
              <Ionicons name="warning" size={24} color="#fff" />
              <View>
                <Text style={styles.sosBannerTitle}>🚨 EMERGENCY SOS ACTIVE</Text>
                <Text style={styles.sosBannerSub}>Tap to open live command view</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* ACTIVE JOURNEY BANNER */}
        {activeJourney && !activeSession && (
          <TouchableOpacity style={styles.journeyBanner} onPress={() => navigation.navigate('Journey')} activeOpacity={0.9}>
            <View style={styles.journeyBannerLeft}>
              <Ionicons name="navigate" size={18} color={COLORS.primary} />
              <View>
                <Text style={styles.journeyBannerTitle}>Protected Journey Active</Text>
                <Text style={styles.journeyBannerSub}>Destination: {activeJourney.destinationName}</Text>
              </View>
            </View>
            <Text style={styles.manageTripBtn}>MANAGE</Text>
          </TouchableOpacity>
        )}

        {/* HERO SAFETY CARD */}
        <View style={styles.heroCard}>
          {/* 365-DAY badge */}
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#fff" />
            <Text style={styles.heroBadgeText}>365-DAY PROTECTION ACTIVE</Text>
          </View>

          {/* Greeting */}
          <View style={styles.greetRow}>
            <View>
              <Text style={styles.greetLabel}>{greeting.text} {greeting.icon}</Text>
              <Text style={styles.greetName}>{firstName}'s Safety Command</Text>
              <Text style={styles.greetSub}>24/7 Live Protection & Emergency Guardian Network</Text>
            </View>
          </View>

          {/* GPS Status Pill */}
          <View style={styles.gpsPill}>
            <View style={[styles.gpsDot, { backgroundColor: locInfo.dot }]} />
            <Text style={styles.gpsLabel}>{locInfo.label}</Text>
            <Text style={styles.gpsAccuracy}>±{accuracy || 10}m</Text>
          </View>

          {/* DYNAMIC SOS HERO BUTTON */}
          <SOSHeroButton />

          {/* QUICK ACTIONS GRID */}
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action, i) => (
              <TouchableOpacity key={i} style={styles.quickCard} onPress={action.onPress} activeOpacity={0.8}>
                <View style={styles.quickIconWrap}>
                  <Ionicons name={action.icon} size={22} color={COLORS.primary} />
                </View>
                <Text style={styles.quickLabel}>{action.label}</Text>
                <Text style={styles.quickSub}>{action.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* READINESS METER */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Safety Readiness</Text>
            <View style={styles.readinessChip}>
              <Text style={styles.readinessChipText}>{readinessScore}% READY</Text>
            </View>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${readinessScore}%` }]} />
          </View>

          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.checkLabel}>GPS Location Permissions</Text>
            <Text style={styles.checkStatus}>Active</Text>
          </View>
          <View style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={16} color={contacts.length >= 3 ? COLORS.success : COLORS.warning} />
            <Text style={styles.checkLabel}>Trusted Contacts Count</Text>
            <Text style={[styles.checkStatus, { color: contacts.length >= 3 ? COLORS.success : COLORS.warning }]}>
              {contacts.length}/5 Added
            </Text>
          </View>
        </View>

        {/* EMERGENCY GUARDIANS */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16 }}>❤️</Text>
              <Text style={styles.cardTitle}>Emergency Guardians</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Contacts')}>
              <Text style={styles.manageLink}>Manage All ({contacts.length})</Text>
            </TouchableOpacity>
          </View>

          {contacts.length > 0 ? (
            contacts.slice(0, 2).map((c) => (
              <View key={c.id} style={styles.contactRow}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>{(c.name || 'U')[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactRel}>{c.relationship} · {c.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${c.phone}`)}>
                  <Ionicons name="call" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <TouchableOpacity style={styles.emptyGuardian} onPress={() => navigation.navigate('Contacts')} activeOpacity={0.8}>
              <Ionicons name="people-outline" size={30} color={COLORS.primaryLight} />
              <Text style={styles.emptyGuardianTitle}>No Guardians Added Yet</Text>
              <Text style={styles.emptyGuardianSub}>Add up to 5 guardians to receive instant alerts.</Text>
              <Text style={styles.addFirstBtn}>+ ADD FIRST GUARDIAN</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 14 },

  // SOS Banner
  sosBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primary, borderRadius: 20, padding: 16 },
  sosBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sosBannerTitle: { fontSize: 13, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  sosBannerSub: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  // Journey Banner
  journeyBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 20, padding: 14 },
  journeyBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  journeyBannerTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  journeyBannerSub: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 1 },
  manageTripBtn: { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder,
    borderRadius: 28, padding: 20, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 8,
  },
  heroBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.primary,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderBottomLeftRadius: 18,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8, textTransform: 'uppercase' },
  greetRow: { marginTop: 32, marginBottom: 14 },
  greetLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  greetName: { fontSize: 22, fontWeight: '900', color: COLORS.textDark, marginTop: 4, letterSpacing: -0.3 },
  greetSub: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },

  // GPS Pill
  gpsPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, alignSelf: 'flex-start', marginBottom: 20 },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  gpsLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  gpsAccuracy: { fontSize: 10, fontWeight: '700', color: COLORS.success, backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: '#86EFAC' },

  // Quick Actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: { width: '47%', backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 20, padding: 14, alignItems: 'center', gap: 8 },
  quickIconWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textDark, textAlign: 'center' },
  quickSub: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' },

  // Card
  card: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, borderRadius: 24, padding: 18, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  manageLink: { fontSize: 11, fontWeight: '800', color: COLORS.primary },

  // Readiness
  readinessChip: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#86EFAC' },
  readinessChipText: { fontSize: 10, fontWeight: '900', color: COLORS.success },
  progressBg: { height: 10, backgroundColor: COLORS.primaryBg, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.primaryBorder, marginBottom: 14, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 5 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  checkLabel: { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  checkStatus: { fontSize: 11, fontWeight: '900', color: COLORS.success },

  // Contact Row
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.primaryBorder },
  contactAvatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  contactName: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  contactRel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 1 },

  // Empty Guardians
  emptyGuardian: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyGuardianTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textDark },
  emptyGuardianSub: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' },
  addFirstBtn: { backgroundColor: COLORS.primary, color: '#fff', fontSize: 11, fontWeight: '900', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, overflow: 'hidden', letterSpacing: 0.5 },
});
