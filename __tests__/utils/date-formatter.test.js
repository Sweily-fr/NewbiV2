import { describe, it, expect } from 'vitest';
import {
  formatDateToFrench,
  formatDateToFrenchLong,
  formatDateTimeToFrench,
} from '@/src/utils/dateFormatter';

describe('formatDateToFrench', () => {
  it('formats a Date object to dd/mm/yyyy', () => {
    // Use UTC-safe date to avoid timezone issues
    const date = new Date('2024-01-15T12:00:00.000Z');
    const result = formatDateToFrench(date);
    expect(result).toBe('15/01/2024');
  });

  it('formats a YYYY-MM-DD string', () => {
    const result = formatDateToFrench('2024-07-25');
    expect(result).toBe('25/07/2024');
  });

  it('formats a numeric timestamp', () => {
    // 2024-01-15T12:00:00Z in milliseconds
    const timestamp = new Date('2024-01-15T12:00:00.000Z').getTime();
    const result = formatDateToFrench(timestamp);
    expect(result).toBe('15/01/2024');
  });

  it('formats a string timestamp', () => {
    const timestamp = String(new Date('2024-01-15T12:00:00.000Z').getTime());
    const result = formatDateToFrench(timestamp);
    expect(result).toBe('15/01/2024');
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(formatDateToFrench(null)).toBe('');
    expect(formatDateToFrench(undefined)).toBe('');
    expect(formatDateToFrench('')).toBe('');
  });

  it('returns original value for invalid date string', () => {
    expect(formatDateToFrench('not-a-date')).toBe('not-a-date');
  });
});

describe('formatDateToFrenchLong', () => {
  it('formats a Date object to long French format', () => {
    const date = new Date('2024-01-15T12:00:00.000Z');
    const result = formatDateToFrenchLong(date);
    // "15 janvier 2024" in fr-FR locale
    expect(result).toContain('2024');
    expect(result).toContain('15');
  });

  it('formats a YYYY-MM-DD string', () => {
    const result = formatDateToFrenchLong('2024-07-25');
    expect(result).toContain('2024');
    expect(result).toContain('25');
  });

  it('returns "Date non disponible" for null/undefined', () => {
    expect(formatDateToFrenchLong(null)).toBe('Date non disponible');
    expect(formatDateToFrenchLong(undefined)).toBe('Date non disponible');
  });

  it('returns "Date non disponible" for empty string', () => {
    expect(formatDateToFrenchLong('')).toBe('Date non disponible');
  });

  it('returns "Date non disponible" for "Invalid Date" string', () => {
    expect(formatDateToFrenchLong('Invalid Date')).toBe('Date non disponible');
  });

  it('returns "Date invalide" for unparseable string', () => {
    expect(formatDateToFrenchLong('not-a-date')).toBe('Date invalide');
  });

  it('returns "Format de date non supporté" for non-date objects', () => {
    expect(formatDateToFrenchLong({})).toBe('Format de date non supporté');
    expect(formatDateToFrenchLong([])).toBe('Format de date non supporté');
  });
});

describe('formatDateTimeToFrench', () => {
  it('formats a Date object to dd/mm/yyyy HH:MM', () => {
    const date = new Date('2024-01-15T14:30:00.000Z');
    const result = formatDateTimeToFrench(date);
    // Should contain date portion
    expect(result).toContain('15');
    expect(result).toContain('01');
    expect(result).toContain('2024');
    // Should contain time portion (may vary by timezone in test env)
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/);
  });

  it('formats a YYYY-MM-DD string (time defaults to noon UTC)', () => {
    const result = formatDateTimeToFrench('2024-07-25');
    expect(result).toContain('25');
    expect(result).toContain('07');
    expect(result).toContain('2024');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/);
  });

  it('returns "Date non disponible" for null/undefined', () => {
    expect(formatDateTimeToFrench(null)).toBe('Date non disponible');
    expect(formatDateTimeToFrench(undefined)).toBe('Date non disponible');
  });

  it('returns "Date non disponible" for empty string', () => {
    expect(formatDateTimeToFrench('')).toBe('Date non disponible');
  });

  it('returns "Date invalide" for unparseable string', () => {
    expect(formatDateTimeToFrench('not-a-date')).toBe('Date invalide');
  });

  it('returns "Format de date non supporté" for non-date objects', () => {
    expect(formatDateTimeToFrench({})).toBe('Format de date non supporté');
  });

  it('formats a numeric timestamp', () => {
    const timestamp = new Date('2024-06-01T10:15:00.000Z').getTime();
    const result = formatDateTimeToFrench(timestamp);
    expect(result).toContain('2024');
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}/);
  });
});
