const FuelLog = require('./fuel.model');

class FuelLogRepository {
  async create(data) {
    return await FuelLog.create(data);
  }

  async find(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { date: -1 } } = options;
    return await FuelLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countDocuments(filter = {}) {
    return await FuelLog.countDocuments(filter).exec();
  }
}

module.exports = new FuelLogRepository();
