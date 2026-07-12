const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    type: {
      type: String,
      enum: {
        values: ['FUEL', 'TOLL', 'MAINTENANCE', 'REPAIR', 'OTHER'],
        message: '{VALUE} is not a valid expense type',
      },
      required: [true, 'Expense type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Expense amount cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
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

// Indexes for performance
expenseSchema.index({ vehicleId: 1 });
expenseSchema.index({ date: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
