import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Linking,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { io } from 'socket.io-client';
import { parentApi } from '../../api/parentApi';
import { API_URL } from '../../utils/constants';
import { COLORS } from '../../theme/colors';
import { playEmergencySiren, stopEmergencySiren } from '../../utils/soundPlayer';
import { toggleSosMute } from '../../redux/slices/sosSlice';

const { width } = Dimensions.get('window');

export default function ParentDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const mutedSosIds = useSelector((state) => state?.sos?.mutedSosIds || []);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('safety'); // 'safety' | 'children'
  const [stats, setStats] = useState({ totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
  const [childrenList, setChildrenList] = useState([]);

  // Modal State for Linking Child
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [isLinking, setIsLinking] = useState(false);

  const socketRef = useRef(null);

  // Fetch Parent Overview Data
  const fetchData = useCallback(async (showIndicator = true) => {
    try {
      if (showIndicator) setIsLoading(true);
      const res = await parentApi.getOverview();
      if (res && res.success) {
        setStats(res.stats || { totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
        setChildrenList(res.children || []);
      }
    } catch (e) {
      console.log('[ParentDashboard] Fetch error:', e?.message);
    } finally {
      if (showIndicator) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);

    // Auto-refresh fallback every 8 seconds (matching web client)
    const interval = setInterval(() => {
      fetchData(false);
    }, 8000);

    // Socket.IO for Real-Time Emergency Alerts
    const serverUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(serverUrl, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (user) {
        const cleanPhone = user.phone ? user.phone.replace(/\D/g, '') : null;
        socket.emit('register-user', {
          email: user.email?.trim().toLowerCase(),
          phone: cleanPhone,
          role: user.role,
        });
        if (user.email) socket.emit('join-room', `user:${user.email.trim().toLowerCase()}`);
        if (cleanPhone) socket.emit('join-room', `user:${cleanPhone}`);
      }
    });

    const handleRealtimeUpdate = () => {
      fetchData(false);
    };

    socket.on('SOS_ALARM_BROADCAST', handleRealtimeUpdate);
    socket.on('SOS_ALARM_STOP', handleRealtimeUpdate);
    socket.on('SOS_PERIODIC_5MIN_UPDATE', handleRealtimeUpdate);
    socket.on('JOURNEY_STATUS_UPDATE', handleRealtimeUpdate);

    // Real-time location updates for children
    socket.on('SOS_LOCATION_UPDATE', (data) => {
      if (!data?.sosSessionId || !data?.latitude || !data?.longitude) return;
      const incomingId = parseInt(data.sosSessionId, 10);
      setChildrenList((prevList) =>
        prevList.map((item) => {
          if (item.activeSos && parseInt(item.activeSos.id, 10) === incomingId) {
            return {
              ...item,
              activeSos: {
                ...item.activeSos,
                latestLocation: {
                  latitude: data.latitude,
                  longitude: data.longitude,
                  accuracy: data.accuracy || 10,
                },
              },
            };
          }
          return item;
        })
      );
    });

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [fetchData, user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  // Link Child API
  const handleLinkChild = async () => {
    const inputVal = linkInput.trim();
    if (!inputVal) {
      return Alert.alert('Required', 'Please enter your child\'s registered email or 10-digit mobile number.');
    }

    try {
      setIsLinking(true);
      const res = await parentApi.linkChild({
        identifier: inputVal,
        relationship: relationship.trim(),
      });
      setIsLinking(false);
      setShowLinkModal(false);
      setLinkInput('');
      Alert.alert('Success', res?.message || 'Child linked successfully!');
      fetchData(false);
    } catch (e) {
      setIsLinking(false);
      Alert.alert('Error', e.response?.data?.error || 'Failed to link child. Please verify child email or phone.');
    }
  };

  // Unlink Child API
  const handleUnlink = (linkId, childName) => {
    Alert.alert(
      'Unlink Child',
      `Are you sure you want to unlink ${childName || 'this child'} from your Parent Portal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: async () => {
            try {
              await parentApi.unlinkChild(linkId);
              setChildrenList((prev) => prev.filter((c) => c.linkId !== linkId));
              fetchData(false);
            } catch (e) {
              Alert.alert('Error', 'Failed to unlink child');
            }
          },
        },
      ]
    );
  };

  // Open Maps / Live Track
  const handleTrackChild = (childItem) => {
    const activeSos = childItem.activeSos;
    const activeJourney = childItem.activeJourney;

    if (activeSos?.shareToken) {
      const url = `https://sakhisuraksha.veaglespace.com/live-track/${activeSos.shareToken}`;
      Linking.openURL(url).catch(() => {});
    } else if (activeJourney?.shareToken) {
      const url = `https://sakhisuraksha.veaglespace.com/live-track/${activeJourney.shareToken}`;
      Linking.openURL(url).catch(() => {});
    } else if (activeSos?.latestLocation?.latitude && activeSos?.latestLocation?.longitude) {
      const gmap = `https://www.google.com/maps/search/?api=1&query=${activeSos.latestLocation.latitude},${activeSos.latestLocation.longitude}`;
      Linking.openURL(gmap).catch(() => {});
    } else {
      Alert.alert('Location Pending', 'Waiting for live GPS coordinates from child\'s device.');
    }
  };

  const handleCallChild = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const handleWhatsAppChild = (phone, name) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Hello ${name || 'beta'}, I am checking your safety status from the SakhiSuraksha Parent Portal.`);
    Linking.openURL(`whatsapp://send?phone=${clean}&text=${msg}`).catch(() => {
      Linking.openURL(`https://wa.me/${clean}?text=${msg}`).catch(() => {});
    });
  };

  if (isLoading && childrenList.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Parent Safety Command...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* 1. TOP PARENTAL CONTROL HEADER (Matching Client Web) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={['#FF5C8A', '#FF2A6D', '#FFD166']}
            style={styles.headerIconCircle}
          >
            <Ionicons name="shield-checkmark" size={24} color="#FFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <View style={styles.headerBadgeRow}>
              <View style={styles.parentPill}>
                <Text style={styles.parentPillText}>PARENTAL CONTROL</Text>
              </View>
              <View style={styles.liveGuardianRow}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveGuardianText}>Child Safety Guardian</Text>
              </View>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {user?.fullName || 'Parent Safety Command'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => fetchData(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
          <Text style={styles.refreshBtnText}>SYNC</Text>
        </TouchableOpacity>
      </View>

      {/* 2. STATS SUMMARY BAR */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.totalChildren}</Text>
          <Text style={styles.statLabel}>Family Linked</Text>
        </View>
        <View style={[styles.statBox, stats.activeSosCount > 0 && styles.statBoxDanger]}>
          <Text style={[styles.statNum, stats.activeSosCount > 0 && { color: '#FF2A6D' }]}>
            {stats.activeSosCount}
          </Text>
          <Text style={[styles.statLabel, stats.activeSosCount > 0 && { color: '#FF2A6D', fontWeight: '900' }]}>
            Active SOS
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.inTripCount}</Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>
      </View>

      {/* 3. DUAL-TAB NAVIGATION BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'safety' && styles.tabBtnActive]}
          onPress={() => setActiveTab('safety')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="activity"
            size={16}
            color={activeTab === 'safety' ? '#FFF' : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'safety' && styles.tabBtnTextActive]}>
            Safety Command
          </Text>
          {stats.activeSosCount > 0 && (
            <View style={styles.tabSosBadge}>
              <Text style={styles.tabSosBadgeText}>{stats.activeSosCount} SOS</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'children' && styles.tabBtnActive]}
          onPress={() => setActiveTab('children')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="people"
            size={16}
            color={activeTab === 'children' ? '#FFF' : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'children' && styles.tabBtnTextActive]}>
            Family Members ({stats.totalChildren})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* TAB 1: SAFETY COMMAND */}
        {activeTab === 'safety' && (
          <View style={styles.tabContent}>
            {/* EMERGENCY SOS BANNER IF ANY CHILD HAS ACTIVE SOS */}
            {stats.activeSosCount > 0 && (
              <LinearGradient
                colors={['#FF2A6D', '#FF5C8A', '#E01A4F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sosAlertBanner}
              >
                <Ionicons name="warning" size={32} color="#FFF" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sosAlertTitle}>EMERGENCY SOS ALERT ACTIVATED!</Text>
                  <Text style={styles.sosAlertSub}>
                    One of your linked children has triggered an Emergency SOS Panic Alarm. Live GPS tracking is broadcasting now!
                  </Text>
                </View>
              </LinearGradient>
            )}

            {childrenList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="heart-outline" size={48} color={COLORS.primaryLight} />
                <Text style={styles.emptyTitle}>No Children Linked Yet</Text>
                <Text style={styles.emptySub}>
                  Link your daughter's or child's account to view real-time GPS safety status and receive instant emergency alerts.
                </Text>
                <TouchableOpacity
                  style={styles.primaryActionBtn}
                  onPress={() => setShowLinkModal(true)}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#FF5C8A', '#FF2A6D']}
                    style={styles.primaryActionGradient}
                  >
                    <Ionicons name="add-circle" size={18} color="#FFF" />
                    <Text style={styles.primaryActionText}>LINK CHILD ACCOUNT NOW</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              childrenList.map((item) => {
                const c = item.child;
                const isSos = !!item.activeSos || c?.safetyStatus === 'SOS_ACTIVE';
                const isTrip = !!item.activeJourney || c?.safetyStatus === 'JOURNEY_ACTIVE';
                const isMuted = item.activeSos && mutedSosIds.includes(String(item.activeSos.id));

                return (
                  <View
                    key={item.linkId}
                    style={[
                      styles.childSafetyCard,
                      isSos ? styles.childCardSos : isTrip ? styles.childCardTrip : styles.childCardSafe,
                    ]}
                  >
                    {/* Top Row: Avatar + Name + Safety Badge */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.cardUserLeft}>
                        <View
                          style={[
                            styles.avatarCircle,
                            isSos ? { backgroundColor: '#FF2A6D' } : isTrip ? { backgroundColor: '#10B981' } : { backgroundColor: COLORS.primary },
                          ]}
                        >
                          <Text style={styles.avatarLetter}>
                            {c.fullName ? c.fullName.charAt(0).toUpperCase() : 'C'}
                          </Text>
                        </View>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.childCardName}>{c.fullName}</Text>
                            <View style={styles.relChip}>
                              <Text style={styles.relChipText}>{item.relationship || 'Child'}</Text>
                            </View>
                          </View>
                          <Text style={styles.childCardPhone}>{c.phone || c.email}</Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View>
                        {isSos ? (
                          <View style={styles.badgeSos}>
                            <Ionicons name="warning" size={12} color="#FFF" />
                            <Text style={styles.badgeSosText}>SOS ACTIVE</Text>
                          </View>
                        ) : isTrip ? (
                          <View style={styles.badgeTrip}>
                            <Ionicons name="navigate" size={12} color="#FFF" />
                            <Text style={styles.badgeTripText}>IN TRANSIT</Text>
                          </View>
                        ) : (
                          <View style={styles.badgeSafe}>
                            <Ionicons name="shield-checkmark" size={12} color="#059669" />
                            <Text style={styles.badgeSafeText}>SAFE & PROTECTED</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Middle Info: GPS & Trip info */}
                    <View style={styles.cardInfoBox}>
                      <View style={styles.infoRowItem}>
                        <Ionicons name="location" size={16} color={isSos ? '#FF2A6D' : COLORS.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.infoLabel}>GPS TRACKING</Text>
                          <Text style={styles.infoVal}>
                            {item.activeSos?.latestLocation?.latitude
                              ? `Lat: ${Number(item.activeSos.latestLocation.latitude).toFixed(4)}, Lng: ${Number(item.activeSos.latestLocation.longitude).toFixed(4)}`
                              : 'Real-Time Geo Sync Active'}
                          </Text>
                        </View>
                      </View>

                      {item.activeJourney ? (
                        <View style={styles.infoRowItem}>
                          <Ionicons name="navigate-circle" size={16} color="#10B981" />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.infoLabel, { color: '#059669' }]}>ACTIVE TRIP DESTINATION</Text>
                            <Text style={styles.infoVal} numberOfLines={1}>
                              {item.activeJourney.destinationName || 'En route to destination'}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.infoRowItem}>
                          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>TRIP MONITOR</Text>
                            <Text style={styles.infoVal}>No active journey in progress</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={styles.actionBtnCall}
                        onPress={() => handleCallChild(c.phone)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="call" size={14} color="#FFF" />
                        <Text style={styles.actionBtnCallText}>CALL</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtnWa}
                        onPress={() => handleWhatsAppChild(c.phone, c.fullName)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#FFF" />
                        <Text style={styles.actionBtnWaText}>WHATSAPP</Text>
                      </TouchableOpacity>

                      {(isSos || isTrip) && (
                        <TouchableOpacity
                          style={styles.actionBtnTrack}
                          onPress={() => handleTrackChild(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="map" size={14} color="#FFF" />
                          <Text style={styles.actionBtnTrackText}>LIVE TRACK</Text>
                        </TouchableOpacity>
                      )}

                      {isSos && item.activeSos && (
                        <TouchableOpacity
                          style={[styles.actionBtnMute, isMuted && styles.actionBtnUnmute]}
                          onPress={() => {
                            if (isMuted) {
                              playEmergencySiren(true);
                            } else {
                              stopEmergencySiren();
                            }
                            dispatch(toggleSosMute(item.activeSos.id));
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name={isMuted ? "volume-high" : "volume-mute"} size={14} color={isMuted ? COLORS.primary : "#FFF"} />
                          <Text style={[styles.actionBtnMuteText, isMuted && { color: COLORS.primary }]}>
                            {isMuted ? 'UNMUTE' : 'MUTE'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: LINKED CHILDREN MANAGEMENT */}
        {activeTab === 'children' && (
          <View style={styles.tabContent}>
            <View style={styles.tabHeaderCard}>
              <View>
                <Text style={styles.tabHeaderTitle}>Linked Child Accounts</Text>
                <Text style={styles.tabHeaderSub}>Manage safety connections for your family</Text>
              </View>
              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => setShowLinkModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="person-add" size={15} color="#FFF" />
                <Text style={styles.addMemberBtnText}>LINK CHILD</Text>
              </TouchableOpacity>
            </View>

            {childrenList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={40} color={COLORS.primaryLight} />
                <Text style={styles.emptyTitle}>No Family Members Linked</Text>
                <Text style={styles.emptySub}>
                  Link your child's phone number to monitor their journey and receive instant alerts.
                </Text>
              </View>
            ) : (
              childrenList.map((item) => (
                <View key={item.linkId} style={styles.memberManageCard}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {item.child.fullName ? item.child.fullName.charAt(0).toUpperCase() : 'C'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.memberName}>{item.child.fullName}</Text>
                      <View style={styles.relChip}>
                        <Text style={styles.relChipText}>{item.relationship || 'Child'}</Text>
                      </View>
                    </View>
                    <Text style={styles.memberSub}>
                      {item.child.phone} • {item.child.email}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.unlinkBtn}
                    onPress={() => handleUnlink(item.linkId, item.child.fullName)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* 4. LINK CHILD MODAL DIALOG */}
      <Modal
        visible={showLinkModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="link" size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Link Child Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLinkModal(false)}>
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter your child's registered mobile number or email address to link them to your parental guardian command.
            </Text>

            <View style={styles.modalForm}>
              <Text style={styles.fieldLabel}>Child's Mobile or Email</Text>
              <TextInput
                style={styles.inputField}
                placeholder="e.g. 9876543210 or child@mail.com"
                placeholderTextColor={COLORS.primaryBorder}
                value={linkInput}
                onChangeText={setLinkInput}
                autoCapitalize="none"
              />

              <Text style={styles.fieldLabel}>Your Relationship to Child</Text>
              <View style={styles.relSelectorRow}>
                {['Mother', 'Father', 'Parent', 'Guardian'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.relOption, relationship === r && styles.relOptionActive]}
                    onPress={() => setRelationship(r)}
                  >
                    <Text style={[styles.relOptionText, relationship === r && styles.relOptionTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitLinkBtn}
                onPress={handleLinkChild}
                disabled={isLinking}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#FF5C8A', '#FF2A6D']}
                  style={styles.submitLinkGradient}
                >
                  {isLinking ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                      <Text style={styles.submitLinkText}>LINK CHILD NOW</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 13, fontWeight: '700', color: COLORS.textMuted },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primaryBorder,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  parentPill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  parentPillText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  liveGuardianRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#059669' },
  liveGuardianText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  headerTitle: { fontSize: 17, fontWeight: '900', color: COLORS.textDark, marginTop: 2 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0F3',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  refreshBtnText: { color: COLORS.primary, fontSize: 11, fontWeight: '900' },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryBorder,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  statBoxDanger: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF2A6D',
  },
  statNum: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  statLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 1 },

  // Dual Tabs
  tabBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabBtnText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  tabBtnTextActive: { color: '#FFF' },
  tabSosBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  tabSosBadgeText: { color: '#FF2A6D', fontSize: 9, fontWeight: '900' },

  scroll: { padding: 14, paddingBottom: 40 },
  tabContent: { gap: 14 },

  // Emergency SOS Banner
  sosAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  sosAlertTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  sosAlertSub: { color: '#FFF', fontSize: 11, fontWeight: '700', opacity: 0.95, marginTop: 2 },

  // Child Safety Card
  childSafetyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 2,
    padding: 16,
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  childCardSos: { backgroundColor: '#FFF0F3', borderColor: '#FF2A6D' },
  childCardTrip: { backgroundColor: '#F0FDF4', borderColor: '#10B981' },
  childCardSafe: { backgroundColor: COLORS.surface, borderColor: COLORS.primaryBorder },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardUserLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  childCardName: { fontSize: 15, fontWeight: '900', color: COLORS.textDark },
  relChip: {
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  relChipText: { color: COLORS.primary, fontSize: 9, fontWeight: '800' },
  childCardPhone: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },

  badgeSos: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeSosText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  badgeTrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeTripText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  badgeSafe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeSafeText: { color: '#059669', fontSize: 10, fontWeight: '900' },

  cardInfoBox: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: 10,
  },
  infoRowItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 9, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  infoVal: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginTop: 1 },

  cardActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnCallText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  actionBtnWa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnWaText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  actionBtnTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnTrackText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  actionBtnMute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnUnmute: {
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  actionBtnMuteText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  // Tab 2 Management Card
  tabHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
  },
  tabHeaderTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textDark },
  tabHeaderSub: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addMemberBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  memberManageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    gap: 12,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  memberAvatarText: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  memberName: { fontSize: 14, fontWeight: '900', color: COLORS.textDark },
  memberSub: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  unlinkBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 10 },

  // Empty State
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  emptySub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  primaryActionBtn: { marginTop: 8, width: '100%', maxWidth: 260 },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  primaryActionText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 16,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 17, fontWeight: '900', color: COLORS.textDark },
  modalDesc: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  modalForm: { gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textDark },
  inputField: {
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  relSelectorRow: { flexDirection: 'row', gap: 8 },
  relOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
  },
  relOptionActive: {
    backgroundColor: '#FFF0F3',
    borderColor: COLORS.primary,
  },
  relOptionText: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },
  relOptionTextActive: { color: COLORS.primary, fontWeight: '900' },
  submitLinkBtn: { marginTop: 6 },
  submitLinkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
  submitLinkText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
});
