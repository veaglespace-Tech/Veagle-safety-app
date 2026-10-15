import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../theme/colors';

/**
 * ProminentDisclosureModal
 * 
 * Google Play Store Compliant Pre-Permission Prominent Disclosure & Consent Dialog.
 *
 * Requirements:
 * 1. Must be shown BEFORE triggering native Android runtime permission prompts.
 * 2. Mandatory exact copy explaining collection and purpose.
 * 3. Clear affirmative action buttons ("Agree" and "Decline").
 * 4. Dismisses without triggering native prompt if user taps "Decline".
 */
export default function ProminentDisclosureModal({
  visible = false,
  onAgree,
  onDecline,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <LinearGradient
                colors={['#FFF0F3', '#FFE4EC']}
                style={styles.iconGradient}
              >
                <Ionicons name="location" size={32} color={COLORS.primary} />
                <View style={styles.shieldBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#fff" />
                </View>
              </LinearGradient>
            </View>

            {/* Badge & Title */}
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>PROMINENT DISCLOSURE</Text>
            </View>
            <Text style={styles.title}>Background Location Access</Text>

            {/* Google Play Mandated Exact Copy Box */}
            <View style={styles.disclosureBox}>
              <View style={styles.disclosureHeader}>
                <Ionicons name="information-circle" size={18} color={COLORS.primary} />
                <Text style={styles.disclosureHeading}>Why We Collect This Data</Text>
              </View>
              <Text style={styles.mandatoryCopy}>
                Sakhi Suraksha collects your background location data to share your live whereabouts with trusted contacts and trigger SOS alerts during an emergency. This data is only used for your safety.
              </Text>
            </View>

            {/* Feature Details */}
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <View style={styles.bulletDot}>
                  <Ionicons name="radio" size={14} color={COLORS.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>Continuous SOS Tracking</Text>
                  <Text style={styles.featureDesc}>
                    Transmits your live coordinates to guardians even when the app is minimized or your phone screen is locked during an active SOS.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.bulletDot}>
                  <Ionicons name="lock-closed" size={14} color={COLORS.primary} />
                </View>
                <View style={styles.featureTextWrap}>
                  <Text style={styles.featureTitle}>Strict Safety & Privacy Use Only</Text>
                  <Text style={styles.featureDesc}>
                    Your location is encrypted in transit and is never sold, monetized, or shared with advertisers.
                  </Text>
                </View>
              </View>
            </View>

            {/* Consent Notice */}
            <Text style={styles.consentNotice}>
              By tapping <Text style={styles.boldText}>Agree</Text>, you will be asked by your operating system to grant location access (select &quot;Allow all the time&quot; when prompted). Tapping <Text style={styles.boldText}>Decline</Text> will cancel location features without requesting permissions.
            </Text>

            {/* Action Buttons: "Agree" and "Decline" */}
            <View style={styles.buttonContainer}>
              {/* Affirmative CTA */}
              <TouchableOpacity
                style={styles.agreeButton}
                activeOpacity={0.85}
                onPress={onAgree}
              >
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientBtn}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.agreeButtonText}>Agree</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Decline CTA */}
              <TouchableOpacity
                style={styles.declineButton}
                activeOpacity={0.8}
                onPress={onDecline}
              >
                <Ionicons name="close-circle-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(20, 4, 18, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFCCE1',
    position: 'relative',
  },
  shieldBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeWrap: {
    backgroundColor: '#FFF0F3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFCCE1',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
    marginBottom: 16,
  },
  disclosureBox: {
    width: '100%',
    backgroundColor: '#FFF5F7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FFCCE1',
    marginBottom: 18,
  },
  disclosureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  disclosureHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mandatoryCopy: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 22,
  },
  featuresList: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  consentNotice: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textMuted,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  boldText: {
    fontWeight: '800',
    color: COLORS.textDark,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  agreeButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  agreeButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  declineButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#F8F4F7',
    borderWidth: 1.5,
    borderColor: '#E5D8E3',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
});
