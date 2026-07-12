const express = require('express');
const {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  retireVehicle,
} = require('./vehicle.controller');
const { protect, restrictTo } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const {
  createVehicleSchema,
  updateVehicleSchema,
  queryVehicleSchema,
} = require('./vehicle.validation');

const router = express.Router();

// Protect all vehicle endpoints
router.use(protect);

router
  .route('/')
  .post(restrictTo('FLEET_MANAGER'), validate(createVehicleSchema), createVehicle)
  .get(validate(queryVehicleSchema), getVehicles);

router
  .route('/:id')
  .get(getVehicleById)
  .patch(restrictTo('FLEET_MANAGER'), validate(updateVehicleSchema), updateVehicle);

router.post('/:id/retire', restrictTo('FLEET_MANAGER'), retireVehicle);

module.exports = router;
