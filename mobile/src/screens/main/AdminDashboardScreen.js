import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
import Animated, { FadeInUp } from 'react-native-reanimated';
import { io } from 'socket.io-client';
import { adminApi } from '../../api/adminApi';
import { sosApi } from '../../api/sosApi';
import { API_URL } from '../../utils/constants';
import { COLORS } from '../../theme/colors';
import { playEmergencySiren, stopEmergencySiren } from '../../utils/soundPlayer';
import { toggleSosMute } from '../../redux/slices/sosSlice';
import LiveSosMap from '../../components/Admin/LiveSosMap';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const mutedSosIds = useSelector((state) => state?.sos?.mutedSosIds || []);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [selectedSosId, setSelectedSosId] = useState(null);
  const [trackingSos, setTrackingSos] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  const socketRef = useRef(null);

  // Fetch Super Admin Overview from /admin/overview
  const fetchOverviewData = useCallback(async (showIndicator = true) => {
    try {
      if (showIndicator) setIsLoading(true);
      const data = await adminApi.fetchOverview();
      setOverview(data || null);

      // Auto-select first active SOS if none selected or previous one ended
      if (data?.activeSos && data.activeSos.length > 0) {
        setSelectedSosId((prev) => {
          const stillExists = data.activeSos.some((s) => s.id === prev);
          return stillExists ? prev : data.activeSos[0].id;
        });
      } else {
        setSelectedSosId(null);
      }
    } catch (err) {
      console.log('[AdminDashboard] Fetch error:', err?.message);
    } finally {
      if (showIndicator) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Siren synchronization
  useEffect(() => {
    const activeSosList = overview?.activeSos || [];
    const hasUnmutedSos = activeSosList.some(
      (sos) => !mutedSosIds.includes(String(sos.id))
    );

    if (hasUnmutedSos && activeSosList.length > 0) {
      playEmergencySiren().catch(() => {});
    } else {
      stopEmergencySiren().catch(() => {});
    }
  }, [overview?.activeSos, mutedSosIds]);

  // Reliable Polling Fallback & History Trail Fetcher for Modal / Active Tracking
  useEffect(() => {
    if (!trackingSos?.id) return;

    const fetchLocationData = async () => {
      try {
        const data = await sosApi.getSosLocation(trackingSos.id);
        if (data && data.location) {
          const lat = parseFloat(data.location.latitude);
          const lng = parseFloat(data.location.longitude);

          if (!isNaN(lat) && !isNaN(lng)) {
            setTrackingSos((prev) => {
              if (prev && prev.id === trackingSos.id) {
                return {
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  locations: [{ latitude: lat, longitude: lng }],
                  locationHistory: data.history || [],
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.log('[Admin Location Polling] Error:', e?.message);
      }
    };

    fetchLocationData();
    const interval = setInterval(fetchLocationData, 3000);
    return () => clearInterval(interval);
  }, [trackingSos?.id]);

  // Initial load and Socket.IO connection
  useEffect(() => {
    fetchOverviewData(true);

    // Auto-refresh background poll every 8 seconds (fallback)
    const pollInterval = setInterval(() => {
      fetchOverviewData(false);
    }, 8000);

    const serverUrl = API_URL.replace(/\/api\/?$/, '');
    const socket = io(serverUrl, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[AdminDashboard] Socket connected:', socket.id);
      // Register as Super Admin — joins the admin-ops broadcast room on the server
      socket.emit('register-user', { role: 'SUPER_ADMIN' });
      // Explicitly join admin rooms so server-side room-targeted events reach us
      socket.emit('join-room', 'admin-ops');
      socket.emit('join-room', 'super-admin');
    });

    socket.on('connect_error', (err) => {
      console.log('[AdminDashboard] Socket error:', err?.message);
    });

    socket.on('SOS_ALARM_BROADCAST', (data) => {
      Alert.alert(
        '🚨 CRITICAL SOS ALERT',
        `${data?.victimName || 'Sakhi Member'} has triggered an emergency SOS broadcast!`,
        [{ text: 'OPEN DISPATCH', style: 'default' }]
      );
      fetchOverviewData(false);
    });

    socket.on('SOS_ALARM_STOP', () => {
      fetchOverviewData(false);
      setTrackingSos(null);
    });

    socket.on('SOS_PERIODIC_5MIN_UPDATE', () => fetchOverviewData(false));
    socket.on('JOURNEY_STATUS_UPDATE',     () => fetchOverviewData(false));

    socket.on('SOS_LOCATION_UPDATE', (data) => {
      if (!data?.sosSessionId || !data?.latitude || !data?.longitude) return;
      const incomingId = parseInt(data.sosSessionId, 10);

      // Update in tracking modal
      setTrackingSos((prev) => {
        if (prev && parseInt(prev.id, 10) === incomingId) {
          const hist = prev.locationHistory ? [...prev.locationHistory] : [];
          hist.push({
            latitude:   data.latitude,
            longitude:  data.longitude,
            accuracy:   data.accuracy,
            recordedAt: data.recordedAt,
          });
          return {
            ...prev,
            latitude:  data.latitude,
            longitude: data.longitude,
            locations: [{ latitude: data.latitude, longitude: data.longitude, accuracy: data.accuracy || 15 }],
            locationHistory: hist,
          };
        }
        return prev;
      });

      // Update in active list
      setOverview((prev) => {
        if (!prev || !prev.activeSos) return prev;
        return {
          ...prev,
          activeSos: prev.activeSos.map((sos) => {
            if (parseInt(sos.id, 10) === incomingId) {
              const hist = sos.locations ? [...sos.locations] : [];
              hist.unshift({
                latitude:   data.latitude,
                longitude:  data.longitude,
                accuracy:   data.accuracy,
                recordedAt: data.recordedAt,
              });
              return {
                ...sos,
                latitude:  data.latitude,
                longitude: data.longitude,
                locations: hist,
              };
            }
            return sos;
          }),
        };
      });
    });

    return () => {
      clearInterval(pollInterval);
      stopEmergencySiren().catch(() => {});
      socket.disconnect();
    };
  }, [fetchOverviewData]);

  // Resolve SOS Action (matching POST /admin/sos/resolve)
  const handleResolveSos = (sosId) => {
    Alert.alert(
      'Resolve Emergency SOS',
      'Confirm resolving this emergency SOS incident on behalf of dispatch center?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'RESOLVE INCIDENT',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsResolving(true);
              const res = await adminApi.adminResolveSos({
                sosSessionId: sosId,
                note: 'Resolved by Super Admin mobile dispatch',
              });
              Alert.alert('Resolved', res.message || 'Incident marked as SAFE and resolved.');
              setTrackingSos(null);
              fetchOverviewData(false);
            } catch (err) {
              const msg =
                err?.response?.data?.error || err.message || 'Failed to resolve emergency SOS';
              Alert.alert('Error', msg);
            } finally {
              setIsResolving(false);
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('Unavailable', 'No phone number registered for this victim.');
      return;
    }
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {});
  };

  const handleWhatsApp = (phone) => {
    if (!phone) {
      Alert.alert('Unavailable', 'No phone number registered for this victim.');
      return;
    }
    const clean = phone.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${clean}`).catch(() => {});
  };

  const activeSosList = overview?.activeSos || [];
  const recentSosList = overview?.recentSos || [];

  const metrics = {
    activeSosCount: overview?.metrics?.activeSosCount || 0,
    totalUsers: overview?.metrics?.totalUsers || 0,
    activePlansCount: overview?.metrics?.activeSubscriptions || 0,
    totalRevenue: overview?.metrics?.totalRevenue || 0,
    currentGstPercentage: overview?.metrics?.currentGstPercentage ?? 18,
  };

  const selectedSos =
    activeSosList.find((s) => s.id === selectedSosId) || activeSosList[0] || null;

  const hasAnyUnmuted = activeSosList.some(
    (s) => !mutedSosIds.includes(String(s.id))
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER BAR */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.shieldIconWrap}>
            <Ionicons name="shield-checkmark" size={22} color="#FFF" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.headerTitle}>SUPER ADMIN DISPATCH</Text>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>LIVE</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Sakhi Emergency Command Center</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => fetchOverviewData(true)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="refresh" size={22} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchOverviewData(false);
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* GLOBAL SIREN BANNER IF ACTIVE */}
        {activeSosList.length > 0 && (
          <LinearGradient
            colors={['#FF2A6D', '#FF5C8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sirenAlertBanner}
          >
            <View style={styles.sirenBannerLeft}>
              <View style={styles.sirenPulseIcon}>
                <Ionicons name="warning" size={22} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sirenBannerTitle}>
                  🚨 {activeSosList.length} ACTIVE EMERGENCY {activeSosList.length === 1 ? 'INCIDENT' : 'INCIDENTS'}
                </Text>
                <Text style={styles.sirenBannerSub}>
                  Live GPS broadcasts actively transmitting to dispatch.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.globalMuteBtn}
              onPress={() => {
                activeSosList.forEach((s) => {
                  if (hasAnyUnmuted) {
                    if (!mutedSosIds.includes(String(s.id))) {
                      dispatch(toggleSosMute(s.id));
                    }
                  } else {
                    if (mutedSosIds.includes(String(s.id))) {
                      dispatch(toggleSosMute(s.id));
                    }
                  }
                });
              }}
            >
              <Ionicons
                name={hasAnyUnmuted ? 'volume-mute' : 'volume-high'}
                size={16}
                color="#FF2A6D"
              />
              <Text style={styles.globalMuteText}>
                {hasAnyUnmuted ? 'MUTE SIREN' : 'PLAY SIREN'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        )}

        {/* TOP KPI CARDS */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.kpiGrid}>
          {/* Card 1: Active SOS */}
          <View style={[styles.kpiCard, styles.kpiCardSos]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>ACTIVE SOS ALERTS</Text>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#FFE4EC' }]}>
                <Ionicons name="alert-circle" size={18} color="#FF2A6D" />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: '#FF2A6D' }]}>
              {metrics.activeSosCount}
            </Text>
            <Text style={styles.kpiSub}>Emergency broadcasts live</Text>
          </View>

          {/* Card 2: Total Members */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>TOTAL MEMBERS</Text>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="people" size={18} color="#9333EA" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{metrics.totalUsers}</Text>
            <Text style={styles.kpiSub}>Registered Sakhi accounts</Text>
          </View>

          {/* Card 3: Active Paid Plans */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>ACTIVE PAID PLANS</Text>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#16A34A" />
              </View>
            </View>
            <Text style={styles.kpiValue}>{metrics.activePlansCount}</Text>
            <Text style={styles.kpiSub}>Active paid protection</Text>
          </View>

          {/* Card 4: Total Revenue */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>TOTAL REVENUE</Text>
              <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="trending-up" size={18} color="#D97706" />
              </View>
            </View>
            <Text style={styles.kpiValue}>₹{Number(metrics.totalRevenue).toFixed(2)}</Text>
            <Text style={styles.kpiSub}>Incl. {metrics.currentGstPercentage}% GST</Text>
          </View>
        </Animated.View>

        {/* SECTION: LIVE ACTIVE EMERGENCY SOS BROADCASTS */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.livePulseDot} />
              <Text style={styles.sectionTitle}>Live Active SOS Emergency Broadcasts</Text>
            </View>
            <View style={styles.incidentBadge}>
              <Text style={styles.incidentBadgeText}>
                {activeSosList.length} LIVE {activeSosList.length === 1 ? 'INCIDENT' : 'INCIDENTS'}
              </Text>
            </View>
          </View>

          {activeSosList.length === 0 ? (
            /* ALL CLEAR STATE */
            <View style={styles.allClearCard}>
              <View style={styles.allClearIconCircle}>
                <Ionicons name="checkmark-circle" size={44} color="#10B981" />
              </View>
              <Text style={styles.allClearTitle}>
                All Clear — No Active Emergency SOS Incidents
              </Text>
              <Text style={styles.allClearSub}>
                All Sakhi members are safe and monitored 24/7 by command dispatch.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {/* INTERACTIVE LIVE MAP FOR SELECTED VICTIM */}
              {selectedSos && (
                <View style={styles.mapCard}>
                  <View style={styles.mapHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Ionicons name="navigate-circle" size={20} color="#FF2A6D" />
                      <Text style={styles.mapVictimTitle} numberOfLines={1}>
                        Tracking: {selectedSos.user?.fullName || 'Victim Member'} (SOS #{selectedSos.id})
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.mapExpandBtn}
                      onPress={() => setTrackingSos(selectedSos)}
                    >
                      <Ionicons name="expand" size={14} color="#FF2A6D" />
                      <Text style={styles.mapExpandText}>FULLSCREEN</Text>
                    </TouchableOpacity>
                  </View>

                  {/* MAP COMPONENT */}
                  <LiveSosMap
                    latitude={selectedSos.locations?.[0]?.latitude || selectedSos.latitude}
                    longitude={selectedSos.locations?.[0]?.longitude || selectedSos.longitude}
                    accuracy={selectedSos.locations?.[0]?.accuracy || 15}
                    victimName={selectedSos.user?.fullName || 'Victim Member'}
                    history={selectedSos.locations || []}
                    isEmergency={true}
                    height={280}
                    onFullscreen={() => setTrackingSos(selectedSos)}
                  />

                  {/* MULTI-INCIDENT SELECTOR TABS (If > 1 active SOS) */}
                  {activeSosList.length > 1 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.sosSelectorScroll}
                    >
                      {activeSosList.map((sos) => {
                        const isSelected = sos.id === selectedSosId;
                        return (
                          <TouchableOpacity
                            key={sos.id}
                            style={[
                              styles.sosSelectorTab,
                              isSelected && styles.sosSelectorTabActive,
                            ]}
                            onPress={() => setSelectedSosId(sos.id)}
                          >
                            <Ionicons
                              name="warning"
                              size={12}
                              color={isSelected ? '#FFF' : '#FF2A6D'}
                            />
                            <Text
                              style={[
                                styles.sosSelectorText,
                                isSelected && styles.sosSelectorTextActive,
                              ]}
                            >
                              SOS #{sos.id} • {sos.user?.fullName?.split(' ')[0] || 'Member'}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* LIST OF ALL ACTIVE SOS INCIDENTS */}
              <View style={{ gap: 12 }}>
                {activeSosList.map((sos) => {
                  const latestLoc = sos.locations?.[0];
                  const lat = latestLoc?.latitude || sos.latitude;
                  const lng = latestLoc?.longitude || sos.longitude;
                  const isMuted = mutedSosIds.includes(String(sos.id));
                  const isCurrentlyTracked = sos.id === selectedSosId;

                  return (
                    <View
                      key={sos.id}
                      style={[
                        styles.activeSosCard,
                        isCurrentlyTracked && styles.activeSosCardHighlight,
                      ]}
                    >
                      {/* Top Info Row */}
                      <View style={styles.sosTopRow}>
                        <View style={styles.sosUserLeft}>
                          <View style={styles.sosAvatarCircle}>
                            <Text style={styles.sosAvatarLetter}>
                              {sos.user?.fullName ? sos.user.fullName.charAt(0).toUpperCase() : 'S'}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={styles.sosBadgeId}>
                                <Text style={styles.sosBadgeIdText}>SOS #{sos.id}</Text>
                              </View>
                              <Text style={styles.sosUserName} numberOfLines={1}>
                                {sos.user?.fullName || 'Anonymous Sakhi'}
                              </Text>
                            </View>
                            <Text style={styles.sosContactDetails} numberOfLines={1}>
                              📞 {sos.user?.phone || 'N/A'} • ✉️ {sos.user?.email || 'N/A'}
                            </Text>
                          </View>
                        </View>

                        {/* Triggered Time */}
                        <Text style={styles.sosTimeText}>
                          {sos.startedAt
                            ? new Date(sos.startedAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Live'}
                        </Text>
                      </View>

                      {/* GPS Coordinates readout */}
                      <View style={styles.sosGpsRow}>
                        <Ionicons name="location" size={14} color="#FF2A6D" />
                        <Text style={styles.sosGpsText}>
                          GPS Coordinates: {lat ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : 'Awaiting GPS stream...'}
                        </Text>
                      </View>

                      {/* Actions Buttons Row */}
                      <View style={styles.sosActionsRow}>
                        {/* MUTE / PLAY SIREN */}
                        <TouchableOpacity
                          style={[
                            styles.sosActionBtn,
                            isMuted ? styles.sosActionBtnMuted : styles.sosActionBtnUnmuted,
                          ]}
                          onPress={() => dispatch(toggleSosMute(sos.id))}
                        >
                          <Ionicons
                            name={isMuted ? 'volume-high' : 'volume-mute'}
                            size={14}
                            color={isMuted ? '#FF2A6D' : '#FFF'}
                          />
                          <Text
                            style={[
                              styles.sosActionText,
                              isMuted ? { color: '#FF2A6D' } : { color: '#FFF' },
                            ]}
                          >
                            {isMuted ? 'PLAY SIREN' : 'MUTE SIREN'}
                          </Text>
                        </TouchableOpacity>

                        {/* TRACK LIVE */}
                        <TouchableOpacity
                          style={[styles.sosActionBtn, styles.sosActionBtnTrack]}
                          onPress={() => {
                            setSelectedSosId(sos.id);
                            setTrackingSos(sos);
                          }}
                        >
                          <Ionicons name="eye" size={14} color="#FFF" />
                          <Text style={[styles.sosActionText, { color: '#FFF' }]}>TRACK LIVE</Text>
                        </TouchableOpacity>

                        {/* CALL */}
                        {sos.user?.phone && (
                          <TouchableOpacity
                            style={[styles.sosActionBtn, styles.sosActionBtnCall]}
                            onPress={() => handleCall(sos.user.phone)}
                          >
                            <Ionicons name="call" size={14} color="#16A34A" />
                          </TouchableOpacity>
                        )}

                        {/* WHATSAPP */}
                        {sos.user?.phone && (
                          <TouchableOpacity
                            style={[styles.sosActionBtn, styles.sosActionBtnWa]}
                            onPress={() => handleWhatsApp(sos.user.phone)}
                          >
                            <Ionicons name="logo-whatsapp" size={14} color="#16A34A" />
                          </TouchableOpacity>
                        )}

                        {/* RESOLVE SOS */}
                        <TouchableOpacity
                          style={[styles.sosActionBtn, styles.sosActionBtnResolve]}
                          onPress={() => handleResolveSos(sos.id)}
                          disabled={isResolving}
                        >
                          <Ionicons name="checkmark-circle" size={14} color="#FFF" />
                          <Text style={[styles.sosActionText, { color: '#FFF' }]}>RESOLVE</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* SECTION: RECENT ACTIVITY & DISPATCH LOGS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Activity & Dispatch Logs</Text>

          {recentSosList.length === 0 ? (
            <View style={styles.emptyRecentCard}>
              <Text style={styles.emptyRecentText}>No recent dispatch logs found.</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {recentSosList.map((sos) => {
                const isResolved = sos.status === 'RESOLVED';
                return (
                  <View key={sos.id} style={styles.recentItemCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentItemTitle}>
                        Emergency SOS #{sos.id} • {sos.user?.fullName || 'Sakhi Member'}
                      </Text>
                      <Text style={styles.recentItemTime}>
                        Triggered on {new Date(sos.startedAt).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.recentStatusBadge,
                        isResolved ? styles.badgeResolved : styles.badgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.recentStatusText,
                          isResolved ? styles.textResolved : styles.textActive,
                        ]}
                      >
                        {sos.status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FULLSCREEN / DETAILED LIVE TRACKING MODAL */}
      <Modal visible={!!trackingSos} transparent animationType="slide">
        {trackingSos && (
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* MODAL HEADER */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={styles.modalAlertIconWrap}>
                    <Ionicons name="warning" size={20} color="#FF2A6D" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalHeaderTitle} numberOfLines={1}>
                      🚨 Live Emergency GPS Stream
                    </Text>
                    <Text style={styles.modalHeaderSub}>
                      Incident #{trackingSos.id} • Real-time movement & trajectory
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setTrackingSos(null)}
                >
                  <Ionicons name="close" size={24} color={COLORS.textDark} />
                </TouchableOpacity>
              </View>

              {/* VICTIM DETAILS CARD */}
              <View style={styles.modalVictimCard}>
                <View style={styles.modalVictimCol}>
                  <Text style={styles.modalVictimLabel}>VICTIM MEMBER</Text>
                  <Text style={styles.modalVictimName}>
                    {trackingSos.user?.fullName || 'Anonymous Sakhi'}
                  </Text>
                </View>

                <View style={styles.modalVictimCol}>
                  <Text style={styles.modalVictimLabel}>CONTACT PHONE</Text>
                  <TouchableOpacity
                    onPress={() => handleCall(trackingSos.user?.phone)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalVictimPhone}>
                      {trackingSos.user?.phone || 'N/A'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalVictimCol}>
                  <Text style={styles.modalVictimLabel}>EMAIL ADDRESS</Text>
                  <Text style={styles.modalVictimEmail} numberOfLines={1}>
                    {trackingSos.user?.email || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* HIGH-PRECISION MAP CONTAINER */}
              <View style={styles.modalMapContainer}>
                <LiveSosMap
                  latitude={trackingSos.locations?.[0]?.latitude || trackingSos.latitude}
                  longitude={trackingSos.locations?.[0]?.longitude || trackingSos.longitude}
                  accuracy={trackingSos.locations?.[0]?.accuracy || 15}
                  victimName={trackingSos.user?.fullName || 'Victim Member'}
                  history={trackingSos.locationHistory || trackingSos.locations || []}
                  isEmergency={true}
                  height={320}
                />
              </View>

              {/* MODAL ACTIONS ROW */}
              <View style={styles.modalFooterActions}>
                {trackingSos.user?.phone && (
                  <TouchableOpacity
                    style={styles.modalCallBtn}
                    onPress={() => handleCall(trackingSos.user.phone)}
                  >
                    <Ionicons name="call" size={16} color="#FFF" />
                    <Text style={styles.modalActionText}>CALL</Text>
                  </TouchableOpacity>
                )}

                {trackingSos.user?.phone && (
                  <TouchableOpacity
                    style={styles.modalWaBtn}
                    onPress={() => handleWhatsApp(trackingSos.user.phone)}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                    <Text style={styles.modalActionText}>WHATSAPP</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalResolveBtn}
                  onPress={() => handleResolveSos(trackingSos.id)}
                  disabled={isResolving}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  <Text style={styles.modalActionText}>RESOLVE INCIDENT NOW</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
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
  shieldIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FF2A6D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textDark, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  statusText: { fontSize: 9, fontWeight: '900', color: '#16A34A' },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 16 },

  // SIREN ALERT BANNER
  sirenAlertBanner: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sirenBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sirenPulseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sirenBannerTitle: { fontSize: 12, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
  sirenBannerSub: { fontSize: 10, fontWeight: '700', color: 'rgba(255, 255, 255, 0.9)' },
  globalMuteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  globalMuteText: { fontSize: 10, fontWeight: '900', color: '#FF2A6D', letterSpacing: 0.5 },

  // KPI GRID
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: (width - 32 - 10) / 2,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiCardSos: {
    borderColor: '#FF2A6D',
    backgroundColor: '#FFF',
  },
  kpiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kpiLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.3 },
  kpiIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 22, fontWeight: '900', color: COLORS.textDark },
  kpiSub: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted },

  // SECTION CONTAINER
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCCE1',
    paddingBottom: 10,
  },
  livePulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF2A6D' },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark, letterSpacing: 0.3 },
  incidentBadge: {
    backgroundColor: '#FFE4EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  incidentBadgeText: { fontSize: 9, fontWeight: '900', color: '#FF2A6D' },

  // ALL CLEAR CARD
  allClearCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
    gap: 6,
  },
  allClearIconCircle: { marginBottom: 4 },
  allClearTitle: { fontSize: 13, fontWeight: '900', color: '#15803D', textAlign: 'center' },
  allClearSub: { fontSize: 11, fontWeight: '600', color: '#166534', textAlign: 'center' },

  // MAP CARD INSIDE OVERVIEW
  mapCard: {
    borderRadius: 20,
    backgroundColor: '#FFF0F3',
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    padding: 10,
    gap: 10,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  mapVictimTitle: { fontSize: 12, fontWeight: '900', color: COLORS.textDark },
  mapExpandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFCCE1',
    gap: 4,
  },
  mapExpandText: { fontSize: 9, fontWeight: '900', color: '#FF2A6D' },
  sosSelectorScroll: { gap: 8, paddingVertical: 4 },
  sosSelectorTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFCCE1',
    gap: 6,
  },
  sosSelectorTabActive: {
    backgroundColor: '#FF2A6D',
    borderColor: '#FF2A6D',
  },
  sosSelectorText: { fontSize: 10, fontWeight: '800', color: COLORS.textDark },
  sosSelectorTextActive: { color: '#FFF' },

  // ACTIVE SOS CARD
  activeSosCard: {
    backgroundColor: '#FFF0F3',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FFCCD8',
    gap: 10,
  },
  activeSosCardHighlight: {
    borderColor: '#FF2A6D',
    backgroundColor: '#FFF5F7',
  },
  sosTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sosUserLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sosAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FF2A6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosAvatarLetter: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  sosBadgeId: {
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF2A6D',
  },
  sosBadgeIdText: { fontSize: 9, fontWeight: '900', color: '#FF2A6D' },
  sosUserName: { fontSize: 13, fontWeight: '900', color: COLORS.textDark, flex: 1 },
  sosContactDetails: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  sosTimeText: { fontSize: 10, fontWeight: '800', color: '#FF2A6D' },
  sosGpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFCCE1',
    gap: 4,
  },
  sosGpsText: { fontSize: 10, fontWeight: '800', color: COLORS.textDark },

  // ACTIONS ROW
  sosActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
  },
  sosActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  sosActionBtnMuted: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF2A6D',
  },
  sosActionBtnUnmuted: {
    backgroundColor: '#10B981',
  },
  sosActionBtnTrack: {
    backgroundColor: '#FF2A6D',
  },
  sosActionBtnCall: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
  },
  sosActionBtnWa: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
  },
  sosActionBtnResolve: {
    backgroundColor: '#059669',
  },
  sosActionText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.3 },

  // RECENT LOGS
  emptyRecentCard: { paddingVertical: 16, alignItems: 'center' },
  emptyRecentText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  recentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  recentItemTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  recentItemTime: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  recentStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeResolved: { backgroundColor: '#DCFCE7' },
  badgeActive: { backgroundColor: '#FFE4EC' },
  recentStatusText: { fontSize: 9, fontWeight: '900' },
  textResolved: { color: '#15803D' },
  textActive: { color: '#FF2A6D' },

  // MODAL OVERLAY
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    gap: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFCCE1',
    paddingBottom: 12,
  },
  modalAlertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFE4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textDark },
  modalHeaderSub: { fontSize: 10, fontWeight: '700', color: '#FF2A6D' },
  modalCloseBtn: { padding: 4 },

  modalVictimCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F3',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFCCE1',
    gap: 8,
  },
  modalVictimCol: { flex: 1 },
  modalVictimLabel: { fontSize: 9, fontWeight: '900', color: COLORS.textMuted },
  modalVictimName: { fontSize: 12, fontWeight: '900', color: COLORS.textDark, marginTop: 2 },
  modalVictimPhone: { fontSize: 12, fontWeight: '900', color: '#FF2A6D', marginTop: 2 },
  modalVictimEmail: { fontSize: 11, fontWeight: '700', color: COLORS.textDark, marginTop: 2 },

  modalMapContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },

  modalFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  modalCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  modalWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  modalResolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
