/**
 * SakhiSuraksha - Emergency SMS Service
 *
 * HYBRID SOS SMS ARCHITECTURE:
 *
 * 1. ANDROID (100% Automatic Background SMS via SIM):
 *    - Uses native SmsManager (via local Expo DirectSms module)
 *    - Sends silently in the background from device SIM card (Jio / Airtel / Vi etc.)
 *    - Requires android.permission.SEND_SMS (requested at runtime)
 *    - No server cost, no API key, works offline / on 2G data
 *
 * 2. iOS (1-Tap Pre-filled Native Composer - User taps 'Send'):
 *    - iOS Apple policy blocks silent background SMS
 *    - Automatically opens native iOS Messages composer (expo-sms / Linking fallback)
 *    - Pre-fills all emergency contact numbers in "To:"
 *    - Pre-fills SOS message + live GPS coordinates + tracking URL
 *    - User just taps the Send arrow ("ios la mi send karan")
 */

import { Platform, PermissionsAndroid, Linking } from 'react-native';

// ---------------------------------------------------------------------------
// 1. Android Permission Helpers
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
          'to your trusted contacts from your SIM card when you trigger an SOS alert.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Deny',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn('[SMSService] Android permission request error:', err?.message);
    return false;
  }
}

export async function hasSmsSendPermission() {
  if (Platform.OS !== 'android') return false;
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
  } catch (err) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 2. Build Emergency SMS Message Content
// ---------------------------------------------------------------------------

export function buildEmergencySmsText({ victimName, trackingUrl, latitude, longitude }) {
  const latStr = latitude ? String(latitude).substring(0, 10) : '';
  const lngStr = longitude ? String(longitude).substring(0, 10) : '';
  const gpsInfo = latStr && lngStr ? `\n📍 GPS: ${latStr}, ${lngStr}` : '';
  const trackInfo = trackingUrl ? `\n👉 Live Track: ${trackingUrl}` : '';

  return (
    `🚨 EMERGENCY SOS ALERT!\n` +
    `${victimName || 'Sakhi Suraksha User'} activated Emergency SOS and needs URGENT HELP!` +
    `${gpsInfo}` +
    `${trackInfo}\n` +
    `Please respond or call immediately!\n` +
    `- SakhiSuraksha Safety System`
  );
}

// ---------------------------------------------------------------------------
// 3. Format & Sanitize Phone Number (+91 default for India)
// ---------------------------------------------------------------------------

export function sanitizePhoneNumber(phone) {
  if (!phone) return '';
  const raw = String(phone).trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits || digits.length < 7) return '';

  if (raw.startsWith('+')) {
    return '+' + digits;
  }
  // If 10 digits (standard Indian mobile number), prepend +91
  if (digits.length === 10) {
    return '+91' + digits;
  }
  return '+' + digits;
}

// ---------------------------------------------------------------------------
// 4. Android: Native Direct SMS Sender (SIM Card Background)
// ---------------------------------------------------------------------------

async function sendAndroidDirectSms(phoneNumber, message) {
  if (Platform.OS !== 'android') return false;

  try {
    // 1. Try our local native Expo module (DirectSms)
    try {
      const { sendDirectSms } = require('../../modules/direct-sms');
      if (typeof sendDirectSms === 'function') {
        const result = await sendDirectSms(phoneNumber, message);
        if (result) return true;
      }
    } catch (_) {}

    // 2. Try NativeModules.SmsManager bridge if available
    const { NativeModules } = require('react-native');
    if (NativeModules?.SmsManager?.sendTextMessage) {
      NativeModules.SmsManager.sendTextMessage(phoneNumber, null, message, null, null);
      return true;
    }

    console.warn('[SMSService] Android direct SMS native module not available');
    return false;
  } catch (err) {
    console.warn('[SMSService] Android direct SMS error for ' + phoneNumber + ':', err?.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 5. Universal Pre-filled Native SMS Composer (1-Tap 'Send' for iOS & Android Fallback)
// ---------------------------------------------------------------------------

export async function openUniversalSmsComposer(phoneNumbers, message) {
  if (!phoneNumbers || phoneNumbers.length === 0) return false;

  console.log(`📱 [SMSService] Opening Universal SMS Composer for ${phoneNumbers.length} contact(s)...`);

  // Option A: Try official expo-sms (native composer on both Android & iOS)
  try {
    const SMS = require('expo-sms');
    if (SMS && typeof SMS.isAvailableAsync === 'function') {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const result = await SMS.sendSMSAsync(phoneNumbers, message);
        console.log('📱 [SMSService] expo-sms completed:', result);
        return result?.result === 'sent';
      }
    }
  } catch (expoSmsErr) {
    console.warn('[SMSService] expo-sms notice:', expoSmsErr?.message);
  }

  // Option B: Fallback to system sms: URL scheme
  try {
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const joined = phoneNumbers.join(Platform.OS === 'ios' ? ',' : ';');
    const url = `sms:${joined}${separator}body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
      console.log('📱 [SMSService] System SMS URL scheme opened successfully');
      return true;
    }
  } catch (linkErr) {
    console.warn('[SMSService] SMS URL scheme fallback error:', linkErr?.message);
  }

  return false;
}

// ---------------------------------------------------------------------------
// 6. Master Dispatcher: sendEmergencySmsToAll
// Called from sosSlice when SOS is triggered and from ActiveSOSScreen button
// ---------------------------------------------------------------------------

export async function sendEmergencySmsToAll({
  emergencyContacts = [],
  victimName,
  trackingUrl,
  latitude,
  longitude,
  delayMs = 0,
  forceComposer = false,
}) {
  if (Platform.OS === 'web') {
    return { sent: 0, failed: 0, skipped: true };
  }

  // Optional delay to prevent UI / modal presentation clashes with external apps (e.g. on iOS)
  if (delayMs > 0) {
    await new Promise((res) => setTimeout(res, delayMs));
  }

  if (!emergencyContacts || emergencyContacts.length === 0) {
    console.warn('[SMSService] No emergency contacts available for SMS');
    return { sent: 0, failed: 0, skipped: true, error: 'NO_CONTACTS' };
  }

  // Sanitize all phone numbers
  const validContacts = emergencyContacts
    .map((c) => ({
      name: c.name || 'Emergency Contact',
      phone: sanitizePhoneNumber(c.phone),
    }))
    .filter((c) => c.phone && c.phone.length >= 8);

  if (validContacts.length === 0) {
    console.warn('[SMSService] No valid formatted phone numbers found in emergency contacts');
    return { sent: 0, failed: 0, skipped: true, error: 'INVALID_NUMBERS' };
  }

  const messageText = buildEmergencySmsText({
    victimName,
    trackingUrl,
    latitude,
    longitude,
  });

  const phoneList = validContacts.map((c) => c.phone);

  // -------------------------------------------------------------------------
  // A. iOS ROUTE OR FORCE COMPOSER: Pre-filled composer (User taps 'Send')
  // -------------------------------------------------------------------------
  if (Platform.OS === 'ios' || forceComposer) {
    const success = await openUniversalSmsComposer(phoneList, messageText);
    return {
      sent: success ? phoneList.length : 0,
      failed: success ? 0 : phoneList.length,
      platform: Platform.OS,
      mode: 'composer',
    };
  }

  // -------------------------------------------------------------------------
  // B. ANDROID ROUTE:
  // Step 1: Try 100% Silent Background SMS via SIM card
  // Step 2: If rejected by OS/Carrier/Permission, immediately launch Universal Composer!
  // -------------------------------------------------------------------------
  let hasPermission = await hasSmsSendPermission();
  if (!hasPermission) {
    hasPermission = await requestSmsSendPermission();
  }

  let sentCount = 0;
  let failCount = 0;

  if (hasPermission) {
    console.log(`📱 [SMSService] Attempting silent background SMS to ${validContacts.length} Android contact(s)...`);

    for (const contact of validContacts) {
      try {
        const ok = await sendAndroidDirectSms(contact.phone, messageText);
        if (ok) {
          sentCount++;
          console.log(`✅ [SMSService] Background SMS dispatched to ${contact.name} (${contact.phone})`);
        } else {
          failCount++;
          console.warn(`⚠️ [SMSService] Background SMS returned false for ${contact.name} (${contact.phone})`);
        }
      } catch (err) {
        failCount++;
        console.warn(`❌ [SMSService] SMS failed for ${contact.name}:`, err?.message);
      }

      // 300ms throttle between sequential messages to avoid SIM modem saturation
      await new Promise((res) => setTimeout(res, 300));
    }
  }

  // -------------------------------------------------------------------------
  // SMART FAILOVER: If silent background failed or was blocked by Samsung/Carrier,
  // automatically launch the pre-filled Native SMS app (iPhone-style 1-tap send)!
  // -------------------------------------------------------------------------
  if (sentCount === 0) {
    console.log('🔄 [SMSService] Background SMS was blocked or failed — launching 1-tap Native SMS Composer fallback for all devices...');
    const opened = await openUniversalSmsComposer(phoneList, messageText);
    return {
      sent: opened ? phoneList.length : 0,
      failed: opened ? 0 : phoneList.length,
      platform: 'android',
      mode: 'fallback_composer',
      permissionDenied: !hasPermission,
    };
  }

  console.log(`📱 [SMSService] Android background SMS completed: ${sentCount} sent, ${failCount} failed`);
  return { sent: sentCount, failed: failCount, platform: 'android', mode: 'background' };
}
