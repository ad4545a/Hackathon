const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Driver name is required'],
      trim: true,
    },
    license_number: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      index: true,
      trim: true,
    },
    license_category: {
      type: String,
      required: [true, 'License category is required'],
      trim: true,
    },
    license_expiry_date: {
      type: Date,
      required: [true, 'License expiry date is required'],
    },
    contact_number: {
      type: String,
      required: [true, 'Contact number is required'],
      trim: true,
    },
    safety_score: {
      type: Number,
      default: 100,
      min: [0, 'Safety score cannot be less than 0'],
      max: [100, 'Safety score cannot be more than 100'],
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
        message: '{VALUE} is not a valid status',
      },
      default: 'Available',
    },
    region: {
      type: String,
      trim: true,
    },
    status_history: [
      {
        status: {
          type: String,
          enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
          required: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to add the initial status to status_history if it is empty or updated
driverSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('status')) {
    if (!this.status_history) {
      this.status_history = [];
    }
    const lastHistory = this.status_history[this.status_history.length - 1];
    if (!lastHistory || lastHistory.status !== this.status) {
      this.status_history.push({
        status: this.status,
        changedAt: new Date(),
      });
    }
  }
  next();
});

const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
