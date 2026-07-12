const Vehicle = require('./vehicle.model');

class VehicleRepository {
  async create(vehicleData) {
    return await Vehicle.create(vehicleData);
  }

  async findById(id) {
    return await Vehicle.findById(id);
  }

  async findByRegistrationNumber(registrationNumber) {
    return await Vehicle.findOne({ registrationNumber });
  }

  async update(id, updateData) {
    return await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async findAndPaginate(queryParams) {
    const { status, type, region, search, sortBy, sortOrder, page, limit } = queryParams;

    const query = {};

    // Filters
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }
    if (region) {
      query.region = { $regex: region, $options: 'i' };
    }

    // Search query matching multiple fields
    if (search) {
      query.$or = [
        { registrationNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination calculations
    const skip = (page - 1) * limit;

    const total = await Vehicle.countDocuments(query);
    const vehicles = await Vehicle.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return {
      vehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = new VehicleRepository();
