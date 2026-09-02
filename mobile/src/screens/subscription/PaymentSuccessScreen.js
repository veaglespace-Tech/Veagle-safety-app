import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function PaymentSuccessScreen({ navigation }) {
  useEffect(() => {
    // Optionally trigger confetti or haptics here
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>Your Sakhi Suraksha 365 Protection Plan is now fully active.</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Transaction ID</Text>
            <Text style={styles.value}>TXN-8392183921</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.value}>₹28.32</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={[styles.value, { color: COLORS.success }]}>Active / 365 Days</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.btnText}>Access Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.successBg },
  content: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  iconWrap: { marginBottom: 24, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.textDark, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  
  card: { width: '100%', backgroundColor: COLORS.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.successBorder, shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  value: { fontSize: 14, fontWeight: '800', color: COLORS.textDark },
  divider: { height: 1, backgroundColor: COLORS.primaryBorder, marginVertical: 16, opacity: 0.5 },

  footer: { padding: 24 },
  btn: { backgroundColor: COLORS.success, paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
});
