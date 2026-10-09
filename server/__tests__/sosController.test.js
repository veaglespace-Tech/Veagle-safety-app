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
  let socketMock;

  beforeAll(async () => {
    const prismaModule = await import('../src/config/prisma.js');
    prismaMock = prismaModule.prisma;
    
    // Add missing mocks that aren't auto-generated or present
    prismaMock.trustedContact = { findMany: jest.fn() };
    prismaMock.parentChildLink = { findMany: jest.fn() };
    prismaMock.organizationMember = { findMany: jest.fn() };
    
    const socketModule = await import('../src/socket.js');
    socketMock = socketModule;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/sos/start', () => {
    it('should return 400 if an active session already exists', async () => {
      // Mock finding an active session
      prismaMock.sosSession.findFirst.mockResolvedValue({ id: 100, status: 'ACTIVE' });

      const response = await request(app)
        .post('/api/sos/start')
        .send({ latitude: 18.5204, longitude: 73.8567 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('An active emergency session already exists.');
    });

    it('should create a new SOS session and return 201', async () => {
      // Mock NO active session exists
      prismaMock.sosSession.findFirst.mockResolvedValue(null);

      // Mock user details
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        fullName: 'Jane Doe',
        phone: '1234567890',
        trustedContacts: []
      });

      // Mock session creation
      prismaMock.sosSession.create.mockResolvedValue({
        id: 101,
        userId: 1,
        status: 'ACTIVE',
        shareToken: 'test-uuid-token'
      });

      // Mock location creation
      prismaMock.sosLocation.create.mockResolvedValue({
        id: 10,
        sosSessionId: 101,
        latitude: 18.5204,
        longitude: 73.8567,
      });

      prismaMock.trustedContact.findMany.mockResolvedValue([]);
      prismaMock.parentChildLink.findMany.mockResolvedValue([]);
      prismaMock.organizationMember.findMany.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/sos/start')
        .send({ latitude: 18.5204, longitude: 73.8567 });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('sessionId', 101);
      expect(response.body).toHaveProperty('shareToken', 'test-uuid-token');
      
      // Verify prisma was called correctly
      expect(prismaMock.sosSession.create).toHaveBeenCalled();
      expect(prismaMock.sosLocation.create).toHaveBeenCalled();
    });
  });
});
