import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Share, Modal, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { io } from 'socket.io-client';
import { organizationApi } from '../../api/organizationApi';
import { sosApi } from '../../api/sosApi';
import { API_URL } from '../../utils/constants';
import { COLORS } from '../../theme/colors';
import { playEmergencySiren, stopEmergencySiren } from '../../utils/soundPlayer';
import { toggleSosMute } from '../../redux/slices/sosSlice';
import LiveSosMap from '../../components/Admin/LiveSosMap';

// ---------------------------------------------------------------------------
// OrganizationDashboardScreen
// Real-time SOS tracking for organisation members via Socket.io + HTTP polling
// ---------------------------------------------------------------------------

export default function OrganizationDashboardScreen({ navigation }) {
  const dispatch     = useDispatch();
  const { user }     = useSelector((state) => state.auth);
  const mutedSosIds  = useSelector((state) => state?.sos?.mutedSosIds || []);

  const [members,        setMembers]        = useState([]);
  const [settings,       setSettings]       = useState(null);
  const [isLoading,      setIsLoading]      = useState(true);
  const [activeTab,      setActiveTab]      = useState('members');
  const [trackingMember, setTrackingMember] = useState(null);

  const socketRef = useRef(null);

  // ── Data fetch ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (showIndicator = true) => {
    try {
      if (showIndicator) setIsLoading(true);
      const [overviewRes, settingsRes] = await Promise.all([
        organizationApi.getOverview(),
        organizationApi.getSettings(),
      ]);
      setMembers(overviewRes.members || []);
      setSettings(settingsRes || null);
    } catch (e) {
      console.log('[OrgDashboard] Fetch error:', e?.message);
    } finally {
      if (showIndicator) setIsLoading(false);
    }
  }, []);

  // ── GPS polling for the open tracking modal (every 3 s) ───────────────────

  useEffect(() => {
    if (!trackingMember?.activeSos?.id) return;

    const pollLoc = async () => {
      try {
        const data = await sosApi.getSosLocation(trackingMember.activeSos.id);
        if (data?.location) {
          const lat = parseFloat(data.location.latitude);
          const lng = parseFloat(data.location.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            setTrackingMember((prev) => {
              if (prev?.activeSos?.id === trackingMember.activeSos.id) {
                return {
                  ...prev,
                  activeSos: {
                    ...prev.activeSos,
                    latestLocation: {
                      latitude:  lat,
                      longitude: lng,
                      accuracy:  data.location.accuracy || 15,
                    },
                    locationHistory: data.history || [],
                  },
                };
              }
              return prev;
            });
          }
        }
      } catch (_) {}
    };

    pollLoc();
    const interval = setInterval(pollLoc, 3000);
    return () => clearInterval(interval);
  }, [trackingMember?.activeSos?.id]);

  // ── Initial load + Socket.io + background poll ────────────────────────────

  useEffect(() => {
    fetchData(true);

    // Background HTTP poll every 8 s as a safety fallback
    const pollInterval = setInterval(() => fetchData(false), 8000);

    // Socket.io — real-time SOS events
    const serverUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(serverUrl, {
      path: '/api/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[OrgDashboard] Socket connected:', socket.id);
      if (user) {
        const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : null;
        // Register — server auto-joins user:email and user:phone rooms
        socket.emit('register-user', {
          email: user.email?.trim().toLowerCase(),
          phone: cleanPhone,
          role:  user.role,
        });
        // Explicitly join our own email room so we receive SOS_ALARM_BROADCAST
        // (server broadcasts to user:${org.email} when a member triggers SOS)
        if (user.email) socket.emit('join-room', `user:${user.email.trim().toLowerCase()}`);
        if (cleanPhone) socket.emit('join-room', `user:${cleanPhone}`);
      }
    });

    socket.on('connect_error', (err) => {
      console.log('[OrgDashboard] Socket error:', err?.message);
    });

    // New SOS triggered by a member → refresh list & switch to Monitor tab
    socket.on('SOS_ALARM_BROADCAST', (data) => {
      fetchData(false);
      setActiveTab('monitor');
      Alert.alert(
        '🚨 MEMBER SOS ALERT',
        `${data?.victimName || 'A member'} has triggered an Emergency SOS!`,
        [{ text: 'OPEN MONITOR', onPress: () => setActiveTab('monitor') }],
      );
    });

    // SOS resolved
    socket.on('SOS_ALARM_STOP', () => {
      fetchData(false);
      setTrackingMember(null);
    });

    // Real-time GPS position update from the child's device
    socket.on('SOS_LOCATION_UPDATE', (data) => {
      if (!data?.sosSessionId || !data?.latitude || !data?.longitude) return;
      const incomingId = parseInt(data.sosSessionId, 10);
      const newLat     = parseFloat(data.latitude);
      const newLng     = parseFloat(data.longitude);
      const newAcc     = data.accuracy ? parseFloat(data.accuracy) : 10;

      // Update members list card
      setMembers((prev) =>
        prev.map((m) => {
          if (m.activeSos && parseInt(m.activeSos.id, 10) === incomingId) {
            return {
              ...m,
              activeSos: {
                ...m.activeSos,
                latestLocation: { latitude: newLat, longitude: newLng, accuracy: newAcc },
              },
            };
          }
          return m;
        }),
      );

      // Update the open map modal
      setTrackingMember((prev) => {
        if (prev?.activeSos && parseInt(prev.activeSos.id, 10) === incomingId) {
          const hist = prev.activeSos.locationHistory
            ? [...prev.activeSos.locationHistory]
            : [];
          hist.push({
            latitude:   newLat,
            longitude:  newLng,
            accuracy:   newAcc,
            recordedAt: data.recordedAt || new Date().toISOString(),
          });
          return {
            ...prev,
            activeSos: {
              ...prev.activeSos,
              latestLocation:  { latitude: newLat, longitude: newLng, accuracy: newAcc },
              locationHistory: hist,
            },
          };
        }
        return prev;
      });
    });

    socket.on('JOURNEY_STATUS_UPDATE', () => fetchData(false));

    return () => {
      clearInterval(pollInterval);
      stopEmergencySiren().catch(() => {});
      socket.disconnect();
    };
  }, [fetchData, user]);

  // ── Siren management ───────────────────────────────────────────────────────
  // Plays when any org member has an active, un-muted SOS

  useEffect(() => {
    const hasActiveSos   = members.some((m) => !!m.activeSos);
    const hasUnmutedSos  = members.some(
      (m) => m.activeSos && !mutedSosIds.includes(String(m.activeSos.id)),
    );

    if (hasActiveSos && hasUnmutedSos) {
      playEmergencySiren().catch(() => {});
    } else {
      stopEmergencySiren().catch(() => {});
    }
  }, [members, mutedSosIds]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    if (!settings?.orgReferralCode) return;
    try {
      await Share.share({
        message: `Join our Organization on SakhiSuraksha! Use code: ${settings.orgReferralCode} during registration.`,
      });
    } catch (_) {}
  }, [settings?.orgReferralCode]);

  const notify = (title, message) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const removeMember = useCallback((userId) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Remove Member\n\nAre you sure you want to remove this member?')) {
        organizationApi.removeMember(userId)
          .then(() => setMembers((prev) => prev.filter((m) => m.userId !== userId)))
          .catch(() => notify('Error', 'Failed to remove member'));
      }
      return;
    }
    Alert.alert('Remove Member', 'Are you sure you want to remove this member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await organizationApi.removeMember(userId);
            setMembers((prev) => prev.filter((m) => m.userId !== userId));
          } catch (_) {
            Alert.alert('Error', 'Failed to remove member');
          }
        },
      },
    ]);
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────

  const activeSosMembers = useMemo(
    () => members.filter((m) => m.activeSos || m.activeJourney),
    [members],
  );

  const sosCount = useMemo(
    () => members.filter((m) => !!m.activeSos).length,
    [members],
  );

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading && members.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Organisation Portal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="business-outline" size={20} color="#FF2A6D" />
          <Text style={styles.headerTitle}>ORGANISATION PORTAL</Text>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        </View>
        {sosCount > 0 && (
          <View style={styles.sosBadge}>
            <Text style={styles.sosBadgeText}>{sosCount} SOS</Text>
          </View>
        )}
      </View>

      {/* ACTIVE SOS ALERT BANNER */}
      {sosCount > 0 && (
        <LinearGradient
          colors={['#FF2A6D', '#FF5C8A', '#E01A4F']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.sosAlertBanner}
        >
          <Ionicons name="warning" size={26} color="#FFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sosAlertTitle}>🚨 EMERGENCY SOS ACTIVE — {sosCount} MEMBER{sosCount > 1 ? 'S' : ''}</Text>
            <Text style={styles.sosAlertSub}>Live GPS tracking is broadcasting now. Tap Live Monitor.</Text>
          </View>
          <TouchableOpacity
            style={styles.muteAllBtn}
            onPress={() => {
              members.forEach((m) => {
                if (m.activeSos) dispatch(toggleSosMute(m.activeSos.id));
              });
            }}
          >
            <Ionicons name="volume-mute" size={16} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* VERTICAL TAB NAV */}
        <View style={styles.sidebarStack}>
          {[
            { id: 'monitor', icon: 'pulse',     title: 'Live Monitor',       sub: 'Real-time safety tracking', badge: sosCount },
            { id: 'members', icon: 'people',    title: 'Member Directory',   sub: 'Manage enrolled users' },
            { id: 'settings', icon: 'settings', title: 'Referral & Settings', sub: 'Your referral link' },
          ].map(({ id, icon, title, sub, badge }) => (
            <TouchableOpacity
              key={id}
              style={[styles.navCard, activeTab === id && styles.navCardActive]}
              onPress={() => setActiveTab(id)}
              activeOpacity={0.8}
            >
              {activeTab === id && (
                <LinearGradient
                  colors={['#FF5C8A', '#FF2A6D']}
                  style={StyleSheet.absoluteFill}
                  borderRadius={20}
                />
              )}
              <View style={[styles.navIconWrap, activeTab === id && styles.navIconWrapActive]}>
                <Ionicons name={icon} size={18} color={activeTab === id ? '#fff' : '#FF2A6D'} />
              </View>
              <View style={styles.navTextWrap}>
                <Text style={[styles.navTitle, activeTab === id && styles.navTitleActive]}>{title}</Text>
                <Text style={[styles.navSub,   activeTab === id && styles.navSubActive]}>{sub}</Text>
              </View>
              {badge > 0 && (
                <View style={styles.navBadge}>
                  <Text style={styles.navBadgeText}>{badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CONTENT AREA ── */}
        <View style={styles.contentArea}>

          {/* LIVE MONITOR TAB */}
          {activeTab === 'monitor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="pulse" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Live Monitor</Text>
              </View>

              {activeSosMembers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="shield-checkmark" size={40} color={COLORS.success} />
                  <Text style={styles.emptyTitle}>All Members Safe</Text>
                  <Text style={styles.emptySub}>No active SOS or Journey at the moment.</Text>
                </View>
              ) : (
                activeSosMembers.map((m) => (
                  <View key={m.userId} style={styles.memberRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{m.user?.fullName?.charAt(0) || 'M'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.user?.fullName}</Text>
                      <View style={styles.statusRow}>
                        {m.activeSos ? (
                          <View style={[styles.statusBadge, styles.statusSos]}>
                            <Ionicons name="warning" size={10} color="#FF2A6D" />
                            <Text style={[styles.statusBadgeText, { color: '#FF2A6D' }]}>EMERGENCY SOS</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, styles.statusJourney]}>
                            <Ionicons name="navigate" size={10} color="#059669" />
                            <Text style={[styles.statusBadgeText, { color: '#059669' }]}>IN JOURNEY</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.actionBtns}>
                      {/* Mute / unmute siren for this member */}
                      {m.activeSos && (
                        <TouchableOpacity
                          style={styles.muteBtn}
                          onPress={() => dispatch(toggleSosMute(m.activeSos.id))}
                        >
                          <Ionicons
                            name={mutedSosIds.includes(String(m.activeSos.id)) ? 'volume-mute' : 'volume-high'}
                            size={14}
                            color={COLORS.primary}
                          />
                        </TouchableOpacity>
                      )}
                      {m.user?.phone && (
                        <TouchableOpacity
                          style={styles.callBtn}
                          onPress={() => Linking.openURL(`tel:${m.user.phone}`)}
                        >
                          <Ionicons name="call" size={14} color="#16A34A" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => setTrackingMember(m)}
                      >
                        <Ionicons name="map" size={13} color="#FFF" />
                        <Text style={styles.trackBtnText}>TRACK</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* MEMBER DIRECTORY TAB */}
          {activeTab === 'members' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="people" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Enrolled Members ({members.length})</Text>
              </View>

              {members.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="business" size={40} color={COLORS.primaryLight} />
                  <Text style={styles.emptyTitle}>No members yet</Text>
                  <Text style={styles.emptySub}>Share your code to enroll members.</Text>
                </View>
              ) : (
                members.map((m) => (
                  <View key={m.userId} style={styles.memberRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{m.user?.fullName?.charAt(0) || 'M'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.user?.fullName}</Text>
                      <Text style={styles.memberSub}>{m.user?.email} · {m.user?.phone}</Text>
                      <View style={styles.statusRow}>
                        {m.activeSos ? (
                          <View style={[styles.statusBadge, styles.statusSos]}>
                            <Ionicons name="warning" size={10} color="#FF2A6D" />
                            <Text style={[styles.statusBadgeText, { color: '#FF2A6D' }]}>EMERGENCY SOS</Text>
                          </View>
                        ) : m.activeJourney ? (
                          <View style={[styles.statusBadge, styles.statusJourney]}>
                            <Ionicons name="navigate" size={10} color="#059669" />
                            <Text style={[styles.statusBadgeText, { color: '#059669' }]}>IN JOURNEY</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, styles.statusSafe]}>
                            <Ionicons name="shield-checkmark" size={10} color={COLORS.success} />
                            <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>SAFE</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeMember(m.userId)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color="#FF2A6D" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* REFERRAL & SETTINGS TAB */}
          {activeTab === 'settings' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="settings" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Settings & Enrollment</Text>
              </View>
              <View style={styles.settingsBlock}>
                <Text style={styles.label}>Your Organisation Code</Text>
                <Text style={styles.desc}>
                  Share this code with your members. They enter it during registration.
                </Text>
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{settings?.orgReferralCode || 'N/A'}</Text>
                  <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
                    <Ionicons name="share-social" size={16} color="#fff" />
                    <Text style={styles.shareBtnText}>SHARE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* LIVE GPS TRACKING MODAL */}
      <Modal visible={!!trackingMember} transparent animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}>
        {trackingMember && (
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Ionicons name="navigate-circle" size={22} color="#FF2A6D" />
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Tracking: {trackingMember.user?.fullName}
                </Text>
                <TouchableOpacity onPress={() => setTrackingMember(null)} hitSlop={8}>
                  <Ionicons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              {/* Status row inside modal */}
              {trackingMember.activeSos && (
                <View style={styles.modalSosBanner}>
                  <Ionicons name="warning" size={14} color="#FF2A6D" />
                  <Text style={styles.modalSosBannerText}>EMERGENCY SOS ACTIVE — Live GPS Broadcasting</Text>
                  <TouchableOpacity
                    onPress={() => dispatch(toggleSosMute(trackingMember.activeSos.id))}
                  >
                    <Ionicons
                      name={mutedSosIds.includes(String(trackingMember.activeSos.id)) ? 'volume-mute' : 'volume-high'}
                      size={16}
                      color="#FF2A6D"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Map */}
              <LiveSosMap
                latitude={
                  trackingMember.activeSos?.latestLocation?.latitude  ||
                  trackingMember.activeSos?.locations?.[0]?.latitude  ||
                  trackingMember.activeJourney?.currentLat || 18.5204
                }
                longitude={
                  trackingMember.activeSos?.latestLocation?.longitude ||
                  trackingMember.activeSos?.locations?.[0]?.longitude ||
                  trackingMember.activeJourney?.currentLng || 73.8567
                }
                accuracy={
                  trackingMember.activeSos?.latestLocation?.accuracy ||
                  trackingMember.activeSos?.locations?.[0]?.accuracy || 15
                }
                victimName={trackingMember.user?.fullName || 'Member'}
                history={trackingMember.activeSos?.locationHistory || trackingMember.activeSos?.locations || []}
                isEmergency={!!trackingMember.activeSos}
                height={300}
              />

              {/* Action buttons */}
              <View style={styles.modalActions}>
                {trackingMember.user?.phone && (
                  <TouchableOpacity
                    style={styles.callMemberBtn}
                    onPress={() => Linking.openURL(`tel:${trackingMember.user.phone}`)}
                  >
                    <Ionicons name="call" size={16} color="#FFF" />
                    <Text style={styles.modalActionText}>CALL MEMBER</Text>
                  </TouchableOpacity>
                )}
                {trackingMember.user?.phone && (
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={() => {
                      const clean = trackingMember.user.phone.replace(/\D/g, '');
                      Linking.openURL(`https://wa.me/${clean}`).catch(() => {});
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                    <Text style={styles.modalActionText}>WHATSAPP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </SafeAreaView>
        )}
      </Modal>

    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#FFF0F3' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
    backgroundColor: '#FFF0F3',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#FF2A6D', textTransform: 'uppercase', letterSpacing: 0.5 },
  livePill:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  liveDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  livePillText:{ fontSize: 9, fontWeight: '900', color: '#16A34A' },
  sosBadge:    { backgroundColor: '#FF2A6D', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  sosBadgeText:{ fontSize: 10, fontWeight: '900', color: '#fff' },

  // SOS alert banner
  sosAlertBanner:{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginHorizontal: 16, marginBottom: 4, borderRadius: 18 },
  sosAlertTitle: { fontSize: 11, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  sosAlertSub:   { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  muteAllBtn:    { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10 },

  scroll: { padding: 20, gap: 24, paddingBottom: 40 },

  // Sidebar nav
  sidebarStack: { gap: 12 },
  navCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    borderWidth: 1.5, borderColor: '#FFCCE1',
    padding: 14, gap: 14,
    shadowColor: '#FF5C8A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
    position: 'relative', overflow: 'hidden',
  },
  navCardActive:    { borderColor: 'transparent', shadowOpacity: 0.3, elevation: 6 },
  navIconWrap:      { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive:{ backgroundColor: 'rgba(255,255,255,0.25)' },
  navTextWrap:      { flex: 1 },
  navTitle:         { fontSize: 15, fontWeight: '900', color: '#2A0826' },
  navTitleActive:   { color: '#fff' },
  navSub:           { fontSize: 12, fontWeight: '600', color: '#684E67', marginTop: 2 },
  navSubActive:     { color: '#fff', opacity: 0.9 },
  navBadge:         { backgroundColor: '#FF2A6D', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  navBadgeText:     { fontSize: 10, fontWeight: '900', color: '#fff' },

  contentArea: { flex: 1 },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 24,
    borderWidth: 1.5, borderColor: '#FFCCE1',
    padding: 20,
    shadowColor: '#FF5C8A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 16, borderBottomWidth: 1.5,
    borderBottomColor: '#FFF0F3', paddingBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#2A0826', textTransform: 'uppercase' },

  // Empty state
  emptyState: { alignItems: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#2A0826' },
  emptySub:   { fontSize: 12, fontWeight: '600', color: '#684E67', textAlign: 'center' },

  // Member rows
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#FFF0F3',
  },
  avatar:     { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFCCE1' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#FF2A6D' },
  memberName: { fontSize: 15, fontWeight: '900', color: '#2A0826' },
  memberSub:  { fontSize: 12, fontWeight: '600', color: '#684E67', marginTop: 2 },
  statusRow:  { flexDirection: 'row', marginTop: 6 },
  statusBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  statusSos:     { backgroundColor: '#FFF0F3', borderColor: '#FF2A6D' },
  statusJourney: { backgroundColor: '#ECFDF5', borderColor: '#34D399' },
  statusSafe:    { backgroundColor: COLORS.surface, borderColor: COLORS.primaryBorder },

  // Action buttons
  actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muteBtn:    { padding: 8, backgroundColor: '#FFF0F3', borderRadius: 8 },
  callBtn:    { padding: 8, backgroundColor: '#DCFCE7', borderRadius: 8 },
  trackBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#FF2A6D', borderRadius: 8 },
  trackBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  deleteBtn:  { padding: 10, backgroundColor: '#FFF0F3', borderRadius: 12 },

  // Settings
  settingsBlock: { gap: 8 },
  label:         { fontSize: 13, fontWeight: '900', color: '#2A0826' },
  desc:          { fontSize: 12, fontWeight: '600', color: '#684E67', lineHeight: 18 },
  codeRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  codeText:      { flex: 1, fontSize: 16, fontWeight: '900', color: '#FF2A6D', backgroundColor: '#FFF0F3', padding: 14, borderRadius: 16, textAlign: 'center', borderWidth: 1.5, borderColor: '#FFCCE1' },
  shareBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF2A6D', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, shadowColor: '#FF2A6D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  shareBtnText:  { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 14 },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1.5, borderBottomColor: '#FFCCE1', paddingBottom: 10 },
  modalTitle:   { flex: 1, fontSize: 15, fontWeight: '900', color: COLORS.textDark },
  modalSosBanner:{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F3', borderWidth: 1.5, borderColor: '#FFCCE1', borderRadius: 12, padding: 10 },
  modalSosBannerText: { flex: 1, fontSize: 11, fontWeight: '800', color: '#FF2A6D' },
  modalActions:  { flexDirection: 'row', gap: 10 },
  callMemberBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 14, gap: 6 },
  whatsappBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', paddingVertical: 12, borderRadius: 14, gap: 6 },
  modalActionText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
});
