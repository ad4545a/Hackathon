const { z } = require('zod');

// Helper to validate MongoDB ObjectId
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, {
  message: 'Invalid ObjectId format',
});

const createMaintenanceSchema = z.object({
  body: z.object({
    vehicleId: objectIdSchema,
    maintenanceType: z.string().min(1, 'Maintenance type is required'),
    description: z.string().min(1, 'Description is required'),
    startDate: z.preprocess((val) => new Date(val), z.date({
      invalid_type_error: 'Invalid start date',
    })),
    cost: z.number().min(0, 'Cost must be non-negative').default(0),
  }),
});

const completeMaintenanceSchema = z.object({
  body: z.object({
    completionDate: z.preprocess(
      (val) => (val ? new Date(val) : new Date()),
      z.date({ invalid_type_error: 'Invalid completion date' })
    ),
    retireVehicle: z.boolean().optional().default(false),
  }),
});

module.exports = {
  createMaintenanceSchema,
  completeMaintenanceSchema,
};
