const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'IN_SHOP', 'ON_TRIP', 'RETIRED'],
      default: 'AVAILABLE',
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
      default: 'Truck',
    },
    region: {
      type: String,
      required: true,
      default: 'North',
    },
    acquisitionCost: {
      type: Number,
      required: true,
      min: 0,
      default: 50000,
    },
  },
  {
    timestamps: true,
  }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
