const express = require('express');
const {
  getFleetUtilization,
  getFuelEfficiency,
  getOperationalCost,
  getVehicleROI,
} = require('./analytics.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');

const router = express.Router();

router.get(
  '/fleet-utilization',
  protect,
  restrictTo('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'),
  getFleetUtilization
);

router.get(
  '/fuel-efficiency',
  protect,
  restrictTo('FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'),
  getFuelEfficiency
);

router.get(
  '/operational-cost',
  protect,
  restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  getOperationalCost
);

router.get(
  '/vehicle-roi',
  protect,
  restrictTo('FLEET_MANAGER', 'FINANCIAL_ANALYST'),
  getVehicleROI
);

module.exports = router;
