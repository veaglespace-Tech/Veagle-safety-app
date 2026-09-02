import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { apiClient } from '../../api/apiClient';

export default function AdminEnquiriesScreen({ navigation }) {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/enquiries');
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to fetch enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleResolve = async (id) => {
    try {
      await apiClient.post(`/admin/enquiries/${id}/resolve`);
      Alert.alert("Success", "Enquiry marked as resolved");
      fetchEnquiries();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to resolve enquiry");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Manage Enquiries</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          enquiries.map(req => (
            <View key={req.id} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.name}>{req.fullName}</Text>
                <View style={[styles.badge, req.status === 'RESOLVED' && styles.badgeSuccess]}>
                  <Text style={[styles.badgeText, req.status === 'RESOLVED' && styles.badgeTextSuccess]}>{req.status}</Text>
                </View>
              </View>
              <Text style={styles.email}>{req.email}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.subjectLabel}>Subject:</Text>
              <Text style={styles.subject}>{req.subject}</Text>
              
              <View style={styles.footer}>
                <Text style={styles.date}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                {req.status === 'PENDING' && (
                  <TouchableOpacity style={styles.replyBtn} onPress={() => handleResolve(req.id)}>
                    <Text style={styles.replyBtnText}>Resolve</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  scroll: { padding: 16, gap: 16 },

  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  badge: { backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FDE68A' },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#D97706' },
  badgeSuccess: { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' },
  badgeTextSuccess: { color: COLORS.success },
  email: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  
  divider: { height: 1, backgroundColor: COLORS.primaryBorder, marginVertical: 12 },
  
  subjectLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  subject: { fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 },
  date: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  replyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  replyBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
});
