import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { apiClient } from '../../api/apiClient';
import { paymentApi } from '../../api/paymentApi';
import { couponApi } from '../../api/couponApi';

export default function CheckoutScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Card input states
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await apiClient.get('/plans');
        if (res.data?.success && res.data.plans.length > 0) {
          setPlans(res.data.plans);
          setSelectedPlan(res.data.plans[0]); // default to first plan
        }
      } catch (err) {
        console.warn("Failed to fetch plans", err);
      }
    };
    fetchPlans();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    try {
      const res = await couponApi.validateCoupon(couponCode, selectedPlan?.id);
      if (res?.success) {
        setAppliedCoupon(res.coupon);
        Alert.alert("Success", "Coupon applied!");
      }
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Invalid coupon");
      setAppliedCoupon(null);
      setCouponCode('');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = async () => {
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
      Alert.alert("Required", "Please fill in all card details to proceed.");
      return;
    }
    setLoading(true);
    try {
      const res = await paymentApi.initiatePayU({
        planId: selectedPlan?.id,
        amount: totalPrice,
        couponCode: appliedCoupon?.code
      });
      
      // Simulate successful redirect since we don't have PayU SDK installed
      setTimeout(() => {
        setLoading(false);
        navigation.replace('PaymentSuccess');
      }, 1500);

    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err.response?.data?.error || "Payment failed");
    }
  };

  // Calculations
  const basePrice = selectedPlan ? Number(selectedPlan.basePrice) : 24.0;
  let finalBasePrice = basePrice;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      finalBasePrice -= (finalBasePrice * appliedCoupon.discountValue / 100);
    } else {
      finalBasePrice -= appliedCoupon.discountValue;
    }
    if (finalBasePrice < 0) finalBasePrice = 0;
  }
  
  const gstRate = 18.0;
  const gstAmount = Number(((finalBasePrice * gstRate) / 100).toFixed(2));
  const totalPrice = Number((finalBasePrice + gstAmount).toFixed(2));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Secure Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.planRow}>
            <View>
              <Text style={styles.planName}>{selectedPlan ? selectedPlan.name : 'Sakhi Suraksha 365'}</Text>
              <Text style={styles.planDesc}>Annual Protection Plan</Text>
            </View>
            <Text style={styles.planPrice}>₹{basePrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Base Price</Text>
            <Text style={styles.costValue}>₹{finalBasePrice.toFixed(2)}</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>GST (18%)</Text>
            <Text style={styles.costValue}>₹{gstAmount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{totalPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.couponWrap}>
            <TextInput 
              style={[styles.couponInput, appliedCoupon && styles.couponInputApplied]} 
              placeholder="Have a coupon code?" 
              placeholderTextColor={COLORS.textMuted}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              editable={!appliedCoupon}
            />
            {!appliedCoupon ? (
              <TouchableOpacity 
                style={[styles.applyBtn, (applyingCoupon || !couponCode) && styles.btnDisabled]} 
                onPress={handleApplyCoupon}
                disabled={applyingCoupon || !couponCode}
              >
                {applyingCoupon ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.applyBtnText}>Apply</Text>}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.applyBtn, styles.removeBtn]} 
                onPress={handleRemoveCoupon}
              >
                <Text style={styles.applyBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          {appliedCoupon && (
            <Text style={styles.successText}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} /> Coupon '{appliedCoupon.code}' applied successfully!
            </Text>
          )}
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <Text style={styles.inputLabel}>Cardholder Name</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Jane Doe" 
            placeholderTextColor={COLORS.textMuted}
            value={cardName}
            onChangeText={setCardName}
          />
          
          <Text style={styles.inputLabel}>Card Number</Text>
          <TextInput 
            style={styles.input} 
            placeholder="**** **** **** 1234" 
            keyboardType="number-pad" 
            placeholderTextColor={COLORS.textMuted}
            value={cardNumber}
            onChangeText={setCardNumber}
            maxLength={16}
          />
          
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>Expiry</Text>
              <TextInput 
                style={styles.input} 
                placeholder="MM/YY" 
                placeholderTextColor={COLORS.textMuted}
                value={cardExpiry}
                onChangeText={setCardExpiry}
                maxLength={5}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.inputLabel}>CVV</Text>
              <TextInput 
                style={styles.input} 
                placeholder="***" 
                secureTextEntry 
                keyboardType="number-pad" 
                placeholderTextColor={COLORS.textMuted}
                value={cardCvv}
                onChangeText={setCardCvv}
                maxLength={3}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payBtn} onPress={handleCheckout} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payBtnText}>Pay ₹{totalPrice.toFixed(2)}</Text>}
        </TouchableOpacity>
        <View style={styles.secureWrap}>
          <Ionicons name="lock-closed" size={12} color={COLORS.success} />
          <Text style={styles.secureText}>Payments are 100% encrypted & secure</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  scroll: { padding: 16, gap: 16 },
  
  summaryCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginBottom: 16 },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  planDesc: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  planPrice: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  
  divider: { height: 1, backgroundColor: COLORS.primaryBorder, marginVertical: 16 },
  
  costRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  costLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  costValue: { fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: '900', color: COLORS.textDark },
  totalValue: { fontSize: 22, fontWeight: '900', color: COLORS.primary },

  couponWrap: { flexDirection: 'row', gap: 8, marginTop: 4 },
  couponInput: { flex: 1, backgroundColor: COLORS.primaryBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 13, fontWeight: '700', color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.primaryBorder },
  couponInputApplied: { backgroundColor: '#f0fdf4', borderColor: COLORS.success, color: COLORS.success },
  applyBtn: { backgroundColor: COLORS.textDark, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  removeBtn: { backgroundColor: COLORS.emergency },
  applyBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  btnDisabled: { opacity: 0.7 },
  successText: { color: COLORS.success, fontSize: 12, fontWeight: '800', marginTop: 8 },

  paymentCard: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: COLORS.primaryBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.primaryBorder },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  footer: { padding: 16, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.primaryBorder },
  payBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  payBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  secureWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 },
  secureText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
});
