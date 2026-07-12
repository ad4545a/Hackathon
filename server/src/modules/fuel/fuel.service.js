const fuelLogRepository = require('./fuel.repository');
const Vehicle = require('../vehicles/vehicle.model');
const { NotFoundError } = require('../../shared/errors/customErrors');

class FuelService {
  async createFuelLog(data, userId) {
    // 1. Check if vehicle exists
    const vehicle = await Vehicle.findById(data.vehicleId);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID ${data.vehicleId} not found`);
    }

    // 2. Prepare log data
    const logData = {
      ...data,
      createdBy: userId,
    };

    // 3. Create log
    return await fuelLogRepository.create(logData);
  }

  async getFuelLogs(filter = {}, options = {}) {
    const logs = await fuelLogRepository.find(filter, options);
    const total = await fuelLogRepository.countDocuments(filter);
    return { logs, total };
  }
}

module.exports = new FuelService();
