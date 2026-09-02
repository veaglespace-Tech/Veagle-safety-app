import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

import { apiClient } from '../../api/apiClient';

export default function HelpContactScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    try {
      await apiClient.post('/contact', {
        fullName: name,
        email,
        phone,
        subject: subject || 'General Inquiry',
        message
      });
      Alert.alert("Message Sent", "We will get back to you within 24 hours.");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.error || "Failed to submit inquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.subtitle}>Have a question or facing an issue? Send us a message.</Text>

          <Text style={styles.inputLabel}>Name *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Jane Doe" 
            placeholderTextColor={COLORS.textMuted} 
            value={name}
            onChangeText={setName}
          />
          
          <Text style={styles.inputLabel}>Email *</Text>
          <TextInput 
            style={styles.input} 
            placeholder="jane@example.com" 
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.inputLabel}>Phone (Optional)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="+91 98765 43210" 
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.inputLabel}>Subject</Text>
          <TextInput 
            style={styles.input} 
            placeholder="E.g. App crashing" 
            placeholderTextColor={COLORS.textMuted} 
            value={subject}
            onChangeText={setSubject}
          />

          <Text style={styles.inputLabel}>Message *</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            placeholder="Describe your issue..." 
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Ticket</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>How does the SOS siren work?</Text>
            <Text style={styles.faqA}>Pressing the SOS button instantly plays a loud alarm and notifies your guardians with live tracking.</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.faqItem}>
            <Text style={styles.faqQ}>Can I add more than 5 guardians?</Text>
            <Text style={styles.faqA}>Yes, upgrading to the Sakhi Suraksha 365 plan allows you to add up to 10 guardians.</Text>
          </View>
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
  scroll: { padding: 16, gap: 20 },

  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.primaryBorder, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 20, fontWeight: '900', color: COLORS.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, marginBottom: 20 },

  inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  input: { backgroundColor: COLORS.primaryBg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.primaryBorder, marginBottom: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },

  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, marginTop: 8 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '900' },

  faqTitle: { fontSize: 16, fontWeight: '900', color: COLORS.textDark, marginLeft: 4 },
  faqItem: { gap: 6 },
  faqQ: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  faqA: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted, lineHeight: 20 },
  divider: { height: 1, backgroundColor: COLORS.primaryBorder, marginVertical: 16 },
});
