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
          <Text style={styles.lastUpdated}>Effective Date: October 2026</Text>
          
          <Text style={styles.heading}>1. Prominent Disclosure: Location Data Access</Text>
          <View style={styles.disclosureHighlight}>
            <Text style={styles.disclosureHighlightText}>
              Sakhi Suraksha collects location data to enable live whereabouts sharing with trusted contacts and SOS emergency alerts, even when the app is closed or not in use.
            </Text>
          </View>
          <Text style={styles.paragraph}>
            This prominent disclosure informs you prior to any permission request that your device location will be accessed only for your physical safety and emergency rescue assistance.
          </Text>

          <Text style={styles.heading}>2. Information We Collect</Text>
          <Text style={styles.paragraph}>
            • Personal Information: Your name, email address, phone number, and account credentials.{'\n'}
            • Emergency Contacts: Phone numbers and names of your chosen guardians.{'\n'}
            • Precise & Approximate Location: Real-time GPS coordinates (latitude, longitude, accuracy) gathered during emergency events, check-ins, or active journeys.{'\n'}
            • Device Information: Device model, operating system version, and unique push notification identifiers for delivering safety alerts.
          </Text>

          <Text style={styles.heading}>3. Background Location Collection & Purpose</Text>
          <Text style={styles.paragraph}>
            Sakhi Suraksha utilizes ACCESS_BACKGROUND_LOCATION strictly to protect you during emergency situations. When you trigger an SOS alert or start a protected journey, the application transmits your live GPS coordinates continuously to your designated guardians, even when the app is minimized, running in the background, or your screen is locked. Background location tracking ceases immediately when the SOS emergency is resolved or journey tracking ends.
          </Text>

          <Text style={styles.heading}>4. How We Use and Share Your Data</Text>
          <Text style={styles.paragraph}>
            • We use your information solely to deliver emergency safety features, SOS alerts, guardian live-map tracking, and journey monitoring.{'\n'}
            • We do NOT sell, rent, monetize, or trade your personal data or location history with any third parties or advertisers.{'\n'}
            • Data is only transmitted to your designated guardians, organization administrators (if applicable), and authorized emergency services.
          </Text>

          <Text style={styles.heading}>5. Data Security & Encryption</Text>
          <Text style={styles.paragraph}>
            All sensitive telemetry, including live location streams, is encrypted in transit using industry-standard HTTPS and secure WebSockets (TLS/WSS). Stored credentials are encrypted using modern cryptographic hashing algorithms.
          </Text>

          <Text style={styles.heading}>6. Data Retention and Account Deletion</Text>
          <Text style={styles.paragraph}>
            In compliance with Google Play's User Data & Account Deletion policies, you have complete control over your personal data. You may request account deletion or data removal at any time through the app settings or by contacting privacy@veaglesafety.org. Upon account deletion, all personal profiles, contacts, and historical location logs are permanently removed from our active servers.
          </Text>

          <Text style={styles.heading}>7. Revoking Permissions</Text>
          <Text style={styles.paragraph}>
            You may modify or revoke location access at any time through your Android device settings: Settings &gt; Apps &gt; Sakhi Suraksha &gt; Permissions &gt; Location. Note that disabling location access will restrict real-time SOS broadcasting.
          </Text>

          <Text style={styles.heading}>8. Contact Us</Text>
          <Text style={styles.paragraph}>
            If you have questions regarding this Privacy Policy or wish to exercise your data rights, contact our Data Protection Officer at privacy@veaglesafety.org or support@veaglespace.com.
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
  disclosureHighlight: {
    backgroundColor: '#FFF0F3',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    marginVertical: 10,
  },
  disclosureHighlightText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 20,
  },
});
