const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['FUEL', 'TOLL', 'MAINTENANCE', 'REPAIR', 'OTHER'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be non-negative'],
    },
    description: {
      type: String,
      required: true,
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
expenseSchema.index({ vehicleId: 1 });
expenseSchema.index({ date: 1 });

const Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

module.exports = Expense;
