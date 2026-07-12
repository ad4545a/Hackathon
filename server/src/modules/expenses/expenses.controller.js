const expenseService = require('./expenses.service');

const createExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const expense = await expenseService.createExpense(req.body, userId);
    res.status(201).json({
      success: true,
      data: expense,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.vehicleId) {
      filter.vehicleId = req.query.vehicleId;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const { expenses, total } = await expenseService.getExpenses(filter, {
      skip,
      limit,
    });

    res.status(200).json({
      success: true,
      data: expenses,
      meta: {
        total,
        page,
        limit,
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
