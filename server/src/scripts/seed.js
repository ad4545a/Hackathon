require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/users/user.model');
const Driver = require('../models/Driver');
const Vehicle = require('../modules/vehicles/vehicle.model');
const Expense = require('../models/Expense');
const FuelLog = require('../modules/fuel/fuel.model');

const seedExpenses = (vehicles, users) => [
  {
    vehicleId: vehicles[0]._id, // Van-05
    type: 'TOLL',
    amount: 45,
    description: 'Highway toll charge for Route 5',
    date: new Date('2026-07-10'),
    createdBy: users[0]._id, // John Manager
  },
  {
    vehicleId: vehicles[1]._id, // Truck-12
    type: 'REPAIR',
    amount: 320,
    description: 'Brake pad replacement',
    date: new Date('2026-07-09'),
    createdBy: users[0]._id,
  },
  {
    vehicleId: vehicles[2]._id, // Sedan-01
    type: 'OTHER',
    amount: 15,
    description: 'Car wash and cleaning',
    date: new Date('2026-07-11'),
    createdBy: users[0]._id,
  },
];

const seedFuelLogs = (vehicles, users) => [
  {
    vehicleId: vehicles[0]._id,
    liters: 40,
    cost: 120,
    odometer: 12100,
    date: new Date('2026-07-10'),
    createdBy: users[0]._id,
  },
  {
    vehicleId: vehicles[1]._id,
    liters: 120,
    cost: 360,
    odometer: 45200,
    date: new Date('2026-07-09'),
    createdBy: users[0]._id,
  },
];

const seedVehicles = [
  {
    registrationNumber: 'MH-12-AB-0005',
    name: 'Van-05',
    model: 'Tata Super Ace',
    type: 'Van',
    maximumLoadCapacity: 500,
    odometer: 12000,
    acquisitionCost: 8000,
    region: 'North',
    status: 'AVAILABLE',
  },
  {
    registrationNumber: 'MH-12-XY-1212',
    name: 'Truck-12',
    model: 'Eicher Pro',
    type: 'Truck',
    maximumLoadCapacity: 5000,
    odometer: 45000,
    acquisitionCost: 28000,
    region: 'West',
    status: 'AVAILABLE',
  },
  {
    registrationNumber: 'MH-12-PQ-9999',
    name: 'Sedan-01',
    model: 'Maruti Dzire',
    type: 'Sedan',
    maximumLoadCapacity: 350,
    odometer: 80000,
    acquisitionCost: 10000,
    region: 'South',
    status: 'AVAILABLE',
  },
];

const seedUsers = [
  {
    name: 'John Manager',
    email: 'manager@transitops.com',
    password: 'Password123!',
    role: 'FLEET_MANAGER',
  },
  {
    name: 'Alice Dispatcher',
    email: 'dispatcher@transitops.com',
    password: 'Password123!',
    role: 'DISPATCHER',
  },
  {
    name: 'Bob Safety',
    email: 'safety@transitops.com',
    password: 'Password123!',
    role: 'SAFETY_OFFICER',
  },
  {
    name: 'Charlie Finance',
    email: 'finance@transitops.com',
    password: 'Password123!',
    role: 'FINANCIAL_ANALYST',
  },
];

const seedDrivers = [
  {
    name: 'Alex Expired',
    license_number: 'DL-EXP12345',
    license_category: 'Heavy Truck',
    license_expiry_date: new Date('2026-06-01'), // Expired (relative to current date 2026-07-12)
    contact_number: '+15550101',
    safety_score: 85,
    status: 'Available',
    region: 'North',
  },
  {
    name: 'Bob Suspended',
    license_number: 'DL-SUS67890',
    license_category: 'Light Commercial',
    license_expiry_date: new Date('2027-10-15'),
    contact_number: '+15550102',
    safety_score: 45,
    status: 'Suspended',
    region: 'East',
  },
  {
    name: 'Charlie Active',
    license_number: 'DL-ONT11223',
    license_category: 'Heavy Truck',
    license_expiry_date: new Date('2028-04-20'),
    contact_number: '+15550103',
    safety_score: 95,
    status: 'On Trip',
    region: 'West',
  },
  {
    name: 'David Available',
    license_number: 'DL-AVL44556',
    license_category: 'Heavy Truck',
    license_expiry_date: new Date('2027-12-01'),
    contact_number: '+15550104',
    safety_score: 98,
    status: 'Available',
    region: 'South',
  },
  {
    name: 'Eva Available',
    license_number: 'DL-AVL77889',
    license_category: 'Light Commercial',
    license_expiry_date: new Date('2027-08-30'),
    contact_number: '+15550105',
    safety_score: 92,
    status: 'Available',
    region: 'North',
  },
  {
    name: 'Frank Available',
    license_number: 'DL-AVL99001',
    license_category: 'Heavy Truck',
    license_expiry_date: new Date('2026-11-15'),
    contact_number: '+15550106',
    safety_score: 89,
    status: 'Available',
    region: 'West',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Delete existing users
    await User.deleteMany({});
    console.log('Cleared existing users.');

    // Create users (pre-save hook will hash passwords)
    const createdUsers = [];
    for (const user of seedUsers) {
      const u = await User.create(user);
      createdUsers.push(u);
    }
    console.log(`Successfully seeded ${seedUsers.length} users.`);

    // Delete existing drivers
    await Driver.deleteMany({});
    console.log('Cleared existing drivers.');

    // Create drivers (pre-save hook handles status history)
    for (const driver of seedDrivers) {
      await Driver.create(driver);
    }
    console.log(`Successfully seeded ${seedDrivers.length} drivers.`);

    // Delete existing vehicles
    await Vehicle.deleteMany({});
    console.log('Cleared existing vehicles.');

    // Create vehicles
    const createdVehicles = [];
    for (const vehicle of seedVehicles) {
      const v = await Vehicle.create(vehicle);
      createdVehicles.push(v);
    }
    console.log(`Successfully seeded ${seedVehicles.length} vehicles.`);

    // Clear and seed fuel logs
    await FuelLog.deleteMany({});
    for (const fl of seedFuelLogs(createdVehicles, createdUsers)) {
      await FuelLog.create(fl);
    }
    console.log('Successfully seeded fuel logs.');

    // Clear and seed expenses
    await Expense.deleteMany({});
    for (const exp of seedExpenses(createdVehicles, createdUsers)) {
      await Expense.create(exp);
    }
    console.log('Successfully seeded expenses.');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
