import {
  sanitizePhoneNumber,
  buildEmergencySmsText,
  openUniversalSmsComposer,
  sendEmergencySmsToAll,
} from '../src/services/smsService';
import { Platform, PermissionsAndroid } from 'react-native';

jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Platform: {
      OS: 'android',
      select: (obj) => obj.android || obj.default,
    },
    PermissionsAndroid: {
      PERMISSIONS: { SEND_SMS: 'android.permission.SEND_SMS' },
      RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
      check: jest.fn().mockResolvedValue(true),
      request: jest.fn().mockResolvedValue('granted'),
    },
    Linking: {
      canOpenURL: jest.fn().mockResolvedValue(true),
      openURL: jest.fn().mockResolvedValue(true),
    },
  };
});

jest.mock('expo-sms', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  sendSMSAsync: jest.fn().mockResolvedValue({ result: 'sent' }),
}));

jest.mock('../modules/direct-sms', () => ({
  sendDirectSms: jest.fn().mockResolvedValue(true),
}));

describe('Emergency SMS Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    PermissionsAndroid.check.mockResolvedValue(true);
    PermissionsAndroid.request.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
  });

  describe('sanitizePhoneNumber', () => {
    it('formats 10-digit Indian numbers with +91', () => {
      expect(sanitizePhoneNumber('9876543210')).toBe('+919876543210');
      expect(sanitizePhoneNumber('9876-543-210')).toBe('+919876543210');
      expect(sanitizePhoneNumber(' 98765 43210 ')).toBe('+919876543210');
    });

    it('preserves existing + country code', () => {
      expect(sanitizePhoneNumber('+919876543210')).toBe('+919876543210');
      expect(sanitizePhoneNumber('+1 234 567 8901')).toBe('+12345678901');
    });

    it('returns empty string for invalid or short numbers', () => {
      expect(sanitizePhoneNumber('')).toBe('');
      expect(sanitizePhoneNumber(null)).toBe('');
      expect(sanitizePhoneNumber('12345')).toBe('');
    });
  });

  describe('buildEmergencySmsText', () => {
    it('builds clear emergency SOS text with coordinates and tracking link', () => {
      const text = buildEmergencySmsText({
        victimName: 'Pooja',
        trackingUrl: 'https://track.veagle.app/sos/123',
        latitude: 18.520430,
        longitude: 73.856743,
      });

      expect(text).toContain('EMERGENCY SOS ALERT');
      expect(text).toContain('Pooja activated Emergency SOS');
      expect(text).toContain('📍 GPS: 18.52043');
      expect(text).toContain('👉 Live Track: https://track.veagle.app/sos/123');
      expect(text).toContain('SakhiSuraksha Safety System');
    });

    it('handles missing victimName gracefully with fallback', () => {
      const text = buildEmergencySmsText({});
      expect(text).toContain('Sakhi Suraksha User');
    });
  });

  describe('openUniversalSmsComposer', () => {
    it('targets only primary contact on Android to prevent RCS group chat error', async () => {
      const SMS = require('expo-sms');
      const contacts = ['+919876543210', '+919876543211'];
      const message = 'Test Emergency Message';

      Platform.OS = 'android';
      const result = await openUniversalSmsComposer(contacts, message);

      expect(result).toBe(true);
      expect(SMS.sendSMSAsync).toHaveBeenCalledWith(['+919876543210'], message);
    });

    it('passes all contacts on iOS', async () => {
      const SMS = require('expo-sms');
      const contacts = ['+919876543210', '+919876543211'];
      const message = 'Test Emergency Message';

      Platform.OS = 'ios';
      const result = await openUniversalSmsComposer(contacts, message);

      expect(result).toBe(true);
      expect(SMS.sendSMSAsync).toHaveBeenCalledWith(contacts, message);
    });

    it('returns false when no numbers provided', async () => {
      const result = await openUniversalSmsComposer([], 'Test');
      expect(result).toBe(false);
    });
  });

  describe('sendEmergencySmsToAll', () => {
    it('dispatches background SMS on Android when permission is present', async () => {
      const { sendDirectSms } = require('../modules/direct-sms');
      const contacts = [
        { name: 'Mom', phone: '9876543210' },
        { name: 'Brother', phone: '9876543211' },
      ];

      const res = await sendEmergencySmsToAll({
        emergencyContacts: contacts,
        victimName: 'Tester',
      });

      expect(res.sent).toBe(2);
      expect(res.failed).toBe(0);
      expect(res.mode).toBe('background');
      expect(sendDirectSms).toHaveBeenCalledTimes(2);
    });

    it('skips gracefully when contacts list is empty', async () => {
      const res = await sendEmergencySmsToAll({
        emergencyContacts: [],
      });

      expect(res.skipped).toBe(true);
      expect(res.error).toBe('NO_CONTACTS');
    });
  });
});
