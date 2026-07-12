const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, {
  message: 'Invalid ObjectId format',
});

const createFuelLogSchema = z.object({
  body: z.object({
    vehicleId: objectIdSchema,
    tripId: objectIdSchema.optional(),
    liters: z.number().gt(0, 'Liters must be greater than 0'),
    cost: z.number().min(0, 'Cost must be non-negative'),
    odometer: z.number().min(0, 'Odometer must be non-negative'),
    date: z.preprocess((val) => (val ? new Date(val) : new Date()), z.date({
      invalid_type_error: 'Invalid date format',
    })),
  }),
});

module.exports = {
  createFuelLogSchema,
};
