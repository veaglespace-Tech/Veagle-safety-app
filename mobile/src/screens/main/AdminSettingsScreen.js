import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { settingApi } from '../../api/settingApi';

export default function AdminSettingsScreen() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingApi.fetchSettings();
      if (data && data.success) {
        setSettings(data.data || {});
      } else if (data) {
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Global Settings</Text>
        <TouchableOpacity onPress={fetchSettings} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.infoText}>Settings editing from mobile is coming soon.</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Configuration</Text>
            {Object.keys(settings).length > 0 ? (
              Object.keys(settings).map((key) => (
                <View key={key} style={styles.settingRow}>
                  <Text style={styles.settingKey}>{key}</Text>
                  <Text style={styles.settingValue} numberOfLines={1}>{String(settings[key])}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No settings configured.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  refreshBtn: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingKey: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: COLORS.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
