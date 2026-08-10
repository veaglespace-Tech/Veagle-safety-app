import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthMessages } from '../../redux/slices/authSlice';
import { COLORS } from '../../theme/colors';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, error, showOtpModal } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    dispatch(clearAuthMessages());
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      if (result.payload?.requiresVerification || result.payload?.pendingToken) {
        navigation.navigate('OTP', { email, mode: 'login' });
      }
      // If token comes directly, AppNavigator will switch to Main
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../../assets/logo.jpeg')}
                style={styles.logoImg}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your Veagle Safety account</Text>
          </View>

          {/* ERROR */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.primary} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* FORM */}
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
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

            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.primaryBorder}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.loginBtnText}>SIGN IN</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.registerLink}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerBold}>Create Account</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 28 },
  logoWrap: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8, overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%', borderRadius: 20 },
  logoEmoji: { fontSize: 38 },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF0F3', borderWidth: 1.5, borderColor: COLORS.primaryBorder,
    borderRadius: 14, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, flex: 1 },
  form: { gap: 16 },
  fieldWrap: {},
  label: {
    fontSize: 11, fontWeight: '800', color: COLORS.textDark,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  eyeBtn: { padding: 4 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
  loginBtn: {
    backgroundColor: COLORS.primary, borderRadius: 999,
    paddingVertical: 17, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38, shadowRadius: 20, elevation: 10, marginTop: 8,
  },
  btnDisabled: { opacity: 0.65 },
  loginBtnText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  registerLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  registerText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  registerBold: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
});
