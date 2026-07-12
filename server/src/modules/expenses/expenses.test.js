require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../users/user.model');
const Vehicle = require('../vehicles/vehicle.model');
const Expense = require('./expenses.model');

const managerUser = {
  name: 'Fleet Manager',
  email: 'manager@transitops.com',
  password: 'Password123!',
  role: 'FLEET_MANAGER',
};

const analystUser = {
  name: 'Financial Analyst',
  email: 'analyst@transitops.com',
  password: 'Password123!',
  role: 'FINANCIAL_ANALYST',
};

const dispatcherUser = {
  name: 'Dispatcher User',
  email: 'dispatcher@transitops.com',
  password: 'Password123!',
  role: 'DISPATCHER',
};

const safetyUser = {
  name: 'Safety User',
  email: 'safety@transitops.com',
  password: 'Password123!',
  role: 'SAFETY_OFFICER',
};

let managerCookie;
let analystCookie;
let dispatcherCookie;
let safetyCookie;
let testVehicle;

beforeAll(async () => {
  const dbURI = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
    : 'mongodb://localhost:27017/transitops_test?replicaSet=rs0';
  
  const cleanURI = dbURI.replace('?replicaSet=rs0', '').replace('&replicaSet=rs0', '');
  await mongoose.connect(cleanURI);
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
  await Vehicle.deleteMany({});
  await Expense.deleteMany({});

  // Create users and sign-in
  await User.create(managerUser);
  await User.create(analystUser);
  await User.create(dispatcherUser);
  await User.create(safetyUser);

  const managerLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: managerUser.email, password: managerUser.password });
  managerCookie = managerLogin.headers['set-cookie'];

  const analystLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: analystUser.email, password: analystUser.password });
  analystCookie = analystLogin.headers['set-cookie'];

  const dispatcherLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: dispatcherUser.email, password: dispatcherUser.password });
  dispatcherCookie = dispatcherLogin.headers['set-cookie'];

  const safetyLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: safetyUser.email, password: safetyUser.password });
  safetyCookie = safetyLogin.headers['set-cookie'];

  // Create a test vehicle
  testVehicle = await Vehicle.create({
    plateNumber: 'MH-12-AB-1234',
    status: 'AVAILABLE',
  });
});

describe('Expense workflows', () => {
  describe('POST /api/v1/expenses', () => {
    test('Should create expense successfully by Fleet Manager', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          type: 'TOLL',
          amount: 25.5,
          description: 'Highway toll charge',
          date: new Date(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.amount).toBe(25.5);
      expect(res.body.data.type).toBe('TOLL');
    });

    test('Should create expense successfully by Financial Analyst', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Cookie', analystCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          type: 'OTHER',
          amount: 150,
          description: 'Document processing fees',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('Should create expense successfully by Dispatcher', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Cookie', dispatcherCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          type: 'FUEL',
          amount: 80,
          description: 'Emergency fuel purchase',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('Should reject expense creation by Safety Officer', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Cookie', safetyCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          type: 'OTHER',
          amount: 50,
          description: 'Safety check fees',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Should fail validation if amount is negative', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          type: 'OTHER',
          amount: -5,
          description: 'Invalid negative expense',
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('Should fail validation if type is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/expenses')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          type: 'INVALID_TYPE',
          amount: 50,
          description: 'Invalid type expense',
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/expenses', () => {
    test('Should list expenses for Fleet Manager, Financial Analyst, and Safety Officer', async () => {
      await Expense.create({
        vehicleId: testVehicle._id,
        type: 'TOLL',
        amount: 15,
        description: 'Toll fee',
        createdBy: new mongoose.Types.ObjectId(),
        date: new Date(),
      });

      const resManager = await request(app)
        .get('/api/v1/expenses')
        .set('Cookie', managerCookie);
      expect(resManager.statusCode).toBe(200);
      expect(resManager.body.success).toBe(true);
      expect(resManager.body.data.length).toBe(1);

      const resAnalyst = await request(app)
        .get('/api/v1/expenses')
        .set('Cookie', analystCookie);
      expect(resAnalyst.statusCode).toBe(200);

      const resSafety = await request(app)
        .get('/api/v1/expenses')
        .set('Cookie', safetyCookie);
      expect(resSafety.statusCode).toBe(200);
    });

    test('Should reject listing expenses for Dispatcher', async () => {
      const res = await request(app)
        .get('/api/v1/expenses')
        .set('Cookie', dispatcherCookie);
      expect(res.statusCode).toBe(403);
    });
  });
});
