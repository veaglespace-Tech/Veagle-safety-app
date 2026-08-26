import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

const LiveSafetyMonitor = ({ members, setActiveTab }) => {
  return (
    <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.listContainer}>
      <View style={styles.listHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>Organization Member Live Dispatch Monitor</Text>
          <Text style={styles.listSubtitle}>Updated Real-Time</Text>
        </View>
      </View>

      {members.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={48} color={COLORS.primary} />
          <Text style={styles.emptyTitle}>No Members Enrolled Yet</Text>
          <Text style={styles.emptySub}>Switch to the Member Directory tab to view your students or employees.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('members')}>
            <Text style={styles.emptyBtnText}>GO TO MEMBER DIRECTORY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.memberList}>
          {members.map((m) => (
            <View key={m.membershipId} style={[styles.memberItem, m.activeSos && styles.memberItemAlert, m.activeJourney && styles.memberItemJourney]}>
              <View style={styles.memberInfo}>
                <View style={[styles.memberAvatar, m.activeSos ? { backgroundColor: COLORS.primary } : m.activeJourney ? { backgroundColor: COLORS.success } : { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.avatarLetter}>{m.user?.fullName?.charAt(0) || 'M'}</Text>
                </View>
                <View>
                  <Text style={styles.memberName}>{m.user?.fullName}</Text>
                  <Text style={styles.memberDetails}>{m.user?.email}</Text>
                </View>
              </View>
              <View style={styles.statusBadge}>
                {m.activeSos ? (
                  <View style={[styles.badge, { backgroundColor: COLORS.primary }]}>
                    <Ionicons name="warning" size={12} color="#FFF" style={{marginRight: 4}} />
                    <Text style={styles.badgeText}>SOS ACTIVE</Text>
                  </View>
                ) : m.activeJourney ? (
                  <View style={[styles.badge, { backgroundColor: COLORS.success + '20' }]}>
                    <Ionicons name="navigate" size={12} color={COLORS.success} style={{marginRight: 4}} />
                    <Text style={[styles.badgeText, { color: COLORS.success }]}>IN-TRIP</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: COLORS.success + '15', borderWidth: 1, borderColor: COLORS.success + '40' }]}>
                    <Ionicons name="shield-checkmark" size={12} color={COLORS.success} style={{marginRight: 4}} />
                    <Text style={[styles.badgeText, { color: COLORS.success }]}>SAFE</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  listContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  listTitle: { fontSize: 14, fontWeight: '900', color: COLORS.textDark, flex: 1 },
  listSubtitle: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },

  emptyState: { backgroundColor: '#FFF0F3', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder, borderStyle: 'dashed', marginTop: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 100, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  emptyBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  memberList: { gap: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  memberItemAlert: { backgroundColor: '#FFF0F3', borderColor: COLORS.primary },
  memberItemJourney: { backgroundColor: '#F0FDF4', borderColor: COLORS.success + '40' },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  memberAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  avatarLetter: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  memberName: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  memberDetails: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  
  statusBadge: { alignItems: 'flex-end', shrink: 0 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
});

export default LiveSafetyMonitor;
