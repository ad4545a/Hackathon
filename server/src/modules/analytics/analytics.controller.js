const analyticsService = require('./analytics.service');

const getFleetUtilization = async (req, res, next) => {
  try {
    const { vehicleType, region } = req.query;
    const data = await analyticsService.getFleetUtilization({ vehicleType, region });
    res.status(200).json({
      success: true,
      data,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getFuelEfficiency = async (req, res, next) => {
  try {
    const { vehicleId, vehicleType, region, startDate, endDate } = req.query;
    const data = await analyticsService.getFuelEfficiency({
      vehicleId,
      vehicleType,
      region,
      startDate,
      endDate,
    });
    res.status(200).json({
      success: true,
      data,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getOperationalCost = async (req, res, next) => {
  try {
    const { vehicleId, vehicleType, region, startDate, endDate } = req.query;
    const data = await analyticsService.getOperationalCost({
      vehicleId,
      vehicleType,
      region,
      startDate,
      endDate,
    });
    res.status(200).json({
      success: true,
      data,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getVehicleROI = async (req, res, next) => {
  try {
    const { vehicleId, vehicleType, region, startDate, endDate } = req.query;
    const data = await analyticsService.getVehicleROI({
      vehicleId,
      vehicleType,
      region,
      startDate,
      endDate,
    });
    res.status(200).json({
      success: true,
      data,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFleetUtilization,
  getFuelEfficiency,
  getOperationalCost,
  getVehicleROI,
};
