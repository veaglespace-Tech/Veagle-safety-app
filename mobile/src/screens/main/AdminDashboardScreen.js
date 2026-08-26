import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

// Components
import OrganizationHeader from '../../components/Admin/OrganizationHeader';
import QuickActionsRow from '../../components/Admin/QuickActionsRow';
import StatsGrid from '../../components/Admin/StatsGrid';
import LiveSafetyMonitor from '../../components/Admin/LiveSafetyMonitor';
import MemberDirectory from '../../components/Admin/MemberDirectory';
import AddMemberModal from '../../components/Admin/AddMemberModal';

export default function AdminDashboardScreen({ navigation }) {
  const {
    firstName,
    activeTab,
    setActiveTab,
    loading,
    stats,
    members,
    filteredMembers,
    searchTerm,
    setSearchTerm,
    showAddModal,
    setShowAddModal,
    addIdentifier,
    setAddIdentifier,
    addMemberCode,
    setAddMemberCode,
    addDepartment,
    setAddDepartment,
    addLoading,
    fetchOverview,
    handleAddMember,
    handleRemoveMember
  } = useAdminDashboard();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* ORGANIZATION HEADER BAR */}
        <OrganizationHeader 
          firstName={firstName} 
          loading={loading} 
          onRefresh={fetchOverview} 
        />

        {/* QUICK ACTIONS ROW */}
        <QuickActionsRow navigation={navigation} />

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
            <StatsGrid stats={stats} />

            {/* LIVE SAFETY STATUS LIST */}
            <LiveSafetyMonitor 
              members={members} 
              setActiveTab={setActiveTab} 
            />
          </View>
        )}

        {activeTab === 'members' && (
          <MemberDirectory 
            filteredMembers={filteredMembers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            setShowAddModal={setShowAddModal}
            handleRemoveMember={handleRemoveMember}
          />
        )}

      </ScrollView>

      {/* ENROLL MEMBER MODAL */}
      <AddMemberModal 
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        addIdentifier={addIdentifier}
        setAddIdentifier={setAddIdentifier}
        addMemberCode={addMemberCode}
        setAddMemberCode={setAddMemberCode}
        addDepartment={addDepartment}
        setAddDepartment={setAddDepartment}
        handleAddMember={handleAddMember}
        addLoading={addLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9FB' },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 16 },
  
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFF', padding: 6, borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6 },
  tabBtnActive: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  tabText: { fontSize: 10, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 0.5 },
  tabTextActive: { color: '#FFF' },
});
