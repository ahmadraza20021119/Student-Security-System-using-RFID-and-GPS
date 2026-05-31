const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Test database connection
beforeAll(async () => {
  const mongoURI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/student_security_test';
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up after tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// Clear database before each test
beforeEach(async () => {
  await Admin.deleteMany({});
});

describe('Authentication Tests', () => {
  describe('POST /api/auth/login', () => {
    test('Should login with valid credentials', async () => {
      // Create test admin
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await Admin.create({
        username: 'testadmin',
        password: hashedPassword,
        email: 'test@example.com',
        role: 'admin',
        isActive: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.admin).toBeDefined();
      expect(response.body.admin.username).toBe('testadmin');
    });

    test('Should fail with invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'testpass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    test('Should fail with invalid password', async () => {
      // Create test admin
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await Admin.create({
        username: 'testadmin',
        password: hashedPassword,
        email: 'test@example.com',
        role: 'admin',
        isActive: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/invalid credentials/i);
    });

    test('Should fail with inactive account', async () => {
      // Create inactive admin
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await Admin.create({
        username: 'inactiveadmin',
        password: hashedPassword,
        email: 'inactive@example.com',
        role: 'admin',
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'inactiveadmin',
          password: 'testpass123'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/inactive/i);
    });

    test('Should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with invalid username format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'ab', // Too short
          password: 'testpass123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      // Create test admin and get token
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      const admin = await Admin.create({
        username: 'testadmin',
        password: hashedPassword,
        email: 'test@example.com',
        fullName: 'Test Admin',
        role: 'admin',
        isActive: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });

      authToken = loginResponse.body.token;
    });

    test('Should get profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testadmin');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.password).toBeUndefined();
    });

    test('Should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('Should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken;

    beforeEach(async () => {
      // Create test admin and get token
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await Admin.create({
        username: 'testadmin',
        password: hashedPassword,
        email: 'test@example.com',
        fullName: 'Test Admin',
        role: 'admin',
        isActive: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });

      authToken = loginResponse.body.token;
    });

    test('Should update profile successfully', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Updated Name',
          email: 'updated@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fullName).toBe('Updated Name');
      expect(response.body.data.email).toBe('updated@example.com');
    });

    test('Should fail without authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({
          fullName: 'Updated Name'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    let authToken;

    beforeEach(async () => {
      // Create test admin and get token
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await Admin.create({
        username: 'testadmin',
        password: hashedPassword,
        email: 'test@example.com',
        role: 'admin',
        isActive: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });

      authToken = loginResponse.body.token;
    });

    test('Should change password successfully', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'testpass123',
          newPassword: 'newpass456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'newpass456'
        });

      expect(loginResponse.status).toBe(200);
    });

    test('Should fail with incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpass456'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/incorrect/i);
    });

    test('Should fail with short new password', async () => {
      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'testpass123',
          newPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let authToken;

    beforeEach(async () => {
      // Create test admin and get token
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await Admin.create({
        username: 'testadmin',
        password: hashedPassword,
        email: 'test@example.com',
        role: 'admin',
        isActive: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });

      authToken = loginResponse.body.token;
    });

    test('Should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(authToken);
    });
  });

  describe('GET /api/auth/verify', () => {
    let authToken;

    beforeEach(async () => {
      // Create test admin and get token
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      await Admin.create({
        username: 'testadmin',
        password: hashedPassword,
        email: 'test@example.com',
        role: 'admin',
        isActive: true
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testadmin',
          password: 'testpass123'
        });

      authToken = loginResponse.body.token;
    });

    test('Should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.admin).toBeDefined();
    });

    test('Should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer invalidtoken');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});