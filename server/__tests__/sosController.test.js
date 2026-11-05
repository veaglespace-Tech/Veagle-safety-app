import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import * as sosController from '../src/controllers/sosController.js';

const app = express();
app.use(express.json());

// Mock authenticateToken middleware to attach a dummy user
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

app.post('/api/sos/start', sosController.startSos);

describe('SOS Controller - Unit Tests', () => {
  let prismaMock;

  beforeAll(async () => {
    const prismaModule = await import('../src/config/prisma.js');
    prismaMock = prismaModule.prisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sos/start', () => {
    it('should reuse existing active session if one exists', async () => {
      // Mock finding an active session
      prismaMock.sosSession.findFirst.mockResolvedValue({
        id: 100,
        userId: 1,
        status: 'ACTIVE',
        shareToken: 'existing-uuid-token',
        startedAt: new Date().toISOString(),
        isSilent: false,
      });

      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        fullName: 'Jane Doe',
        phone: '1234567890',
        email: 'jane@example.com',
      });

      prismaMock.sosLocation.create.mockResolvedValue({
        id: 10,
        sosSessionId: 100,
        latitude: 18.5204,
        longitude: 73.8567,
      });

      const response = await request(app)
        .post('/api/sos/start')
        .send({ initialLat: 18.5204, initialLng: 73.8567 });

      expect(response.status).toBe(200);
      expect(response.body.sosSession).toHaveProperty('id', 100);
      expect(response.body.sosSession).toHaveProperty('shareToken', 'existing-uuid-token');
    });

    it('should create a new SOS session and return 200', async () => {
      // Mock NO active session exists
      prismaMock.sosSession.findFirst.mockResolvedValue(null);

      // Mock user details
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        fullName: 'Jane Doe',
        phone: '1234567890',
        email: 'jane@example.com',
      });

      // Mock session creation
      prismaMock.sosSession.create.mockResolvedValue({
        id: 101,
        userId: 1,
        status: 'ACTIVE',
        shareToken: 'test-uuid-token',
        startedAt: new Date().toISOString(),
        isSilent: false,
      });

      // Mock location creation
      prismaMock.sosLocation.create.mockResolvedValue({
        id: 10,
        sosSessionId: 101,
        latitude: 18.5204,
        longitude: 73.8567,
      });

      const response = await request(app)
        .post('/api/sos/start')
        .send({ initialLat: 18.5204, initialLng: 73.8567 });

      expect(response.status).toBe(200);
      expect(response.body.sosSession).toHaveProperty('id', 101);
      expect(response.body.sosSession).toHaveProperty('shareToken', 'test-uuid-token');

      // Verify prisma was called correctly
      expect(prismaMock.sosSession.create).toHaveBeenCalled();
      expect(prismaMock.sosLocation.create).toHaveBeenCalled();
    });
  });
});
