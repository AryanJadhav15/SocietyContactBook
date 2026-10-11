import { z } from 'zod';
import { phoneSchema, paginationQuery } from './commonSchemas.js';

const idArray = z.array(z.coerce.number().int().positive()).default([]);
const days = z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).default([]);

export const contactListSchema = z.object({
  query: z.object({
    ...paginationQuery,
    search: z.string().trim().optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    subcategoryId: z.coerce.number().int().positive().optional(),
    workTypeId: z.coerce.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    sortBy: z.enum(['personName', 'contactCode', 'createdAt', 'updatedAt']).default('personName'),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional()
});

export const contactBody = z.object({
  categoryId: z.coerce.number().int().positive(),
  subcategoryId: z.coerce.number().int().positive(),
  personName: z.string().trim().min(2).max(140),
  gender: z.enum(['FEMALE', 'MALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY']),
  mobileNumber: phoneSchema,
  alternateMobile: phoneSchema.optional().or(z.literal('')),
  whatsappAvailable: z.coerce.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  workTypeIds: idArray,
  serviceIds: idArray,
  workDetail: z.object({
    experienceYears: z.coerce.number().int().min(0).max(80).optional().nullable(),
    workingSince: z.coerce.number().int().min(1950).max(2100).optional().nullable(),
    preferredStart: z.string().trim().max(10).optional().nullable(),
    preferredEnd: z.string().trim().max(10).optional().nullable(),
    serviceArea: z.string().trim().max(160).optional().nullable(),
    availability: z.string().trim().max(120).optional().nullable(),
    charges: z.string().trim().max(120).optional().nullable(),
    remarks: z.string().trim().max(2000).optional().nullable(),
    workingDays: days
  }).optional(),
  medicalDetail: z.object({
    specialization: z.string().trim().max(120).optional().nullable(),
    clinicName: z.string().trim().max(160).optional().nullable(),
    clinicAddress: z.string().trim().max(2000).optional().nullable(),
    clinicPhone: phoneSchema.optional().or(z.literal('')).nullable(),
    consultationTiming: z.string().trim().max(120).optional().nullable(),
    appointmentAvailability: z.string().trim().max(120).optional().nullable(),
    homeVisitStatus: z.coerce.boolean().optional().nullable()
  }).optional(),
  flatAssociations: z.array(z.object({
    flatId: z.coerce.number().int().positive(),
    relationship: z.string().trim().max(100).optional().nullable(),
    timing: z.string().trim().max(120).optional().nullable(),
    remarks: z.string().trim().max(2000).optional().nullable()
  })).default([])
});

export const createContactSchema = z.object({
  body: contactBody,
  query: z.object({}).optional(),
  params: z.object({}).optional()
});

export const updateContactSchema = z.object({
  body: contactBody.partial(),
  query: z.object({}).optional(),
  params: z.object({ id: z.coerce.number().int().positive() })
});
