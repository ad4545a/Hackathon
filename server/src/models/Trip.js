const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, 'Source location is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination location is required'],
      trim: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      required: [true, 'Driver reference is required'],
    },
    cargo_weight: {
      type: Number,
      required: [true, 'Cargo weight is required'],
      min: [0, 'Cargo weight must be a positive number'],
    },
    planned_distance: {
      type: Number,
      required: [true, 'Planned distance is required'],
      min: [0, 'Planned distance must be a positive number'],
    },
    actual_distance: {
      type: Number,
      min: [0, 'Actual distance must be a positive number'],
    },
    fuel_consumed: {
      type: Number,
      min: [0, 'Fuel consumed must be a positive number'],
    },
    status: {
      type: String,
      enum: {
        values: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
        message: '{VALUE} is not a valid trip status',
      },
      default: 'Draft',
    },
    dispatched_at: {
      type: Date,
    },
    completed_at: {
      type: Date,
    },
    cancelled_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
