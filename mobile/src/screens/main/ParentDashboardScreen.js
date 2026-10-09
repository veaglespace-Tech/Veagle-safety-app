import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { parentApi } from '../../api/parentApi';
import { COLORS } from '../../theme/colors';

export default function ParentDashboardScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('children');
  const [linkInput, setLinkInput] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await parentApi.getOverview();
      setChildren(res.children || []);
    } catch (e) {
      console.log('Parent fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkChild = async () => {
    if (!linkInput.trim()) return Alert.alert('Error', 'Please enter child email or phone');
    try {
      setIsLoading(true);
      await parentApi.linkChild({ identifier: linkInput, relationship: 'Parent' });
      setLinkInput('');
      Alert.alert('Success', 'Child linked successfully');
      fetchData();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to link child');
      setIsLoading(false);
    }
  };

  const handleUnlink = (linkId) => {
    Alert.alert('Unlink Child', 'Are you sure you want to unlink this child?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlink', style: 'destructive', onPress: async () => {
        try {
          await parentApi.unlinkChild(linkId);
          setChildren(children.filter(c => c.linkId !== linkId));
        } catch (e) {
          Alert.alert('Error', 'Failed to unlink');
        }
      }}
    ]);
  };

  if (isLoading && children.length === 0) {
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
        <Text style={styles.headerTitle}>Parent Portal</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'children' && styles.tabActive]} onPress={() => setActiveTab('children')}>
          <Text style={[styles.tabText, activeTab === 'children' && styles.tabTextActive]}>My Family ({children.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'add' && styles.tabActive]} onPress={() => setActiveTab('add')}>
          <Text style={[styles.tabText, activeTab === 'add' && styles.tabTextActive]}>Link New Child</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'children' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Linked Children</Text>
            </View>
            {children.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="person-add" size={40} color={COLORS.primaryLight} />
                <Text style={styles.emptyTitle}>No family members linked</Text>
                <Text style={styles.emptySub}>Add your children to monitor their safety.</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setActiveTab('add')}>
                  <Text style={styles.addBtnText}>LINK CHILD NOW</Text>
                </TouchableOpacity>
              </View>
            ) : (
              children.map((c) => (
                <View key={c.linkId} style={styles.childRow}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{c.child.fullName?.charAt(0) || 'C'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>{c.child.fullName}</Text>
                    <Text style={styles.childSub}>{c.child.email} • {c.child.phone}</Text>
                    <View style={styles.statusRow}>
                       {c.activeSos ? (
                         <View style={[styles.statusBadge, { backgroundColor: '#FFF0F3', borderColor: '#FF2A6D' }]}>
                           <Ionicons name="warning" size={10} color="#FF2A6D" />
                           <Text style={[styles.statusText, { color: '#FF2A6D' }]}>EMERGENCY SOS</Text>
                         </View>
                       ) : c.activeJourney ? (
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
                  <TouchableOpacity onPress={() => handleUnlink(c.linkId)} style={styles.deleteBtn}>
                    <Ionicons name="close" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="link" size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Link Family Member</Text>
            </View>
            <View style={styles.formGap}>
              <Text style={styles.label}>Child's Registered Email or Mobile</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com or mobile number"
                placeholderTextColor={COLORS.primaryBorder}
                value={linkInput}
                onChangeText={setLinkInput}
              />
              <TouchableOpacity style={styles.linkBtn} onPress={handleLinkChild} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.linkBtnText}>LINK ACCOUNT</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark },
  tabContainer: { flexDirection: 'row', padding: 16, gap: 10 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  tabTextActive: { color: '#fff' },
  scroll: { padding: 16, gap: 16 },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primaryBorder, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder, paddingBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark, textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', padding: 24, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark },
  emptySub: { fontSize: 12, color: COLORS.textMuted },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, marginTop: 8 },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.primaryBorder },
  avatarText: { fontSize: 16, fontWeight: '900', color: COLORS.primary },
  childName: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  childSub: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  statusRow: { flexDirection: 'row', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '900' },
  deleteBtn: { padding: 8, backgroundColor: COLORS.primaryBg, borderRadius: 12 },
  formGap: { gap: 12 },
  label: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  input: { backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 14, paddingHorizontal: 16, height: 48, fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  linkBtn: { backgroundColor: COLORS.primary, borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  linkBtnText: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 1 },
});
