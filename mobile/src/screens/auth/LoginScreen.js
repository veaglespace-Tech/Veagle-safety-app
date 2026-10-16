import React, { useState, useEffect, useCallback, memo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';

import { loginUser, clearAuthMessages, isSuperAdminError } from '../../redux/slices/authSlice';
import { COLORS } from '../../theme/colors';
import ProminentDisclosureModal from '../../components/common/ProminentDisclosureModal';
import { LOCATION_DISCLOSURE_KEY } from '../../services/permissionService';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORT_PHONE    = '8237999101';
const SUPPORT_WHATSAPP = `https://wa.me/91${SUPPORT_PHONE}`;

/**
 * All user roles that can log in through this single screen.
 * This is shown as a visual info strip — it is NOT a selector.
 * The backend determines the actual role from the credentials.
 */
const ALL_ROLES = [
  { icon: 'person',          label: 'User',         color: '#3B82F6' },
  { icon: 'heart',           label: 'Parent',       color: '#10B981' },
  { icon: 'business',        label: 'Organisation', color: '#8B5CF6' },
  { icon: 'shield-checkmark', label: 'Super Admin', color: '#FF2A6D' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Labelled input with left icon and optional right element */
const InputField = memo(function InputField({ label, icon, right, inputProps }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholderTextColor={COLORS.primaryBorder}
          {...inputProps}
        />
        {right}
      </View>
    </View>
  );
});

/** Error banner — only rendered when there is an error */
const ErrorBanner = memo(function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle" size={16} color={COLORS.primary} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
});

/**
 * "All roles use this screen" strip.
 * Makes it immediately clear that every type of account — User, Parent,
 * Organisation, or Super Admin — logs in right here.
 */
const RoleStrip = memo(function RoleStrip() {
  return (
    <View style={styles.roleStripWrap}>
      <Text style={styles.roleStripHeading}>One Login for All Accounts</Text>
      <View style={styles.roleRow}>
        {ALL_ROLES.map(({ icon, label, color }) => (
          <View key={label} style={styles.roleChip}>
            <View style={[styles.roleChipIcon, { backgroundColor: color + '18' }]}>
              <Ionicons name={icon} size={14} color={color} />
            </View>
            <Text style={[styles.roleChipLabel, { color }]}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.roleStripNote}>
        Enter your credentials — we'll take you to the right dashboard automatically.
      </Text>
    </View>
  );
});

/** Support CTA */
const SupportCard = memo(function SupportCard() {
  return (
    <View style={styles.supportCard}>
      <Ionicons name="headset-outline" size={22} color={COLORS.primary} style={styles.supportIcon} />
      <Text style={styles.supportTitle}>Need an Account or Plan Upgrade?</Text>
      <Text style={styles.supportSub}>
        Self-registration is disabled. Contact support to activate your account or upgrade your safety plan.
      </Text>
      <View style={styles.supportBtnsRow}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={15} color="#fff" />
          <Text style={styles.supportBtnText}>Call Us</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.whatsappBtn}
          onPress={() => Linking.openURL(SUPPORT_WHATSAPP)}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={15} color="#fff" />
          <Text style={styles.supportBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showIntroDisclosure, setShowIntroDisclosure] = useState(false);

  // Check on app launch if the user has seen the starting disclosure
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const consent = await AsyncStorage.getItem(LOCATION_DISCLOSURE_KEY);
        if (!consent && mounted) {
          setShowIntroDisclosure(true);
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, []);

  const handleIntroAgree = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LOCATION_DISCLOSURE_KEY, 'agreed');
    } catch (e) {}
    setShowIntroDisclosure(false);
  }, []);

  const handleIntroDecline = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LOCATION_DISCLOSURE_KEY, 'declined');
    } catch (e) {}
    setShowIntroDisclosure(false);
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = useCallback(() => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (!password) {
      Alert.alert('Password Required', 'Please enter your password.');
      return false;
    }
    return true;
  }, [email, password]);

  // ── OTP redirect helper ───────────────────────────────────────────────────

  const handleOtpRedirect = useCallback(
    (payload) => {
      if (payload?.requiresVerification || payload?.pendingToken) {
        navigation.navigate('OTP', {
          email: email.trim(),
          password,
          mode: 'login',
          debugOtp: payload?.debugOtp || null,
        });
        return true;
      }
      return false;
    },
    [email, password, navigation],
  );

  // ── Core login logic ──────────────────────────────────────────────────────
  //
  // Flow:
  //   1. Try a normal login → if fulfilled, redirect (OTP or Main).
  //   2. If the backend says it's a super-admin account, silently retry
  //      with isAdminLogin: true — same screen, seamless UX.
  //   3. Any other failure → Redux error state shows the ErrorBanner.
  //
  // ALL roles (User, Parent, Organisation, Super Admin) go through this
  // single function. The backend decides the role; the RoleBasedNavigator
  // then shows the correct dashboard automatically.
  // ─────────────────────────────────────────────────────────────────────────

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    dispatch(clearAuthMessages());

    // Step 1 — Standard login
    const result = await dispatch(loginUser({ email: email.trim(), password }));

    if (loginUser.fulfilled.match(result)) {
      handleOtpRedirect(result.payload);
      return; // AppNavigator switches to the correct role dashboard
    }

    if (result.payload?.requiresVerification) {
      handleOtpRedirect(result.payload);
      return;
    }

    // Step 2 — Super Admin silent retry
    const rejectedError = result.payload?.error || '';
    if (isSuperAdminError(rejectedError)) {
      dispatch(clearAuthMessages());
      const adminResult = await dispatch(
        loginUser({ email: email.trim(), password, isAdminLogin: true }),
      );
      if (loginUser.fulfilled.match(adminResult)) {
        handleOtpRedirect(adminResult.payload);
      } else if (adminResult.payload?.requiresVerification) {
        handleOtpRedirect(adminResult.payload);
      }
    }
  }, [validate, dispatch, email, password, handleOtpRedirect]);

  const togglePassword = useCallback(() => setShowPass((v) => !v), []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../../assets/logo.jpeg')}
                style={styles.logoImg}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your SakhiSuraksha account</Text>
          </View>

          {/* ── Error Banner ── */}
          <ErrorBanner message={error} />

          {/* ── Form ── */}
          <View style={styles.form}>

            {/* Email */}
            <InputField
              label="Email Address"
              icon="mail-outline"
              inputProps={{
                placeholder:    'your@email.com',
                keyboardType:   'email-address',
                autoCapitalize: 'none',
                autoCorrect:    false,
                returnKeyType:  'next',
                value:          email,
                onChangeText:   setEmail,
              }}
            />

            {/* Password */}
            <InputField
              label="Password"
              icon="lock-closed-outline"
              inputProps={{
                placeholder:     'Enter your password',
                secureTextEntry: !showPass,
                returnKeyType:   'done',
                onSubmitEditing: handleLogin,
                value:           password,
                onChangeText:    setPassword,
              }}
              right={
                <TouchableOpacity onPress={togglePassword} style={styles.eyeBtn} hitSlop={8}>
                  <Ionicons
                    name={showPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#FF5C8A', '#FF2A6D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginBtnGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={18} color="#fff" />
                    <Text style={styles.loginBtnText}>SIGN IN</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Info note */}
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.infoText}>
                Your role is detected automatically from your credentials.
              </Text>
            </View>

          </View>

          {/* ── Support Card ── */}
          <SupportCard />

          {/* ── Google Play Policy: Footer with Privacy Policy & Terms Links ── */}
          <View style={styles.policyFooter}>
            <TouchableOpacity onPress={() => navigation.navigate('Privacy')} hitSlop={8}>
              <Text style={styles.policyLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.policyDivider}>•</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')} hitSlop={8}>
              <Text style={styles.policyLinkText}>Terms of Service</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Prominent Disclosure on App Launch (Informational consent before login) */}
      <ProminentDisclosureModal
        visible={showIntroDisclosure}
        onAgree={handleIntroAgree}
        onDecline={handleIntroDecline}
        consentNotice="By continuing, you understand that Sakhi Suraksha collects location data during emergencies to protect you. System location permissions will only be requested when you initiate an SOS alert or safety feature."
        agreeText="I Understand"
        declineText="Close"
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Layout
  safe:  { flex: 1, backgroundColor: COLORS.primaryBg },
  flex:  { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  // Header
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 20 },
  logoWrap: {
    width: 84, height: 84, borderRadius: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.primaryBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  logoImg:  { width: '100%', height: '100%' },
  title:    { fontSize: 26, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center' },

  // Role strip
  roleStripWrap: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.primaryBorder,
    borderRadius: 20, padding: 16, marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  roleStripHeading: {
    fontSize: 11, fontWeight: '900', color: COLORS.textDark,
    textTransform: 'uppercase', letterSpacing: 0.8,
    textAlign: 'center', marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 10,
  },
  roleChip: { flex: 1, alignItems: 'center', gap: 4 },
  roleChipIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  roleChipLabel: { fontSize: 9, fontWeight: '800', textAlign: 'center', letterSpacing: 0.3 },
  roleStripNote: {
    fontSize: 10, fontWeight: '600', color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 15,
  },

  // Error banner
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF0F3',
    borderWidth: 1.5, borderColor: COLORS.primaryBorder,
    borderRadius: 14, padding: 12, marginBottom: 16,
  },
  errorText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, flex: 1 },

  // Form
  form:      { gap: 16 },
  fieldWrap: {},
  label: {
    fontSize: 11, fontWeight: '800', color: COLORS.textDark,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.primaryBorder,
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  inputIcon: { marginRight: 10 },
  input:     { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  eyeBtn:    { padding: 4 },

  // Forgot
  forgotBtn:  { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },

  // Sign-in button
  loginBtn: {
    borderRadius: 999, overflow: 'hidden', marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38, shadowRadius: 20, elevation: 10,
  },
  btnDisabled: { opacity: 0.65 },
  loginBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 17,
  },
  loginBtnText: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  // Info note
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginTop: -4,
  },
  infoText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, flex: 1 },

  // Support card
  supportCard: {
    marginTop: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.primaryBorder,
    borderRadius: 20, padding: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  supportIcon:  { marginBottom: 8 },
  supportTitle: { fontSize: 13, fontWeight: '900', color: COLORS.textDark, textAlign: 'center', marginBottom: 4 },
  supportSub:   { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, textAlign: 'center', lineHeight: 16, marginBottom: 14 },
  supportBtnsRow: { flexDirection: 'row', gap: 10, width: '100%' },
  callBtn: {
    flex: 1, backgroundColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  whatsappBtn: {
    flex: 1, backgroundColor: '#25D366',
    borderRadius: 12, paddingVertical: 11,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  supportBtnText: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  policyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  policyLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  policyDivider: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
