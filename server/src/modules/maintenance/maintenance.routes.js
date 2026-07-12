const express = require('express');
const {
  startMaintenance,
  completeMaintenance,
  getMaintenanceLogs,
} = require('./maintenance.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  createMaintenanceSchema,
  completeMaintenanceSchema,
} = require('./maintenance.validation');

const router = express.Router();

router.post(
  '/',
  protect,
  restrictTo('FLEET_MANAGER'),
  validate(createMaintenanceSchema),
  startMaintenance
);

router.get('/', protect, getMaintenanceLogs);

router.post(
  '/:id/complete',
  protect,
  restrictTo('FLEET_MANAGER'),
  validate(completeMaintenanceSchema),
  completeMaintenance
);

module.exports = router;
