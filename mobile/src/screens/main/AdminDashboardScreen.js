import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

export default function AdminDashboardScreen({ navigation }) {
  const { user } = useSelector((state) => state.auth);
  const firstName = (user?.fullName || user?.name || 'Admin').split(' ')[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Animated Welcome Header */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Organization Admin</Text>
            <Text style={styles.name}>Welcome, {firstName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0].toUpperCase()}</Text>
          </View>
        </Animated.View>

        {/* Glassmorphism Summary Cards */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.statsContainer}>
          <View style={styles.glassCard}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>1,245</Text>
            <Text style={styles.statLabel}>Active Members</Text>
          </View>
          <View style={styles.glassCard}>
            <Ionicons name="warning" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Recent Alerts</Text>
          </View>
        </Animated.View>

        {/* System Status */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>System Status</Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>ALL SYSTEMS NORMAL</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.actionRow} onPress={() => {
            import('react-native').then(({ Alert }) => {
              Alert.alert("Coming Soon", "Organization management dashboard is in development.");
            });
          }}>
            <Ionicons name="business" size={20} color={COLORS.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionTitle}>Manage Organization</Text>
              <Text style={styles.actionSub}>View departments and team leaders</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionRow} onPress={() => {
            import('react-native').then(({ Alert }) => {
              Alert.alert("Coming Soon", "Safety Reports feature is currently in development.");
            });
          }}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.actionTitle}>Safety Reports</Text>
              <Text style={styles.actionSub}>Generate monthly safety compliance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24, gap: 16 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  greeting: { fontSize: 13, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },
  name: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, marginTop: 4 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primaryBg, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  avatarText: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  
  statsContainer: { flexDirection: 'row', gap: 12 },
  glassCard: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, alignItems: 'flex-start' },
  statValue: { fontSize: 26, fontWeight: '900', color: COLORS.textDark, marginTop: 12 },
  statLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginTop: 4 },
  
  card: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, borderRadius: 24, padding: 18, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 12, elevation: 4, marginTop: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusChip: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#86EFAC' },
  statusChipText: { fontSize: 10, fontWeight: '900', color: COLORS.success },
  
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  actionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  actionSub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
});
