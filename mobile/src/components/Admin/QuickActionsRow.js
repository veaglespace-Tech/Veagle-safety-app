import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

const QuickActionsRow = ({ navigation }) => {
  return (
    <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminCoupons')}>
        <Ionicons name="pricetag" size={20} color={COLORS.primary} />
        <Text style={styles.actionText}>Coupons</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminReferrals')}>
        <Ionicons name="git-network" size={20} color={COLORS.primary} />
        <Text style={styles.actionText}>Referrals</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AdminSettings')}>
        <Ionicons name="settings" size={20} color={COLORS.primary} />
        <Text style={styles.actionText}>Settings</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#FFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, gap: 4 },
  actionText: { fontSize: 11, fontWeight: '700', color: COLORS.textDark },
});

export default QuickActionsRow;
