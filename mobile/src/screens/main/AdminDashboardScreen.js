import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { organizationApi } from '../../api/organizationApi';

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const firstName = (user?.fullName || user?.name || 'HQ Admin');
  
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'members'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMembers: 0, activeSosCount: 0, inTripCount: 0, safeCount: 0 });
  const [members, setMembers] = useState([]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getOverview();
      if (data && data.success) {
        setStats(data.stats || { totalMembers: 0, activeSosCount: 0, inTripCount: 0, safeCount: 0 });
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch organization overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* ORGANIZATION HEADER BAR */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.hqIcon}>
              <Ionicons name="business" size={28} color="#FFF" />
            </View>
            <View>
              <View style={styles.hqTagContainer}>
                <View style={styles.hqBadge}>
                  <Text style={styles.hqBadgeText}>ORGANIZATION HQ</Text>
                </View>
                <Text style={styles.hqSubtitle}>• Safety Dispatch Portal</Text>
              </View>
              <Text style={styles.hqName}>{firstName}</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshBtn} 
            onPress={fetchOverview}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
            )}
            <Text style={styles.refreshText}>REFRESH STATUS</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* QUICK ACTIONS ROW */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.quickActionsContainer}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminCoupons')}>
            <Ionicons name="pricetag" size={20} color={COLORS.primary} />
            <Text style={styles.actionText}>Coupons</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminReferrals')}>
            <Ionicons name="git-network" size={20} color={COLORS.primary} />
            <Text style={styles.actionText}>Referrals</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminSettings')}>
            <Ionicons name="settings" size={20} color={COLORS.primary} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 2-TAB NAVIGATION BAR */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'monitor' && styles.tabBtnActive]}
            onPress={() => setActiveTab('monitor')}
          >
            <Ionicons name="pulse" size={16} color={activeTab === 'monitor' ? '#FFF' : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'monitor' && styles.tabTextActive]}>
              1. LIVE SAFETY MONITOR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'members' && styles.tabBtnActive]}
            onPress={() => setActiveTab('members')}
          >
            <Ionicons name="people" size={16} color={activeTab === 'members' ? '#FFF' : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
              2. MEMBER DIRECTORY ({stats.totalMembers})
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {activeTab === 'monitor' && (
          <View style={{ gap: 16 }}>
            {/* STATS CARDS */}
            <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.statsGrid}>
              
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>TOTAL MEMBERS</Text>
                  <Ionicons name="people" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.statValue}>{stats.totalMembers}</Text>
                <Text style={styles.statSubtitle}>Enrolled Students/Staff</Text>
              </View>

              <View style={[styles.statCard, stats.activeSosCount > 0 && styles.statCardAlert]}>
                <View style={styles.statHeader}>
                  <Text style={[styles.statTitle, { color: COLORS.primary }]}>ACTIVE SOS</Text>
                  <Ionicons name="warning" size={16} color={COLORS.primary} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.activeSosCount}</Text>
                <Text style={[styles.statSubtitle, { color: COLORS.primary }]}>Emergency Triggered</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statTitle}>ACTIVE TRIPS</Text>
                  <Ionicons name="navigate" size={16} color={COLORS.success} />
                </View>
                <Text style={styles.statValue}>{stats.inTripCount}</Text>
                <Text style={styles.statSubtitle}>Journeys In-Transit</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={[styles.statTitle, { color: COLORS.success }]}>SAFE MEMBERS</Text>
                  <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.safeCount}</Text>
                <Text style={styles.statSubtitle}>Normal Protection</Text>
              </View>

            </Animated.View>

            {/* LIVE SAFETY STATUS LIST */}
            <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.listContainer}>
              <View style={styles.listHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>Organization Member Live Dispatch Monitor</Text>
                  <Text style={styles.listSubtitle}>Updated Real-Time</Text>
                </View>
              </View>

              {members.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people" size={48} color={COLORS.primary} />
                  <Text style={styles.emptyTitle}>No Members Enrolled Yet</Text>
                  <Text style={styles.emptySub}>Switch to the Member Directory tab to view your students or employees.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('members')}>
                    <Text style={styles.emptyBtnText}>GO TO MEMBER DIRECTORY</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.memberList}>
                  {members.map((m) => (
                    <View key={m.membershipId} style={[styles.memberItem, m.activeSos && styles.memberItemAlert, m.activeJourney && styles.memberItemJourney]}>
                      <View style={styles.memberInfo}>
                        <View style={[styles.memberAvatar, m.activeSos ? { backgroundColor: COLORS.primary } : m.activeJourney ? { backgroundColor: COLORS.success } : { backgroundColor: COLORS.primary }]}>
                          <Text style={styles.avatarLetter}>{m.user.fullName?.charAt(0) || 'M'}</Text>
                        </View>
                        <View>
                          <Text style={styles.memberName}>{m.user.fullName}</Text>
                          <Text style={styles.memberDetails}>{m.user.email}</Text>
                        </View>
                      </View>
                      <View style={styles.statusBadge}>
                        {m.activeSos ? (
                          <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
                            <Ionicons name="warning" size={12} color="#FFF" style={{marginRight: 4}} />
                            <Text style={styles.badgeText}>SOS ACTIVE</Text>
                          </View>
                        ) : m.activeJourney ? (
                          <View style={[styles.badge, { backgroundColor: COLORS.success + '20' }]}>
                            <Ionicons name="navigate" size={12} color={COLORS.success} style={{marginRight: 4}} />
                            <Text style={[styles.badgeText, { color: COLORS.success }]}>IN-TRIP</Text>
                          </View>
                        ) : (
                          <View style={[styles.badge, { backgroundColor: COLORS.success + '15', borderWidth: 1, borderColor: COLORS.success + '40' }]}>
                            <Ionicons name="shield-checkmark" size={12} color={COLORS.success} style={{marginRight: 4}} />
                            <Text style={[styles.badgeText, { color: COLORS.success }]}>SAFE</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {activeTab === 'members' && (
          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.listContainer}>
             <View style={styles.listHeaderRow}>
                <Text style={styles.listTitle}>Member Directory</Text>
              </View>
              
              {members.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people" size={48} color={COLORS.primary} />
                  <Text style={styles.emptyTitle}>No Members Enrolled Yet</Text>
                  <Text style={styles.emptySub}>Please use the Web Application at this time to add new members to your organization.</Text>
                </View>
              ) : (
                <View style={styles.memberList}>
                  {members.map((m) => (
                    <View key={m.membershipId} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.avatarLetter}>{m.user.fullName?.charAt(0) || 'M'}</Text>
                        </View>
                        <View>
                          <Text style={styles.memberName}>{m.user.fullName}</Text>
                          <Text style={styles.memberDetails}>{m.user.email} • {m.user.phone}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
          </Animated.View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 16 },
  
  headerCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  hqIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  hqTagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  hqBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  hqBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  hqSubtitle: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  hqName: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  refreshText: { fontSize: 9, fontWeight: '800', color: COLORS.textDark, letterSpacing: 0.5 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  tabBtnActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },

  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700', color: COLORS.textDark },
  tabText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },
  tabTextActive: { color: '#FFF' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statCardAlert: { backgroundColor: '#FFF0F3', borderColor: COLORS.primary },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statTitle: { fontSize: 9, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 28, fontWeight: '900', color: COLORS.textDark },
  statSubtitle: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, marginTop: 4 },

  listContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  listTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark, flex: 1 },
  listSubtitle: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },

  emptyState: { backgroundColor: '#FFF0F3', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder, borderStyle: 'dashed' },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emptyBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  memberList: { gap: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  memberItemAlert: { backgroundColor: '#FFF0F3', borderColor: COLORS.primary },
  memberItemJourney: { backgroundColor: '#F0FDF4', borderColor: COLORS.success + '40' },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  memberAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  avatarLetter: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  memberName: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  memberDetails: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { alignItems: 'flex-end', shrink: 0 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
});
