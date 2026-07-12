const express = require('express');
const { createFuelLog, getFuelLogs } = require('./fuel.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { createFuelLogSchema } = require('./fuel.validation');

const router = express.Router();

router.post(
  '/',
  protect,
  restrictTo('FLEET_MANAGER', 'DISPATCHER'),
  validate(createFuelLogSchema),
  createFuelLog
);

router.get('/', protect, getFuelLogs);

module.exports = router;
