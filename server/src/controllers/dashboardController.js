const Vehicle = require('../modules/vehicles/vehicle.model');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Maintenance = require('../modules/maintenance/maintenance.model');
const FuelLog = require('../modules/fuel/fuel.model');
const Expense = require('../models/Expense');

const getDashboardSummary = async (req, res, next) => {
  try {
    // 1. Calculate active vehicles, pending trips, active maintenance
    const activeVehiclesCount = await Vehicle.countDocuments({ status: 'ON_TRIP' });
    const pendingDispatchesCount = await Trip.countDocuments({ status: 'Draft' });
    const maintenanceDueCount = await Maintenance.countDocuments({ status: 'ACTIVE' });

    // 2. Calculate total expenses (expenses + maintenance cost + fuel log cost)
    const expenseAgg = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const maintenanceAgg = await Maintenance.aggregate([
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);
    const fuelLogAgg = await FuelLog.aggregate([
      { $group: { _id: null, total: { $sum: '$cost' } } },
    ]);

    const totalExpenseAmount =
      (expenseAgg[0]?.total || 0) +
      (maintenanceAgg[0]?.total || 0) +
      (fuelLogAgg[0]?.total || 0);

    // 3. Dispatch trend (last 7 days counts)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dispatchTrendAgg = await Trip.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      trendMap[dateString] = { day: dayName, dispatches: 0 };
    }

    dispatchTrendAgg.forEach((item) => {
      if (trendMap[item._id]) {
        trendMap[item._id].dispatches = item.count;
      }
    });

    const dispatchTrend = Object.values(trendMap);

    // 4. Vehicle status breakdown
    const vehicleBreakdownAgg = await Vehicle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const breakdownMap = { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 };
    vehicleBreakdownAgg.forEach((item) => {
      breakdownMap[item._id] = item.count;
    });

    const vehicleStatusBreakdown = [
      { status: 'active', count: breakdownMap.ON_TRIP },
      { status: 'idle', count: breakdownMap.AVAILABLE },
      { status: 'maintenance', count: breakdownMap.IN_SHOP },
    ];

    // 5. Recent activity (fetch latest from trips, maintenance, and expenses, merge and sort)
    const recentTrips = await Trip.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('vehicle', 'registrationNumber')
      .populate('driver', 'name');

    const recentMaintenance = await Maintenance.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('vehicleId', 'registrationNumber');

    const recentExpenses = await Expense.find()
      .sort({ date: -1 })
      .limit(3)
      .populate('vehicleId', 'registrationNumber');

    const activities = [];

    recentTrips.forEach((t) => {
      activities.push({
        date: t.createdAt.toISOString().split('T')[0],
        type: 'Dispatch',
        description: `Trip ${t.status} from ${t.source} to ${t.destination} using ${t.vehicle?.registrationNumber || 'N/A'}`,
        status: t.status,
        timestamp: t.createdAt.getTime(),
      });
    });

    recentMaintenance.forEach((m) => {
      activities.push({
        date: m.createdAt.toISOString().split('T')[0],
        type: 'Maintenance',
        description: `${m.maintenanceType} maintenance for ${m.vehicleId?.registrationNumber || 'N/A'} (${m.status})`,
        status: m.status,
        timestamp: m.createdAt.getTime(),
      });
    });

    recentExpenses.forEach((e) => {
      activities.push({
        date: e.date.toISOString().split('T')[0],
        type: 'Expense',
        description: `${e.type} charge logged for ${e.vehicleId?.registrationNumber || 'N/A'}: $${e.amount}`,
        status: 'Logged',
        timestamp: e.date.getTime(),
      });
    });

    activities.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivity = activities.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          activeVehicles: activeVehiclesCount,
          pendingDispatches: pendingDispatchesCount,
          maintenanceDue: maintenanceDueCount,
          totalExpenses: totalExpenseAmount,
        },
        dispatchTrend,
        vehicleStatusBreakdown,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};
