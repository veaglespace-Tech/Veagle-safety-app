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
// 5. iOS: Pre-filled Native SMS Composer (User taps 'Send')
// ---------------------------------------------------------------------------

async function sendIosSmsComposer(phoneNumbers, message) {
  if (Platform.OS !== 'ios') return false;
  if (!phoneNumbers || phoneNumbers.length === 0) return false;

  console.log(`📱 [SMSService] Opening iOS SMS Composer for ${phoneNumbers.length} contact(s)...`);

  // Option A: Try official expo-sms (MFMessageComposeViewController in-app modal)
  try {
    const SMS = require('expo-sms');
    if (SMS && typeof SMS.isAvailableAsync === 'function') {
      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        const result = await SMS.sendSMSAsync(phoneNumbers, message);
        console.log('📱 [SMSService] iOS expo-sms completed:', result);
        return result?.result === 'sent';
      }
    }
  } catch (expoSmsErr) {
    console.warn('[SMSService] expo-sms iOS notice:', expoSmsErr?.message);
  }

  // Option B: Fallback to iOS system sms: URL scheme
  try {
    // iOS scheme: sms:number1,number2&body=message
    const joined = phoneNumbers.join(',');
    const url = `sms:${joined}&body=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url);
      console.log('📱 [SMSService] iOS SMS URL scheme opened successfully');
      return true;
    }
  } catch (linkErr) {
    console.warn('[SMSService] iOS SMS URL scheme fallback error:', linkErr?.message);
  }

  return false;
}

// ---------------------------------------------------------------------------
// 6. Master Dispatcher: sendEmergencySmsToAll
// Called from sosSlice when SOS is triggered
// ---------------------------------------------------------------------------

export async function sendEmergencySmsToAll({
  emergencyContacts = [],
  victimName,
  trackingUrl,
  latitude,
  longitude,
}) {
  if (Platform.OS === 'web') {
    return { sent: 0, failed: 0, skipped: true };
  }

  if (!emergencyContacts || emergencyContacts.length === 0) {
    console.warn('[SMSService] No emergency contacts available for SMS');
    return { sent: 0, failed: 0, skipped: true };
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
    return { sent: 0, failed: 0, skipped: true };
  }

  const messageText = buildEmergencySmsText({
    victimName,
    trackingUrl,
    latitude,
    longitude,
  });

  // -------------------------------------------------------------------------
  // A. iOS ROUTE: Pre-filled composer (User taps 'Send')
  // -------------------------------------------------------------------------
  if (Platform.OS === 'ios') {
    const phoneList = validContacts.map((c) => c.phone);
    const success = await sendIosSmsComposer(phoneList, messageText);
    return {
      sent: success ? phoneList.length : 0,
      failed: success ? 0 : phoneList.length,
      platform: 'ios',
    };
  }

  // -------------------------------------------------------------------------
  // B. ANDROID ROUTE: 100% Silent Background SMS via SIM
  // -------------------------------------------------------------------------
  let hasPermission = await hasSmsSendPermission();
  if (!hasPermission) {
    hasPermission = await requestSmsSendPermission();
  }

  if (!hasPermission) {
    console.warn('⚠️ [SMSService] Android SEND_SMS permission denied — cannot send silent background SMS');
    return { sent: 0, failed: validContacts.length, permissionDenied: true, platform: 'android' };
  }

  console.log(`📱 [SMSService] Sending silent background SMS to ${validContacts.length} Android contact(s)...`);

  let sentCount = 0;
  let failCount = 0;

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

  console.log(`📱 [SMSService] Android background SMS completed: ${sentCount} sent, ${failCount} failed`);
  return { sent: sentCount, failed: failCount, platform: 'android' };
}
