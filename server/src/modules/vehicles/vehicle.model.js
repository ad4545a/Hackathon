const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true,
    },
    maximumLoadCapacity: {
      type: Number,
      required: [true, 'Maximum load capacity is required'],
      min: [0, 'Maximum load capacity must be a positive number'],
    },
    odometer: {
      type: Number,
      required: [true, 'Odometer reading is required'],
      min: [0, 'Odometer reading cannot be negative'],
      default: 0,
    },
    acquisitionCost: {
      type: Number,
      required: [true, 'Acquisition cost is required'],
      min: [0, 'Acquisition cost must be a positive number'],
    },
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'],
        message: '{VALUE} is not a valid vehicle status',
      },
      default: 'AVAILABLE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
