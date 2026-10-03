import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

describe('Unit Test: Frontend Utilities (formatCurrency, formatDate, cn)', () => {
  describe('cn (Tailwind class merging)', () => {
    it('should correctly merge classes and resolve conflicts', () => {
      const result = cn('bg-red-500', 'p-4', 'bg-blue-500', false && 'hidden', undefined);
      expect(result).toBe('p-4 bg-blue-500');
    });

    it('should handle empty and conditional values', () => {
      expect(cn('btn', true && 'btn-primary', false && 'btn-secondary')).toBe('btn btn-primary');
      expect(cn()).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers into Peruvian Soles (PEN)', () => {
      const result = formatCurrency(25.5);
      expect(result).toMatch(/25[.,]0?50?/);
    });

    it('should format string amounts accurately', () => {
      const result = formatCurrency('150.00');
      expect(result).toMatch(/150[.,]00/);
    });

    it('should handle zero, null, or invalid amounts gracefully', () => {
      const resultZero = formatCurrency(0);
      expect(resultZero).toMatch(/0[.,]00/);

      const resultInvalid = formatCurrency('not-a-number');
      expect(resultInvalid).toMatch(/0[.,]00/);
    });
  });

  describe('formatDate', () => {
    it('should format valid date strings and Date objects', () => {
      const date = new Date('2026-10-02T15:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).not.toBe('-');
      expect(formatted.length).toBeGreaterThan(5);
    });

    it('should return "-" for null, undefined, or empty values', () => {
      expect(formatDate(null as any)).toBe('-');
      expect(formatDate(undefined as any)).toBe('-');
      expect(formatDate('')).toBe('-');
    });

    it('should return "-" for invalid date strings without throwing RangeError', () => {
      expect(formatDate('invalid-date-string')).toBe('-');
    });
  });
});
