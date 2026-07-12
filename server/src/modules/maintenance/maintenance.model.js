const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    maintenanceType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completionDate: {
      type: Date,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
      required: true,
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
maintenanceSchema.index({ vehicleId: 1 });
maintenanceSchema.index({ status: 1 });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

module.exports = Maintenance;
