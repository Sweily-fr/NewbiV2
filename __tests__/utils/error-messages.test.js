import { describe, it, expect } from 'vitest';
import {
  ERROR_MESSAGES,
  getErrorMessage,
  showErrorToast,
  isCriticalError,
  requiresUserAction,
} from '@/src/utils/errorMessages';

describe('ERROR_MESSAGES', () => {
  it('contains all expected top-level categories', () => {
    const categories = Object.keys(ERROR_MESSAGES);
    expect(categories).toContain('AUTH');
    expect(categories).toContain('NETWORK');
    expect(categories).toContain('VALIDATION');
    expect(categories).toContain('CLIENT');
    expect(categories).toContain('INVOICE');
    expect(categories).toContain('QUOTE');
    expect(categories).toContain('CREDIT_NOTE');
    expect(categories).toContain('COMPANY');
    expect(categories).toContain('FILE');
    expect(categories).toContain('PAYMENT');
    expect(categories).toContain('GENERIC');
  });

  it('all message values are non-empty strings', () => {
    for (const category of Object.values(ERROR_MESSAGES)) {
      for (const message of Object.values(category)) {
        expect(typeof message).toBe('string');
        expect(message.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getErrorMessage', () => {
  it('returns generic unknown error for null/undefined', () => {
    expect(getErrorMessage(null)).toBe(ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR);
    expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR);
  });

  it('handles string error input', () => {
    const result = getErrorMessage('connection refused');
    expect(result).toBe(ERROR_MESSAGES.NETWORK.CONNECTION_FAILED);
  });

  it('handles Error object with message', () => {
    const error = new Error('token expired');
    const result = getErrorMessage(error);
    expect(result).toBe(ERROR_MESSAGES.AUTH.SESSION_EXPIRED);
  });

  it('detects authentication errors from message', () => {
    expect(getErrorMessage('invalid credentials')).toBe(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    expect(getErrorMessage('authentication failed')).toBe(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
  });

  it('detects network errors from message', () => {
    expect(getErrorMessage('timeout')).toBe(ERROR_MESSAGES.NETWORK.TIMEOUT);
    expect(getErrorMessage('service unavailable')).toBe(ERROR_MESSAGES.NETWORK.SERVER_UNAVAILABLE);
  });

  it('handles error codes - UNAUTHENTICATED', () => {
    const error = { code: 'UNAUTHENTICATED', message: '' };
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.AUTH.UNAUTHORIZED);
  });

  it('handles error codes - COMPANY_INFO_INCOMPLETE', () => {
    const error = { code: 'COMPANY_INFO_INCOMPLETE', message: '' };
    expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.COMPANY.INFO_INCOMPLETE);
  });

  it('handles error codes - NOT_FOUND with context', () => {
    const error = { code: 'NOT_FOUND', message: '' };
    expect(getErrorMessage(error, 'client')).toBe(ERROR_MESSAGES.CLIENT.NOT_FOUND);
    expect(getErrorMessage(error, 'invoice')).toBe(ERROR_MESSAGES.INVOICE.NOT_FOUND);
    expect(getErrorMessage(error, 'quote')).toBe(ERROR_MESSAGES.QUOTE.NOT_FOUND);
  });

  it('handles DUPLICATE_KEY code with context', () => {
    const error = { code: 'DUPLICATE_KEY', message: '' };
    expect(getErrorMessage(error, 'client')).toBe(ERROR_MESSAGES.CLIENT.ALREADY_EXISTS);
    expect(getErrorMessage(error, 'invoice')).toBe(ERROR_MESSAGES.INVOICE.DUPLICATE_NUMBER);
  });

  it('returns contextual default message for unknown errors', () => {
    expect(getErrorMessage('some random error', 'invoice')).toBe(ERROR_MESSAGES.INVOICE.CREATION_FAILED);
    expect(getErrorMessage('some random error', 'client')).toBe(ERROR_MESSAGES.CLIENT.CREATION_FAILED);
    expect(getErrorMessage('some random error', 'auth')).toBe(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    expect(getErrorMessage('some random error', 'generic')).toBe(ERROR_MESSAGES.GENERIC.UNKNOWN_ERROR);
  });

  it('detects file upload errors', () => {
    expect(getErrorMessage('upload failed')).toBe(ERROR_MESSAGES.FILE.UPLOAD_FAILED);
    expect(getErrorMessage('upload too large file')).toBe(ERROR_MESSAGES.FILE.TOO_LARGE);
  });

  it('detects SIRET validation errors', () => {
    expect(getErrorMessage('siret invalide')).toBe(ERROR_MESSAGES.VALIDATION.INVALID_SIRET);
  });

  it('detects "already exists" messages with context', () => {
    expect(getErrorMessage('cet email existe déjà', 'client')).toBe(ERROR_MESSAGES.CLIENT.ALREADY_EXISTS);
    expect(getErrorMessage('already exists', 'invoice')).toBe(ERROR_MESSAGES.INVOICE.DUPLICATE_NUMBER);
  });
});

describe('showErrorToast', () => {
  it('calls the toast function with the error message', () => {
    const mockToast = vi.fn();
    const result = showErrorToast('connection refused', 'generic', mockToast);
    expect(mockToast).toHaveBeenCalledWith(ERROR_MESSAGES.NETWORK.CONNECTION_FAILED);
    expect(result).toBe(ERROR_MESSAGES.NETWORK.CONNECTION_FAILED);
  });

  it('returns message even without toast function', () => {
    const result = showErrorToast('timeout', 'generic', null);
    expect(result).toBe(ERROR_MESSAGES.NETWORK.TIMEOUT);
  });

  it('does not throw if toastFunction is undefined', () => {
    expect(() => showErrorToast('some error')).not.toThrow();
  });
});

describe('isCriticalError', () => {
  it('returns false for null/undefined', () => {
    expect(isCriticalError(null)).toBe(false);
    expect(isCriticalError(undefined)).toBe(false);
  });

  it('returns true for UNAUTHENTICATED error code', () => {
    expect(isCriticalError({ code: 'UNAUTHENTICATED', message: '' })).toBe(true);
  });

  it('returns true for TOKEN_EXPIRED error code', () => {
    expect(isCriticalError({ code: 'TOKEN_EXPIRED', message: '' })).toBe(true);
  });

  it('returns true for SESSION_EXPIRED error code', () => {
    expect(isCriticalError({ code: 'SESSION_EXPIRED', message: '' })).toBe(true);
  });

  it('returns true for "token expired" in message', () => {
    expect(isCriticalError('token expired')).toBe(true);
    expect(isCriticalError(new Error('jwt expired'))).toBe(true);
  });

  it('returns false for permission errors (not session expiration)', () => {
    expect(isCriticalError('access denied')).toBe(false);
    expect(isCriticalError('forbidden')).toBe(false);
    expect(isCriticalError('unauthorized')).toBe(false);
  });

  it('returns false for regular errors', () => {
    expect(isCriticalError('some random error')).toBe(false);
    expect(isCriticalError(new Error('validation failed'))).toBe(false);
  });
});

describe('requiresUserAction', () => {
  it('returns false for null/undefined', () => {
    expect(requiresUserAction(null)).toBe(false);
    expect(requiresUserAction(undefined)).toBe(false);
  });

  it('returns true for COMPANY_INFO_INCOMPLETE code', () => {
    expect(requiresUserAction({ code: 'COMPANY_INFO_INCOMPLETE', message: '' })).toBe(true);
  });

  it('returns true for EMAIL_NOT_VERIFIED code', () => {
    expect(requiresUserAction({ code: 'EMAIL_NOT_VERIFIED', message: '' })).toBe(true);
  });

  it('returns true for messages matching action patterns', () => {
    expect(requiresUserAction('Veuillez compléter les informations')).toBe(true);
    expect(requiresUserAction('Veuillez vérifier votre email')).toBe(true);
    expect(requiresUserAction('Configuration requise')).toBe(true);
  });

  it('returns false for regular errors', () => {
    expect(requiresUserAction('some error')).toBe(false);
    expect(requiresUserAction(new Error('network failure'))).toBe(false);
  });
});
