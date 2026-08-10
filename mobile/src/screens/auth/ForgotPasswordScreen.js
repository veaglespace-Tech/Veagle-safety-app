import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api/authApi';
import { COLORS } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconEmoji}>{sent ? '✅' : '🔑'}</Text>
            </View>

            {sent ? (
              <>
                <Text style={styles.title}>Check Your Email</Text>
                <Text style={styles.subtitle}>
                  We've sent a password reset link to{'\n'}
                  <Text style={styles.highlight}>{email}</Text>
                </Text>
                <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.btnText}>BACK TO LOGIN</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Enter your registered email and we'll send you a reset link.</Text>

                <View style={styles.form}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputRow}>
                    <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="your@email.com"
                      placeholderTextColor={COLORS.primaryBorder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, isLoading && styles.btnDisabled]}
                  onPress={handleSend}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  {isLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.btnText}>SEND RESET LINK</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 8 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  iconWrap: { width: 90, height: 90, borderRadius: 24, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 6 },
  iconEmoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.textDark, marginBottom: 10 },
  subtitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  highlight: { fontWeight: '800', color: COLORS.primary },
  form: { width: '100%', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14 },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  btn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 17, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 20, elevation: 10 },
  btnDisabled: { opacity: 0.65 },
  btnText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },
});
