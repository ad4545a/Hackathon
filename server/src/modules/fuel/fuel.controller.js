const fuelService = require('./fuel.service');

const createFuelLog = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const fuelLog = await fuelService.createFuelLog(req.body, userId);
    res.status(201).json({
      success: true,
      data: fuelLog,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getFuelLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.vehicleId) {
      filter.vehicleId = req.query.vehicleId;
    }

    const { logs, total } = await fuelService.getFuelLogs(filter, {
      skip,
      limit,
    });

    res.status(200).json({
      success: true,
      data: logs,
      meta: {
        total,
        page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createFuelLog,
  getFuelLogs,
};
