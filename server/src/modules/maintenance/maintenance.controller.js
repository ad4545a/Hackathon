const maintenanceService = require('./maintenance.service');

const startMaintenance = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const maintenance = await maintenanceService.startMaintenance(req.body, userId);
    res.status(201).json({
      success: true,
      data: maintenance,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const completeMaintenance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await maintenanceService.completeMaintenance(id, req.body, req.user._id);
    res.status(200).json({
      success: true,
      data: result,
      meta: {},
    });
  } catch (error) {
    next(error);
  }
};

const getMaintenanceLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.vehicleId) {
      filter.vehicleId = req.query.vehicleId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const { logs, total } = await maintenanceService.getMaintenanceLogs(filter, {
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
  startMaintenance,
  completeMaintenance,
  getMaintenanceLogs,
};
