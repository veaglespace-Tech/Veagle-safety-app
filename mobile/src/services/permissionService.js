import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export const LOCATION_DISCLOSURE_KEY = '@sakhi_suraksha_location_disclosure_consent_v2';
export const BG_PERMISSION_PROMPTED_KEY = '@sakhi_suraksha_bg_perm_prompted_v2';

/**
 * Checks current native Android/iOS permission status WITHOUT triggering any prompt.
 */
export async function checkLocationPermissions() {
  try {
    const fg = await Location.getForegroundPermissionsAsync().catch(() => null);
    const bg = await Location.getBackgroundPermissionsAsync().catch(() => null);
    const notif = await Notifications.getPermissionsAsync().catch(() => null);

    return {
      foregroundGranted: fg?.status === 'granted',
      backgroundGranted: bg?.status === 'granted',
      notificationsGranted: notif?.status === 'granted',
      foregroundStatus: fg?.status || 'undetermined',
      backgroundStatus: bg?.status || 'undetermined',
    };
  } catch (e) {
    return {
      foregroundGranted: false,
      backgroundGranted: false,
      notificationsGranted: false,
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
 * Check if background location / notification permissions have already been prompted.
 */
export async function hasPromptedBackground() {
  try {
    const val = await AsyncStorage.getItem(BG_PERMISSION_PROMPTED_KEY);
    return val === 'prompted';
  } catch {
    return false;
  }
}

/**
 * Executed ONLY AFTER the user taps "Agree" in the Prominent Disclosure dialog.
 * Triggers the native Android runtime permission prompts:
 * 1. Native Foreground Location Prompt
 * 2. Native Notification Permission (Android 13+)
 * 3. Native Background Location Prompt ("Allow all the time")
 */
export async function requestPermissionsAfterConsent() {
  try {
    // 1. Record explicit user consent in storage
    await AsyncStorage.setItem(LOCATION_DISCLOSURE_KEY, 'agreed').catch(() => {});
    await AsyncStorage.setItem(BG_PERMISSION_PROMPTED_KEY, 'prompted').catch(() => {});

    // 2. Trigger native Android runtime prompt for foreground location
    const fgResult = await Location.requestForegroundPermissionsAsync().catch(() => null);
    const foregroundGranted = fgResult?.status === 'granted';

    // 3. Trigger native notification permission (crucial for foreground service notification on Android 13+)
    try {
      await Notifications.requestPermissionsAsync().catch(() => {});
    } catch (notifErr) {}

    let backgroundGranted = false;
    if (foregroundGranted) {
      // 4. Trigger native Android runtime prompt for background location ("Allow all the time")
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
