import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfileSettings } from '../../redux/slices/authSlice';

export default function UserSettingsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [pushEnabled, setPushEnabled] = useState(user?.settings?.pushNotifications !== false);
  const [locationEnabled, setLocationEnabled] = useState(user?.settings?.locationSharing !== false);
  const [sirenEnabled, setSirenEnabled] = useState(user?.settings?.loudSiren === true);

  const handleToggle = async (key, val, setter) => {
    setter(val);
    try {
      await dispatch(updateProfileSettings({ [key]: val })).unwrap();
    } catch (err) {
      setter(!val); // Revert on failure
      Alert.alert("Error", "Failed to update setting");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Push Notifications</Text>
              <Text style={styles.rowSub}>Receive alerts from your guardians</Text>
            </View>
            <Switch value={pushEnabled} onValueChange={(v) => handleToggle('pushNotifications', v, setPushEnabled)} trackColor={{ true: COLORS.primary }} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Privacy & Safety</Text>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Live Location Sharing</Text>
              <Text style={styles.rowSub}>Share GPS with guardians on SOS</Text>
            </View>
            <Switch value={locationEnabled} onValueChange={(v) => handleToggle('locationSharing', v, setLocationEnabled)} trackColor={{ true: COLORS.primary }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Loud Siren Mode</Text>
              <Text style={styles.rowSub}>Play loud alarm during SOS</Text>
            </View>
            <Switch value={sirenEnabled} onValueChange={(v) => handleToggle('loudSiren', v, setSirenEnabled)} trackColor={{ true: COLORS.primary }} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuTitle}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow}>
            <Text style={styles.menuTitle}>Delete Account</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 18, fontWeight: '900', color: COLORS.textDark },
  scroll: { padding: 16, gap: 16 },

  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 13, fontWeight: '900', color: COLORS.primary, marginBottom: 16, letterSpacing: 0.5 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, marginBottom: 2 },
  rowSub: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.primaryBorder, marginVertical: 16 },

  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  menuTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textDark },
});
