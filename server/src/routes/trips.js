const express = require('express');
const { createTrip, getTrips, getTripById } = require('../controllers/tripController');

const router = express.Router();

router.post('/', createTrip);
router.get('/', getTrips);
router.get('/:id', getTripById);

module.exports = router;
