import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { apiClient } from '../../api/apiClient';

export default function OrganizationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    totalMembers: 0,
    activeSosCount: 0,
    inTripCount: 0,
    safeCount: 0,
  });

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/organization/overview');
      if (res.data?.success) {
        setStatsData(res.data.stats || statsData);
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to fetch organization stats");
    } finally {
      setLoading(false);
    }
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [addIdentifier, setAddIdentifier] = useState('');
  const [addMemberCode, setAddMemberCode] = useState('');
  const [addDepartment, setAddDepartment] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const handleAddMember = async () => {
    if (!addIdentifier.trim()) {
      Alert.alert("Required", "Please enter member email or phone.");
      return;
    }
    setAddLoading(true);
    try {
      const res = await apiClient.post('/organization/members', {
        identifier: addIdentifier.trim(),
        memberCode: addMemberCode.trim(),
        department: addDepartment.trim(),
      });
      if (res.data?.success) {
        Alert.alert("Success", res.data.message || "Member added successfully!");
        setShowAddModal(false);
        setAddIdentifier('');
        setAddMemberCode('');
        setAddDepartment('');
        fetchOverview();
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to add member.");
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const stats = [
    { label: 'Active Users', value: statsData.totalMembers, icon: 'people' },
    { label: 'Safe Members', value: statsData.safeCount, icon: 'shield-checkmark' },
    { label: 'Active Alerts', value: statsData.activeSosCount, icon: 'alert-circle', color: COLORS.success },
    { label: 'Journeys', value: statsData.inTripCount, icon: 'navigate' }
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Organization</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <View style={styles.orgAvatar}>
            <Text style={styles.orgAvatarText}>VG</Text>
          </View>
          <Text style={styles.orgName}>Veagle Global Inc.</Text>
          <Text style={styles.orgRole}>Admin Dashboard</Text>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <View key={idx} style={styles.statBox}>
              <Ionicons name={stat.icon} size={24} color={stat.color || COLORS.primary} style={styles.statIcon} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="person-add" size={20} color="#FFF" />
          <Text style={styles.actionBtnText}>Enroll New Member</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enroll Member</Text>
            
            <Text style={styles.inputLabel}>Phone or Email *</Text>
            <TextInput style={styles.input} placeholder="jane@example.com" value={addIdentifier} onChangeText={setAddIdentifier} autoCapitalize="none" />
            
            <Text style={styles.inputLabel}>Member Code (Optional)</Text>
            <TextInput style={styles.input} placeholder="EMP-001" value={addMemberCode} onChangeText={setAddMemberCode} autoCapitalize="characters" />
            
            <Text style={styles.inputLabel}>Department (Optional)</Text>
            <TextInput style={styles.input} placeholder="Engineering" value={addDepartment} onChangeText={setAddDepartment} />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddMember} disabled={addLoading}>
                {addLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Enroll</Text>}
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
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  scroll: { padding: 16 },

  headerCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder, marginBottom: 24 },
  orgAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  orgAvatarText: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  orgName: { fontSize: 22, fontWeight: '900', color: COLORS.textDark, marginBottom: 4 },
  orgRole: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },

  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statBox: { width: '48%', backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  statIcon: { marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, marginTop: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark, marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: COLORS.primaryBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.primaryBorder },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, backgroundColor: COLORS.primaryBg, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder },
  cancelBtnText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '700' },
  submitBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', shadowColor: COLORS.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});
