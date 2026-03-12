import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateInvoicePrefix,
  parseInvoicePrefix,
  formatInvoicePrefix,
  getCurrentMonthYear,
} from '@/src/utils/invoiceUtils';

describe('generateInvoicePrefix', () => {
  it('generates prefix from a specific date', () => {
    const date = new Date(2025, 6, 15); // July 2025 (month is 0-indexed)
    expect(generateInvoicePrefix(date)).toBe('F-072025');
  });

  it('pads single-digit months with leading zero', () => {
    const date = new Date(2025, 0, 1); // January 2025
    expect(generateInvoicePrefix(date)).toBe('F-012025');
  });

  it('handles December correctly', () => {
    const date = new Date(2025, 11, 31); // December 2025
    expect(generateInvoicePrefix(date)).toBe('F-122025');
  });

  it('uses current date when no argument provided', () => {
    const now = new Date();
    const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expectedYear = now.getFullYear();
    expect(generateInvoicePrefix()).toBe(`F-${expectedMonth}${expectedYear}`);
  });

  it('handles dates in different years', () => {
    const date = new Date(2030, 2, 10); // March 2030
    expect(generateInvoicePrefix(date)).toBe('F-032030');
  });
});

describe('parseInvoicePrefix', () => {
  it('parses a standard prefix (F-MMYYYY)', () => {
    const result = parseInvoicePrefix('F-072025');
    expect(result).toEqual({ month: '07', year: '2025' });
  });

  it('parses prefix with separator (F-MM-YYYY)', () => {
    const result = parseInvoicePrefix('F-07-2025');
    expect(result).toEqual({ month: '07', year: '2025' });
  });

  it('parses prefix with slash separator (F-MM/YYYY)', () => {
    const result = parseInvoicePrefix('F-07/2025');
    expect(result).toEqual({ month: '07', year: '2025' });
  });

  it('handles 2-digit year and expands to 20XX', () => {
    const result = parseInvoicePrefix('F-0725');
    expect(result).toEqual({ month: '07', year: '2025' });
  });

  it('returns null for null input', () => {
    expect(parseInvoicePrefix(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(parseInvoicePrefix(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseInvoicePrefix('')).toBeNull();
  });

  it('returns null for invalid format', () => {
    expect(parseInvoicePrefix('INVALID')).toBeNull();
    expect(parseInvoicePrefix('G-072025')).toBeNull();
  });
});

describe('formatInvoicePrefix', () => {
  it('formats month and 4-digit year', () => {
    expect(formatInvoicePrefix('7', '2025')).toBe('F-072025');
  });

  it('pads single-digit month', () => {
    expect(formatInvoicePrefix('1', '2025')).toBe('F-012025');
  });

  it('keeps double-digit month as-is', () => {
    expect(formatInvoicePrefix('12', '2025')).toBe('F-122025');
  });

  it('expands 2-digit year to 20XX', () => {
    expect(formatInvoicePrefix('7', '25')).toBe('F-072025');
  });

  it('handles numeric inputs as strings', () => {
    expect(formatInvoicePrefix(3, '2026')).toBe('F-032026');
  });
});

describe('getCurrentMonthYear', () => {
  it('returns an object with month and year strings', () => {
    const result = getCurrentMonthYear();
    expect(result).toHaveProperty('month');
    expect(result).toHaveProperty('year');
    expect(typeof result.month).toBe('string');
    expect(typeof result.year).toBe('string');
  });

  it('month is zero-padded and between 01-12', () => {
    const { month } = getCurrentMonthYear();
    expect(month).toMatch(/^(0[1-9]|1[0-2])$/);
  });

  it('year is a 4-digit string', () => {
    const { year } = getCurrentMonthYear();
    expect(year).toMatch(/^\d{4}$/);
  });

  it('matches the current date values', () => {
    const now = new Date();
    const { month, year } = getCurrentMonthYear();
    expect(month).toBe(String(now.getMonth() + 1).padStart(2, '0'));
    expect(year).toBe(String(now.getFullYear()));
  });
});
