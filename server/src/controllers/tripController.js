const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Vehicle = require('../modules/vehicles/vehicle.model');
const Driver = require('../models/Driver');
const { isDriverEligible } = require('../utils/driverEligibility');
const { NotFoundError, ConflictError, AppError } = require('../shared/errors/customErrors');

// Helper to run operations in a Mongoose transaction if supported, else fallback to standard execution
const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await callback(session);
    });
    session.endSession();
    return result;
  } catch (error) {
    session.endSession();
    // Catch transaction errors caused by running on a standalone MongoDB without replica set
    const isStandaloneError =
      error.message.includes('Transaction numbers are only allowed') ||
      error.message.includes('replica set') ||
      error.codeName === 'IllegalOperation' ||
      error.code === 20;

    if (isStandaloneError) {
      // Fallback execution
      return await callback(null);
    }
    throw error;
  }
};

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

// PATCH /api/trips/:id/dispatch - Dispatch trip inside MongoDB Transaction (with fallback)
const dispatchTrip = async (req, res, next) => {
  try {
    const resultTrip = await runInTransaction(async (session) => {
      // 1. Re-fetch trip inside session (if session active)
      const tripQuery = Trip.findById(req.params.id);
      if (session) tripQuery.session(session);
      const trip = await tripQuery;

      if (!trip) {
        throw new NotFoundError(`Trip with ID ${req.params.id} not found`);
      }
      if (trip.status !== 'Draft') {
        throw new ConflictError(`Trip status must be 'Draft' to dispatch (current status: ${trip.status})`);
      }

      // 2. Re-fetch and validate vehicle
      const vehicleQuery = Vehicle.findById(trip.vehicle);
      if (session) vehicleQuery.session(session);
      const vehicle = await vehicleQuery;

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }
      if (vehicle.status !== 'AVAILABLE') {
        throw new ConflictError(`Vehicle is not available (status: ${vehicle.status})`);
      }

      // 3. Re-fetch and validate driver
      const driverQuery = Driver.findById(trip.driver);
      if (session) driverQuery.session(session);
      const driver = await driverQuery;

      if (!driver) {
        throw new NotFoundError('Driver not found');
      }
      if (!isDriverEligible(driver)) {
        throw new ConflictError(`Driver is not eligible (status: ${driver.status})`);
      }

      // 4. Perform atomic state transitions
      trip.status = 'Dispatched';
      trip.dispatched_at = new Date();

      vehicle.status = 'ON_TRIP';
      driver.status = 'On Trip';

      await trip.save(session ? { session } : {});
      await vehicle.save(session ? { session } : {});
      await driver.save(session ? { session } : {});

      return trip;
    });

    const populatedTrip = await Trip.findById(resultTrip._id)
      .populate('vehicle', 'registrationNumber name model maximumLoadCapacity status region')
      .populate('driver', 'name license_number contact_number status');

    res.status(200).json({
      success: true,
      data: populatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/trips/:id/complete - Complete trip inside MongoDB Transaction (with fallback)
const completeTrip = async (req, res, next) => {
  try {
    const { actual_distance, fuel_consumed, final_odometer } = req.body;

    if (actual_distance === undefined || fuel_consumed === undefined || final_odometer === undefined) {
      return next(new AppError('Missing required fields: actual_distance, fuel_consumed, final_odometer are required', 400, 'BAD_REQUEST'));
    }
    if (actual_distance < 0 || fuel_consumed < 0 || final_odometer < 0) {
      return next(new AppError('Values must be non-negative', 400, 'BAD_REQUEST'));
    }

    const resultTrip = await runInTransaction(async (session) => {
      // 1. Re-fetch and validate trip
      const tripQuery = Trip.findById(req.params.id);
      if (session) tripQuery.session(session);
      const trip = await tripQuery;

      if (!trip) {
        throw new NotFoundError(`Trip with ID ${req.params.id} not found`);
      }
      if (trip.status !== 'Dispatched') {
        throw new ConflictError(`Trip status must be 'Dispatched' to complete (current status: ${trip.status})`);
      }

      // 2. Re-fetch and validate vehicle odometer
      const vehicleQuery = Vehicle.findById(trip.vehicle);
      if (session) vehicleQuery.session(session);
      const vehicle = await vehicleQuery;

      if (!vehicle) {
        throw new NotFoundError('Vehicle not found');
      }
      if (final_odometer < vehicle.odometer) {
        throw new AppError(`Final odometer (${final_odometer}) cannot be less than current odometer (${vehicle.odometer})`, 400, 'BAD_REQUEST');
      }

      // 3. Re-fetch driver
      const driverQuery = Driver.findById(trip.driver);
      if (session) driverQuery.session(session);
      const driver = await driverQuery;

      if (!driver) {
        throw new NotFoundError('Driver not found');
      }

      // 4. Update documents
      trip.status = 'Completed';
      trip.completed_at = new Date();
      trip.actual_distance = actual_distance;
      trip.fuel_consumed = fuel_consumed;

      vehicle.status = 'AVAILABLE';
      vehicle.odometer = final_odometer;

      driver.status = 'Available';

      await trip.save(session ? { session } : {});
      await vehicle.save(session ? { session } : {});
      await driver.save(session ? { session } : {});

      return trip;
    });

    const populatedTrip = await Trip.findById(resultTrip._id)
      .populate('vehicle', 'registrationNumber name model maximumLoadCapacity status region')
      .populate('driver', 'name license_number contact_number status');

    res.status(200).json({
      success: true,
      data: populatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/trips/:id/cancel - Cancel trip inside MongoDB Transaction (with fallback)
const cancelTrip = async (req, res, next) => {
  try {
    const resultTrip = await runInTransaction(async (session) => {
      const tripQuery = Trip.findById(req.params.id);
      if (session) tripQuery.session(session);
      const trip = await tripQuery;

      if (!trip) {
        throw new NotFoundError(`Trip with ID ${req.params.id} not found`);
      }

      if (trip.status === 'Completed' || trip.status === 'Cancelled') {
        throw new ConflictError(`Cannot cancel a trip that is already ${trip.status}`);
      }

      // If Dispatched, restore vehicle and driver status
      if (trip.status === 'Dispatched') {
        const vehicleQuery = Vehicle.findById(trip.vehicle);
        if (session) vehicleQuery.session(session);
        const vehicle = await vehicleQuery;
        if (vehicle) {
          vehicle.status = 'AVAILABLE';
          await vehicle.save(session ? { session } : {});
        }

        const driverQuery = Driver.findById(trip.driver);
        if (session) driverQuery.session(session);
        const driver = await driverQuery;
        if (driver) {
          driver.status = 'Available';
          await driver.save(session ? { session } : {});
        }
      }

      // If Draft, just cancel it. No status updates required.
      trip.status = 'Cancelled';
      trip.cancelled_at = new Date();
      await trip.save(session ? { session } : {});

      return trip;
    });

    const populatedTrip = await Trip.findById(resultTrip._id)
      .populate('vehicle', 'registrationNumber name model maximumLoadCapacity status region')
      .populate('driver', 'name license_number contact_number status');

    res.status(200).json({
      success: true,
      data: populatedTrip,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  dispatchTrip,
  completeTrip,
  cancelTrip,
};
