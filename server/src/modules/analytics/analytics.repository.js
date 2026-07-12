const mongoose = require('mongoose');
const Vehicle = require('../vehicles/vehicle.model');
const Trip = require('../trips/trip.model');
const FuelLog = require('../fuel/fuel.model');
const Maintenance = require('../maintenance/maintenance.model');
const Expense = require('../expenses/expenses.model');

class AnalyticsRepository {
  async getFleetUtilization(filters = {}) {
    const { vehicleType, region } = filters;
    const match = { status: { $ne: 'RETIRED' } };
    if (vehicleType) match.vehicleType = vehicleType;
    if (region) match.region = region;

    const result = await Vehicle.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalActive: { $sum: 1 },
          totalOnTrip: {
            $sum: { $cond: [{ $eq: ['$status', 'ON_TRIP'] }, 1, 0] },
          },
        },
      },
    ]);

    if (!result || result.length === 0) {
      return { totalActive: 0, totalOnTrip: 0, utilizationRate: 0 };
    }

    const { totalActive, totalOnTrip } = result[0];
    const utilizationRate = totalActive > 0 ? (totalOnTrip / totalActive) * 100 : 0;

    return { totalActive, totalOnTrip, utilizationRate };
  }

  async getFuelEfficiency(filters = {}) {
    const { vehicleId, vehicleType, region, startDate, endDate } = filters;

    // 1. Calculate total distance from completed trips
    const tripMatch = { status: 'COMPLETED' };
    if (vehicleId) tripMatch.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    if (startDate || endDate) {
      tripMatch.endDate = {};
      if (startDate) tripMatch.endDate.$gte = new Date(startDate);
      if (endDate) tripMatch.endDate.$lte = new Date(endDate);
    }

    const tripPipeline = [{ $match: tripMatch }];
    tripPipeline.push(
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' }
    );

    if (vehicleType) tripPipeline.push({ $match: { 'vehicle.vehicleType': vehicleType } });
    if (region) tripPipeline.push({ $match: { 'vehicle.region': region } });

    tripPipeline.push({
      $group: {
        _id: null,
        totalDistance: { $sum: '$distance' },
      },
    });

    const [tripResult] = await Trip.aggregate(tripPipeline);
    const totalDistance = tripResult?.totalDistance || 0;

    // 2. Calculate total fuel consumed
    const fuelMatch = {};
    if (vehicleId) fuelMatch.vehicleId = new mongoose.Types.ObjectId(vehicleId);
    if (startDate || endDate) {
      fuelMatch.date = {};
      if (startDate) fuelMatch.date.$gte = new Date(startDate);
      if (endDate) fuelMatch.date.$lte = new Date(endDate);
    }

    const fuelPipeline = [{ $match: fuelMatch }];
    fuelPipeline.push(
      {
        $lookup: {
          from: 'vehicles',
          localField: 'vehicleId',
          foreignField: '_id',
          as: 'vehicle',
        },
      },
      { $unwind: '$vehicle' }
    );

    if (vehicleType) fuelPipeline.push({ $match: { 'vehicle.vehicleType': vehicleType } });
    if (region) fuelPipeline.push({ $match: { 'vehicle.region': region } });

    fuelPipeline.push({
      $group: {
        _id: null,
        totalFuel: { $sum: '$liters' },
      },
    });

    const [fuelResult] = await FuelLog.aggregate(fuelPipeline);
    const totalFuel = fuelResult?.totalFuel || 0;

    const efficiency = totalFuel > 0 ? totalDistance / totalFuel : 0;

    return { totalDistance, totalFuel, efficiency };
  }

  async getOperationalCost(filters = {}) {
    const { vehicleId, vehicleType, region, startDate, endDate } = filters;

    // Build common filter parameters helper
    const buildPipeline = (matchObj, dateField) => {
      if (vehicleId) matchObj.vehicleId = new mongoose.Types.ObjectId(vehicleId);
      if (startDate || endDate) {
        matchObj[dateField] = {};
        if (startDate) matchObj[dateField].$gte = new Date(startDate);
        if (endDate) matchObj[dateField].$lte = new Date(endDate);
      }

      const pipeline = [{ $match: matchObj }];
      pipeline.push(
        {
          $lookup: {
            from: 'vehicles',
            localField: 'vehicleId',
            foreignField: '_id',
            as: 'vehicle',
          },
        },
        { $unwind: '$vehicle' }
      );

      if (vehicleType) pipeline.push({ $match: { 'vehicle.vehicleType': vehicleType } });
      if (region) pipeline.push({ $match: { 'vehicle.region': region } });

      return pipeline;
    };

    // 1. Sum Fuel Cost
    const fuelPipeline = buildPipeline({}, 'date');
    fuelPipeline.push({ $group: { _id: null, total: { $sum: '$cost' } } });
    const [fuelRes] = await FuelLog.aggregate(fuelPipeline);
    const fuelCost = fuelRes?.total || 0;

    // 2. Sum Maintenance Cost (Completed only)
    const maintPipeline = buildPipeline({ status: 'COMPLETED' }, 'completionDate');
    maintPipeline.push({ $group: { _id: null, total: { $sum: '$cost' } } });
    const [maintRes] = await Maintenance.aggregate(maintPipeline);
    const maintenanceCost = maintRes?.total || 0;

    // 3. Sum non-duplicated Expenses (TOLL, REPAIR, OTHER)
    const expensePipeline = buildPipeline({ type: { $in: ['TOLL', 'REPAIR', 'OTHER'] } }, 'date');
    expensePipeline.push({ $group: { _id: null, total: { $sum: '$amount' } } });
    const [expenseRes] = await Expense.aggregate(expensePipeline);
    const otherExpenseCost = expenseRes?.total || 0;

    const totalOperationalCost = fuelCost + maintenanceCost + otherExpenseCost;

    return {
      fuelCost,
      maintenanceCost,
      otherExpenseCost,
      totalOperationalCost,
    };
  }

  async getVehicleROI(filters = {}) {
    const { vehicleId, vehicleType, region, startDate, endDate } = filters;

    // Build vehicle query
    const vehicleQuery = {};
    if (vehicleId) vehicleQuery._id = new mongoose.Types.ObjectId(vehicleId);
    if (vehicleType) vehicleQuery.vehicleType = vehicleType;
    if (region) vehicleQuery.region = region;

    const vehicles = await Vehicle.find(vehicleQuery);
    if (!vehicles || vehicles.length === 0) {
      return [];
    }

    const roiReports = [];

    for (const vehicle of vehicles) {
      // 1. Revenue from completed trips
      const tripMatch = { vehicleId: vehicle._id, status: 'COMPLETED' };
      if (startDate || endDate) {
        tripMatch.endDate = {};
        if (startDate) tripMatch.endDate.$gte = new Date(startDate);
        if (endDate) tripMatch.endDate.$lte = new Date(endDate);
      }
      const [tripRes] = await Trip.aggregate([
        { $match: tripMatch },
        { $group: { _id: null, total: { $sum: '$revenue' } } },
      ]);
      const revenue = tripRes?.total || 0;

      // 2. Fuel cost
      const fuelMatch = { vehicleId: vehicle._id };
      if (startDate || endDate) {
        fuelMatch.date = {};
        if (startDate) fuelMatch.date.$gte = new Date(startDate);
        if (endDate) fuelMatch.date.$lte = new Date(endDate);
      }
      const [fuelRes] = await FuelLog.aggregate([
        { $match: fuelMatch },
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]);
      const fuelCost = fuelRes?.total || 0;

      // 3. Maintenance cost
      const maintMatch = { vehicleId: vehicle._id, status: 'COMPLETED' };
      if (startDate || endDate) {
        maintMatch.completionDate = {};
        if (startDate) maintMatch.completionDate.$gte = new Date(startDate);
        if (endDate) maintMatch.completionDate.$lte = new Date(endDate);
      }
      const [maintRes] = await Maintenance.aggregate([
        { $match: maintMatch },
        { $group: { _id: null, total: { $sum: '$cost' } } },
      ]);
      const maintenanceCost = maintRes?.total || 0;

      const netProfit = revenue - (fuelCost + maintenanceCost);
      const acquisitionCost = vehicle.acquisitionCost || 50000;
      const roi = (netProfit / acquisitionCost) * 100;

      roiReports.push({
        vehicleId: vehicle._id,
        plateNumber: vehicle.plateNumber,
        revenue,
        fuelCost,
        maintenanceCost,
        netProfit,
        acquisitionCost,
        roiPercent: roi,
      });
    }

    return roiReports;
  }
}

module.exports = new AnalyticsRepository();
