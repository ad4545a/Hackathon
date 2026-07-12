const Trip = require('../models/Trip');
const Vehicle = require('../modules/vehicles/vehicle.model');
const Driver = require('../models/Driver');
const { isDriverEligible } = require('../utils/driverEligibility');
const { NotFoundError, AppError } = require('../shared/errors/customErrors');

// POST /api/trips - Create trip in Draft status
const createTrip = async (req, res, next) => {
  try {
    const { source, destination, vehicle, driver, cargo_weight, planned_distance } = req.body;

    // Validate body presence
    if (!source || !destination || !vehicle || !driver || cargo_weight === undefined || planned_distance === undefined) {
      return next(new AppError('Missing required fields: source, destination, vehicle, driver, cargo_weight, planned_distance are all required', 400, 'BAD_REQUEST'));
    }

    // 1. Validate Vehicle exists and is AVAILABLE
    const dbVehicle = await Vehicle.findById(vehicle);
    if (!dbVehicle) {
      return next(new AppError('Vehicle not found', 400, 'BAD_REQUEST'));
    }
    if (dbVehicle.status !== 'AVAILABLE') {
      return next(new AppError(`Vehicle is not available (status: ${dbVehicle.status})`, 400, 'BAD_REQUEST'));
    }

    // 2. Validate Driver exists and passes isDriverEligible check
    const dbDriver = await Driver.findById(driver);
    if (!dbDriver) {
      return next(new AppError('Driver not found', 400, 'BAD_REQUEST'));
    }
    if (!isDriverEligible(dbDriver)) {
      const isExpired = new Date(dbDriver.license_expiry_date) <= new Date();
      return next(new AppError(`Driver is not eligible (status: ${dbDriver.status}, license expired: ${isExpired})`, 400, 'BAD_REQUEST'));
    }

    // 3. Validate cargo_weight <= vehicle.maximumLoadCapacity
    if (cargo_weight <= 0) {
      return next(new AppError('Cargo weight must be a positive number', 400, 'BAD_REQUEST'));
    }
    if (cargo_weight > dbVehicle.maximumLoadCapacity) {
      return next(new AppError(`Cargo weight ${cargo_weight} exceeds vehicle maximum load capacity ${dbVehicle.maximumLoadCapacity}`, 400, 'BAD_REQUEST'));
    }

    // 4. Validate planned_distance is a positive number
    if (planned_distance <= 0) {
      return next(new AppError('Planned distance must be a positive number', 400, 'BAD_REQUEST'));
    }

    // All validations pass -> Create in 'Draft' status
    const newTrip = await Trip.create({
      source,
      destination,
      vehicle,
      driver,
      cargo_weight,
      planned_distance,
      status: 'Draft',
    });

    // Populate and return
    const populatedTrip = await Trip.findById(newTrip._id)
      .populate('vehicle', 'registrationNumber name model maximumLoadCapacity status region')
      .populate('driver', 'name license_number contact_number status');

    res.status(201).json({
      success: true,
      data: populatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/trips - list all, supporting query parameters status & region
const getTrips = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;

    if (req.query.region) {
      // Find all vehicle IDs in the specified region
      const vehicles = await Vehicle.find({ region: req.query.region }).select('_id');
      const vehicleIds = vehicles.map((v) => v._id);
      query.vehicle = { $in: vehicleIds };
    }

    const trips = await Trip.find(query)
      .populate('vehicle', 'registrationNumber name model maximumLoadCapacity status region')
      .populate('driver', 'name license_number contact_number status');

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/trips/:id - get one trip, populated
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle', 'registrationNumber name model maximumLoadCapacity status region')
      .populate('driver', 'name license_number contact_number status');

    if (!trip) {
      return next(new NotFoundError(`Trip with ID ${req.params.id} not found`));
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
};
