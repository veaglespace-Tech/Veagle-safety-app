import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { parentApi } from '../../api/parentApi';

export default function ParentDashboardScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const firstName = (user?.fullName || user?.name || 'Parent');
  
  const [activeTab, setActiveTab] = useState('safety'); // 'safety' | 'children'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
  const [childrenList, setChildrenList] = useState([]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [childIdentifier, setChildIdentifier] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [addLoading, setAddLoading] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await parentApi.getOverview();
      if (data && data.success) {
        setStats(data.stats || { totalChildren: 0, activeSosCount: 0, inTripCount: 0 });
        setChildrenList(data.children || []);
      }
    } catch (err) {
      console.error('Failed to fetch parent overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleAddChild = async () => {
    if (!childIdentifier.trim()) {
      Alert.alert('Required', 'Please enter child mobile number or email address.');
      return;
    }

    try {
      setAddLoading(true);
      const res = await parentApi.linkChild({
        identifier: childIdentifier.trim(),
        relationship: relationship.trim(),
      });

      if (res && res.success) {
        Alert.alert('Success', res.message || 'Child linked successfully!');
        setChildIdentifier('');
        setShowAddModal(false);
        fetchOverview();
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to link child. Please verify mobile/email.';
      Alert.alert('Error', msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleUnlinkChild = (linkId, childName) => {
    Alert.alert(
      'Unlink Child',
      `Are you sure you want to unlink ${childName} from your Parent Portal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlink', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await parentApi.unlinkChild(linkId);
              if (res && res.success) {
                fetchOverview();
              }
            } catch (err) {
              const msg = err?.response?.data?.error || err.message || 'Failed to unlink child.';
              Alert.alert('Error', msg);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* PARENTAL HEADER BAR */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.hqIcon}>
              <Ionicons name="shield-half" size={28} color="#FFF" />
            </View>
            <View>
              <View style={styles.hqTagContainer}>
                <View style={styles.hqBadge}>
                  <Text style={styles.hqBadgeText}>PARENTAL CONTROL</Text>
                </View>
                <Text style={styles.hqSubtitle}>• Child Safety Guardian</Text>
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
            <Text style={styles.refreshText}>REFRESH GPS</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 2-TAB NAVIGATION BAR */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'safety' && styles.tabBtnActive]}
            onPress={() => setActiveTab('safety')}
          >
            <Ionicons name="pulse" size={16} color={activeTab === 'safety' ? '#FFF' : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'safety' && styles.tabTextActive]}>
              1. CHILD SAFETY COMMAND
            </Text>
            {stats.activeSosCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{stats.activeSosCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'children' && styles.tabBtnActive]}
            onPress={() => setActiveTab('children')}
          >
            <Ionicons name="people" size={16} color={activeTab === 'children' ? '#FFF' : COLORS.textMuted} />
            <Text style={[styles.tabText, activeTab === 'children' && styles.tabTextActive]}>
              2. LINKED CHILDREN ({stats.totalChildren})
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* TAB 1: CHILD SAFETY COMMAND */}
        {activeTab === 'safety' && (
          <View style={{ gap: 16 }}>
            {stats.activeSosCount > 0 && (
              <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.sosAlertBanner}>
                <Ionicons name="warning" size={32} color="#FFF" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sosAlertTitle}>EMERGENCY SOS ALERT ACTIVATED!</Text>
                  <Text style={styles.sosAlertSub}>One or more of your linked children have triggered an Emergency SOS Alert. Live GPS tracking is broadcasting now.</Text>
                </View>
              </Animated.View>
            )}

            <Animated.View entering={FadeInUp.delay(200).duration(500)}>
              {childrenList.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="heart" size={48} color={COLORS.primary} />
                  <Text style={styles.emptyTitle}>No Children Linked Yet</Text>
                  <Text style={styles.emptySub}>Link your child's account to view real-time GPS safety status and receive instant SOS alerts.</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
                    <Text style={styles.emptyBtnText}>LINK CHILD ACCOUNT NOW</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {childrenList.map((item) => {
                    const c = item.child;
                    const isSos = item.activeSos || c.safetyStatus === 'SOS_ACTIVE';
                    const isTrip = item.activeJourney || c.safetyStatus === 'JOURNEY_ACTIVE';

                    return (
                      <View key={item.linkId} style={[styles.childCard, isSos ? styles.childCardSos : isTrip ? styles.childCardTrip : null]}>
                        <View style={styles.childHeader}>
                          <View style={styles.childInfo}>
                            <View style={[styles.childAvatar, isSos ? { backgroundColor: COLORS.primary } : isTrip ? { backgroundColor: COLORS.success } : { backgroundColor: COLORS.primary }]}>
                              <Text style={styles.avatarLetter}>{c.fullName?.charAt(0) || 'C'}</Text>
                            </View>
                            <View>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.childName}>{c.fullName}</Text>
                                <View style={styles.relBadge}>
                                  <Text style={styles.relBadgeText}>{item.relationship}</Text>
                                </View>
                              </View>
                              <Text style={styles.childDetails}>{c.phone} • {c.email}</Text>
                            </View>
                          </View>
                          {/* STATUS BADGE */}
                          <View>
                            {isSos ? (
                              <View style={[styles.statusBadge, { backgroundColor: COLORS.primary }]}>
                                <Ionicons name="warning" size={12} color="#FFF" style={{marginRight: 4}} />
                                <Text style={styles.statusBadgeText}>SOS ACTIVE</Text>
                              </View>
                            ) : isTrip ? (
                              <View style={[styles.statusBadge, { backgroundColor: COLORS.success }]}>
                                <Ionicons name="navigate" size={12} color="#FFF" style={{marginRight: 4}} />
                                <Text style={styles.statusBadgeText}>IN-TRIP</Text>
                              </View>
                            ) : (
                              <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '15', borderWidth: 1, borderColor: COLORS.success + '40' }]}>
                                <Ionicons name="shield-checkmark" size={12} color={COLORS.success} style={{marginRight: 4}} />
                                <Text style={[styles.statusBadgeText, { color: COLORS.success }]}>SAFE</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.gpsGrid}>
                          <View style={styles.gpsBox}>
                            <Ionicons name="location" size={20} color={COLORS.primary} />
                            <View style={{ marginLeft: 8, flex: 1 }}>
                              <Text style={styles.gpsBoxLabel}>GPS Tracking Status</Text>
                              <Text style={styles.gpsBoxValue}>Real-Time Geo Sync Active</Text>
                            </View>
                          </View>
                          {item.activeJourney ? (
                            <View style={styles.gpsBox}>
                              <Ionicons name="navigate" size={20} color={COLORS.success} />
                              <View style={{ marginLeft: 8, flex: 1 }}>
                                <Text style={[styles.gpsBoxLabel, { color: COLORS.success }]}>Active Destination</Text>
                                <Text style={styles.gpsBoxValue} numberOfLines={1}>{item.activeJourney.destinationName}</Text>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.gpsBox}>
                              <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
                              <View style={{ marginLeft: 8, flex: 1 }}>
                                <Text style={[styles.gpsBoxLabel, { color: COLORS.textMuted }]}>Trip Monitor</Text>
                                <Text style={styles.gpsBoxValue}>No active trip in progress</Text>
                              </View>
                            </View>
                          )}
                        </View>

                        {isSos && (
                          <TouchableOpacity 
                            style={styles.liveTrackBtn}
                            onPress={() => navigation.navigate('ActiveSOS')}
                          >
                            <Text style={styles.liveTrackBtnText}>OPEN LIVE MAP & GPS STREAM</Text>
                            <Ionicons name="open-outline" size={16} color="#FFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          </View>
        )}

        {/* TAB 2: LINKED CHILDREN DIRECTORY */}
        {activeTab === 'children' && (
          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.directoryContainer}>
             <View style={styles.dirHeaderRow}>
                <View>
                  <Text style={styles.listTitle}>Linked Child Accounts</Text>
                  <Text style={styles.listSubtitle}>Manage accounts linked to your Parent Portal</Text>
                </View>
                <TouchableOpacity style={styles.enrollBtn} onPress={() => setShowAddModal(true)}>
                  <Ionicons name="add" size={16} color="#FFF" />
                  <Text style={styles.enrollBtnText}>LINK NEW</Text>
                </TouchableOpacity>
              </View>
              
              {childrenList.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="heart" size={48} color={COLORS.primary} />
                  <Text style={styles.emptyTitle}>No linked child accounts</Text>
                  <Text style={styles.emptySub}>Click the button above to link your child using their phone number or email.</Text>
                </View>
              ) : (
                <View style={styles.memberList}>
                  {childrenList.map((item) => (
                    <View key={item.linkId} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.avatarLetter}>{item.child.fullName?.charAt(0) || 'C'}</Text>
                        </View>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.memberName}>{item.child.fullName}</Text>
                            <View style={styles.relBadge}>
                              <Text style={styles.relBadgeText}>{item.relationship}</Text>
                            </View>
                          </View>
                          <Text style={styles.memberDetails}>{item.child.email} • {item.child.phone}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeBtn} 
                        onPress={() => handleUnlinkChild(item.linkId, item.child.fullName)}
                      >
                        <Ionicons name="trash" size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
          </Animated.View>
        )}

      </ScrollView>

      {/* LINK CHILD MODAL */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="heart" size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Link Child Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Child Registered Mobile Number or Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email or 10-digit mobile"
                  value={childIdentifier}
                  onChangeText={setChildIdentifier}
                  autoCapitalize="none"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Relationship</Text>
                <View style={styles.relationshipGrid}>
                  {['Parent', 'Father', 'Mother', 'Guardian'].map((rel) => (
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

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalCancelBtn} 
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.modalCancelText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalSubmitBtn} 
                  onPress={handleAddChild}
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>LINK CHILD</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 16 },
  
  headerCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  hqIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  hqTagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  hqBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  hqBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  hqSubtitle: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  hqName: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  refreshText: { fontSize: 9, fontWeight: '800', color: COLORS.textDark, letterSpacing: 0.5 },

  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 6, borderRadius: 16, borderWidth: 2, borderColor: COLORS.primaryBorder, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  tabBtnActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  tabText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },
  tabTextActive: { color: '#FFF' },
  tabBadge: { backgroundColor: '#FFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  tabBadgeText: { color: COLORS.primary, fontSize: 9, fontWeight: '900' },

  sosAlertBanner: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  sosAlertTitle: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
  sosAlertSub: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' },

  emptyState: { backgroundColor: '#FFF0F3', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 2, borderColor: COLORS.primaryBorder, borderStyle: 'dashed', marginTop: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emptyBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  listContainer: { gap: 16 },
  childCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  childCardSos: { backgroundColor: '#FFF0F3', borderColor: COLORS.primary },
  childCardTrip: { backgroundColor: '#F0FDF4', borderColor: COLORS.success + '40' },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder, paddingBottom: 16, marginBottom: 16 },
  childInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  childAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  avatarLetter: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  childName: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  relBadge: { backgroundColor: '#FFF0F3', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primaryBorder },
  relBadgeText: { fontSize: 10, fontWeight: '900', color: COLORS.primary },
  childDetails: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  statusBadgeText: { fontSize: 10, fontWeight: '900', color: '#FFF' },

  gpsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gpsBox: { width: '48%', backgroundColor: 'rgba(255,255,255,0.8)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder, flexDirection: 'row', alignItems: 'center' },
  gpsBoxLabel: { fontSize: 9, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase', marginBottom: 2 },
  gpsBoxValue: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  
  liveTrackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 16, marginTop: 16 },
  liveTrackBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  directoryContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 2, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  dirHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  listTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  listSubtitle: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  enrollBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  enrollBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
  memberList: { gap: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.primaryBorder + '50' },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  memberAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  memberName: { fontSize: 14, fontWeight: '900', color: COLORS.textDark },
  memberDetails: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  removeBtn: { padding: 8, backgroundColor: '#FFF0F3', borderRadius: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder, paddingBottom: 16, marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  modalForm: { gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  input: { backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: 'bold', color: COLORS.textDark },
  
  relationshipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  relOption: { flex: 1, minWidth: '45%', backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: COLORS.primaryBorder, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  relOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  relOptionText: { fontSize: 12, fontWeight: '800', color: COLORS.textDark },
  relOptionTextActive: { color: '#FFF' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelBtn: { flex: 1, backgroundColor: '#FFF0F3', paddingVertical: 14, borderRadius: 100, alignItems: 'center' },
  modalCancelText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  modalSubmitBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 100, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalSubmitText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
