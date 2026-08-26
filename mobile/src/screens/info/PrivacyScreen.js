import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function PrivacyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.contentCard}>
          <Text style={styles.lastUpdated}>Last Updated: October 2026</Text>
          
          <Text style={styles.heading}>1. Information We Collect</Text>
          <Text style={styles.paragraph}>
            At Veagle, your privacy is our priority. We collect information you provide directly to us, such as when you create an account, update your profile, or use our emergency SOS features. This includes your location data (which is strictly used for safety tracking) and your designated emergency contacts.
          </Text>

          <Text style={styles.heading}>2. How We Use Information</Text>
          <Text style={styles.paragraph}>
            We use the information we collect to provide, maintain, and improve our services, particularly to ensure rapid response during emergencies. Your live location is only shared with your trusted guardians when you explicitly trigger an SOS or a journey.
          </Text>

          <Text style={styles.heading}>3. Data Security</Text>
          <Text style={styles.paragraph}>
            We implement industry-standard encryption to protect your personal data. We do not sell your personal data to third parties.
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
