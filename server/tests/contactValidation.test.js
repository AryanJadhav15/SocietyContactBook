import { describe, expect, it } from 'vitest';
import { createContactSchema } from '../src/validators/contactSchemas.js';

const valid = {
  categoryId: 1,
  subcategoryId: 2,
  personName: 'Sunita Patil',
  gender: 'FEMALE',
  mobileNumber: '9812345678',
  status: 'ACTIVE',
  whatsappAvailable: true,
  workTypeIds: [1, 2],
  serviceIds: [3],
  workDetail: { workingDays: ['MONDAY', 'SATURDAY'] },
  flatAssociations: [{ flatId: 1, relationship: 'Maid', timing: '7:00-9:00 AM' }]
};

describe('contact validation', () => {
  it('accepts the required Word document contact fields', () => {
    const result = createContactSchema.safeParse({ body: valid });
    expect(result.success).toBe(true);
  });

  it('rejects a missing mobile number', () => {
    const result = createContactSchema.safeParse({ body: { ...valid, mobileNumber: '' } });
    expect(result.success).toBe(false);
  });
});
