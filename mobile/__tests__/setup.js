jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getBackgroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 18.5204, longitude: 73.8567, accuracy: 10 },
  }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  Accuracy: { Balanced: 3, High: 4 },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Heavy: 'heavy' },
  NotificationFeedbackType: { Error: 'error' },
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue({}),
  deleteNotificationChannelAsync: jest.fn().mockResolvedValue({}),
  registerTaskAsync: jest.fn().mockResolvedValue({}),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
  getDevicePushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-fcm' }),
  AndroidImportance: { MAX: 5 },
  AndroidAudioUsage: { ALARM: 4 },
  AndroidAudioContentType: { SONIFICATION: 4 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
  AndroidNotificationPriority: { MAX: 'max' },
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskDefined: jest.fn().mockReturnValue(true),
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: { eas: { projectId: 'mock-project-id' } } },
}));

jest.mock('@react-native-firebase/messaging', () => {
  const messagingInstance = {
    setBackgroundMessageHandler: jest.fn(),
    requestPermission: jest.fn().mockResolvedValue(1),
    registerDeviceForRemoteMessages: jest.fn().mockResolvedValue(true),
    getToken: jest.fn().mockResolvedValue('mock-native-fcm-token'),
    deleteToken: jest.fn().mockResolvedValue(true),
    onTokenRefresh: jest.fn(() => () => {}),
    onMessage: jest.fn(() => () => {}),
    onNotificationOpenedApp: jest.fn(() => () => {}),
    getInitialNotification: jest.fn().mockResolvedValue(null),
  };
  const fn = () => messagingInstance;
  fn.AuthorizationStatus = { AUTHORIZED: 1, PROVISIONAL: 2 };
  return fn;
});
