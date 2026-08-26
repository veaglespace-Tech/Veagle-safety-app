import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

const StatsGrid = ({ stats }) => {
  return (
    <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.statsGrid}>
      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>TOTAL MEMBERS</Text>
          <Ionicons name="people" size={16} color={COLORS.primary} />
        </View>
        <Text style={styles.statValue}>{stats.totalMembers}</Text>
        <Text style={styles.statSubtitle}>Enrolled Students/Staff</Text>
      </View>

      <View style={[styles.statCard, stats.activeSosCount > 0 && styles.statCardAlert]}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: COLORS.primary }]}>ACTIVE SOS</Text>
          <Ionicons name="warning" size={16} color={COLORS.primary} />
        </View>
        <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.activeSosCount}</Text>
        <Text style={[styles.statSubtitle, { color: COLORS.primary }]}>Emergency Triggered</Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>ACTIVE TRIPS</Text>
          <Ionicons name="navigate" size={16} color={COLORS.success} />
        </View>
        <Text style={styles.statValue}>{stats.inTripCount}</Text>
        <Text style={styles.statSubtitle}>Journeys In-Transit</Text>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statHeader}>
          <Text style={[styles.statTitle, { color: COLORS.success }]}>SAFE MEMBERS</Text>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
        </View>
        <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.safeCount}</Text>
        <Text style={styles.statSubtitle}>Normal Protection</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  statCardAlert: { backgroundColor: '#FFF0F3', borderColor: COLORS.primary },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statTitle: { fontSize: 9, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5 },
  statValue: { fontSize: 28, fontWeight: '900', color: COLORS.textDark },
  statSubtitle: { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, marginTop: 4 },
});

export default StatsGrid;
