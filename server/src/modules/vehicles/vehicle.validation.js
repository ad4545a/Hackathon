const { z } = require('zod');

const createVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z
      .string({ required_error: 'Registration number is required' })
      .trim()
      .min(2, 'Registration number must be at least 2 characters')
      .toUpperCase(),
    name: z
      .string({ required_error: 'Vehicle name is required' })
      .trim()
      .min(1, 'Vehicle name cannot be empty'),
    model: z
      .string({ required_error: 'Vehicle model is required' })
      .trim()
      .min(1, 'Vehicle model cannot be empty'),
    type: z
      .string({ required_error: 'Vehicle type is required' })
      .trim()
      .min(1, 'Vehicle type cannot be empty'),
    maximumLoadCapacity: z
      .number({ required_error: 'Maximum load capacity is required' })
      .positive('Maximum load capacity must be a positive number'),
    odometer: z
      .number()
      .nonnegative('Odometer reading cannot be negative')
      .optional()
      .default(0),
    acquisitionCost: z
      .number({ required_error: 'Acquisition cost is required' })
      .nonnegative('Acquisition cost must be a positive number'),
    region: z
      .string({ required_error: 'Region is required' })
      .trim()
      .min(1, 'Region cannot be empty'),
  }),
});

const updateVehicleSchema = z.object({
  body: z.object({
    registrationNumber: z
      .string()
      .trim()
      .min(2, 'Registration number must be at least 2 characters')
      .toUpperCase()
      .optional(),
    name: z.string().trim().min(1, 'Vehicle name cannot be empty').optional(),
    model: z.string().trim().min(1, 'Vehicle model cannot be empty').optional(),
    type: z.string().trim().min(1, 'Vehicle type cannot be empty').optional(),
    maximumLoadCapacity: z.number().positive('Maximum load capacity must be positive').optional(),
    odometer: z.number().nonnegative('Odometer reading cannot be negative').optional(),
    acquisitionCost: z.number().nonnegative('Acquisition cost must be positive').optional(),
    region: z.string().trim().min(1, 'Region cannot be empty').optional(),
    status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
  }),
});

const queryVehicleSchema = z.object({
  query: z.object({
    status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']).optional(),
    type: z.string().optional(),
    region: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z
      .string()
      .transform((val) => parseInt(val, 10) || 1)
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform((val) => parseInt(val, 10) || 10)
      .optional()
      .default('10'),
  }),
});

module.exports = {
  createVehicleSchema,
  updateVehicleSchema,
  queryVehicleSchema,
};
