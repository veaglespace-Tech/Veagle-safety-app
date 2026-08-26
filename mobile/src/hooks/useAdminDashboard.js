import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { organizationApi } from '../api/organizationApi';
import { useSelector } from 'react-redux';

export const useAdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const firstName = (user?.fullName || user?.name || 'HQ Admin');
  
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'members'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalMembers: 0, activeSosCount: 0, inTripCount: 0, safeCount: 0 });
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addIdentifier, setAddIdentifier] = useState('');
  const [addMemberCode, setAddMemberCode] = useState('');
  const [addDepartment, setAddDepartment] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

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
        fetchOverview();
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Failed to add member. Please verify phone/email.';
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
                fetchOverview();
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
      m.user?.fullName?.toLowerCase().includes(term) ||
      m.user?.email?.toLowerCase().includes(term) ||
      m.user?.phone?.includes(term) ||
      m.memberCode?.toLowerCase().includes(term) ||
      m.department?.toLowerCase().includes(term)
    );
  });

  return {
    user,
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
  };
};
