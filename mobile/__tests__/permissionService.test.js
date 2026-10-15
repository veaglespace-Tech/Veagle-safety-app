import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkLocationPermissions,
  requestPermissionsAfterConsent,
  handleDisclosureDecline,
  LOCATION_DISCLOSURE_KEY,
} from '../src/services/permissionService';

describe('Two-Step Prominent Disclosure & Consent Permission Flow Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('checkLocationPermissions should query permission status without triggering runtime prompt', async () => {
    const status = await checkLocationPermissions();
    expect(Location.getForegroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.getBackgroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    expect(status.foregroundGranted).toBe(true);
    expect(status.backgroundGranted).toBe(true);
  });

  it('requestPermissionsAfterConsent should record agreement and trigger native runtime prompts when user taps Agree', async () => {
    const result = await requestPermissionsAfterConsent();
    
    // 1. Consent must be recorded in storage
    const consent = await AsyncStorage.getItem(LOCATION_DISCLOSURE_KEY);
    expect(consent).toBe('agreed');

    // 2. Native Android runtime prompts must be triggered
    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Location.requestBackgroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.foregroundGranted).toBe(true);
    expect(result.backgroundGranted).toBe(true);
  });

  it('handleDisclosureDecline should record decline and NEVER trigger native runtime prompts when user taps Decline', async () => {
    const result = await handleDisclosureDecline();

    // 1. Decline must be recorded
    const consent = await AsyncStorage.getItem(LOCATION_DISCLOSURE_KEY);
    expect(consent).toBe('declined');

    // 2. Native runtime prompts MUST NOT be called
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(Location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    expect(result.declined).toBe(true);
    expect(result.foregroundGranted).toBe(false);
  });
});
