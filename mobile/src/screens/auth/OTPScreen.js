import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { verifyEmailOtp, resendOtpCode, clearAuthMessages } from '../../redux/slices/authSlice';
import { COLORS } from '../../theme/colors';

export default function OTPScreen({ navigation, route }) {
  const dispatch = useDispatch();
  const { isLoading, error, pendingVerificationEmail } = useSelector((state) => state.auth);
  const { email: routeEmail } = route.params || {};
  const displayEmail = pendingVerificationEmail || routeEmail || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef([]);

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleOtpChange = (val, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = val.replace(/[^0-9]/g, '');
    setOtp(newOtp);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
      return;
    }
    Keyboard.dismiss();
    dispatch(clearAuthMessages());
    const result = await dispatch(verifyEmailOtp({ email: displayEmail, otp: code }));
    if (verifyEmailOtp.fulfilled.match(result)) {
      // AppNavigator will handle routing based on token/registrationToken
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    await dispatch(resendOtpCode({ email: displayEmail }));
    setResendCooldown(60);
    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconEmoji}>📧</Text>
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a 6-digit OTP to{'\n'}
          <Text style={styles.emailHighlight}>{displayEmail}</Text>
        </Text>

        {/* 6-digit OTP boxes */}
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(ref) => (inputs.current[idx] = ref)}
              style={[styles.otpBox, digit && styles.otpBoxFilled]}
              value={digit}
              onChangeText={(val) => handleOtpChange(val, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={COLORS.primary} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.verifyBtn, isLoading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.verifyBtnText}>VERIFY OTP</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} style={styles.resendBtn} disabled={resendCooldown > 0}>
          <Text style={[styles.resendText, resendCooldown > 0 && styles.resendDisabled]}>
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  topBar: { paddingHorizontal: 20, paddingTop: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  iconWrap: { width: 90, height: 90, borderRadius: 24, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 6 },
  iconEmoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, marginBottom: 10 },
  subtitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  emailHighlight: { fontWeight: '800', color: COLORS.primary },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  otpBox: {
    width: 48, height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.surface, textAlign: 'center', fontSize: 20, fontWeight: '900', color: COLORS.textDark,
  },
  otpBoxFilled: { borderColor: COLORS.primary, backgroundColor: '#FFF0F3' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F3', borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 14, padding: 12, marginBottom: 16, width: '100%' },
  errorText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, flex: 1 },
  verifyBtn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 17, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 20, elevation: 10, marginBottom: 16 },
  btnDisabled: { opacity: 0.65 },
  verifyBtnText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  resendBtn: { paddingVertical: 10 },
  resendText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  resendDisabled: { color: COLORS.textMuted },
});
