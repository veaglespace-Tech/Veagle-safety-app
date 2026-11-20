import { requireNativeModule } from 'expo-modules-core';

let DirectSmsModule = null;

function getDirectSmsModule() {
  if (!DirectSmsModule) {
    try {
      DirectSmsModule = requireNativeModule('DirectSms');
    } catch (e) {
      console.warn('[DirectSms] requireNativeModule failed:', e?.message);
    }
  }
  return DirectSmsModule;
}

// Immediate eager load attempt
getDirectSmsModule();

export async function sendDirectSms(phoneNumber, message) {
  const mod = getDirectSmsModule();
  if (mod && typeof mod.sendDirectSms === 'function') {
    try {
      const res = await mod.sendDirectSms(phoneNumber, message);
      return !!res;
    } catch (err) {
      console.warn('[DirectSms] Native send error:', err?.message);
      return false;
    }
  }
  console.warn('[DirectSms] DirectSmsModule not available at call time');
  return false;
}

export default {
  sendDirectSms,
};
