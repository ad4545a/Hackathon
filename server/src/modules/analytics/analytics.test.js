require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../users/user.model');
const Vehicle = require('../vehicles/vehicle.model');
const Trip = require('../trips/trip.model');
const FuelLog = require('../fuel/fuel.model');
const Maintenance = require('../maintenance/maintenance.model');
const Expense = require('../expenses/expenses.model');

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
  await Trip.deleteMany({});
  await FuelLog.deleteMany({});
  await Maintenance.deleteMany({});
  await Expense.deleteMany({});

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
    status: 'ON_TRIP',
    vehicleType: 'Truck',
    region: 'North',
    acquisitionCost: 60000,
  });

  // Create a completed trip
  await Trip.create({
    vehicleId: testVehicle._id,
    distance: 300,
    revenue: 1200,
    status: 'COMPLETED',
    endDate: new Date(),
  });

  // Create a fuel log
  await FuelLog.create({
    vehicleId: testVehicle._id,
    liters: 50,
    cost: 100,
    odometer: 100500,
    createdBy: new mongoose.Types.ObjectId(),
    date: new Date(),
  });

  // Create a completed maintenance
  await Maintenance.create({
    vehicleId: testVehicle._id,
    maintenanceType: 'Routine pads',
    description: 'Replacing pads',
    startDate: new Date(),
    completionDate: new Date(),
    cost: 200,
    status: 'COMPLETED',
    createdBy: new mongoose.Types.ObjectId(),
  });

  // Create a toll expense
  await Expense.create({
    vehicleId: testVehicle._id,
    type: 'TOLL',
    amount: 30,
    description: 'Highway toll',
    createdBy: new mongoose.Types.ObjectId(),
    date: new Date(),
  });
});

describe('Analytics workflows', () => {
  describe('GET /api/v1/analytics/fleet-utilization', () => {
    test('Should return fleet utilization correctly', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/fleet-utilization')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.utilizationRate).toBe(100); // 1 vehicle active, 1 ON_TRIP
    });
  });

  describe('GET /api/v1/analytics/fuel-efficiency', () => {
    test('Should return fuel efficiency correctly', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/fuel-efficiency')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.efficiency).toBe(6); // 300 miles / 50 liters
    });
  });

  describe('GET /api/v1/analytics/operational-cost', () => {
    test('Should return operational cost correctly (with no double-counting)', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/operational-cost')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // fuel (100) + maintenance (200) + toll expense (30) = 330
      expect(res.body.data.totalOperationalCost).toBe(330);
    });

    test('Should reject access for Dispatcher to operational-cost', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/operational-cost')
        .set('Cookie', dispatcherCookie);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/v1/analytics/vehicle-roi', () => {
    test('Should calculate vehicle ROI correctly', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/vehicle-roi')
        .set('Cookie', managerCookie);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].revenue).toBe(1200);
      expect(res.body.data[0].fuelCost).toBe(100);
      expect(res.body.data[0].maintenanceCost).toBe(200);
      // ROI: (1200 - 300) / 60000 = 1.5%
      expect(res.body.data[0].roiPercent).toBe(1.5);
    });
  });
});
