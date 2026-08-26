import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { COLORS } from '../../theme/colors';

export default function AboutScreen({ navigation }) {
  const features = [
    { icon: 'radio-outline', title: '3-Second SOS', description: 'Engineered for extreme emergency speed.' },
    { icon: 'location-outline', title: 'Live Tracking', description: 'Real-time GPS tracking for your guardians.' },
    { icon: 'shield-checkmark-outline', title: 'Secure & Private', description: 'Your data is encrypted and secure.' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Us</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.heroSection}>
          <View style={styles.logoWrap}>
            <Ionicons name="shield" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Veagle Safety</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.description}>
            Veagle is your ultimate safety companion. Our mission is to provide peace of mind through rapid emergency response and real-time tracking technology.
          </Text>
        </Animated.View>

        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {features.map((item, index) => (
            <Animated.View key={index} entering={FadeInUp.delay(200 + index * 100).duration(500)} style={styles.featureCard}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={item.icon} size={24} color={COLORS.primary} />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureDesc}>{item.description}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Veagle. All rights reserved.</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { width: 90, height: 90, borderRadius: 24, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, marginBottom: 4 },
  version: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 16 },
  description: { fontSize: 14, color: COLORS.textDark, textAlign: 'center', lineHeight: 22, opacity: 0.8 },
  featuresContainer: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginLeft: 4 },
  featureCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primaryBorder },
  featureIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  featureTextWrap: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, marginBottom: 2 },
  featureDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
});
