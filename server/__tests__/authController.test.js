import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import * as authController from '../src/controllers/authController.js';

// Setup an Express app for testing the controller routes
const app = express();
app.use(express.json());
app.post('/api/auth/login', authController.login);

describe('Auth Controller - Unit Tests', () => {
  let prismaMock;

  beforeAll(async () => {
    // Import the mocked prisma from the setup file
    const prismaModule = await import('../src/config/prisma.js');
    prismaMock = prismaModule.prisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 401 if user does not exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email/phone or password');
    });

    it('should return 401 if password is incorrect', async () => {
      // Mock finding a user
      prismaMock.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      // Mock bcrypt to return false (password mismatch)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return a token if login is successful', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedpassword',
        fullName: 'Test User',
        role: 'USER',
        safetyStatus: 'SAFE',
        isEmailVerified: true
      };

      prismaMock.user.findFirst.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true); // Password match

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'correctpassword' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });
  });
});
