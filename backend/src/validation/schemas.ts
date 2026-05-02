import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid ID format.');
const phonePattern = /^\+?[0-9()\-\s]{7,20}$/;
const cloudinaryUrlPattern = /^https?:\/\/(?:res\.cloudinary\.com)\/.+/i;

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

const optionalAddressSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().max(255, 'Address must be 255 characters or fewer.').optional()
);

const optionalAdminNoteSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? undefined : trimmed;
  },
  z.string().max(1000, 'Admin notes must be 1000 characters or fewer.').optional()
);

const binConditionStatusValues = ['active', 'maintenance', 'retired'] as const;
const binConditionStatusSchema = z.enum(binConditionStatusValues);

const reportStatusValues = ['submitted', 'in_review', 'resolved', 'rejected'] as const;
const reportStatusSchema = z.enum(reportStatusValues);

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

export const signupBodySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('A valid email is required.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(72, 'Password must be 72 characters or fewer.'),
  phone: optionalPhoneSchema,
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
  status: binConditionStatusSchema.optional().default('active'),
});

export const updateBinConditionStatusBodySchema = z.object({
  status: binConditionStatusSchema,
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

export const createReportBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters.')
    .max(120, 'Title must be 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters.')
    .max(2000, 'Description must be 2000 characters or fewer.'),
  category: z
    .string()
    .trim()
    .min(2, 'Category must be at least 2 characters.')
    .max(50, 'Category must be 50 characters or fewer.')
    .optional()
    .default('general'),
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
  imageUrl: z
    .string()
    .trim()
    .url('A valid image URL is required.')
    .regex(cloudinaryUrlPattern, 'Image URL must be a Cloudinary URL.'),
  address: optionalAddressSchema,
});

export const updateReportStatusBodySchema = z.object({
  status: reportStatusSchema,
  adminNotes: optionalAdminNoteSchema,
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
    status: z.enum(['unknown', 'collected', 'missed']),
    wasOverflowing: z.boolean().optional(),
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

    if (payload.status !== 'collected' && payload.wasOverflowing === true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Overflow observation can only be sent when status is collected.',
        path: ['wasOverflowing'],
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

export const binIdParamsSchema = z.object({
  binId: uuidSchema,
});

export const reportIdParamsSchema = z.object({
  reportId: uuidSchema,
});

export const getValidationErrorMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? 'Invalid request payload.';
};
