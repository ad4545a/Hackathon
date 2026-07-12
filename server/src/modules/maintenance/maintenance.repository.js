const Maintenance = require('./maintenance.model');

class MaintenanceRepository {
  async create(data, session = null) {
    const options = session ? { session } : {};
    const [maintenance] = await Maintenance.create([data], options);
    return maintenance;
  }

  async findById(id, session = null) {
    const query = Maintenance.findById(id);
    if (session) {
      query.session(session);
    }
    return await query.exec();
  }

  async find(filter = {}, options = {}) {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    return await Maintenance.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countDocuments(filter = {}) {
    return await Maintenance.countDocuments(filter).exec();
  }

  async update(id, updateData, session = null) {
    const options = { new: true, runValidators: true };
    if (session) {
      options.session = session;
    }
    return await Maintenance.findByIdAndUpdate(id, updateData, options).exec();
  }
}

module.exports = new MaintenanceRepository();
