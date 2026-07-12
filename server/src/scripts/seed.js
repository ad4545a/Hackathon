require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/users/user.model');

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

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Delete existing users
    await User.deleteMany({});
    console.log('Cleared existing users.');

    // Create users (pre-save hook will hash passwords)
    for (const user of seedUsers) {
      await User.create(user);
    }
    console.log(`Successfully seeded ${seedUsers.length} users.`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
