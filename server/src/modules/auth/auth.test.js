require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../users/user.model');

const testUser = {
  name: 'Test Manager',
  email: 'testmanager@transitops.com',
  password: 'Password123!',
  role: 'FLEET_MANAGER',
};

beforeAll(async () => {
  let dbURI = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
    : 'mongodb://localhost:27017/transitops_test?replicaSet=rs0';
  
  // Strip replicaSet option if not running in a replica-set environment
  dbURI = dbURI.replace('?replicaSet=rs0', '').replace('&replicaSet=rs0', '');
  await mongoose.connect(dbURI);
});

afterAll(async () => {
  try {
    await mongoose.connection.db.dropDatabase();
  } catch (err) {
    // DB might not be initialized
  }
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Model & Auth workflows', () => {
  test('Should hash password when a new user is created', async () => {
    const user = await User.create(testUser);
    expect(user.password).not.toBe(testUser.password);
    expect(user.password.startsWith('$2b$')).toBe(true);
  });

  test('Should not return password by default in queries', async () => {
    await User.create(testUser);
    const user = await User.findOne({ email: testUser.email });
    expect(user.password).toBeUndefined();
  });

  test('Should fail login with incorrect password', async () => {
    await User.create(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword!',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('Should fail login when fields do not meet Zod validation requirements', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'invalid-email',
        password: 'short',
      });

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.email).toBeDefined();
    expect(res.body.error.details.password).toBeDefined();
  });

  test('Should login successfully and set cookie', async () => {
    await User.create(testUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined();

    const cookieHeader = res.headers['set-cookie'][0];
    expect(cookieHeader).toContain('token=');
  });

  test('Should fetch current user profile when authenticated', async () => {
    await User.create(testUser);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const cookie = loginRes.headers['set-cookie'];

    const profileRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.body.success).toBe(true);
    expect(profileRes.body.data.user.email).toBe(testUser.email);
  });

  test('Should reject access to protected route if unauthenticated', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('Should logout and clear cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie'][0]).toContain('loggedout');
  });
});
