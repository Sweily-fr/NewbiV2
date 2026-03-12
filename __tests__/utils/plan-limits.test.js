import { describe, it, expect } from 'vitest';
import {
  PLAN_LIMITS,
  SEAT_PRICE,
  getPlanLimits,
  canInviteUsers,
  canAddPaidSeats,
} from '@/src/lib/plan-limits';

describe('PLAN_LIMITS constants', () => {
  it('should define three plans: freelance, pme, entreprise', () => {
    expect(Object.keys(PLAN_LIMITS)).toEqual(['freelance', 'pme', 'entreprise']);
  });

  it('freelance plan has correct limits', () => {
    const plan = PLAN_LIMITS.freelance;
    expect(plan.invitableUsers).toBe(0);
    expect(plan.accountants).toBe(1);
    expect(plan.totalUsers).toBe(1);
    expect(plan.canAddPaidUsers).toBe(false);
    expect(plan.workspaces).toBe(1);
    expect(plan.bankAccounts).toBe(1);
    expect(plan.storage).toBe(50);
    expect(plan.projects).toBe(50);
    expect(plan.invoices).toBe(500);
  });

  it('pme plan has correct limits', () => {
    const plan = PLAN_LIMITS.pme;
    expect(plan.invitableUsers).toBe(10);
    expect(plan.accountants).toBe(3);
    expect(plan.totalUsers).toBe(11);
    expect(plan.canAddPaidUsers).toBe(true);
    expect(plan.workspaces).toBe(1);
    expect(plan.bankAccounts).toBe(3);
    expect(plan.storage).toBe(200);
    expect(plan.projects).toBe(200);
    expect(plan.invoices).toBe(2000);
  });

  it('entreprise plan has correct limits', () => {
    const plan = PLAN_LIMITS.entreprise;
    expect(plan.invitableUsers).toBe(25);
    expect(plan.accountants).toBe(5);
    expect(plan.totalUsers).toBe(26);
    expect(plan.canAddPaidUsers).toBe(true);
    expect(plan.workspaces).toBe(1);
    expect(plan.bankAccounts).toBe(5);
    expect(plan.storage).toBe(500);
    expect(plan.projects).toBe(500);
    expect(plan.invoices).toBe(5000);
  });

  it('SEAT_PRICE should be 7.49', () => {
    expect(SEAT_PRICE).toBe(7.49);
  });
});

describe('getPlanLimits', () => {
  it('returns freelance limits for "freelance"', () => {
    expect(getPlanLimits('freelance')).toEqual(PLAN_LIMITS.freelance);
  });

  it('returns pme limits for "pme"', () => {
    expect(getPlanLimits('pme')).toEqual(PLAN_LIMITS.pme);
  });

  it('returns entreprise limits for "entreprise"', () => {
    expect(getPlanLimits('entreprise')).toEqual(PLAN_LIMITS.entreprise);
  });

  it('is case-insensitive', () => {
    expect(getPlanLimits('FREELANCE')).toEqual(PLAN_LIMITS.freelance);
    expect(getPlanLimits('PME')).toEqual(PLAN_LIMITS.pme);
    expect(getPlanLimits('Entreprise')).toEqual(PLAN_LIMITS.entreprise);
  });

  it('falls back to freelance for unknown plan', () => {
    expect(getPlanLimits('unknown')).toEqual(PLAN_LIMITS.freelance);
  });

  it('falls back to freelance for null/undefined', () => {
    expect(getPlanLimits(null)).toEqual(PLAN_LIMITS.freelance);
    expect(getPlanLimits(undefined)).toEqual(PLAN_LIMITS.freelance);
  });
});

describe('canInviteUsers', () => {
  it('returns false for freelance (no invitable users, no paid seats)', () => {
    expect(canInviteUsers('freelance')).toBe(false);
  });

  it('returns true for pme (has invitable users and paid seats)', () => {
    expect(canInviteUsers('pme')).toBe(true);
  });

  it('returns true for entreprise (has invitable users and paid seats)', () => {
    expect(canInviteUsers('entreprise')).toBe(true);
  });

  it('returns false for unknown plan (falls back to freelance)', () => {
    expect(canInviteUsers('nonexistent')).toBe(false);
  });
});

describe('canAddPaidSeats', () => {
  it('returns false for freelance', () => {
    expect(canAddPaidSeats('freelance')).toBe(false);
  });

  it('returns true for pme', () => {
    expect(canAddPaidSeats('pme')).toBe(true);
  });

  it('returns true for entreprise', () => {
    expect(canAddPaidSeats('entreprise')).toBe(true);
  });

  it('returns false for unknown plan (falls back to freelance)', () => {
    expect(canAddPaidSeats(null)).toBe(false);
  });
});
