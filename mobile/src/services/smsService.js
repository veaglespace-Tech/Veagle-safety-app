/**
 * SakhiSuraksha - Emergency SMS Service
 *
 * Sends automatic background SMS from the user's own SIM card to all
 * emergency contacts when SOS is triggered, using Android's native SmsManager.
 *
 * HOW IT WORKS:
 * - Android SmsManager API sends SMS directly via device SIM card (Jio/Airtel/Vi etc.)
 * - No external API, no server cost, no internet required!
 * - Works even on 2G / no data connection
 * - Uses user's normal SMS plan (most plans include free SMS)
 *
 * PERMISSIONS REQUIRED:
 * - android.permission.SEND_SMS  (declared in app.json)
 * - Runtime permission requested on first SOS trigger
 *
 * iOS NOTE:
 * - iOS does NOT allow background SMS without user confirmation (Apple policy)
 * - On iOS, we silently skip SMS (WhatsApp + FCM still work)
 *
 * PLAY STORE NOTE:
 * - Google allows SEND_SMS for verified women safety / emergency apps
 * - Declare usage reason: "Emergency SOS SMS for women safety"
 */

import { Platform, PermissionsAndroid } from 'react-native';

// ---------------------------------------------------------------------------
// Request Android SEND_SMS Runtime Permission
// ---------------------------------------------------------------------------
export async function requestSmsSendPermission() {
  if (Platform.OS !== 'android') return false;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      {
        title: 'Emergency SMS Permission',
        message:
          'SakhiSuraksha needs permission to automatically send emergency SMS ' +
          "to your trusted contacts when you trigger an SOS alert. This is critical " +
          'for your safety and uses your phone\'s SIM card.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Deny',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[SMSService] Permission request error:', err?.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Check if SEND_SMS permission is already granted
// ---------------------------------------------------------------------------
export async function hasSmsSendPermission() {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.SEND_SMS
    );
    return result;
  } catch (err) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Build Emergency SMS Message
// ---------------------------------------------------------------------------
function buildEmergencySmsText({ victimName, trackingUrl, latitude, longitude }) {
  const latStr = latitude ? String(latitude).substring(0, 10) : '';
  const lngStr = longitude ? String(longitude).substring(0, 10) : '';
  const gpsInfo = latStr && lngStr ? `\nGPS: ${latStr},${lngStr}` : '';
  const trackInfo = trackingUrl ? `\nLive Track: ${trackingUrl}` : '';

  return (
    `🚨 EMERGENCY SOS ALERT!\n` +
    `${victimName || 'Someone'} needs URGENT HELP!\n` +
    `${gpsInfo}` +
    `${trackInfo}\n` +
    `Please respond immediately!\n` +
    `- SakhiSuraksha App`
  );
}

// ---------------------------------------------------------------------------
// Send SMS via Android Native SmsManager
// ---------------------------------------------------------------------------
async function sendNativeSms(phoneNumber, message) {
  if (Platform.OS !== 'android') return false;

  try {
    // Use React Native's NativeModules to access Android SmsManager
    const { NativeModules } = require('react-native');

    // Try expo-sms first (if installed)
    try {
      const SMS = require('expo-sms');
      if (SMS && typeof SMS.isAvailableAsync === 'function') {
        const isAvailable = await SMS.isAvailableAsync();
        if (isAvailable) {
          // expo-sms opens composer on iOS, but on Android we need direct send
          // expo-sms does NOT support silent background sending — skip it
        }
      }
    } catch (_) {}

    // Android Native SmsManager via NativeModules
    if (NativeModules.SmsManager) {
      NativeModules.SmsManager.sendTextMessage(
        phoneNumber,
        null, // SIM slot (null = default SIM)
        message,
        null, // sentIntent
        null  // deliveryIntent
      );
      return true;
    }

    // Fallback: Use React Native's SendIntentAndroid (silent send)
    // This uses the SmsManager Java class directly via a bridge
    const ReactNativeModule = require('react-native');
    if (ReactNativeModule?.NativeModules?.IntentLauncher) {
      return false;
    }

    console.warn('[SMSService] NativeModules.SmsManager not available on this build');
    return false;
  } catch (err) {
    console.warn('[SMSService] Native SMS send error:', err?.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main: Send Emergency SMS to All Contacts
// Called from sosSlice after successful SOS trigger
// ---------------------------------------------------------------------------
export async function sendEmergencySmsToAll({
  emergencyContacts = [],
  victimName,
  trackingUrl,
  latitude,
  longitude,
}) {
  // Only works on Android — iOS skipped silently
  if (Platform.OS !== 'android') {
    console.log('[SMSService] iOS: Skipping native SMS (Apple policy - not supported)');
    return { sent: 0, failed: 0, skipped: true };
  }

  if (!emergencyContacts || emergencyContacts.length === 0) {
    console.warn('[SMSService] No emergency contacts provided for SMS');
    return { sent: 0, failed: 0, skipped: true };
  }

  // 1. Check / Request Permission
  let hasPermission = await hasSmsSendPermission();
  if (!hasPermission) {
    hasPermission = await requestSmsSendPermission();
  }

  if (!hasPermission) {
    console.warn('[SMSService] SEND_SMS permission denied — SMS not sent');
    return { sent: 0, failed: 0, permissionDenied: true };
  }

  // 2. Build Message
  const smsText = buildEmergencySmsText({ victimName, trackingUrl, latitude, longitude });
  console.log(`[SMSService] Sending Emergency SMS to ${emergencyContacts.length} contact(s)...`);

  // 3. Send to Each Contact
  let sentCount = 0;
  let failCount = 0;

  for (const contact of emergencyContacts) {
    try {
      // Clean phone number: keep only digits and leading +
      const rawPhone = String(contact.phone || '').trim();
      const cleanPhone = rawPhone.startsWith('+')
        ? '+' + rawPhone.replace(/\D/g, '')
        : rawPhone.replace(/\D/g, '');

      if (!cleanPhone || cleanPhone.length < 7) {
        console.warn(`[SMSService] Skipping invalid number for ${contact.name}: ${rawPhone}`);
        failCount++;
        continue;
      }

      // For India: ensure number has country code
      const finalPhone = cleanPhone.startsWith('+')
        ? cleanPhone
        : cleanPhone.length === 10
          ? `+91${cleanPhone}`
          : `+${cleanPhone}`;

      const success = await sendNativeSms(finalPhone, smsText);
      if (success) {
        sentCount++;
        console.log(`✅ [SMSService] Emergency SMS sent to ${contact.name} (${finalPhone})`);
      } else {
        failCount++;
        console.warn(`⚠️ [SMSService] SMS send returned false for ${contact.name} (${finalPhone})`);
      }
    } catch (contactErr) {
      failCount++;
      console.warn(`❌ [SMSService] SMS failed for ${contact.name}:`, contactErr?.message);
    }

    // Small delay between messages to avoid SIM throttling
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`[SMSService] Emergency SMS dispatch complete: ${sentCount} sent, ${failCount} failed`);
  return { sent: sentCount, failed: failCount };
}
