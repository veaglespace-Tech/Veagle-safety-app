import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const PRIMARY_LINES = [
  {
    title: 'National Emergency',
    number: '112',
    desc: 'Unified all-in-one emergency response (Police + Fire + Ambulance)',
    bg: COLORS.primary,
    icon: 'shield-outline',
    badge: '24 / 7',
  },
  {
    title: 'Women Helpline',
    number: '1091',
    desc: 'National helpline for women in distress — trauma, abuse, harassment',
    bg: COLORS.plum,
    icon: 'call',
    badge: 'FREE',
  },
];

const SECONDARY_LINES = [
  { title: 'Ambulance & Medical', number: '108', icon: 'medkit-outline', desc: 'Emergency medical & trauma response' },
  { title: 'Police Direct', number: '100', icon: 'phone-portrait-outline', desc: 'Local police dispatch center' },
  { title: 'Child Helpline', number: '1098', icon: 'chatbubble-outline', desc: 'Child protection & trafficking prevention' },
  { title: 'Cyber Crime', number: '1930', icon: 'globe-outline', desc: 'Online harassment, fraud & stalking' },
];

export default function HelplinesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Emergency Contacts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Single-tap direct dialing to all national emergency services</Text>

        {/* PRIMARY LINES */}
        {PRIMARY_LINES.map((item) => (
          <TouchableOpacity
            key={item.number}
            style={[styles.primaryCard, { backgroundColor: item.bg }]}
            onPress={() => Linking.openURL(`tel:${item.number}`)}
            activeOpacity={0.85}
          >
            <View style={styles.primaryCardLeft}>
              <View style={styles.primaryIconWrap}>
                <Ionicons name={item.icon} size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.primaryTitleRow}>
                  <Text style={styles.primaryCardTitle}>{item.title}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={styles.primaryCardDesc} numberOfLines={2}>{item.desc}</Text>
              </View>
            </View>
            <View style={styles.primaryCardRight}>
              <Text style={styles.primaryNumber}>{item.number}</Text>
              <Text style={styles.tapToCall}>TAP TO CALL</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* DIVIDER */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>More Services</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* SECONDARY LINES */}
        <View style={{ gap: 8 }}>
          {SECONDARY_LINES.map((item) => (
            <TouchableOpacity
              key={item.number}
              style={styles.secondaryCard}
              onPress={() => Linking.openURL(`tel:${item.number}`)}
              activeOpacity={0.85}
            >
              <View style={styles.secondaryIconWrap}>
                <Ionicons name={item.icon} size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.secondaryTitle}>{item.title}</Text>
                <Text style={styles.secondaryDesc}>{item.desc}</Text>
              </View>
              <View style={styles.secondaryRight}>
                <Text style={styles.secondaryNumber}>{item.number}</Text>
                <View style={styles.callIconWrap}>
                  <Ionicons name="call" size={14} color={COLORS.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* NCRB LINK */}
        <View style={styles.ncrbCard}>
          <View>
            <Text style={styles.ncrbTitle}>National Crime Records Bureau</Text>
            <Text style={styles.ncrbDesc}>File online reports for cybercrime, missing persons & more</Text>
          </View>
          <TouchableOpacity
            style={styles.ncrbBtn}
            onPress={() => Linking.openURL('https://cybercrime.gov.in')}
            activeOpacity={0.85}
          >
            <Text style={styles.ncrbBtnText}>Visit</Text>
            <Ionicons name="open-outline" size={14} color="#fff" />
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
  scroll: { paddingHorizontal: 16, paddingBottom: 28, gap: 10 },
  subtitle: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },

  primaryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 22, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14, elevation: 8 },
  primaryCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  primaryIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  primaryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryCardTitle: { fontSize: 14, fontWeight: '900', color: '#fff' },
  badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#fff', letterSpacing: 0.8 },
  primaryCardDesc: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 3, lineHeight: 16 },
  primaryCardRight: { alignItems: 'flex-end', marginLeft: 12 },
  primaryNumber: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  tapToCall: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.primaryBorder },
  dividerText: { fontSize: 9, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

  secondaryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.primaryBorder, borderRadius: 18, padding: 14, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  secondaryIconWrap: { width: 42, height: 42, borderRadius: 13, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },
  secondaryTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  secondaryDesc: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 1 },
  secondaryRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
  secondaryNumber: { fontSize: 17, fontWeight: '900', color: COLORS.primary },
  callIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.primaryBg, borderWidth: 1, borderColor: COLORS.primaryBorder, alignItems: 'center', justifyContent: 'center' },

  ncrbCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.primaryBg, borderWidth: 1.5, borderColor: COLORS.primaryBorder, borderRadius: 18, padding: 14 },
  ncrbTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  ncrbDesc: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginTop: 2, maxWidth: 200 },
  ncrbBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.plum, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  ncrbBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
});
