import { z } from 'zod';

const uuidSchema = z.string().uuid('Invalid identifier.');

export const loginFormSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const authenticatedUserSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(1, 'Invalid user profile.'),
  email: z.string().trim().email('Invalid user profile.'),
  role: z.enum(['admin', 'driver', 'user']),
  accessToken: z.string().trim().min(1, 'Invalid user profile.'),
});

const reportCategorySchema = z.enum([
  'overflowing',
  'damaged',
  'missed_pickup',
  'illegal_dumping',
  'general',
]);

export const createBinFormSchema = z.object({
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
  zone: z
    .string()
    .trim()
    .min(1, 'Zone is required.')
    .max(100, 'Zone must be 100 characters or less.'),
  status: z.enum(['active', 'maintenance', 'retired']),
});

export const createDriverFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(72, 'Password must be 72 characters or fewer.'),
});

export const createRouteFormSchema = z
  .object({
    driverId: uuidSchema,
    binIds: z.array(uuidSchema).min(1, 'Select at least one bin before dispatching.'),
  })
  .refine((payload) => new Set(payload.binIds).size === payload.binIds.length, {
    message: 'Duplicate bins are not allowed in a route.',
    path: ['binIds'],
  });

export const signupFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 digits.')
    .max(20, 'Phone number must be 20 characters or fewer.')
    .optional()
    .or(z.literal('')),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long.')
    .max(72, 'Password must be 72 characters or fewer.'),
});

export const reportFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters long.')
    .max(120, 'Title must be 120 characters or fewer.'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long.')
    .max(2000, 'Description must be 2000 characters or fewer.'),
  category: reportCategorySchema,
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
  imageUrl: z.string().trim().url('Enter a valid image URL.'),
  address: z
    .string()
    .trim()
    .max(255, 'Address must be 255 characters or fewer.')
    .optional()
    .or(z.literal('')),
  binId: uuidSchema.optional().or(z.literal('')),
});

export const reportFormWithLocalPhotoSchema = reportFormSchema.omit({ imageUrl: true });

export const getValidationErrorMessage = (error: z.ZodError) => {
  return error.issues[0]?.message ?? 'Invalid form input.';
};
