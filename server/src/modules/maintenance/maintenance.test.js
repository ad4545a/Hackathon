require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../users/user.model');
const Vehicle = require('../vehicles/vehicle.model');
const Maintenance = require('./maintenance.model');

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

let managerCookie;
let dispatcherCookie;
let testVehicle;

beforeAll(async () => {
  let dbURI = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
    : 'mongodb://localhost:27017/transitops_test?replicaSet=rs0';
  
  // Strip replicaSet option if not running in a replica-set environment
  dbURI = dbURI.replace('?replicaSet=rs0', '').replace('&replicaSet=rs0', '');
  
  // Connect to DB
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
  await Vehicle.deleteMany({});
  await Maintenance.deleteMany({});

  // Create users and sign-in to get cookies
  const manager = await User.create(managerUser);
  const dispatcher = await User.create(dispatcherUser);

  const managerLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: managerUser.email, password: managerUser.password });
  managerCookie = managerLogin.headers['set-cookie'];

  const dispatcherLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: dispatcherUser.email, password: dispatcherUser.password });
  dispatcherCookie = dispatcherLogin.headers['set-cookie'];

  // Create a test vehicle
  testVehicle = await Vehicle.create({
    plateNumber: 'MH-12-AB-1234',
    status: 'AVAILABLE',
  });
});

describe('Maintenance workflows', () => {
  describe('POST /api/v1/maintenance (Start)', () => {
    test('Should start maintenance successfully if user is Fleet Manager and vehicle is AVAILABLE', async () => {
      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'Oil Change',
          description: 'Routine oil change maintenance',
          startDate: new Date(),
          cost: 150,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.maintenanceType).toBe('Oil Change');

      // Verify Vehicle status is updated to IN_SHOP
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle.status).toBe('IN_SHOP');
    });

    test('Should reject start maintenance if user role is not Fleet Manager', async () => {
      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Cookie', dispatcherCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'Oil Change',
          description: 'Routine oil change maintenance',
          startDate: new Date(),
          cost: 150,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    test('Should reject if vehicle status is not AVAILABLE', async () => {
      // Set status to IN_SHOP
      testVehicle.status = 'IN_SHOP';
      await testVehicle.save();

      const res = await request(app)
        .post('/api/v1/maintenance')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'Oil Change',
          description: 'Routine oil change maintenance',
          startDate: new Date(),
          cost: 150,
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MAINTENANCE_VEHICLE_NOT_AVAILABLE');
    });
  });

  describe('POST /api/v1/maintenance/:id/complete', () => {
    test('Should complete maintenance successfully and return vehicle to AVAILABLE', async () => {
      // Start a maintenance log
      const startRes = await request(app)
        .post('/api/v1/maintenance')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'Routine Brake Repair',
          description: 'Changing pads',
          startDate: new Date(),
          cost: 300,
        });

      const maintId = startRes.body.data._id;

      const completeRes = await request(app)
        .post(`/api/v1/maintenance/${maintId}/complete`)
        .set('Cookie', managerCookie)
        .send({
          completionDate: new Date(),
          retireVehicle: false,
        });

      expect(completeRes.statusCode).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.data.maintenance.status).toBe('COMPLETED');
      expect(completeRes.body.data.vehicleStatus).toBe('AVAILABLE');

      // Verify Vehicle status in DB
      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle.status).toBe('AVAILABLE');
    });

    test('Should retire vehicle if retireVehicle is true', async () => {
      const startRes = await request(app)
        .post('/api/v1/maintenance')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'Routine Brake Repair',
          description: 'Changing pads',
          startDate: new Date(),
          cost: 300,
        });

      const maintId = startRes.body.data._id;

      const completeRes = await request(app)
        .post(`/api/v1/maintenance/${maintId}/complete`)
        .set('Cookie', managerCookie)
        .send({
          completionDate: new Date(),
          retireVehicle: true,
        });

      expect(completeRes.statusCode).toBe(200);
      expect(completeRes.body.data.vehicleStatus).toBe('RETIRED');

      const updatedVehicle = await Vehicle.findById(testVehicle._id);
      expect(updatedVehicle.status).toBe('RETIRED');
    });
  });

  describe('GET /api/v1/maintenance', () => {
    test('Should list logs when authenticated', async () => {
      await request(app)
        .post('/api/v1/maintenance')
        .set('Cookie', managerCookie)
        .send({
          vehicleId: testVehicle._id.toString(),
          maintenanceType: 'Routine Brake Repair',
          description: 'Changing pads',
          startDate: new Date(),
          cost: 300,
        });

      const res = await request(app)
        .get('/api/v1/maintenance')
        .set('Cookie', dispatcherCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });
  });
});
