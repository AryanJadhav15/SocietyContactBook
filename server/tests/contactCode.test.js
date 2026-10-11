import { describe, expect, it } from 'vitest';
import { formatContactCode } from '../src/utils/contactCode.js';

describe('formatContactCode', () => {
  it('creates human-readable padded codes', () => {
    expect(formatContactCode(1)).toBe('CNT-000001');
    expect(formatContactCode(125)).toBe('CNT-000125');
  });
});
