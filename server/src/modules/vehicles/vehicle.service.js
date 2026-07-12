const vehicleRepository = require('./vehicle.repository');
const { ConflictError, NotFoundError, ValidationError } = require('../../shared/errors/customErrors');

class VehicleService {
  async createVehicle(vehicleData) {
    const existing = await vehicleRepository.findByRegistrationNumber(vehicleData.registrationNumber);
    if (existing) {
      throw new ConflictError(
        'A vehicle with this registration number already exists.',
        'DUPLICATE_REGISTRATION'
      );
    }
    return await vehicleRepository.create(vehicleData);
  }

  async getVehicles(queryParams) {
    return await vehicleRepository.findAndPaginate(queryParams);
  }

  async getVehicleById(id) {
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }
    return vehicle;
  }

  async updateVehicle(id, updateData) {
    const vehicle = await this.getVehicleById(id);

    // If changing registration number, verify it is unique
    if (updateData.registrationNumber && updateData.registrationNumber !== vehicle.registrationNumber) {
      const existing = await vehicleRepository.findByRegistrationNumber(updateData.registrationNumber);
      if (existing) {
        throw new ConflictError(
          'A vehicle with this registration number already exists.',
          'DUPLICATE_REGISTRATION'
        );
      }
    }

    return await vehicleRepository.update(id, updateData);
  }

  async retireVehicle(id) {
    const vehicle = await this.getVehicleById(id);

    if (vehicle.status === 'RETIRED') {
      throw new ConflictError('Vehicle is already retired.', 'VEHICLE_ALREADY_RETIRED');
    }

    if (vehicle.status === 'ON_TRIP') {
      throw new ValidationError('Vehicle is currently on a trip and cannot be retired.');
    }

    return await vehicleRepository.update(id, { status: 'RETIRED' });
  }
}

module.exports = new VehicleService();
