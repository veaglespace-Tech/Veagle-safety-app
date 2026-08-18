import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { referralApi } from '../../api/referralApi';

export default function AdminReferralsScreen() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await referralApi.getAllPartners();
      if (data && data.success) {
        setPartners(data.data || []);
      } else if (Array.isArray(data)) {
        setPartners(data);
      }
    } catch (err) {
      console.error('Failed to fetch referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const renderPartner = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.nameText}>{item.name}</Text>
        <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
          <Text style={styles.statusText}>{item.isActive ? 'ACTIVE' : 'INACTIVE'}</Text>
        </View>
      </View>
      <Text style={styles.descText}>Code: {item.referralCode}</Text>
      <Text style={styles.descText}>Email: {item.email}</Text>
      <Text style={styles.descText}>Type: {item.partnerType}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Referral Partners</Text>
        <TouchableOpacity onPress={fetchPartners} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : partners.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="git-network-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No referral partners found</Text>
        </View>
      ) : (
        <FlatList
          data={partners}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          renderItem={renderPartner}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  refreshBtn: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  descText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
