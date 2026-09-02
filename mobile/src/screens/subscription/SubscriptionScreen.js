import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function SubscriptionScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for the UI transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    "24/7 Unlimited One-Tap Emergency SOS Broadcast",
    "Encrypted Live GPS Location Tracking & Map Sharing",
    "Instant Multi-Channel Guardian Alerts (SMS, Email, App)",
    "Loud Siren Audio Alarm & Device Vibration Drill",
    "5 Verified Emergency Trusted Guardians Network",
    "SuperAdmin Emergency Command Center Monitoring"
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Subscription</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Top Status Card */}
            <View style={styles.statusCard}>
              <View style={styles.statusHeaderRow}>
                <View style={styles.crownIconWrap}>
                  <MaterialCommunityIcons name="crown" size={24} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.statusTitle}>Subscription & Plan Status</Text>
                  <Text style={styles.statusSub}>Manage your active 24/7 emergency protection plan & coverage validity</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.renewBtn} activeOpacity={0.8} onPress={() => {
                navigation.navigate('Checkout');
              }}>
                <Ionicons name="refresh" size={16} color="#FFF" />
                <Text style={styles.renewBtnText}>RENEW / UPGRADE PLAN</Text>
              </TouchableOpacity>
            </View>

            {/* Main Plan Card */}
            <View style={styles.planCard}>
              {/* Tags */}
              <View style={styles.tagsRow}>
                <View style={styles.tagPink}>
                  <Text style={styles.tagPinkText}>365-DAY UNLIMITED PROTECTION</Text>
                </View>
                <View style={styles.tagGreen}>
                  <Text style={styles.tagGreenText}>ACTIVE PLAN</Text>
                </View>
              </View>

              {/* Title & Price */}
              <View style={styles.titlePriceWrap}>
                <Text style={styles.planName}>Sakhi Suraksha 365 Protection Plan</Text>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>TOTAL PAID</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceValue}>₹28.32</Text>
                    <Text style={styles.pricePeriod}>/ year</Text>
                  </View>
                  <Text style={styles.priceSubtext}>Includes ₹24.00 Base + 18% GST (₹4.32)</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Info Grid */}
              <View style={styles.infoGrid}>
                <View style={styles.infoBox}>
                  <View style={styles.infoHeaderRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.infoBoxTitle}>START DATE</Text>
                  </View>
                  <Text style={styles.infoBoxValue}>26 Aug 2026</Text>
                  <Text style={styles.infoBoxSub}>Plan Activated</Text>
                </View>

                <View style={styles.infoBox}>
                  <View style={styles.infoHeaderRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.infoBoxTitle}>EXPIRY DATE</Text>
                  </View>
                  <Text style={styles.infoBoxValue}>01 Aug 2027</Text>
                  <Text style={styles.infoBoxSub}>Valid for 365 Days</Text>
                </View>

                <View style={[styles.infoBox, { width: '100%', marginTop: 8 }]}>
                  <View style={[styles.infoHeaderRow, { justifyContent: 'flex-start', gap: 6 }]}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
                    <Text style={[styles.infoBoxTitle, { color: COLORS.success }]}>COVERAGE</Text>
                  </View>
                  <Text style={[styles.infoBoxValue, { color: COLORS.success }]}>24/7 Active</Text>
                  <Text style={styles.infoBoxSub}>Full Guard Network Enabled</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Annual Subscription Validity Status</Text>
                  <Text style={styles.progressValue}>365 / 365 Days Active</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '100%' }]} />
                </View>
              </View>

              <View style={styles.divider} />

              {/* Features List */}
              <Text style={styles.featuresTitle}>INCLUDED PLAN FEATURES & BENEFITS</Text>
              <View style={styles.featuresList}>
                {features.map((feat, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureIconWrap}>
                      <Ionicons name="checkmark" size={12} color={COLORS.success} />
                    </View>
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>

            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 16 },
  
  // Status Card
  statusCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  statusHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  crownIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  statusTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark, marginBottom: 4 },
  statusSub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, lineHeight: 18 },
  renewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  renewBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },

  // Main Plan Card
  planCard: { backgroundColor: COLORS.surface, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  tagPink: { backgroundColor: '#FFF0F3', borderWidth: 1, borderColor: COLORS.primaryBorder, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagPinkText: { color: COLORS.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  tagGreen: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  tagGreenText: { color: COLORS.success, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  titlePriceWrap: { gap: 16 },
  planName: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, lineHeight: 32 },
  
  priceContainer: { alignItems: 'flex-start' },
  priceLabel: { fontSize: 11, fontWeight: '900', color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  priceValue: { fontSize: 32, fontWeight: '900', color: COLORS.primary },
  pricePeriod: { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  priceSubtext: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 4 },

  divider: { height: 1, backgroundColor: COLORS.primaryBorder, marginVertical: 24 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  infoBox: { width: '48%', backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 16, padding: 16, marginBottom: 10 },
  infoHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoBoxTitle: { fontSize: 11, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
  infoBoxValue: { fontSize: 15, fontWeight: '900', color: COLORS.textDark, marginBottom: 2 },
  infoBoxSub: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },

  progressSection: { marginTop: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, flex: 1 },
  progressValue: { fontSize: 12, fontWeight: '900', color: COLORS.primary },
  progressBarBg: { height: 8, backgroundColor: '#FFF0F3', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },

  featuresTitle: { fontSize: 12, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.8, marginBottom: 16 },
  featuresList: { gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: COLORS.primaryBorder, padding: 14, borderRadius: 16 },
  featureIconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#86EFAC', alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.textDark, lineHeight: 18 },
});
