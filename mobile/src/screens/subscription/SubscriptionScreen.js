import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/apiClient';
import { COLORS } from '../../theme/colors';

export default function SubscriptionScreen({ navigation }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await apiClient.get('/plans');
        setPlans(res.data.plans || res.data || []);
      } catch (e) {}
      setLoading(false);
    };
    fetchPlans();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Subscription & Plans</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={{ fontSize: 36 }}>💎</Text>
          <Text style={styles.heroTitle}>Upgrade Your Protection</Text>
          <Text style={styles.heroSub}>Choose a plan that keeps you safe 24/7 with all premium safety features.</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 40 }} />
        ) : plans.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No plans available at the moment.</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {plans.map((plan, idx) => (
              <View key={plan.id || idx} style={[styles.planCard, idx === 0 && styles.planCardPopular]}>
                {idx === 0 && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>⭐ MOST POPULAR</Text>
                  </View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>₹{plan.price}</Text>
                  <Text style={styles.planPeriod}>/{plan.durationDays >= 365 ? 'year' : plan.durationDays + ' days'}</Text>
                </View>
                {plan.features && (
                  <View style={{ gap: 6, marginTop: 10, marginBottom: 16 }}>
                    {(Array.isArray(plan.features) ? plan.features : Object.keys(plan.features)).map((feat, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                        <Text style={styles.featureText}>{typeof feat === 'string' ? feat : feat}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.planBtn, idx === 0 && styles.planBtnPrimary]}
                  onPress={() => {}}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.planBtnText, idx !== 0 && styles.planBtnTextOutline]}>
                    {idx === 0 ? 'GET STARTED' : 'SELECT PLAN'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },
  heroCard: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 6 },
  heroTitle: { fontSize: 20, fontWeight: '900', color: COLORS.textDark, textAlign: 'center' },
  heroSub: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, textAlign: 'center', lineHeight: 18 },
  emptyCard: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  planCard: { backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, borderRadius: 24, padding: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 14, elevation: 5, overflow: 'hidden' },
  planCardPopular: { borderColor: COLORS.primary, shadowOpacity: 0.22 },
  popularBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start', marginBottom: 12 },
  popularBadgeText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  planName: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 },
  planPrice: { fontSize: 32, fontWeight: '900', color: COLORS.primary },
  planPeriod: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 12, fontWeight: '700', color: COLORS.textDark },
  planBtn: { borderRadius: 999, paddingVertical: 14, alignItems: 'center', backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  planBtnPrimary: {},
  planBtnText: { fontSize: 13, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  planBtnTextOutline: { color: '#fff' },
});
