import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthMessages } from '../../redux/slices/authSlice';
import { COLORS } from '../../theme/colors';
import { BLOOD_GROUPS, EMERGENCY_RELATIONS } from '../../utils/constants';

export default function RegisterScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Parent');
  const [parentEmail, setParentEmail] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password) {
      Alert.alert('Required Fields', 'Please fill in all required fields.');
      return;
    }
    dispatch(clearAuthMessages());
    const payload = {
      fullName, email, phone, password,
      bloodGroup, address, city, state, pincode,
      emergencyContactName, emergencyContactRelation,
      emergencyContactPhone, parentEmail,
    };
    const result = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(result)) {
      navigation.navigate('OTP', { email, mode: 'register' });
    }
  };

  const InputField = ({ label, icon, value, onChangeText, placeholder, keyboardType, secureTextEntry, right, flex }) => (
    <View style={[styles.fieldWrap, flex && { flex: flex }]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Ionicons name={icon} size={17} color={COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, right && { paddingRight: 32 }]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.primaryBorder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        />
        {right}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* TOP BAR */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrap}>
              <Image source={require('../../../assets/logo.jpeg')} style={styles.headerLogo} />
              <Text style={styles.pageTitle}>Create Account</Text>
            </View>
          </View>

          {/* SINGLE MAIN FORM CARD */}
          <View style={styles.mainCard}>
            
            {/* SECTION 1 */}
            <View style={styles.sectionHeader}>
              <Ionicons name="person" size={16} color={COLORS.primary} />
              <Text style={styles.sectionHead}>Personal Information</Text>
            </View>
            <View style={styles.formGap}>
              <InputField label="Full Name *" icon="person-outline" value={fullName} onChangeText={setFullName} placeholder="e.g. Priya Sharma" />
              <InputField label="Email Address *" icon="mail-outline" value={email} onChangeText={setEmail} placeholder="priya@example.com" keyboardType="email-address" />
              <InputField label="Mobile Number *" icon="call-outline" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" />
              
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={17} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Create strong password"
                    placeholderTextColor={COLORS.primaryBorder}
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* DIVIDER */}
            <View style={styles.divider} />

            {/* SECTION 2 */}
            <View style={styles.sectionHeader}>
              <Ionicons name="medkit" size={16} color={COLORS.primary} />
              <Text style={styles.sectionHead}>Medical & Location</Text>
            </View>
            <View style={styles.formGap}>
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Blood Group</Text>
                <View style={styles.pillsWrap}>
                  {BLOOD_GROUPS.map(bg => (
                    <TouchableOpacity key={bg} onPress={() => setBloodGroup(bg)}
                      style={[styles.pill, bloodGroup === bg && styles.pillActive]}>
                      <Text style={[styles.pillText, bloodGroup === bg && styles.pillTextActive]}>{bg}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <InputField label="Address" icon="home-outline" value={address} onChangeText={setAddress} placeholder="Street address" />
              
              <View style={styles.twoColRow}>
                <InputField label="City" icon="location-outline" value={city} onChangeText={setCity} placeholder="Mumbai" flex={1} />
                <InputField label="State" icon="map-outline" value={state} onChangeText={setState} placeholder="Maharashtra" flex={1} />
              </View>

              <InputField label="Pincode" icon="pin-outline" value={pincode} onChangeText={setPincode} placeholder="400001" keyboardType="numeric" />
            </View>

            {/* DIVIDER */}
            <View style={styles.divider} />

            {/* SECTION 3 */}
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
              <Text style={styles.sectionHead}>Emergency Contact</Text>
            </View>
            <View style={styles.formGap}>
              <InputField label="Contact Name" icon="person-add-outline" value={emergencyContactName} onChangeText={setEmergencyContactName} placeholder="Parent / Guardian name" />
              <InputField label="Contact Phone" icon="call-outline" value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} placeholder="+91 98765 00000" keyboardType="phone-pad" />
              <InputField label="Parent/Guardian Email" icon="mail-outline" value={parentEmail} onChangeText={setParentEmail} placeholder="parent@example.com" keyboardType="email-address" />
              
              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Relationship</Text>
                <View style={styles.pillsWrap}>
                  {EMERGENCY_RELATIONS.map(r => (
                    <TouchableOpacity key={r} onPress={() => setEmergencyContactRelation(r)}
                      style={[styles.pill, emergencyContactRelation === r && styles.pillActive]}>
                      <Text style={[styles.pillText, emergencyContactRelation === r && styles.pillTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.primary} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.registerBtn, isLoading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.registerBtnText}>CREATE ACCOUNT</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>Already registered? <Text style={styles.loginBold}>Sign In</Text></Text>
            </TouchableOpacity>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 28, height: 28, borderRadius: 8 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textDark, letterSpacing: -0.5 },

  mainCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderRadius: 24,
    padding: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
    gap: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sectionHead: { fontSize: 12, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.8 },

  divider: { height: 1, backgroundColor: COLORS.primaryBorder, marginVertical: 4 },

  formGap: { gap: 12 },
  twoColRow: { flexDirection: 'row', gap: 10 },
  fieldWrap: {},
  label: { fontSize: 10, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    paddingVertical: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },

  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.primaryBorder, backgroundColor: COLORS.surface },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  pillTextActive: { color: '#fff' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F3', borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 14, padding: 12, marginTop: 4 },
  errorText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, flex: 1 },

  registerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.65 },
  registerBtnText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  loginLink: { alignItems: 'center', paddingVertical: 8 },
  loginLinkText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  loginBold: { fontWeight: '800', color: COLORS.primary },
});
