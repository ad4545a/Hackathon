const express = require('express');
const {
  createTrip,
  getTrips,
  getTripById,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} = require('../controllers/tripController');
const { protect, restrictTo } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // Require login for all trip operations

router.post('/', restrictTo('DISPATCHER'), createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);
router.patch('/:id/dispatch', restrictTo('DISPATCHER'), dispatchTrip);
router.patch('/:id/complete', restrictTo('DISPATCHER'), completeTrip);
router.patch('/:id/cancel', restrictTo('DISPATCHER'), cancelTrip);

module.exports = router;
