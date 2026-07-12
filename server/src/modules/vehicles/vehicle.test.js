require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../users/user.model');
const Vehicle = require('./vehicle.model');

let managerToken;
let managerCookie;
let dispatcherToken;
let dispatcherCookie;

const testManager = {
  name: 'Fleet Manager',
  email: 'manager-test@transitops.com',
  password: 'Password123!',
  role: 'FLEET_MANAGER',
};

const testDispatcher = {
  name: 'Dispatcher User',
  email: 'dispatcher-test@transitops.com',
  password: 'Password123!',
  role: 'DISPATCHER',
};

const testVehicle = {
  registrationNumber: 'MH-12-AB-1234',
  name: 'Delivery Van 01',
  model: 'Tata Ace',
  type: 'Van',
  maximumLoadCapacity: 800,
  odometer: 1500,
  acquisitionCost: 12000,
  region: 'West',
};

beforeAll(async () => {
  const dbURI = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
    : 'mongodb://localhost:27017/transitops_test?replicaSet=rs0';
  await mongoose.connect(dbURI);

  // Setup seed users for role check
  await User.deleteMany({});
  
  await User.create(testManager);
  await User.create(testDispatcher);

  // Login both users to fetch cookies/tokens
  const managerLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: testManager.email, password: testManager.password });
  
  managerToken = managerLogin.body.data.token;
  managerCookie = managerLogin.headers['set-cookie'];

  const dispatcherLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: testDispatcher.email, password: testDispatcher.password });
  
  dispatcherToken = dispatcherLogin.body.data.token;
  dispatcherCookie = dispatcherLogin.headers['set-cookie'];
});

afterAll(async () => {
  try {
    await mongoose.connection.db.dropDatabase();
  } catch (err) {}
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Vehicle.deleteMany({});
});

describe('Vehicle Management Module', () => {
  test('Should create a vehicle successfully as FLEET_MANAGER', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Cookie', managerCookie)
      .send(testVehicle);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicle.registrationNumber).toBe(testVehicle.registrationNumber);
    expect(res.body.data.vehicle.status).toBe('AVAILABLE');
  });

  test('Should reject vehicle creation as DISPATCHER (RBAC check)', async () => {
    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Cookie', dispatcherCookie)
      .send(testVehicle);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('Should reject vehicle creation with duplicate registrationNumber', async () => {
    await Vehicle.create(testVehicle);

    const res = await request(app)
      .post('/api/v1/vehicles')
      .set('Cookie', managerCookie)
      .send(testVehicle);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_REGISTRATION');
  });

  test('Should update vehicle details as FLEET_MANAGER', async () => {
    const vehicle = await Vehicle.create(testVehicle);

    const res = await request(app)
      .patch(`/api/v1/vehicles/${vehicle._id}`)
      .set('Cookie', managerCookie)
      .send({ name: 'Updated Delivery Van', maximumLoadCapacity: 1000 });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicle.name).toBe('Updated Delivery Van');
    expect(res.body.data.vehicle.maximumLoadCapacity).toBe(1000);
  });

  test('Should retrieve vehicle details', async () => {
    const vehicle = await Vehicle.create(testVehicle);

    const res = await request(app)
      .get(`/api/v1/vehicles/${vehicle._id}`)
      .set('Cookie', dispatcherCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicle.registrationNumber).toBe(testVehicle.registrationNumber);
  });

  test('Should list vehicles with filters, search, and pagination', async () => {
    await Vehicle.create(testVehicle);
    await Vehicle.create({
      ...testVehicle,
      registrationNumber: 'MH-12-CD-5678',
      name: 'Cargo Truck 02',
      type: 'Truck',
      region: 'North',
    });

    // 1. Filter by type
    let res = await request(app)
      .get('/api/v1/vehicles?type=Truck')
      .set('Cookie', dispatcherCookie);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.vehicles.length).toBe(1);
    expect(res.body.data.vehicles[0].type).toBe('Truck');

    // 2. Search query matching 'Van'
    res = await request(app)
      .get('/api/v1/vehicles?search=Van')
      .set('Cookie', dispatcherCookie);
    expect(res.body.data.vehicles.length).toBe(1);
    expect(res.body.data.vehicles[0].name).toContain('Van');
  });

  test('Should retire a vehicle successfully', async () => {
    const vehicle = await Vehicle.create(testVehicle);

    const res = await request(app)
      .post(`/api/v1/vehicles/${vehicle._id}/retire`)
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.vehicle.status).toBe('RETIRED');
  });

  test('Should block retirement of a vehicle that is currently ON_TRIP', async () => {
    const vehicle = await Vehicle.create({
      ...testVehicle,
      status: 'ON_TRIP',
    });

    const res = await request(app)
      .post(`/api/v1/vehicles/${vehicle._id}/retire`)
      .set('Cookie', managerCookie);

    expect(res.statusCode).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('currently on a trip');
  });
});
