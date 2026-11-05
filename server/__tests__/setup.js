import { jest } from '@jest/globals';

// Setup common mocks for all tests
jest.unstable_mockModule('../src/config/prisma.js', () => {
  return {
    prisma: {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      sosSession: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      sosLocation: {
        create: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      sosAlert: {
        create: jest.fn().mockResolvedValue({}),
      },
      trustedContact: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      parentChildLink: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
      organizationMember: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      deviceToken: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    }
  };
});

jest.unstable_mockModule('../src/socket.js', () => {
  return {
    getIO: jest.fn(() => ({
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    })),
  };
});

jest.unstable_mockModule('../src/services/mailer.js', () => {
  return {
    sendSosEmergencyAlert: jest.fn().mockResolvedValue(true),
    sendSosSafeAlert: jest.fn().mockResolvedValue(true),
    sendEmailVerificationOtp: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  };
});

jest.unstable_mockModule('../src/services/fcmService.js', () => {
  return {
    sendEmergencySirenPush: jest.fn().mockResolvedValue(true),
  };
});
