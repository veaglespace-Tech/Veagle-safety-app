import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { adminApi } from '../../api/adminApi';

const { width } = Dimensions.get('window');

const ROLE_FILTERS = ['ALL', 'USER', 'ORGANIZATION', 'PARENT', 'SUPER_ADMIN'];

export default function AdminUsersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modal: Create User
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [newCity, setNewCity] = useState('Pune');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  const [grantFreePlan, setGrantFreePlan] = useState(true);

  // Modal: Role Update
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);

  const fetchUsers = useCallback(async (showIndicator = true) => {
    try {
      if (showIndicator) setLoading(true);
      const res = await adminApi.fetchUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.log('[AdminUsers] Fetch error:', err?.message);
    } finally {
      if (showIndicator) setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(true);
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!newFullName.trim() || !newEmail.trim() || !newPassword.trim()) {
      Alert.alert('Required Fields', 'Full Name, Email, and Password are required.');
      return;
    }

    try {
      setCreateLoading(true);
      const res = await adminApi.createUser({
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.replace(/\D/g, ''),
        password: newPassword,
        role: newRole,
        city: newCity,
        emergencyContactName: newEmergencyName.trim(),
        emergencyContactPhone: newEmergencyPhone.replace(/\D/g, ''),
        grantFreePlan,
        planDurationDays: 365,
      });

      Alert.alert('Success', res.message || 'Account created successfully!');
      setShowCreateModal(false);
      // Reset form
      setNewFullName('');
      setNewEmail('');
      setNewPhone('');
      setNewPassword('');
      setNewRole('USER');
      setNewEmergencyName('');
      setNewEmergencyPhone('');
      fetchUsers(false);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to create user account';
      Alert.alert('Error', msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleGrantFreePlan = (user) => {
    Alert.alert(
      'Grant 1-Year Protection',
      `Grant 365 Days of Free Active Protection to ${user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'GRANT ACCESS',
          onPress: async () => {
            try {
              const res = await adminApi.grantSubscription(user.id, { planDurationDays: 365 });
              Alert.alert('Success', res.message || '1-Year protection granted!');
              fetchUsers(false);
            } catch (err) {
              const msg = err?.response?.data?.error || err.message || 'Failed to grant subscription';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const handleToggleBlock = (user) => {
    const isBlocked = user.isBlocked;
    Alert.alert(
      isBlocked ? 'Unblock User' : 'Block User',
      `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} ${user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'UNBLOCK' : 'BLOCK',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await adminApi.toggleUserBlock(user.id);
              Alert.alert('Status Updated', res.message || 'User account status updated.');
              fetchUsers(false);
            } catch (err) {
              const msg = err?.response?.data?.error || err.message || 'Failed to update user status';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const handleUpdateRole = async (targetRole) => {
    if (!selectedUserForRole) return;
    try {
      const res = await adminApi.updateUserRole({
        userId: selectedUserForRole.id,
        role: targetRole,
      });
      Alert.alert('Role Updated', res.message || `Role updated to ${targetRole}`);
      setSelectedUserForRole(null);
      fetchUsers(false);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to update role';
      Alert.alert('Error', msg);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      (u.fullName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.phone || '').includes(term);

    const matchesRole =
      selectedRole === 'ALL' || (u.role || '').toUpperCase() === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeStyle = (role) => {
    switch (role?.toUpperCase()) {
      case 'SUPER_ADMIN':
        return { bg: '#FFE4EC', text: '#FF2A6D', label: 'SUPER ADMIN' };
      case 'ORGANIZATION':
        return { bg: '#F3E8FF', text: '#9333EA', label: 'ORGANIZATION' };
      case 'PARENT':
        return { bg: '#FCE7F3', text: '#DB2777', label: 'PARENT' };
      default:
        return { bg: '#DCFCE7', text: '#16A34A', label: 'USER' };
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>USER DIRECTORY</Text>
          <Text style={styles.headerSubtitle}>
            {users.length} Total Accounts • Role Management & Subscriptions
          </Text>
        </View>

        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add" size={14} color="#FFF" />
          <Text style={styles.createBtnText}>NEW USER</Text>
        </TouchableOpacity>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or mobile..."
            placeholderTextColor={COLORS.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ROLE FILTER CHIPS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {ROLE_FILTERS.map((rf) => {
          const isSelected = selectedRole === rf;
          return (
            <TouchableOpacity
              key={rf}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setSelectedRole(rf)}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {rf}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* USER LIST */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchUsers(false);
            }}
            colors={[COLORS.primary]}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading user database...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.primaryLight} />
            <Text style={styles.emptyTitle}>No matching accounts found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your search criteria or create a new user account.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredUsers.map((u) => {
              const roleBadge = getRoleBadgeStyle(u.role);
              const isSubActive = u.subscriptionStatus === 'ACTIVE';

              return (
                <View key={u.id} style={styles.userCard}>
                  {/* Top: Avatar + Name + Role */}
                  <View style={styles.userCardTop}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.userName}>{u.fullName}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                          <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>
                            {roleBadge.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.userContactText}>
                        📞 {u.phone || 'No mobile'} • ✉️ {u.email}
                      </Text>
                    </View>
                  </View>

                  {/* Middle Status Info */}
                  <View style={styles.statusRow}>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>PROTECTION PLAN</Text>
                      <View
                        style={[
                          styles.subStatusBadge,
                          isSubActive ? styles.subActive : styles.subInactive,
                        ]}
                      >
                        <Ionicons
                          name={isSubActive ? 'shield-checkmark' : 'shield-outline'}
                          size={11}
                          color={isSubActive ? '#16A34A' : '#DC2626'}
                        />
                        <Text
                          style={[
                            styles.subStatusText,
                            isSubActive ? { color: '#16A34A' } : { color: '#DC2626' },
                          ]}
                        >
                          {isSubActive ? 'ACTIVE PROTECTION' : 'FREE / EXPIRED'}
                        </Text>
                      </View>
                    </View>

                    {u.city && (
                      <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>LOCATION</Text>
                        <Text style={styles.statusValue}>{u.city}</Text>
                      </View>
                    )}
                  </View>

                  {/* Bottom Action Buttons */}
                  <View style={styles.userActionsRow}>
                    {/* Grant Subscription */}
                    <TouchableOpacity
                      style={styles.actionBtnGrant}
                      onPress={() => handleGrantFreePlan(u)}
                    >
                      <Ionicons name="sparkles" size={13} color="#9333EA" />
                      <Text style={styles.actionBtnGrantText}>GRANT 1-YR FREE</Text>
                    </TouchableOpacity>

                    {/* Change Role */}
                    <TouchableOpacity
                      style={styles.actionBtnRole}
                      onPress={() => setSelectedUserForRole(u)}
                    >
                      <Ionicons name="swap-horizontal" size={13} color={COLORS.textDark} />
                      <Text style={styles.actionBtnRoleText}>CHANGE ROLE</Text>
                    </TouchableOpacity>

                    {/* Block / Unblock */}
                    <TouchableOpacity
                      style={[
                        styles.actionBtnBlock,
                        u.isBlocked && styles.actionBtnUnblock,
                      ]}
                      onPress={() => handleToggleBlock(u)}
                    >
                      <Ionicons
                        name={u.isBlocked ? 'lock-open' : 'lock-closed'}
                        size={13}
                        color={u.isBlocked ? '#16A34A' : '#DC2626'}
                      />
                      <Text
                        style={[
                          styles.actionBtnBlockText,
                          u.isBlocked ? { color: '#16A34A' } : { color: '#DC2626' },
                        ]}
                      >
                        {u.isBlocked ? 'UNBLOCK' : 'BLOCK'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* MODAL: CREATE USER */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="person-add" size={20} color="#FF2A6D" />
                <Text style={styles.modalTitle}>Create User Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Pooja Shinde"
                  value={newFullName}
                  onChangeText={setNewFullName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10-digit number"
                  value={newPhone}
                  onChangeText={setNewPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Temporary Password *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              {/* Role Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Role</Text>
                <View style={styles.roleSelectionRow}>
                  {['USER', 'PARENT', 'ORGANIZATION', 'SUPER_ADMIN'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleSelectChip, newRole === r && styles.roleSelectChipActive]}
                      onPress={() => setNewRole(r)}
                    >
                      <Text
                        style={[
                          styles.roleSelectChipText,
                          newRole === r && styles.roleSelectChipTextActive,
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Grant Free Plan Switch */}
              <TouchableOpacity
                style={styles.grantSwitchRow}
                onPress={() => setGrantFreePlan(!grantFreePlan)}
              >
                <Ionicons
                  name={grantFreePlan ? 'checkbox' : 'square-outline'}
                  size={20}
                  color="#FF2A6D"
                />
                <Text style={styles.grantSwitchText}>
                  Automatically Grant 1-Year Free Protection Plan (365 Days)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleCreateUser}
                disabled={createLoading}
              >
                {createLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>CREATE ACCOUNT NOW</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: CHANGE USER ROLE */}
      <Modal visible={!!selectedUserForRole} transparent animationType="fade">
        <View style={styles.modalOverlayCenter}>
          <View style={styles.roleModalBox}>
            <Text style={styles.roleModalTitle}>
              Change Role for {selectedUserForRole?.fullName}
            </Text>
            <Text style={styles.roleModalSub}>
              Select new role to grant permissions immediately:
            </Text>

            <View style={{ gap: 8, marginVertical: 16 }}>
              {['USER', 'PARENT', 'ORGANIZATION', 'SUPER_ADMIN'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={styles.roleOptionBtn}
                  onPress={() => handleUpdateRole(role)}
                >
                  <Text style={styles.roleOptionText}>{role}</Text>
                  <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSelectedUserForRole(null)}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFCCE1',
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2A6D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  createBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.textDark },

  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  filterChipActive: { backgroundColor: '#FF2A6D', borderColor: '#FF2A6D' },
  filterChipText: { fontSize: 10, fontWeight: '800', color: COLORS.textDark },
  filterChipTextActive: { color: '#FFF' },

  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  loadingContainer: { paddingVertical: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    borderStyle: 'dashed',
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  emptyTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark },
  emptySub: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },

  userCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  userCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  userName: { fontSize: 13, fontWeight: '900', color: COLORS.textDark },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { fontSize: 9, fontWeight: '900' },
  userContactText: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, marginTop: 2 },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9FB',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCE1',
    gap: 16,
  },
  statusItem: { gap: 2 },
  statusLabel: { fontSize: 8, fontWeight: '900', color: COLORS.textMuted },
  statusValue: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  subStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  subActive: { backgroundColor: '#DCFCE7' },
  subInactive: { backgroundColor: '#FEE2E2' },
  subStatusText: { fontSize: 9, fontWeight: '900' },

  userActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionBtnGrant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnGrantText: { fontSize: 9, fontWeight: '900', color: '#9333EA' },
  actionBtnRole: {
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
  actionBtnRoleText: { fontSize: 9, fontWeight: '900', color: COLORS.textDark },
  actionBtnBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  actionBtnUnblock: { backgroundColor: '#DCFCE7' },
  actionBtnBlockText: { fontSize: 9, fontWeight: '900' },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#FFCCE1',
    paddingBottom: 10,
  },
  modalTitle: { fontSize: 15, fontWeight: '900', color: COLORS.textDark },
  formScroll: { gap: 12, paddingBottom: 20 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: 10, fontWeight: '900', color: COLORS.textMuted },
  textInput: {
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
  roleSelectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFF0F3',
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  roleSelectChipActive: { backgroundColor: '#FF2A6D', borderColor: '#FF2A6D' },
  roleSelectChipText: { fontSize: 10, fontWeight: '800', color: COLORS.textDark },
  roleSelectChipTextActive: { color: '#FFF' },
  grantSwitchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  grantSwitchText: { fontSize: 10, fontWeight: '800', color: COLORS.textDark, flex: 1 },
  submitBtn: {
    backgroundColor: '#FF2A6D',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF2A6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },

  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  roleModalBox: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFCCE1',
  },
  roleModalTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark },
  roleModalSub: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 4 },
  roleOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFF0F3',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFCCE1',
  },
  roleOptionText: { fontSize: 12, fontWeight: '900', color: COLORS.textDark },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted },
});
