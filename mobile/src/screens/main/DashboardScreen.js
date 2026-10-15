import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchContacts } from '../../redux/slices/contactsSlice';
import { checkActiveSos } from '../../redux/slices/sosSlice';
import { fetchUser } from '../../redux/slices/authSlice';
import { journeyApi } from '../../api/journeyApi';
import { setLocationStatus } from '../../redux/slices/locationSlice';
import { useLocationDisclosure } from '../../hooks/useLocationDisclosure';
import { COLORS } from '../../theme/colors';
import SOSHeroButton from '../../components/sos/SOSHeroButton';

// ---------------------------------------------------------------------------
// Constants — defined outside component so they are never re-created
// ---------------------------------------------------------------------------

const LOC_STATUS_INFO = {
  LIVE:    { label: 'GPS Live',       color: COLORS.success,  dot: COLORS.success },
  STALE:   { label: 'GPS Updating',   color: COLORS.warning,  dot: COLORS.warning },
  DENIED:  { label: 'Location Denied', color: COLORS.primary, dot: COLORS.primary },
  OFFLINE: { label: 'Offline',        color: COLORS.textMuted, dot: COLORS.textMuted },
};

const SOS_GRADIENT  = ['#FF2A6D', '#FF5C8A', '#FF2A6D'];
const HERO_GRADIENT = ['#FFFFFF', '#FFF0F3', '#FFFFFF'];
const BADGE_GRADIENT = ['#FF5C8A', '#FF2A6D'];
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END   = { x: 1, y: 1 };

// ---------------------------------------------------------------------------
// Pure sub-components (memo prevents re-renders when props unchanged)
// ---------------------------------------------------------------------------

/** Pulsing SOS banner — only shown during an active emergency */
const SOSBanner = memo(({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
    <LinearGradient
      colors={SOS_GRADIENT}
      start={GRADIENT_START}
      end={GRADIENT_END}
      style={styles.sosBanner}
    >
      <View style={styles.sosBannerLeft}>
        <View style={styles.sosBannerIconWrap}>
          <Ionicons name="warning" size={24} color="#fff" />
        </View>
        <View style={styles.flex1}>
          <Text style={styles.sosBannerTitle}>🚨 EMERGENCY SOS ACTIVE</Text>
          <Text style={styles.sosBannerSub}>Encrypted GPS stream broadcasting to guardians</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#fff" />
    </LinearGradient>
  </TouchableOpacity>
));

/** Journey-active banner */
const JourneyBanner = memo(({ journey, onPress }) => (
  <TouchableOpacity style={styles.journeyBanner} onPress={onPress} activeOpacity={0.9}>
    <View style={styles.journeyBannerLeft}>
      <Ionicons name="navigate" size={18} color={COLORS.primary} />
      <View>
        <Text style={styles.journeyBannerTitle}>Protected Journey Active</Text>
        <Text style={styles.journeyBannerSub}>Destination: {journey.destinationName}</Text>
      </View>
    </View>
    <Text style={styles.manageTripBtn}>MANAGE</Text>
  </TouchableOpacity>
));

/** GPS status pill */
const GpsPill = memo(({ locInfo, accuracy, onPress }) => (
  <TouchableOpacity
    style={styles.gpsPill}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.gpsDot, { backgroundColor: locInfo.dot }]} />
    <Text style={styles.gpsLabel}>{locInfo.label}</Text>
    <Text style={styles.gpsAccuracy}>±{accuracy || 10}m</Text>
    {onPress && <Ionicons name="chevron-forward" size={12} color={COLORS.primary} style={{ marginLeft: 2 }} />}
  </TouchableOpacity>
));

/** A single quick-action card */
const QuickCard = memo(({ icon, label, sub, onPress }) => (
  <TouchableOpacity style={styles.quickCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.quickIconWrap}>
      <Ionicons name={icon} size={22} color={COLORS.primary} />
    </View>
    <Text style={styles.quickLabel}>{label}</Text>
    <Text style={styles.quickSub}>{sub}</Text>
  </TouchableOpacity>
));

/** Safety readiness card */
const ReadinessCard = memo(({ score, contacts, locStatus, onRequestLocation }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>Safety Readiness</Text>
      <View style={styles.readinessChip}>
        <Text style={styles.readinessChipText}>{score}% READY</Text>
      </View>
    </View>

    <View style={styles.progressBg}>
      <View style={[styles.progressFill, { width: `${score}%` }]} />
    </View>

    <TouchableOpacity
      style={styles.checkRow}
      onPress={onRequestLocation}
      disabled={locStatus === 'LIVE'}
      activeOpacity={0.7}
    >
      <Ionicons
        name={locStatus === 'LIVE' ? 'checkmark-circle' : 'alert-circle'}
        size={16}
        color={locStatus === 'LIVE' ? COLORS.success : COLORS.warning}
      />
      <Text style={styles.checkLabel}>GPS Location Permissions</Text>
      <Text style={[styles.checkStatus, { color: locStatus === 'LIVE' ? COLORS.success : COLORS.warning }]}>
        {locStatus === 'LIVE' ? 'Active' : 'Enable'}
      </Text>
    </TouchableOpacity>
    <View style={styles.checkRow}>
      <Ionicons
        name="checkmark-circle"
        size={16}
        color={contacts.length >= 3 ? COLORS.success : COLORS.warning}
      />
      <Text style={styles.checkLabel}>Trusted Contacts Count</Text>
      <Text style={[styles.checkStatus, { color: contacts.length >= 3 ? COLORS.success : COLORS.warning }]}>
        {contacts.length}/5 Added
      </Text>
    </View>
  </View>
));

/** Single guardian row */
const GuardianRow = memo(({ contact }) => (
  <View style={styles.contactRow}>
    <View style={styles.contactAvatar}>
      <Text style={styles.contactAvatarText}>
        {(contact.name || 'U')[0].toUpperCase()}
      </Text>
    </View>
    <View style={styles.flex1}>
      <Text style={styles.contactName}>{contact.name}</Text>
      <Text style={styles.contactRel}>{contact.relationship} · {contact.phone}</Text>
    </View>
    <TouchableOpacity
      onPress={() => Linking.openURL(`tel:${contact.phone}`)}
      hitSlop={8}
    >
      <Ionicons name="call" size={18} color={COLORS.primary} />
    </TouchableOpacity>
  </View>
));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning',   icon: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', icon: '🌤️' };
  return            { text: 'Good Evening',    icon: '🌙' };
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();

  const user          = useSelector((s) => s.auth.user);
  const activeSession = useSelector((s) => s.sos.activeSession);
  const contacts      = useSelector((s) => s.contacts.contacts ?? []);
  const locStatus     = useSelector((s) => s.location.status   ?? 'LIVE');
  const locAccuracy   = useSelector((s) => s.location.accuracy ?? 10);

  const [activeJourney, setActiveJourney] = useState(null);
  const { requestWithDisclosure, DisclosureModal } = useLocationDisclosure();

  const handleRequestLocation = useCallback(() => {
    requestWithDisclosure(
      () => {
        dispatch(setLocationStatus('LIVE'));
      },
      () => {
        dispatch(setLocationStatus('DENIED'));
      }
    );
  }, [requestWithDisclosure, dispatch]);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadActiveJourney = useCallback(async () => {
    try {
      const res = await journeyApi.getActiveJourney();
      setActiveJourney(res.journey ?? null);
    } catch {
      // Journey is optional — swallow silently
    }
  }, []);

  useEffect(() => {
    dispatch(fetchUser());
    dispatch(fetchContacts());
    dispatch(checkActiveSos());
    loadActiveJourney();
  }, [dispatch, loadActiveJourney]);

  // ── Memoised derived values ───────────────────────────────────────────────

  const firstName = useMemo(
    () => (user?.fullName || user?.name || 'User').split(' ')[0],
    [user],
  );

  const greeting = useMemo(() => getGreeting(), []);

  const locInfo = useMemo(
    () => LOC_STATUS_INFO[locStatus] ?? LOC_STATUS_INFO.LIVE,
    [locStatus],
  );

  const readinessScore = useMemo(() => {
    if (contacts.length >= 3 && locStatus === 'LIVE') return 100;
    if (contacts.length > 0) return 85;
    return 45;
  }, [contacts.length, locStatus]);

  // ── Memoised navigation callbacks ─────────────────────────────────────────

  const goSOS      = useCallback(() => navigation.navigate('ActiveSOS'),  [navigation]);
  const goJourney  = useCallback(() => navigation.navigate('Journey'),    [navigation]);
  const goContacts = useCallback(() => navigation.navigate('Contacts'),   [navigation]);
  const goHelplines = useCallback(() => navigation.navigate('Helplines'), [navigation]);

  const QUICK_ACTIONS = useMemo(() => [
    { icon: 'navigate',  label: 'Track Journey', sub: 'Share Live Route',       onPress: goJourney },
    { icon: 'time',      label: 'Check On Me',   sub: 'Safety Timer',           onPress: goJourney },
    { icon: 'people',    label: 'Guardians',     sub: `${contacts.length} Trusted`, onPress: goContacts },
    { icon: 'call',      label: 'Helplines',     sub: '112 & 1091',             onPress: goHelplines },
  ], [contacts.length, goJourney, goContacts, goHelplines]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      >

        {/* SOS Alert Banner */}
        {activeSession && <SOSBanner onPress={goSOS} />}

        {/* Active Journey Banner */}
        {activeJourney && !activeSession && (
          <JourneyBanner journey={activeJourney} onPress={goJourney} />
        )}

        {/* Hero Safety Card */}
        <LinearGradient
          colors={HERO_GRADIENT}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={styles.heroCard}
        >
          {/* 365-day badge */}
          <LinearGradient
            colors={BADGE_GRADIENT}
            start={GRADIENT_START}
            end={GRADIENT_END}
            style={styles.heroBadge}
          >
            <Ionicons name="shield-checkmark" size={13} color="#fff" />
            <Text style={styles.heroBadgeText}>365-DAY PROTECTION ACTIVE</Text>
          </LinearGradient>

          {/* Greeting */}
          <View style={styles.greetRow}>
            <Text style={styles.greetLabel}>{greeting.text} {greeting.icon}</Text>
            <Text style={styles.greetName}>{firstName}'s Safety Command</Text>
            <Text style={styles.greetSub}>24/7 Live Protection & Emergency Guardian Network</Text>
          </View>

          {/* GPS pill */}
          <GpsPill
            locInfo={locInfo}
            accuracy={locAccuracy}
            onPress={locStatus !== 'LIVE' ? handleRequestLocation : undefined}
          />

          {/* SOS Hero Button */}
          <SOSHeroButton />

          {/* Quick-actions grid */}
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => (
              <QuickCard key={action.label} {...action} />
            ))}
          </View>
        </LinearGradient>

        {/* Safety Readiness */}
        <ReadinessCard
          score={readinessScore}
          contacts={contacts}
          locStatus={locStatus}
          onRequestLocation={handleRequestLocation}
        />

        {/* Emergency Guardians */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.heartEmoji}>❤️</Text>
              <Text style={styles.cardTitle}>Emergency Guardians</Text>
            </View>
            <TouchableOpacity onPress={goContacts} hitSlop={8}>
              <Text style={styles.manageLink}>Manage All ({contacts.length})</Text>
            </TouchableOpacity>
          </View>

          {contacts.length > 0 ? (
            contacts
              .slice(0, 2)
              .map((c) => <GuardianRow key={c.id} contact={c} />)
          ) : (
            <TouchableOpacity style={styles.emptyGuardian} onPress={goContacts} activeOpacity={0.8}>
              <Ionicons name="people-outline" size={30} color={COLORS.primaryLight} />
              <Text style={styles.emptyGuardianTitle}>No Guardians Added Yet</Text>
              <Text style={styles.emptyGuardianSub}>Add up to 5 guardians to receive instant alerts.</Text>
              <Text style={styles.addFirstBtn}>+ ADD FIRST GUARDIAN</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
      <DisclosureModal />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: COLORS.primaryBg },
  flex1: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 14 },

  // SOS Banner
  sosBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 24, padding: 18,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
  },
  sosBannerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  sosBannerIconWrap: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosBannerTitle: { fontSize: 13, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  sosBannerSub:   { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.95)', marginTop: 2 },

  // Journey Banner
  journeyBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.primaryBorder,
    borderRadius: 20, padding: 14,
  },
  journeyBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  journeyBannerTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  journeyBannerSub:   { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 1 },
  manageTripBtn:      { fontSize: 10, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },

  // Hero Card
  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.primaryBorder,
    borderRadius: 28, padding: 20, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 8,
  },
  heroBadge: {
    position: 'absolute', top: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8, borderBottomLeftRadius: 18,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8, textTransform: 'uppercase' },
  greetRow:   { marginTop: 32, marginBottom: 14 },
  greetLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  greetName:  { fontSize: 22, fontWeight: '900', color: COLORS.textDark, marginTop: 4, letterSpacing: -0.3 },
  greetSub:   { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },

  // GPS Pill
  gpsPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 999, alignSelf: 'flex-start', marginBottom: 20,
  },
  gpsDot:      { width: 8, height: 8, borderRadius: 4 },
  gpsLabel:    { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  gpsAccuracy: {
    fontSize: 10, fontWeight: '700', color: COLORS.success,
    backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999, borderWidth: 1, borderColor: '#86EFAC',
  },

  // Quick Actions
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '47%', backgroundColor: COLORS.primaryBg,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    borderRadius: 20, padding: 14, alignItems: 'center', gap: 8,
  },
  quickIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textDark, textAlign: 'center' },
  quickSub:   { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.primaryBorder,
    borderRadius: 24, padding: 18,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heartEmoji:     { fontSize: 16 },
  cardTitle:      { fontSize: 13, fontWeight: '900', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  manageLink:     { fontSize: 11, fontWeight: '800', color: COLORS.primary },

  // Readiness
  readinessChip:     { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#86EFAC' },
  readinessChipText: { fontSize: 10, fontWeight: '900', color: COLORS.success },
  progressBg:        { height: 10, backgroundColor: COLORS.primaryBg, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.primaryBorder, marginBottom: 14, overflow: 'hidden' },
  progressFill:      { height: '100%', backgroundColor: COLORS.primary, borderRadius: 5 },
  checkRow:          { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  checkLabel:        { flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  checkStatus:       { fontSize: 11, fontWeight: '900', color: COLORS.success },

  // Guardian Row
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.primaryBorder,
  },
  contactAvatar:     { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  contactName:       { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  contactRel:        { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 1 },

  // Empty Guardians
  emptyGuardian:      { alignItems: 'center', gap: 8, paddingVertical: 16 },
  emptyGuardianTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textDark },
  emptyGuardianSub:   { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center' },
  addFirstBtn:        { backgroundColor: COLORS.primary, color: '#fff', fontSize: 11, fontWeight: '900', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, overflow: 'hidden', letterSpacing: 0.5 },
});
