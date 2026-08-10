import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Switch, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUser, updateProfileSettings, logoutUser } from '../../redux/slices/authSlice';
import { COLORS } from '../../theme/colors';
import { BLOOD_GROUPS, EMERGENCY_RELATIONS } from '../../utils/constants';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincode, setPincode] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('Parent');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || '');
      setPhone(user.phone || '');
      setBloodGroup(user.bloodGroup || 'O+');
      setAddress(user.address || '');
      setCity(user.city || '');
      setStateVal(user.state || '');
      setPincode(user.pincode || '');
      setEmergencyContactName(user.emergencyContactName || '');
      setEmergencyContactPhone(user.emergencyContactPhone || '');
      setEmergencyContactRelation(user.emergencyContactRelation || 'Parent');
    }
  }, [user]);

  const handleSave = async () => {
    const result = await dispatch(updateProfileSettings({
      fullName, phone, bloodGroup, address, city,
      state: stateVal, pincode, emergencyContactName,
      emergencyContactPhone, emergencyContactRelation,
    }));
    if (updateProfileSettings.fulfilled.match(result)) {
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        dispatch(logoutUser());
      }
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) },
      ]);
    }
  };

  const firstName = (user?.fullName || user?.name || 'User').split(' ')[0];
  const subscriptionActive = user?.subscriptionStatus === 'ACTIVE';

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* PROFILE HEADER */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.fullName || user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || ''}</Text>
            <View style={[styles.subChip, !subscriptionActive && styles.subChipInactive]}>
              <Ionicons name={subscriptionActive ? 'shield-checkmark' : 'shield-outline'} size={12} color={subscriptionActive ? COLORS.success : COLORS.textMuted} />
              <Text style={[styles.subChipText, !subscriptionActive && styles.subChipTextInactive]}>
                {subscriptionActive ? 'Subscription Active' : 'No Active Plan'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
            <Ionicons name={isEditing ? 'close' : 'create-outline'} size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {saved && (
          <View style={styles.savedBanner}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
            <Text style={styles.savedBannerText}>Profile updated successfully!</Text>
          </View>
        )}

        {/* PERSONAL INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {isEditing ? (
            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <TextInput style={styles.fieldInput} value={fullName} onChangeText={setFullName} placeholder="Your full name" placeholderTextColor={COLORS.primaryBorder} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Phone</Text>
                <TextInput style={styles.fieldInput} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" placeholderTextColor={COLORS.primaryBorder} keyboardType="phone-pad" />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Blood Group</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {BLOOD_GROUPS.map(bg => (
                    <TouchableOpacity key={bg} onPress={() => setBloodGroup(bg)}
                      style={[styles.pill, bloodGroup === bg && styles.pillActive]}>
                      <Text style={[styles.pillText, bloodGroup === bg && styles.pillTextActive]}>{bg}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={{ gap: 2 }}>
              <InfoRow icon="person-outline" label="Full Name" value={user?.fullName || user?.name} />
              <InfoRow icon="mail-outline" label="Email" value={user?.email} />
              <InfoRow icon="call-outline" label="Phone" value={user?.phone} />
              <InfoRow icon="heart-outline" label="Blood Group" value={user?.bloodGroup} />
              <InfoRow icon="location-outline" label="City" value={user?.city} />
            </View>
          )}
        </View>

        {/* LOCATION INFO (editing only) */}
        {isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput style={styles.fieldInput} value={address} onChangeText={setAddress} placeholder="Street address" placeholderTextColor={COLORS.primaryBorder} />
              </View>
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput style={styles.fieldInput} value={city} onChangeText={setCity} placeholder="Mumbai" placeholderTextColor={COLORS.primaryBorder} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>State</Text>
                  <TextInput style={styles.fieldInput} value={stateVal} onChangeText={setStateVal} placeholder="Maharashtra" placeholderTextColor={COLORS.primaryBorder} />
                </View>
              </View>
              <View>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <TextInput style={styles.fieldInput} value={pincode} onChangeText={setPincode} placeholder="400001" placeholderTextColor={COLORS.primaryBorder} keyboardType="numeric" />
              </View>
            </View>
          </View>
        )}

        {/* EMERGENCY CONTACT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          {isEditing ? (
            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.fieldLabel}>Contact Name</Text>
                <TextInput style={styles.fieldInput} value={emergencyContactName} onChangeText={setEmergencyContactName} placeholder="Parent / Guardian name" placeholderTextColor={COLORS.primaryBorder} />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Contact Phone</Text>
                <TextInput style={styles.fieldInput} value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} placeholder="+91 98765 00000" placeholderTextColor={COLORS.primaryBorder} keyboardType="phone-pad" />
              </View>
              <View>
                <Text style={styles.fieldLabel}>Relationship</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {EMERGENCY_RELATIONS.map(r => (
                    <TouchableOpacity key={r} onPress={() => setEmergencyContactRelation(r)}
                      style={[styles.pill, emergencyContactRelation === r && styles.pillActive]}>
                      <Text style={[styles.pillText, emergencyContactRelation === r && styles.pillTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={{ gap: 2 }}>
              <InfoRow icon="person-add-outline" label="Contact Name" value={user?.emergencyContactName} />
              <InfoRow icon="call-outline" label="Contact Phone" value={user?.emergencyContactPhone} />
              <InfoRow icon="people-outline" label="Relationship" value={user?.emergencyContactRelation} />
            </View>
          )}
        </View>

        {/* SAVE BUTTON */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.saveBtnText}>SAVE PROFILE</Text>
            }
          </TouchableOpacity>
        )}

        {/* QUICK LINKS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Subscription')} activeOpacity={0.8}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            <Text style={styles.linkText}>Subscription & Plans</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, styles.logoutRow]} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
            <Text style={[styles.linkText, { color: COLORS.primary }]}>Logout</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },

  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.surface, borderWidth: 2, borderColor: COLORS.primaryBorder, borderRadius: 24, padding: 18, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 5 },
  avatarWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#fff' },
  profileName: { fontSize: 17, fontWeight: '900', color: COLORS.textDark },
  profileEmail: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2 },
  subChip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#86EFAC', alignSelf: 'flex-start' },
  subChipText: { fontSize: 10, fontWeight: '800', color: COLORS.success },
  subChipInactive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primaryBorder },
  subChipTextInactive: { color: COLORS.textMuted },
  editBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },

  savedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#86EFAC', borderRadius: 14, padding: 12 },
  savedBannerText: { fontSize: 13, fontWeight: '700', color: COLORS.success },

  section: { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 22, padding: 18, gap: 12, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBg },
  infoIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginTop: 2 },

  fieldLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  fieldInput: { backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, fontSize: 13, fontWeight: '600', color: COLORS.textDark },
  rowInputs: { flexDirection: 'row', gap: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: COLORS.primaryBorder, backgroundColor: COLORS.surface, marginRight: 7 },
  pillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillText: { fontSize: 12, fontWeight: '700', color: COLORS.textDark },
  pillTextActive: { color: '#fff' },

  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 17, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.38, shadowRadius: 18, elevation: 8 },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnText: { fontSize: 14, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.primaryBg },
  logoutRow: { borderBottomWidth: 0 },
  linkText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textDark },
});
