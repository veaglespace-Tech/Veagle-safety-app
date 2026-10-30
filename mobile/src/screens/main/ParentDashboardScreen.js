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
import { sosApi } from '../../api/sosApi';
import { API_URL } from '../../utils/constants';
import { COLORS } from '../../theme/colors';
import { playEmergencySiren, stopEmergencySiren } from '../../utils/soundPlayer';
import { toggleSosMute } from '../../redux/slices/sosSlice';
import LiveSosMap from '../../components/Admin/LiveSosMap';

const { width } = Dimensions.get('window');

export default function ParentDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const mutedSosIds = useSelector((state) => state?.sos?.mutedSosIds || []);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('safety'); // 'safety' | 'children' | 'history'
  const [stats, setStats] = useState({ totalChildren: 0, activeSosCount: 0, inTripCount: 0, safeCount: 0 });
  const [childrenList, setChildrenList] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [recentJourneys, setRecentJourneys] = useState([]);

  // Modal State for Linking Child
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [isLinking, setIsLinking] = useState(false);

  // Modal State for Live Map Tracking
  const [trackingItem, setTrackingItem] = useState(null);
  const [pingingChildId, setPingingChildId] = useState(null);

  const socketRef = useRef(null);
  const playedAlertIdsRef = useRef(new Set());

  // Fetch Parent Overview Data
  const fetchData = useCallback(async (showIndicator = true) => {
    try {
      if (showIndicator) setIsLoading(true);
      const res = await parentApi.getOverview();
      if (res && res.success) {
        setStats(res.stats || { totalChildren: 0, activeSosCount: 0, inTripCount: 0, safeCount: 0 });
        setChildrenList(res.children || []);
        setRecentAlerts(res.recentAlerts || []);
        setRecentJourneys(res.recentJourneys || []);
      }
    } catch (e) {
      console.log('[ParentDashboard] Fetch error:', e?.message);
    } finally {
      if (showIndicator) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Poll location if actively tracking a child
  useEffect(() => {
    if (!trackingItem?.activeSos?.id) return;

    const fetchLocationData = async () => {
      try {
        const data = await sosApi.getSosLocation(trackingItem.activeSos.id);
        if (data && data.location) {
          const lat = parseFloat(data.location.latitude);
          const lng = parseFloat(data.location.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            setTrackingItem((prev) => {
              if (prev && prev.activeSos && prev.activeSos.id === trackingItem.activeSos.id) {
                return {
                  ...prev,
                  activeSos: {
                    ...prev.activeSos,
                    latestLocation: {
                      latitude: lat,
                      longitude: lng,
                      accuracy: data.location.accuracy || 10,
                    },
                    locationHistory: data.history || [],
                  },
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.log('[Parent Polling] Location fetch error:', e?.message);
      }
    };

    fetchLocationData();
    const interval = setInterval(fetchLocationData, 3000);
    return () => clearInterval(interval);
  }, [trackingItem?.activeSos?.id]);

  useEffect(() => {
    fetchData(true);

    const interval = setInterval(() => {
      fetchData(false);
    }, 8000);

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
    socket.on('SOS_ALARM_STOP', () => {
      handleRealtimeUpdate();
      setTrackingItem(null);
    });
    socket.on('SOS_PERIODIC_5MIN_UPDATE', handleRealtimeUpdate);
    socket.on('JOURNEY_STATUS_UPDATE', handleRealtimeUpdate);

    socket.on('SOS_LOCATION_UPDATE', (data) => {
      if (!data?.sosSessionId || !data?.latitude || !data?.longitude) return;
      const incomingId = parseInt(data.sosSessionId, 10);
      const newLat = parseFloat(data.latitude);
      const newLng = parseFloat(data.longitude);
      const newAcc = data.accuracy ? parseFloat(data.accuracy) : 10;

      // Update in active children list
      setChildrenList((prevList) =>
        prevList.map((item) => {
          if (item.activeSos && parseInt(item.activeSos.id, 10) === incomingId) {
            return {
              ...item,
              activeSos: {
                ...item.activeSos,
                latestLocation: {
                  latitude: newLat,
                  longitude: newLng,
                  accuracy: newAcc,
                },
              },
            };
          }
          return item;
        })
      );

      // Update in live modal tracking view
      setTrackingItem((prev) => {
        if (prev && prev.activeSos && parseInt(prev.activeSos.id, 10) === incomingId) {
          const hist = prev.activeSos.locationHistory ? [...prev.activeSos.locationHistory] : [];
          hist.push({
            latitude: newLat,
            longitude: newLng,
            accuracy: newAcc,
            recordedAt: data.recordedAt || new Date().toISOString(),
          });
          return {
            ...prev,
            activeSos: {
              ...prev.activeSos,
              latestLocation: {
                latitude: newLat,
                longitude: newLng,
                accuracy: newAcc,
              },
              locationHistory: hist,
            },
          };
        }
        return prev;
      });
    });

    return () => {
      clearInterval(interval);
      stopEmergencySiren().catch(() => {});
      if (socket) socket.disconnect();
    };
  }, [fetchData, user]);

  // Audio Siren Management - Alerts once per new unmuted SOS and stops immediately on mute
  useEffect(() => {
    const activeSosItems = childrenList.filter((item) => item.activeSos);
    let shouldAlertOnce = false;

    activeSosItems.forEach((item) => {
      const sosId = String(item.activeSos.id);
      if (!mutedSosIds.includes(sosId) && !playedAlertIdsRef.current.has(sosId)) {
        playedAlertIdsRef.current.add(sosId);
        shouldAlertOnce = true;
      }
    });

    const hasAnyUnmuted = activeSosItems.some(
      (item) => !mutedSosIds.includes(String(item.activeSos.id))
    );

    if (shouldAlertOnce && hasAnyUnmuted) {
      playEmergencySiren(true, 60).catch(() => {});
    } else if (!hasAnyUnmuted) {
      stopEmergencySiren().catch(() => {});
    }
  }, [childrenList, mutedSosIds]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  const notify = (title, message) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const confirmAction = (title, message, onConfirm) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: onConfirm },
      ]);
    }
  };

  // Handle Child Safety Check-in Ping (New Feature from Web!)
  const handlePingCheckin = async (childId, childName) => {
    try {
      setPingingChildId(childId);
      const res = await parentApi.pingCheckin(childId);
      notify('Ping Dispatched', res.message || `Safety check-in ping dispatched to ${childName}!`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to dispatch safety ping.';
      notify('Notice', msg);
    } finally {
      setPingingChildId(null);
    }
  };

  // Link Child
  const handleLinkChild = async () => {
    if (!linkInput.trim()) {
      notify('Required', 'Please enter your child\'s registered email or 10-digit mobile number.');
      return;
    }

    try {
      setIsLinking(true);
      const res = await parentApi.linkChild({
        identifier: linkInput.trim(),
        relationship,
      });

      if (res && res.success) {
        notify('Child Linked', res.message || 'Child account successfully linked!');
        setLinkInput('');
        setShowLinkModal(false);
        fetchData(false);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Failed to link child account. Please verify mobile/email.';
      notify('Linking Error', msg);
    } finally {
      setIsLinking(false);
    }
  };

  // Unlink Child
  const handleUnlink = (linkId, childName) => {
    confirmAction(
      'Unlink Child Account',
      `Are you sure you want to unlink ${childName}? You will no longer receive emergency alerts for this child.`,
      async () => {
        try {
          const res = await parentApi.unlinkChild(linkId);
          if (res && res.success) {
            notify('Success', `${childName} has been unlinked.`);
            fetchData(false);
          }
        } catch (e) {
          notify('Error', e?.response?.data?.error || 'Failed to unlink child.');
        }
      }
    );
  };

  const handleTrackChild = (item) => {
    setTrackingItem(item);
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

  // Derive real-time counts from current active children to avoid stale false-positive alarms
  const realActiveSosCount = childrenList.length > 0
    ? childrenList.filter((c) => Boolean(c.activeSos)).length
    : (stats.activeSosCount || 0);

  const realInTripCount = childrenList.length > 0
    ? childrenList.filter((c) => !c.activeSos && Boolean(c.activeJourney)).length
    : (stats.inTripCount || 0);

  const realSafeCount = childrenList.length > 0
    ? childrenList.filter((c) => !c.activeSos && !c.activeJourney).length
    : (stats.safeCount !== undefined ? stats.safeCount : Math.max(0, (stats.totalChildren || 0) - realActiveSosCount - realInTripCount));

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
      {/* 1. TOP PARENTAL CONTROL HEADER */}
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
        <View style={[styles.statBox, realActiveSosCount > 0 && styles.statBoxDanger]}>
          <Text style={[styles.statNum, realActiveSosCount > 0 && { color: '#FF2A6D' }]}>
            {realActiveSosCount}
          </Text>
          <Text style={[styles.statLabel, realActiveSosCount > 0 && { color: '#FF2A6D', fontWeight: '900' }]}>
            Active SOS
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{realInTripCount}</Text>
          <Text style={styles.statLabel}>In Transit</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#059669' }]}>
            {realSafeCount}
          </Text>
          <Text style={styles.statLabel}>Safe & Sound</Text>
        </View>
      </View>

      {/* 3. THREE-TAB NAVIGATION BAR (Matching Client Web) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'safety' && styles.tabBtnActive]}
          onPress={() => setActiveTab('safety')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="pulse-outline"
            size={15}
            color={activeTab === 'safety' ? '#FFF' : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'safety' && styles.tabBtnTextActive]}>
            Safety Monitor
          </Text>
          {realActiveSosCount > 0 && (
            <View style={styles.tabSosBadge}>
              <Text style={styles.tabSosBadgeText}>{realActiveSosCount}</Text>
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
            size={15}
            color={activeTab === 'children' ? '#FFF' : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'children' && styles.tabBtnTextActive]}>
            Children ({stats.totalChildren})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.85}
        >
          <Ionicons
            name="time"
            size={15}
            color={activeTab === 'history' ? '#FFF' : COLORS.textMuted}
          />
          <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* TAB 1: SAFETY MONITOR */}
        {activeTab === 'safety' && (
          <View style={styles.tabContent}>
            {/* EMERGENCY SOS BANNER IF ANY CHILD HAS ACTIVE SOS */}
            {realActiveSosCount > 0 && (
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
                const latestLat = item.activeSos?.latestLocation?.latitude || item.lastKnownLocation?.latitude;
                const latestLng = item.activeSos?.latestLocation?.longitude || item.lastKnownLocation?.longitude;

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
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.childCardName}>{c.fullName}</Text>
                            <View style={styles.relChip}>
                              <Text style={styles.relChipText}>{item.relationship || 'Child'}</Text>
                            </View>
                            {c.bloodGroup && (
                              <View style={styles.bloodChip}>
                                <Text style={styles.bloodChipText}>🩸 {c.bloodGroup}</Text>
                              </View>
                            )}
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
                          <Text style={styles.infoLabel}>
                            {isSos ? 'LIVE EMERGENCY GPS' : item.lastKnownLocation ? 'LAST RECORDED LOCATION' : 'GEO SYNC'}
                          </Text>
                          <Text style={styles.infoVal}>
                            {latestLat && latestLng
                              ? `Lat: ${Number(latestLat).toFixed(4)}, Lng: ${Number(latestLng).toFixed(4)}`
                              : 'Real-Time Geo Sync Active'}
                          </Text>
                        </View>
                      </View>

                      {item.activeJourney && (
                        <View style={styles.infoRowItem}>
                          <Ionicons name="navigate-circle" size={16} color="#10B981" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.infoLabel}>ACTIVE JOURNEY DESTINATION</Text>
                            <Text style={styles.infoVal}>
                              {item.activeJourney.destinationName || 'Live Tracking Journey'}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Actions Buttons Row */}
                    <View style={styles.cardActionsRow}>
                      {/* Check-in Ping Button (New feature from web!) */}
                      <TouchableOpacity
                        style={styles.actionBtnPing}
                        onPress={() => handlePingCheckin(c.id, c.fullName)}
                        disabled={pingingChildId === c.id}
                        activeOpacity={0.8}
                      >
                        {pingingChildId === c.id ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="radio" size={14} color="#FFF" />
                            <Text style={styles.actionBtnPingText}>CHECK-IN PING</Text>
                          </>
                        )}
                      </TouchableOpacity>

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

                      {/* Map Tracking Button (Works for SOS, Journey, or Last Known Location) */}
                      {(isSos || isTrip || latestLat) && (
                        <TouchableOpacity
                          style={styles.actionBtnTrack}
                          onPress={() => handleTrackChild(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="map" size={14} color="#FFF" />
                          <Text style={styles.actionBtnTrackText}>
                            {isSos ? 'LIVE TRACK' : 'VIEW MAP'}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {isSos && item.activeSos && (
                        <TouchableOpacity
                          style={[styles.actionBtnMute, isMuted && styles.actionBtnUnmute]}
                          onPress={() => {
                            const sosId = String(item.activeSos.id);
                            if (isMuted) {
                              playedAlertIdsRef.current.delete(sosId);
                              playEmergencySiren(true, 60);
                            } else {
                              playedAlertIdsRef.current.add(sosId);
                              stopEmergencySiren();
                            }
                            dispatch(toggleSosMute(sosId));
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
              <View style={{ flex: 1 }}>
                <Text style={styles.tabHeaderTitle}>Linked Child Accounts</Text>
                <Text style={styles.tabHeaderSub}>Manage safety connections for your family</Text>
              </View>
              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => setShowLinkModal(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="person-add" size={14} color="#FFF" />
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
                      📞 {item.child.phone} • ✉️ {item.child.email}
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

        {/* TAB 3: ALERTS & TRIP HISTORY (New Feature matching Web client!) */}
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            {/* RECENT SOS ALERTS */}
            <View style={styles.historySection}>
              <View style={styles.historyHeaderRow}>
                <Ionicons name="warning" size={18} color="#FF2A6D" />
                <Text style={styles.historySectionTitle}>Recent Emergency SOS Alerts</Text>
              </View>

              {recentAlerts.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Text style={styles.emptyHistoryText}>No emergency alerts recorded yet. All is safe.</Text>
                </View>
              ) : (
                recentAlerts.map((alt) => (
                  <View key={alt.id} style={styles.historyItemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyItemName}>
                        SOS #{alt.id} • {alt.user?.fullName || 'Child'}
                      </Text>
                      <Text style={styles.historyItemTime}>
                        {alt.startedAt ? new Date(alt.startedAt).toLocaleString('en-IN') : 'Recent'}
                      </Text>
                    </View>
                    <View style={[styles.historyStatusBadge, alt.status === 'RESOLVED' ? styles.histResolved : styles.histActive]}>
                      <Text style={[styles.historyStatusText, alt.status === 'RESOLVED' ? { color: '#059669' } : { color: '#FF2A6D' }]}>
                        {alt.status}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* RECENT JOURNEYS */}
            <View style={styles.historySection}>
              <View style={styles.historyHeaderRow}>
                <Ionicons name="navigate" size={18} color="#10B981" />
                <Text style={styles.historySectionTitle}>Recent Journey & Commute Logs</Text>
              </View>

              {recentJourneys.length === 0 ? (
                <View style={styles.emptyHistoryBox}>
                  <Text style={styles.emptyHistoryText}>No past journeys recorded for linked children.</Text>
                </View>
              ) : (
                recentJourneys.map((j) => (
                  <View key={j.id} style={styles.historyItemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyItemName}>
                        {j.destinationName || 'Commute Route'} • {j.user?.fullName || 'Child'}
                      </Text>
                      <Text style={styles.historyItemTime}>
                        {j.startedAt ? new Date(j.startedAt).toLocaleString('en-IN') : 'Recent'}
                      </Text>
                    </View>
                    <View style={[styles.historyStatusBadge, styles.histResolved]}>
                      <Text style={[styles.historyStatusText, { color: '#059669' }]}>
                        {j.status || 'COMPLETED'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
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
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Enter your child's registered mobile number or email address to request access to their real-time safety stream.
            </Text>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Child Registered Mobile or Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210 or daughter@gmail.com"
                placeholderTextColor={COLORS.textMuted}
                value={linkInput}
                onChangeText={setLinkInput}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Your Relationship</Text>
              <View style={styles.relSelectionRow}>
                {['Parent', 'Mother', 'Father', 'Guardian'].map((rel) => (
                  <TouchableOpacity
                    key={rel}
                    style={[styles.relOption, relationship === rel && styles.relOptionActive]}
                    onPress={() => setRelationship(rel)}
                  >
                    <Text style={[styles.relOptionText, relationship === rel && styles.relOptionTextActive]}>
                      {rel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleLinkChild}
              disabled={isLinking}
              activeOpacity={0.85}
            >
              {isLinking ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.modalSubmitBtnText}>LINK CHILD NOW</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 5. FULLSCREEN / MODAL LIVE MAP TRACKING */}
      <Modal
        visible={!!trackingItem}
        transparent
        animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
        onRequestClose={() => setTrackingItem(null)}
      >
        {trackingItem && (() => {
          const isSosChild = Boolean(trackingItem.activeSos);
          return (
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Ionicons
                    name={isSosChild ? "warning" : "shield-checkmark"}
                    size={22}
                    color={isSosChild ? "#FF2A6D" : "#10B981"}
                  />
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {isSosChild ? '🚨 Live SOS: ' : '📍 Location: '}
                    {trackingItem.child?.fullName || 'Child'}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  backgroundColor: isSosChild ? '#FFE4EC' : '#ECFDF5',
                  borderWidth: 1,
                  borderColor: isSosChild ? '#FF2A6D' : '#10B981',
                  marginRight: 8,
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '900',
                    color: isSosChild ? '#FF2A6D' : '#059669',
                  }}>
                    {isSosChild ? 'SOS ACTIVE' : 'SAFE & PROTECTED'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setTrackingItem(null)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              {/* LIVE SOS MAP / SAFE LOCATION MAP */}
              <LiveSosMap
                latitude={
                  trackingItem.activeSos?.latestLocation?.latitude ||
                  trackingItem.lastKnownLocation?.latitude ||
                  18.5204
                }
                longitude={
                  trackingItem.activeSos?.latestLocation?.longitude ||
                  trackingItem.lastKnownLocation?.longitude ||
                  73.8567
                }
                accuracy={trackingItem.activeSos?.latestLocation?.accuracy || 15}
                victimName={trackingItem.child?.fullName || 'Child'}
                history={trackingItem.activeSos?.locations || trackingItem.activeSos?.locationHistory || []}
                isEmergency={isSosChild}
                height={320}
              />

              <View style={styles.trackingModalActions}>
                <TouchableOpacity
                  style={styles.actionBtnCall}
                  onPress={() => handleCallChild(trackingItem.child?.phone)}
                >
                  <Ionicons name="call" size={16} color="#FFF" />
                  <Text style={styles.actionBtnCallText}>CALL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnWa}
                  onPress={() => handleWhatsAppChild(trackingItem.child?.phone, trackingItem.child?.fullName)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                  <Text style={styles.actionBtnWaText}>WHATSAPP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnPing}
                  onPress={() => handlePingCheckin(trackingItem.child?.id, trackingItem.child?.fullName)}
                >
                  <Ionicons name="radio" size={16} color="#FFF" />
                  <Text style={styles.actionBtnPingText}>PING</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, fontWeight: '800', color: COLORS.textMuted },

  // HEADER
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFCCE1',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headerBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  parentPill: {
    backgroundColor: '#FFE4EC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  parentPillText: { fontSize: 9, fontWeight: '900', color: '#FF2A6D' },
  liveGuardianRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveGuardianText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  headerTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textDark, marginTop: 2 },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  refreshBtnText: { fontSize: 10, fontWeight: '900', color: COLORS.primary },

  // STATS BAR
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statBox: { alignItems: 'center', flex: 1 },
  statBoxDanger: { backgroundColor: '#FFE4EC', borderRadius: 10, paddingVertical: 2 },
  statNum: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  statLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, marginTop: 2 },

  // TAB BAR
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFCCE1',
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  tabBtnActive: { backgroundColor: '#FF2A6D' },
  tabBtnText: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted },
  tabBtnTextActive: { color: '#FFF' },
  tabSosBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabSosBadgeText: { fontSize: 9, fontWeight: '900', color: '#FF2A6D' },

  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  tabContent: { gap: 14 },

  // SOS ALERT BANNER
  sosAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sosAlertTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  sosAlertSub: { fontSize: 10, fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)', marginTop: 2 },

  // EMPTY CARD
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark },
  emptySub: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  primaryActionBtn: { marginTop: 8 },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  primaryActionText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  // CHILD SAFETY CARD
  childSafetyCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  childCardSos: { borderColor: '#FF2A6D', backgroundColor: '#FFF5F7' },
  childCardTrip: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  childCardSafe: { borderColor: '#FFCCE1' },

  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardUserLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  childCardName: { fontSize: 13, fontWeight: '900', color: COLORS.textDark },
  relChip: {
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  relChipText: { fontSize: 9, fontWeight: '800', color: COLORS.primary },
  bloodChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bloodChipText: { fontSize: 9, fontWeight: '900', color: '#DC2626' },
  childCardPhone: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },

  badgeSos: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeSosText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  badgeTrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeTripText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  badgeSafe: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeSafeText: { color: '#059669', fontSize: 9, fontWeight: '900' },

  cardInfoBox: {
    backgroundColor: '#FFF9FB',
    borderRadius: 14,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  infoRowItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted },
  infoVal: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },

  cardActionsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  actionBtnPing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333EA',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnPingText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  actionBtnCall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnCallText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  actionBtnWa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnWaText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  actionBtnTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnTrackText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  actionBtnMute: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnUnmute: { backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.primary },
  actionBtnMuteText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

  // TAB 2: LINKED CHILDREN
  tabHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
  },
  tabHeaderTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark },
  tabHeaderSub: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addMemberBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  memberManageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    gap: 10,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  memberName: { fontSize: 13, fontWeight: '900', color: COLORS.textDark },
  memberSub: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  unlinkBtn: { padding: 8, backgroundColor: '#FEE2E2', borderRadius: 10 },

  // TAB 3: HISTORY
  historySection: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    gap: 10,
  },
  historyHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: '#FFCCE1', paddingBottom: 8 },
  historySectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textDark },
  emptyHistoryBox: { paddingVertical: 14, alignItems: 'center' },
  emptyHistoryText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#FFF0F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  historyItemName: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  historyItemTime: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  historyStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  histResolved: { backgroundColor: '#DCFCE7' },
  histActive: { backgroundColor: '#FEE2E2' },
  historyStatusText: { fontSize: 9, fontWeight: '900' },

  // MODAL OVERLAY
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 14,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: '#FFCCE1', paddingBottom: 10 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textDark },
  modalDesc: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  inputWrap: { gap: 4 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted },
  input: {
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FFCCE1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  relSelectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  relOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  relOptionActive: { backgroundColor: '#FF2A6D', borderColor: '#FF2A6D' },
  relOptionText: { fontSize: 10, fontWeight: '800', color: COLORS.textDark },
  relOptionTextActive: { color: '#FFF' },
  modalSubmitBtn: {
    backgroundColor: '#FF2A6D',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  trackingModalActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
});
