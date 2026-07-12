require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Driver = require('../models/Driver');

beforeAll(async () => {
  let dbURI = process.env.MONGODB_URI 
    ? process.env.MONGODB_URI.replace('/transitops', '/transitops_test') 
    : 'mongodb://localhost:27017/transitops_test';

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
  await Driver.deleteMany({});
});

describe('Driver REST API Endpoints', () => {
  const sampleDriver = {
    name: 'John Doe',
    license_number: 'DL-12345678',
    license_category: 'Heavy Truck',
    license_expiry_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year in future
    contact_number: '+15550100',
    safety_score: 95,
    status: 'Available',
    region: 'North',
  };

  describe('POST /api/drivers', () => {
    test('Should create a new driver successfully with valid data', async () => {
      const res = await request(app)
        .post('/api/drivers')
        .send(sampleDriver);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(sampleDriver.name);
      expect(res.body.data.license_number).toBe(sampleDriver.license_number);
    });

    test('Should fail if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/drivers')
        .send({ name: 'Only Name' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Should fail with 409 Conflict if duplicate license_number is submitted', async () => {
      await Driver.create(sampleDriver);

      const res = await request(app)
        .post('/api/drivers')
        .send(sampleDriver);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/drivers', () => {
    test('Should list all drivers', async () => {
      await Driver.create(sampleDriver);
      await Driver.create({
        ...sampleDriver,
        license_number: 'DL-87654321',
        name: 'Jane Smith',
      });

      const res = await request(app).get('/api/drivers');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data.length).toBe(2);
    });

    test('Should filter drivers by status and region', async () => {
      await Driver.create({ ...sampleDriver, status: 'Available', region: 'North' });
      await Driver.create({ ...sampleDriver, license_number: 'DL-87654321', status: 'Suspended', region: 'North' });
      await Driver.create({ ...sampleDriver, license_number: 'DL-11112222', status: 'Available', region: 'South' });

      const res = await request(app).get('/api/drivers?status=Available&region=North');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /api/drivers/available', () => {
    test('Should only return Available drivers with non-expired licenses', async () => {
      // 1. Valid driver
      await Driver.create({ ...sampleDriver, name: 'Valid Driver', license_number: 'DL-VALID' });
      // 2. Suspended driver
      await Driver.create({ ...sampleDriver, name: 'Suspended Driver', license_number: 'DL-SUS', status: 'Suspended' });
      // 3. Expired license driver
      await Driver.create({ 
        ...sampleDriver, 
        name: 'Expired Driver', 
        license_number: 'DL-EXP', 
        license_expiry_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) // 10 days ago
      });

      const res = await request(app).get('/api/drivers/available');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].name).toBe('Valid Driver');
    });
  });

  describe('GET /api/drivers/:id', () => {
    test('Should return driver by ID', async () => {
      const driver = await Driver.create(sampleDriver);

      const res = await request(app).get(`/api/drivers/${driver._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(driver.name);
    });

    test('Should return 404 if driver ID not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/drivers/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/drivers/:id', () => {
    test('Should update driver fields', async () => {
      const driver = await Driver.create(sampleDriver);

      const res = await request(app)
        .put(`/api/drivers/${driver._id}`)
        .send({ name: 'John Updated', safety_score: 99 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('John Updated');
      expect(res.body.data.safety_score).toBe(99);
    });
  });

  describe('DELETE /api/drivers/:id', () => {
    test('Should soft-delete driver by setting status to Off Duty', async () => {
      const driver = await Driver.create(sampleDriver);

      const res = await request(app).delete(`/api/drivers/${driver._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Off Duty');
    });
  });

  describe('PATCH /api/drivers/:id/status', () => {
    test('Should update status and push entry into status_history', async () => {
      const driver = await Driver.create(sampleDriver);

      const res = await request(app)
        .patch(`/api/drivers/${driver._id}/status`)
        .send({ status: 'Suspended' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Suspended');
      expect(res.body.data.status_history.length).toBe(2);
      expect(res.body.data.status_history[1].status).toBe('Suspended');
    });
  });
});
