const Expense = require('../models/Expense');
const Vehicle = require('../modules/vehicles/vehicle.model');
const { AppError, NotFoundError } = require('../shared/errors/customErrors');

const createExpense = async (req, res, next) => {
  try {
    const { vehicleId, tripId, type, amount, description, date } = req.body;

    if (!vehicleId || !type || amount === undefined || !description) {
      return next(
        new AppError(
          'Missing required fields: vehicleId, type, amount, description are required',
          400,
          'BAD_REQUEST'
        )
      );
    }

    // Verify vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return next(new NotFoundError('Vehicle not found'));
    }

    const expense = await Expense.create({
      vehicleId,
      tripId: tripId || undefined,
      type,
      amount,
      description,
      date: date || new Date(),
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const { vehicleId, type, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    if (vehicleId) {
      query.vehicleId = vehicleId;
    }
    if (type) {
      query.type = type;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const pPage = parseInt(page, 10) || 1;
    const pLimit = parseInt(limit, 10) || 10;
    const skip = (pPage - 1) * pLimit;

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(pLimit)
      .populate('vehicleId', 'registrationNumber name model')
      .populate('createdBy', 'name role');

    res.status(200).json({
      success: true,
      data: expenses,
      meta: {
        total,
        page: pPage,
        limit: pLimit,
        totalPages: Math.ceil(total / pLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
};
