import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { organizationApi } from '../../api/organizationApi';
import { COLORS } from '../../theme/colors';

export default function OrganizationDashboardScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [members, setMembers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, settingsRes] = await Promise.all([
        organizationApi.getOverview(),
        organizationApi.getSettings()
      ]);
      setMembers(overviewRes.members || []);
      setSettings(settingsRes || null);
    } catch (e) {
      console.log('Org fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!settings?.orgReferralCode) return;
    try {
      await Share.share({
        message: `Join our Organization on Sakhi Suraksha app! Use code: ${settings.orgReferralCode} during registration.`,
      });
    } catch (error) {}
  };

  const removeMember = async (userId) => {
    Alert.alert('Remove Member', 'Are you sure you want to remove this member?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await organizationApi.removeMember(userId);
          setMembers(members.filter(m => m.userId !== userId));
        } catch (e) {
          Alert.alert('Error', 'Failed to remove member');
        }
      }}
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="people-outline" size={20} color="#FF2A6D" />
          <Text style={styles.headerTitle}>ORGANIZATION PORTAL</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* CUSTOM VERTICAL TABS LIKE WEB SIDEBAR */}
        <View style={styles.sidebarStack}>
          
          <TouchableOpacity 
            style={[styles.navCard, activeTab === 'monitor' && styles.navCardActive]} 
            onPress={() => setActiveTab('monitor')}
            activeOpacity={0.8}
          >
            {activeTab === 'monitor' ? (
              <LinearGradient colors={['#FF5C8A', '#FF2A6D']} style={StyleSheet.absoluteFill} borderRadius={20} />
            ) : null}
            <View style={[styles.navIconWrap, activeTab === 'monitor' && styles.navIconWrapActive]}>
              <Ionicons name="pulse" size={18} color={activeTab === 'monitor' ? '#fff' : '#FF2A6D'} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={[styles.navTitle, activeTab === 'monitor' && styles.navTitleActive]}>Live Monitor</Text>
              <Text style={[styles.navSub, activeTab === 'monitor' && styles.navSubActive]}>Real-time safety tracking</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navCard, activeTab === 'members' && styles.navCardActive]} 
            onPress={() => setActiveTab('members')}
            activeOpacity={0.8}
          >
            {activeTab === 'members' ? (
              <LinearGradient colors={['#FF5C8A', '#FF2A6D']} style={StyleSheet.absoluteFill} borderRadius={20} />
            ) : null}
            <View style={[styles.navIconWrap, activeTab === 'members' && styles.navIconWrapActive]}>
              <Ionicons name="people" size={18} color={activeTab === 'members' ? '#fff' : '#FF2A6D'} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={[styles.navTitle, activeTab === 'members' && styles.navTitleActive]}>Member Directory</Text>
              <Text style={[styles.navSub, activeTab === 'members' && styles.navSubActive]}>Manage enrolled users</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navCard, activeTab === 'settings' && styles.navCardActive]} 
            onPress={() => setActiveTab('settings')}
            activeOpacity={0.8}
          >
            {activeTab === 'settings' ? (
              <LinearGradient colors={['#FF5C8A', '#FF2A6D']} style={StyleSheet.absoluteFill} borderRadius={20} />
            ) : null}
            <View style={[styles.navIconWrap, activeTab === 'settings' && styles.navIconWrapActive]}>
              <Ionicons name="settings" size={18} color={activeTab === 'settings' ? '#fff' : '#FF2A6D'} />
            </View>
            <View style={styles.navTextWrap}>
              <Text style={[styles.navTitle, activeTab === 'settings' && styles.navTitleActive]}>Referral & Settings</Text>
              <Text style={[styles.navSub, activeTab === 'settings' && styles.navSubActive]}>Your referral link</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* CONTENT AREA */}
        <View style={styles.contentArea}>
          {activeTab === 'monitor' && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="pulse" size={18} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Live Monitor</Text>
              </View>
              {members.filter(m => m.activeSos || m.activeJourney).length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="shield-checkmark" size={40} color={COLORS.success} />
                  <Text style={styles.emptyTitle}>All Members Safe</Text>
                  <Text style={styles.emptySub}>No active SOS or Journey at the moment.</Text>
                </View>
              ) : (
                members.filter(m => m.activeSos || m.activeJourney).map((m) => (
                  <View key={m.userId} style={styles.memberRow}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{m.user.fullName?.charAt(0) || 'M'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.user.fullName}</Text>
                      <View style={styles.statusRow}>
                        {m.activeSos ? (
                          <View style={[styles.statusBadge, { backgroundColor: '#FFF0F3', borderColor: '#FF2A6D' }]}>
                            <Ionicons name="warning" size={10} color="#FF2A6D" />
                            <Text style={[styles.statusText, { color: '#FF2A6D' }]}>EMERGENCY SOS</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5', borderColor: '#34D399' }]}>
                            <Ionicons name="navigate" size={10} color="#059669" />
                            <Text style={[styles.statusText, { color: '#059669' }]}>IN JOURNEY</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

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
                    <Text style={styles.avatarText}>{m.user.fullName?.charAt(0) || 'M'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.user.fullName}</Text>
                    <Text style={styles.memberSub}>{m.user.email} • {m.user.phone}</Text>
                    <View style={styles.statusRow}>
                       {m.activeSos ? (
                         <View style={[styles.statusBadge, { backgroundColor: '#FFF0F3', borderColor: '#FF2A6D' }]}>
                           <Ionicons name="warning" size={10} color="#FF2A6D" />
                           <Text style={[styles.statusText, { color: '#FF2A6D' }]}>EMERGENCY SOS</Text>
                         </View>
                       ) : m.activeJourney ? (
                         <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5', borderColor: '#34D399' }]}>
                           <Ionicons name="navigate" size={10} color="#059669" />
                           <Text style={[styles.statusText, { color: '#059669' }]}>IN JOURNEY</Text>
                         </View>
                       ) : (
                         <View style={[styles.statusBadge, { backgroundColor: COLORS.surface, borderColor: COLORS.primaryBorder }]}>
                           <Ionicons name="shield-checkmark" size={10} color={COLORS.success} />
                           <Text style={[styles.statusText, { color: COLORS.success }]}>SAFE</Text>
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

          {activeTab === 'settings' && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Settings & Enrollment</Text>
            </View>
            <View style={styles.settingsBlock}>
              <Text style={styles.label}>Your Organization Code</Text>
              <Text style={styles.desc}>Share this code with your members. They should enter this code during registration.</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF0F3' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, backgroundColor: '#FFF0F3' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 13, fontWeight: '900', color: '#FF2A6D', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  scroll: { padding: 20, gap: 24, paddingBottom: 40 },
  
  sidebarStack: { gap: 12 },
  navCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    borderWidth: 1.5, 
    borderColor: '#FFCCE1', 
    padding: 14, 
    gap: 14,
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden'
  },
  navCardActive: {
    borderColor: 'transparent',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  navIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  navTextWrap: { flex: 1 },
  navTitle: { fontSize: 15, fontWeight: '900', color: '#2A0826' },
  navTitleActive: { color: '#fff' },
  navSub: { fontSize: 12, fontWeight: '600', color: '#684E67', marginTop: 2 },
  navSubActive: { color: '#fff', opacity: 0.9 },

  contentArea: { flex: 1 },

  card: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1.5, borderColor: '#FFCCE1', padding: 20, shadowColor: '#FF5C8A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, borderBottomWidth: 1.5, borderBottomColor: '#FFF0F3', paddingBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: '#2A0826', textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#2A0826' },
  emptySub: { fontSize: 12, fontWeight: '600', color: '#684E67', textAlign: 'center' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#FFF0F3' },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFCCE1' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#FF2A6D' },
  memberName: { fontSize: 15, fontWeight: '900', color: '#2A0826' },
  memberSub: { fontSize: 12, fontWeight: '600', color: '#684E67', marginTop: 2 },
  statusRow: { flexDirection: 'row', marginTop: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  deleteBtn: { padding: 10, backgroundColor: '#FFF0F3', borderRadius: 12 },
  settingsBlock: { gap: 8 },
  label: { fontSize: 13, fontWeight: '900', color: '#2A0826' },
  desc: { fontSize: 12, fontWeight: '600', color: '#684E67', lineHeight: 18 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  codeText: { flex: 1, fontSize: 16, fontWeight: '900', color: '#FF2A6D', backgroundColor: '#FFF0F3', padding: 14, borderRadius: 16, textAlign: 'center', borderWidth: 1.5, borderColor: '#FFCCE1' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF2A6D', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16, shadowColor: '#FF2A6D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  shareBtnText: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 0.5 }
});
