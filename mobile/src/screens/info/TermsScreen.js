import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function TermsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.lastUpdated}>Last Updated: October 2026</Text>
          
          <Text style={styles.heading}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing or using the Veagle app, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </Text>

          <Text style={styles.heading}>2. Use of Service</Text>
          <Text style={styles.paragraph}>
            You agree to use the emergency services responsibly. False alarms or misuse of the SOS broadcasting feature may result in the suspension of your account.
          </Text>

          <Text style={styles.heading}>3. Subscription & Billing</Text>
          <Text style={styles.paragraph}>
            Certain premium features require an active subscription. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the app.
          </Text>

          <Text style={styles.heading}>4. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            While we strive for 100% uptime, Veagle is not a replacement for local emergency services (like 911). We shall not be held liable for network failures or delays in emergency response.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  contentCard: { backgroundColor: COLORS.surface, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primaryBorder },
  lastUpdated: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 24 },
  heading: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, marginBottom: 8, marginTop: 16 },
  paragraph: { fontSize: 14, color: COLORS.textDark, opacity: 0.8, lineHeight: 22 },
});
