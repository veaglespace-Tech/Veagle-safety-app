import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

const MemberDirectory = ({ filteredMembers, searchTerm, setSearchTerm, setShowAddModal, handleRemoveMember }) => {
  return (
    <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.listContainer}>
       <View style={styles.directoryActions}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
              placeholderTextColor={COLORS.textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <TouchableOpacity style={styles.enrollBtn} onPress={() => setShowAddModal(true)}>
            <Ionicons name="add" size={16} color="#FFF" />
            <Text style={styles.enrollBtnText}>ENROLL</Text>
          </TouchableOpacity>
        </View>
        
        {filteredMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>No matching members found</Text>
            <Text style={styles.emptySub}>Try adjusting your search query or enroll new members.</Text>
          </View>
        ) : (
          <View style={styles.memberList}>
            {filteredMembers.map((m) => (
              <View key={m.membershipId} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarLetter}>{m.user?.fullName?.charAt(0) || 'M'}</Text>
                  </View>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.memberName}>{m.user?.fullName}</Text>
                      {m.memberCode && (
                        <View style={styles.memberCodeBadge}>
                          <Text style={styles.memberCodeText}>#{m.memberCode}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberDetails}>{m.user?.email} • {m.user?.phone}</Text>
                    {m.department && <Text style={styles.memberDept}>Dept: {m.department}</Text>}
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.removeBtn} 
                  onPress={() => handleRemoveMember(m.membershipId, m.user?.fullName)}
                >
                  <Ionicons name="trash" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  listContainer: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8 },
  directoryActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 12, fontWeight: 'bold', color: COLORS.textDark },
  enrollBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, paddingHorizontal: 16, height: 44, borderRadius: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  enrollBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  emptyState: { backgroundColor: '#FFF0F3', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder, borderStyle: 'dashed', marginTop: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', marginBottom: 20 },

  memberList: { gap: 12 },
  memberItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: COLORS.primaryBorder },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  memberAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary },
  avatarLetter: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  memberName: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  memberCodeBadge: { backgroundColor: '#FFF0F3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: COLORS.primaryBorder },
  memberCodeText: { fontSize: 10, fontWeight: '900', color: COLORS.primary },
  memberDetails: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  memberDept: { fontSize: 10, fontWeight: '800', color: COLORS.primaryLight, marginTop: 2 },
  
  removeBtn: { padding: 8, backgroundColor: '#FFF0F3', borderRadius: 8 },
});

export default MemberDirectory;
