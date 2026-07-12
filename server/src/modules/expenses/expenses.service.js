const expenseRepository = require('./expenses.repository');
const Vehicle = require('../vehicles/vehicle.model');
const { NotFoundError } = require('../../shared/errors/customErrors');

class ExpenseService {
  async createExpense(data, userId) {
    // 1. Check if vehicle exists
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID ${data.vehicleId} not found`);
    }

    // 2. Prepare expense data
    const expenseData = {
      ...data,
      createdBy: userId,
    };

    // 3. Create expense
    return await expenseRepository.create(expenseData);
  }

  async getExpenses(filter = {}, options = {}) {
    const expenses = await expenseRepository.find(filter, options);
    const total = await expenseRepository.countDocuments(filter);
    return { expenses, total };
  }
}

module.exports = new ExpenseService();
