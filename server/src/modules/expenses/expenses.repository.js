const Expense = require('./expenses.model');

class ExpenseRepository {
  async create(data) {
    return await Expense.create(data);
  }

  async find(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { date: -1 } } = options;
    return await Expense.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('vehicleId', 'registrationNumber name model')
      .populate('createdBy', 'name role')
      .exec();
  }

  async countDocuments(filter = {}) {
    return await Expense.countDocuments(filter).exec();
  }
}

module.exports = new ExpenseRepository();
