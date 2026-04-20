import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format.');
const phonePattern = /^\+?[0-9()\-\s]{7,20}$/;

const optionalZoneSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().max(100, 'Zone must be 100 characters or less.').optional()
);

const optionalPhoneSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z
    .string()
    .regex(phonePattern, 'Phone number format is invalid.')
    .optional()
);

const missedReasonCodeValues = [
  'road_blocked',
  'access_denied',
  'gate_locked',
  'vehicle_breakdown',
  'safety_hazard',
] as const;

const optionalMissedReasonCodeSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed.toLowerCase().replace(/\s+/g, '_');
  },
  z.enum(missedReasonCodeValues).optional()
);

const optionalMissedNoteSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().max(255, 'Missed note must be 255 characters or fewer.').optional()
);

export const loginBodySchema = z.object({
  email: z.string().trim().email('A valid email is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export const createBinBodySchema = z.object({
  latitude: z
    .coerce
    .number()
    .min(-90, 'Latitude must be between -90 and 90.')
    .max(90, 'Latitude must be between -90 and 90.'),
  longitude: z
    .coerce
    .number()
    .min(-180, 'Longitude must be between -180 and 180.')
    .max(180, 'Longitude must be between -180 and 180.'),
  zone: optionalZoneSchema,
});

export const createDriverBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('A valid email is required.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(72, 'Password must be 72 characters or fewer.'),
  phone: optionalPhoneSchema,
});

export const createRouteBodySchema = z
  .object({
    driverId: uuidSchema,
    binIds: z.array(uuidSchema).min(1, 'At least one bin is required.'),
  })
  .refine((payload) => new Set(payload.binIds).size === payload.binIds.length, {
    message: 'Duplicate bins are not allowed in a route.',
    path: ['binIds'],
  });

export const updateBinStatusBodySchema = z
  .object({
    status: z.enum(['unknown', 'collected', 'overflowing', 'missed']),
    missedReasonCode: optionalMissedReasonCodeSchema,
    missedNote: optionalMissedNoteSchema,
  })
  .superRefine((payload, ctx) => {
    if (payload.status === 'missed' && !payload.missedReasonCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missed reason code is required when status is missed.',
        path: ['missedReasonCode'],
      });
    }

    if (payload.status !== 'missed' && payload.missedReasonCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missed reason code can only be sent when status is missed.',
        path: ['missedReasonCode'],
      });
    }

    if (payload.status !== 'missed' && payload.missedNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Missed note can only be sent when status is missed.',
        path: ['missedNote'],
      });
    }
  });

export const driverIdParamsSchema = z.object({
  driverId: uuidSchema,
});

export const routeIdParamsSchema = z.object({
  routeId: uuidSchema,
});

export const routeBinParamsSchema = z.object({
  routeId: uuidSchema,
  binId: uuidSchema,
});

export const getValidationErrorMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? 'Invalid request payload.';
};
