import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

const OrganizationHeader = ({ firstName, loading, onRefresh }) => {
  return (
    <Animated.View entering={FadeInDown.duration(600)} style={styles.headerCard}>
      <View style={styles.headerLeft}>
        <View style={styles.hqIcon}>
          <Ionicons name="business" size={28} color="#FFF" />
        </View>
        <View>
          <View style={styles.hqTagContainer}>
            <View style={styles.hqBadge}>
              <Text style={styles.hqBadgeText}>ORGANIZATION HQ</Text>
            </View>
            <Text style={styles.hqSubtitle}>• Safety Dispatch Portal</Text>
          </View>
          <Text style={styles.hqName}>{firstName}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.refreshBtn} 
        onPress={onRefresh}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
        )}
        <Text style={styles.refreshText}>REFRESH STATUS</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  hqIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  hqTagContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  hqBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  hqBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  hqSubtitle: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
  hqName: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryBorder, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  refreshText: { fontSize: 9, fontWeight: '800', color: COLORS.textDark, letterSpacing: 0.5 },
});

export default OrganizationHeader;
