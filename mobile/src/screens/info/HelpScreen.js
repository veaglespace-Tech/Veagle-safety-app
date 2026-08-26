import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export default function HelpScreen({ navigation }) {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@veagle.com').catch(() => {
      Alert.alert('Error', 'Could not open email client.');
    });
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+18001234567').catch(() => {
      Alert.alert('Error', 'Could not open dialer.');
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Ionicons name="chatbubbles-outline" size={48} color={COLORS.primary} style={{ marginBottom: 12 }} />
          <Text style={styles.title}>How can we help you?</Text>
          <Text style={styles.description}>
            If you have any questions or run into issues with the app, our support team is available 24/7.
          </Text>
        </View>

        <View style={styles.contactContainer}>
          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="mail" size={24} color="#2563EB" />
            </View>
            <View style={styles.contactTextWrap}>
              <Text style={styles.contactTitle}>Email Us</Text>
              <Text style={styles.contactDesc}>support@veagle.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleCallSupport} activeOpacity={0.8}>
            <View style={[styles.iconWrap, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="call" size={24} color="#16A34A" />
            </View>
            <View style={styles.contactTextWrap}>
              <Text style={styles.contactTitle}>Call Support</Text>
              <Text style={styles.contactDesc}>1-800-123-4567</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primaryBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.primaryBorder },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryBg, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, textTransform: 'uppercase', letterSpacing: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  heroSection: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.textDark, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 },
  contactContainer: { gap: 16 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconWrap: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  contactTextWrap: { flex: 1 },
  contactTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  contactDesc: { fontSize: 13, color: COLORS.textMuted },
});
