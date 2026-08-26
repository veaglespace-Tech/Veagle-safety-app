import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { COLORS } from '../../theme/colors';
import { organizationApi } from '../../api/organizationApi';

export default function AdminUsersScreen() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addIdentifier, setAddIdentifier] = useState('');
  const [addMemberCode, setAddMemberCode] = useState('');
  const [addDepartment, setAddDepartment] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getOverview();
      if (data && data.success) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to fetch organization overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async () => {
    if (!addIdentifier.trim()) {
      Alert.alert('Error', 'Please enter member email address or mobile number.');
      return;
    }

    try {
      setAddLoading(true);
      const res = await organizationApi.addMember({
        identifier: addIdentifier.trim(),
        memberCode: addMemberCode.trim(),
        department: addDepartment.trim(),
      });

      if (res && res.success) {
        Alert.alert('Success', res.message || 'Member added successfully!');
        setAddIdentifier('');
        setAddMemberCode('');
        setAddDepartment('');
        setShowAddModal(false);
        fetchMembers();
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to add member.';
      Alert.alert('Error', msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = (membershipId, memberName) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from your Organization?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await organizationApi.removeMember(membershipId);
              if (res && res.success) {
                fetchMembers();
              }
            } catch (err) {
              const msg = err?.response?.data?.error || err.message || 'Failed to remove member.';
              Alert.alert('Error', msg);
            }
          }
        }
      ]
    );
  };

  const filteredMembers = members.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.user.fullName?.toLowerCase().includes(term) ||
      m.user.email?.toLowerCase().includes(term) ||
      m.user.phone?.includes(term) ||
      m.memberCode?.toLowerCase().includes(term) ||
      m.department?.toLowerCase().includes(term)
    );
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Member Directory</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchMembers} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Ionicons name="refresh" size={24} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.listContainer}>
          <View style={styles.directoryActions}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members..."
                placeholderTextColor={COLORS.textMuted}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            <TouchableOpacity style={styles.enrollBtn} onPress={() => setShowAddModal(true)}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.enrollBtnText}>ENROLL</Text>
            </TouchableOpacity>
          </View>
          
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people" size={48} color={COLORS.primary} />
              <Text style={styles.emptyTitle}>No matching members found</Text>
              <Text style={styles.emptySub}>Try adjusting your search query or enroll new members.</Text>
            </View>
          ) : (
            <View style={styles.memberList}>
              {filteredMembers.map((m) => (
                <View key={m.membershipId} style={styles.memberItem}>
                  <View style={styles.memberInfo}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.avatarLetter}>{m.user.fullName?.charAt(0) || 'M'}</Text>
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.memberName}>{m.user.fullName}</Text>
                        {m.memberCode && (
                          <View style={styles.memberCodeBadge}>
                            <Text style={styles.memberCodeText}>#{m.memberCode}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.memberDetails}>{m.user.email} • {m.user.phone}</Text>
                      {m.department && <Text style={styles.memberDept}>Dept: {m.department}</Text>}
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={() => handleRemoveMember(m.membershipId, m.user.fullName)}
                  >
                    <Ionicons name="trash" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ENROLL MEMBER MODAL */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="business" size={20} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Enroll Organization Member</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Member Registered Phone or Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email or 10-digit mobile"
                  value={addIdentifier}
                  onChangeText={setAddIdentifier}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.inputGroupRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Roll / Member Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. STU-102"
                    value={addMemberCode}
                    onChangeText={setAddMemberCode}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Department / Branch</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Science"
                    value={addDepartment}
                    onChangeText={setAddDepartment}
                  />
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
                  onPress={handleAddMember}
                  disabled={addLoading}
                >
                  {addLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalSubmitText}>ENROLL MEMBER</Text>
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
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark },
  refreshBtn: { padding: 4 },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },
  listContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
  directoryActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 12, fontWeight: 'bold', color: COLORS.textDark },
  enrollBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 16, height: 44, borderRadius: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  enrollBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  emptyState: { backgroundColor: '#FFF0F3', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder, borderStyle: 'dashed', marginTop: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
  memberList: { gap: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  memberAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  avatarLetter: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  memberName: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  memberCodeBadge: { backgroundColor: '#FFF0F3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primaryBorder },
  memberCodeText: { fontSize: 10, fontWeight: '900', color: COLORS.primary },
  memberDetails: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  memberDept: { fontSize: 10, fontWeight: '800', color: COLORS.primaryLight, marginTop: 2 },
  removeBtn: { padding: 8, backgroundColor: '#FFF0F3', borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder, paddingBottom: 16, marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  modalForm: { gap: 16 },
  inputGroup: { gap: 6 },
  inputGroupRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  input: { backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: 'bold', color: COLORS.textDark },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, backgroundColor: '#FFF0F3', paddingVertical: 14, borderRadius: 100, alignItems: 'center' },
  modalCancelText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  modalSubmitBtn: { flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 100, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  modalSubmitText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
});
