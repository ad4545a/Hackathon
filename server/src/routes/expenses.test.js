require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../modules/users/user.model');
const Vehicle = require('../modules/vehicles/vehicle.model');
const Expense = require('../models/Expense');

let managerCookie;
let safetyOfficerCookie;
let vehicle;

const testManager = {
  name: 'Fleet Manager User',
  email: 'manager-exp-test@transitops.com',
  password: 'Password123!',
  role: 'FLEET_MANAGER',
};

const testSafetyOfficer = {
  name: 'Safety Officer User',
  email: 'safety-exp-test@transitops.com',
  password: 'Password123!',
  role: 'SAFETY_OFFICER',
};

beforeAll(async () => {
  const dbURI = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
    : 'mongodb://localhost:27017/transitops_test?replicaSet=rs0';
  await mongoose.connect(dbURI);

  await User.deleteMany({});
  await Vehicle.deleteMany({});
  await Expense.deleteMany({});

  // Create users
  await User.create(testManager);
  await User.create(testSafetyOfficer);

  // Login as manager
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: testManager.email, password: testManager.password });
  managerCookie = loginRes.headers['set-cookie'];

  // Login as Safety Officer
  const loginResSO = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: testSafetyOfficer.email, password: testSafetyOfficer.password });
  safetyOfficerCookie = loginResSO.headers['set-cookie'];

  // Create test vehicle
  vehicle = await Vehicle.create({
    registrationNumber: 'MH-12-EX-7777',
    name: 'Van-EX',
    model: 'Tata Ace',
    type: 'Van',
    maximumLoadCapacity: 500,
    odometer: 1000,
    acquisitionCost: 9000,
    region: 'North',
    status: 'AVAILABLE',
  });
});

afterAll(async () => {
  try {
    await mongoose.connection.db.dropDatabase();
  } catch (err) {}
  await mongoose.connection.close();
});

describe('Expense API Endpoints & Role Protections', () => {
  test('FLEET_MANAGER should create an expense successfully', async () => {
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Cookie', managerCookie)
      .send({
        vehicleId: vehicle._id,
        type: 'TOLL',
        amount: 30,
        description: 'Toll fee route A',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(30);
    expect(res.body.data.type).toBe('TOLL');
  });

  test('SAFETY_OFFICER should be blocked from creating an expense (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/v1/expenses')
      .set('Cookie', safetyOfficerCookie)
      .send({
        vehicleId: vehicle._id,
        type: 'OTHER',
        amount: 100,
        description: 'Safety check cost',
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('Should list expenses with pagination and populates vehicle details', async () => {
    const res = await request(app)
      .get('/api/v1/expenses')
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].vehicleId).toBeDefined();
    expect(res.body.data[0].vehicleId.registrationNumber).toBe('MH-12-EX-7777');
  });
});
