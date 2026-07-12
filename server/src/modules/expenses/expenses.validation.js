const { z } = require('zod');

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, {
  message: 'Invalid ObjectId format',
});

const createExpenseSchema = z.object({
  body: z.object({
    vehicleId: objectIdSchema,
    tripId: objectIdSchema.optional(),
    type: z.enum(['FUEL', 'TOLL', 'MAINTENANCE', 'REPAIR', 'OTHER'], {
      errorMap: () => ({ message: 'Type must be FUEL, TOLL, MAINTENANCE, REPAIR, or OTHER' }),
    }),
    amount: z.number().min(0, 'Amount must be non-negative'),
    description: z.string().min(1, 'Description is required'),
    date: z.preprocess((val) => (val ? new Date(val) : new Date()), z.date({
      invalid_type_error: 'Invalid date format',
    })),
  }),
});

module.exports = {
  createExpenseSchema,
};
