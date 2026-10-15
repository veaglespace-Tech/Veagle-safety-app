import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export const LOCATION_DISCLOSURE_KEY = '@sakhi_suraksha_location_disclosure_consent_v2';

/**
 * Checks current native Android/iOS permission status WITHOUT triggering any prompt.
 */
export async function checkLocationPermissions() {
  try {
    const fg = await Location.getForegroundPermissionsAsync().catch(() => null);
    const bg = await Location.getBackgroundPermissionsAsync().catch(() => null);

    return {
      foregroundGranted: fg?.status === 'granted',
      backgroundGranted: bg?.status === 'granted',
      foregroundStatus: fg?.status || 'undetermined',
      backgroundStatus: bg?.status || 'undetermined',
    };
  } catch (e) {
    return {
      foregroundGranted: false,
      backgroundGranted: false,
      foregroundStatus: 'undetermined',
      backgroundStatus: 'undetermined',
    };
  }
}

/**
 * Check if the user previously agreed to the prominent disclosure.
 */
export async function hasAgreedDisclosure() {
  try {
    const val = await AsyncStorage.getItem(LOCATION_DISCLOSURE_KEY);
    return val === 'agreed';
  } catch {
    return false;
  }
}

/**
 * Executed ONLY AFTER the user taps "Agree" in the Prominent Disclosure dialog.
 * Triggers the native Android runtime permission prompts:
 * 1. Native Foreground Location Prompt
 * 2. Native Background Location Prompt (if foreground granted)
 */
export async function requestPermissionsAfterConsent() {
  try {
    // 1. Record explicit user consent in storage
    await AsyncStorage.setItem(LOCATION_DISCLOSURE_KEY, 'agreed').catch(() => {});

    // 2. Trigger native Android runtime prompt for foreground location
    const fgResult = await Location.requestForegroundPermissionsAsync().catch(() => null);
    const foregroundGranted = fgResult?.status === 'granted';

    let backgroundGranted = false;
    if (foregroundGranted) {
      // 3. Trigger native Android runtime prompt for background location
      const bgResult = await Location.requestBackgroundPermissionsAsync().catch(() => null);
      backgroundGranted = bgResult?.status === 'granted';
    }

    return {
      success: foregroundGranted,
      foregroundGranted,
      backgroundGranted,
    };
  } catch (error) {
    console.warn('[PermissionService] Error requesting native location permissions:', error);
    return {
      success: false,
      foregroundGranted: false,
      backgroundGranted: false,
      error,
    };
  }
}

/**
 * Executed when the user taps "Decline" in the Prominent Disclosure dialog.
 * STRICTLY cancels the flow and DOES NOT trigger any native runtime prompt.
 */
export async function handleDisclosureDecline() {
  try {
    await AsyncStorage.setItem(LOCATION_DISCLOSURE_KEY, 'declined').catch(() => {});
  } catch {}

  return {
    declined: true,
    foregroundGranted: false,
    backgroundGranted: false,
  };
}
