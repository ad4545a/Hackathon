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

const router = express.Router();

router.get('/', getDrivers);
router.get('/available', getAvailableDrivers);
router.get('/:id', getDriverById);
router.post('/', createDriver);
router.put('/:id', updateDriver);
router.delete('/:id', softDeleteDriver);
router.patch('/:id/status', updateDriverStatus);

module.exports = router;
