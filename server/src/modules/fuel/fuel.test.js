require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../users/user.model');
const Vehicle = require('../vehicles/vehicle.model');
const FuelLog = require('./fuel.model');

const managerUser = {
  name: 'Fleet Manager',
  email: 'manager@transitops.com',
  password: 'Password123!',
  role: 'FLEET_MANAGER',
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
  await FuelLog.deleteMany({});

  // Create users and sign-in
  await User.create(managerUser);
  await User.create(dispatcherUser);
  await User.create(safetyUser);

  const managerLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: managerUser.email, password: managerUser.password });
  managerCookie = managerLogin.headers['set-cookie'];

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

describe('Fuel Log workflows', () => {
  describe('POST /api/v1/fuel-logs', () => {
    test('Should create fuel log successfully by Fleet Manager', async () => {
      const res = await request(app)
        .post('/api/v1/fuel-logs')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          liters: 45.5,
          cost: 95.2,
          odometer: 120500,
          date: new Date(),
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.liters).toBe(45.5);
      expect(res.body.data.cost).toBe(95.2);
    });

    test('Should create fuel log successfully by Dispatcher', async () => {
      const res = await request(app)
        .post('/api/v1/fuel-logs')
        .set('Cookie', dispatcherCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          liters: 30,
          cost: 60,
          odometer: 120600,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    test('Should reject fuel log creation by Safety Officer', async () => {
      const res = await request(app)
        .post('/api/v1/fuel-logs')
        .set('Cookie', safetyCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          liters: 30,
          cost: 60,
          odometer: 120600,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Should fail validation if liters is negative or zero', async () => {
      const res = await request(app)
        .post('/api/v1/fuel-logs')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          liters: 0,
          cost: 60,
          odometer: 120600,
        });

      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/fuel-logs', () => {
    test('Should list logs when authenticated', async () => {
      await FuelLog.create({
        vehicleId: testVehicle._id,
        liters: 10,
        cost: 20,
        odometer: 120700,
        createdBy: new mongoose.Types.ObjectId(),
        date: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/fuel-logs')
        .set('Cookie', safetyCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });
});
