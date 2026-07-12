const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    liters: {
      type: Number,
      required: true,
      min: [0.001, 'Liters must be greater than 0'],
    },
    cost: {
      type: Number,
      required: true,
      min: [0, 'Cost must be non-negative'],
    },
    odometer: {
      type: Number,
      required: true,
      min: [0, 'Odometer must be non-negative'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
fuelLogSchema.index({ vehicleId: 1 });
fuelLogSchema.index({ date: 1 });

const FuelLog = mongoose.model('FuelLog', fuelLogSchema);

module.exports = FuelLog;
