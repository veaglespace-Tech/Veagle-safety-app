import { requireNativeModule } from 'expo-modules-core';

let DirectSmsModule = null;
try {
  DirectSmsModule = requireNativeModule('DirectSms');
} catch (e) {
  // Graceful fallback when module is not available (e.g. on iOS or Expo Go)
}

export async function sendDirectSms(phoneNumber, message) {
  if (DirectSmsModule && typeof DirectSmsModule.sendDirectSms === 'function') {
    try {
      return await DirectSmsModule.sendDirectSms(phoneNumber, message);
    } catch (err) {
      console.warn('[DirectSms] Native send error:', err?.message);
      return false;
    }
  }
  return false;
}

export default {
  sendDirectSms,
};
