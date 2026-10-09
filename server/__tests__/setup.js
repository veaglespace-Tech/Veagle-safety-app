import { jest } from '@jest/globals';

// Setup common mocks for all tests
jest.unstable_mockModule('../src/config/prisma.js', () => {
  return {
    prisma: {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      sosSession: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      sosLocation: {
        create: jest.fn(),
      }
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
