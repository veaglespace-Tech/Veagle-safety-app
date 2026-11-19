import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from './constants';

// Native: Android Keystore-backed storage and iOS Keychain.
// Web: keep the existing browser storage behavior.
export async function getAuthToken() {
  if (Platform.OS === 'web') return AsyncStorage.getItem(TOKEN_KEY);

  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) return token;

  // One-time migration for people upgrading from the old AsyncStorage token.
  const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
  if (!legacyToken) return null;
  await SecureStore.setItemAsync(TOKEN_KEY, legacyToken);
  await AsyncStorage.removeItem(TOKEN_KEY);
  return legacyToken;
}

export async function setAuthToken(token) {
  if (Platform.OS === 'web') return AsyncStorage.setItem(TOKEN_KEY, token);
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function clearAuthToken() {
  if (Platform.OS === 'web') return AsyncStorage.removeItem(TOKEN_KEY);
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    AsyncStorage.removeItem(TOKEN_KEY),
  ]);
}
