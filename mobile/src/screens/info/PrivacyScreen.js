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
            At SakhiSuraksha, your privacy and physical security are our utmost priorities. We collect information you provide directly to us, including your profile details, emergency contacts, and real-time location data. 
          </Text>
          <Text style={[styles.paragraph, { marginTop: 8, fontWeight: '600' }]}>
            Prominent Disclosure: Sakhi Suraksha collects your background location data to share your live whereabouts with trusted contacts and trigger SOS alerts during an emergency. This data is only used for your safety.
          </Text>

          <Text style={styles.heading}>2. How We Use Information</Text>
          <Text style={styles.paragraph}>
            We use your location and emergency contact data solely for real-time SOS broadcasting, active journey protection, and emergency alerting. Your location is transmitted encrypted and is never sold, leased, or shared with third-party advertisers.
          </Text>

          <Text style={styles.heading}>3. Background Location Tracking</Text>
          <Text style={styles.paragraph}>
            Background location access is strictly activated during an active emergency SOS or when you initiate a protected journey. It ensures your emergency contacts receive continuous, life-saving GPS updates even if your device screen locks or the application is minimized.
          </Text>

          <Text style={styles.heading}>4. Data Security & Retention</Text>
          <Text style={styles.paragraph}>
            All sensitive telemetry is transmitted via secure HTTPS/WSS protocols with standard encryption. You may revoke location permissions at any time through your operating system settings.
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
