const mongoose = require('mongoose');
const maintenanceRepository = require('./maintenance.repository');
const Vehicle = require('../vehicles/vehicle.model');
const { NotFoundError, ConflictError } = require('../../shared/errors/customErrors');

// Helper to check if database is running as a replica set
async function checkReplicaSet() {
  try {
    if (mongoose.connection.readyState !== 1) return false;
    await mongoose.connection.db.admin().command({ replSetGetStatus: 1 });
    return true;
  } catch (e) {
    return false;
  }
}

class MaintenanceService {
  async startMaintenance(data, userId) {
    const isReplicaSet = await checkReplicaSet();
    let session = null;

    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      // 1. Check if vehicle exists
      const vehicle = session 
        ? await Vehicle.findById(data.vehicleId).session(session)
        : await Vehicle.findById(data.vehicleId);
        
      if (!vehicle) {
        throw new NotFoundError(`Vehicle with ID ${data.vehicleId} not found`);
      }

      // 2. Check if vehicle is AVAILABLE
      if (vehicle.status !== 'AVAILABLE') {
        throw new ConflictError(
          `Vehicle is currently ${vehicle.status} and cannot be put into maintenance.`,
          'MAINTENANCE_VEHICLE_NOT_AVAILABLE'
        );
      }

      // 3. Create maintenance record
      const maintenanceData = {
        ...data,
        status: 'ACTIVE',
        createdBy: userId,
      };
      const maintenance = await maintenanceRepository.create(maintenanceData, session);

      // 4. Update vehicle status to IN_SHOP
      vehicle.status = 'IN_SHOP';
      if (session) {
        await vehicle.save({ session });
        await session.commitTransaction();
      } else {
        await vehicle.save();
      }

      return maintenance;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async completeMaintenance(id, completionData, userId) {
    const { completionDate, retireVehicle } = completionData;
    const isReplicaSet = await checkReplicaSet();
    let session = null;

    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      // 1. Check if maintenance record exists
      const maintenance = session
        ? await maintenanceRepository.findById(id, session)
        : await maintenanceRepository.findById(id);

      if (!maintenance) {
        throw new NotFoundError(`Maintenance record with ID ${id} not found`);
      }

      // 2. Check if status is ACTIVE
      if (maintenance.status !== 'ACTIVE') {
        throw new ConflictError(
          `Maintenance is already ${maintenance.status} and cannot be completed.`,
          'MAINTENANCE_NOT_ACTIVE'
        );
      }

      // 3. Update maintenance status to COMPLETED and save completion date
      maintenance.status = 'COMPLETED';
      maintenance.completionDate = completionDate || new Date();
      
      if (session) {
        await maintenance.save({ session });
      } else {
        await maintenance.save();
      }

      // 4. Update Vehicle status
      const vehicle = session
        ? await Vehicle.findById(maintenance.vehicleId).session(session)
        : await Vehicle.findById(maintenance.vehicleId);

      if (!vehicle) {
        throw new NotFoundError(`Vehicle with ID ${maintenance.vehicleId} not found`);
      }

      if (retireVehicle) {
        vehicle.status = 'RETIRED';
      } else {
        vehicle.status = 'AVAILABLE';
      }
      
      if (session) {
        await vehicle.save({ session });
        await session.commitTransaction();
      } else {
        await vehicle.save();
      }
      
      return {
        maintenance,
        vehicleStatus: vehicle.status,
      };
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async getMaintenanceLogs(filter = {}, options = {}) {
    const logs = await maintenanceRepository.find(filter, options);
    const total = await maintenanceRepository.countDocuments(filter);
    return { logs, total };
  }
}

module.exports = new MaintenanceService();
