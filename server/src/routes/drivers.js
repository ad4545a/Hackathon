const express = require('express');
const {
  getDrivers,
  getAvailableDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  softDeleteDriver,
  updateDriverStatus,
} = require('../controllers/driverController');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // Require login for all driver operations

router.get('/', getDrivers);
router.get('/available', getAvailableDrivers);
router.get('/:id', getDriverById);
router.post('/', restrictTo('DISPATCHER', 'SAFETY_OFFICER'), createDriver);
router.put('/:id', restrictTo('DISPATCHER', 'SAFETY_OFFICER'), updateDriver);
router.delete('/:id', restrictTo('DISPATCHER', 'SAFETY_OFFICER'), softDeleteDriver);
router.patch('/:id/status', restrictTo('DISPATCHER', 'SAFETY_OFFICER'), updateDriverStatus);

module.exports = router;
