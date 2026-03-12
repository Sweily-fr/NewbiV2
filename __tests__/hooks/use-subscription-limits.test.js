import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the dependencies before importing the hook
vi.mock('@/src/contexts/dashboard-layout-context', () => ({
  useSubscription: vi.fn(),
}));

vi.mock('@/src/lib/auth-client', () => ({
  authClient: {
    organization: {
      list: vi.fn(),
      getFullOrganization: vi.fn(),
    },
  },
}));

vi.mock('@/src/lib/plan-limits', () => ({
  getPlanLimits: vi.fn((planName) => {
    const plans = {
      freelance: {
        invitableUsers: 0,
        accountants: 1,
        totalUsers: 1,
        canAddPaidUsers: false,
        workspaces: 1,
        bankAccounts: 1,
        storage: 50,
        projects: 50,
        invoices: 500,
      },
      pme: {
        invitableUsers: 10,
        accountants: 3,
        totalUsers: 11,
        canAddPaidUsers: true,
        workspaces: 1,
        bankAccounts: 3,
        storage: 200,
        projects: 200,
        invoices: 2000,
      },
      entreprise: {
        invitableUsers: 25,
        accountants: 5,
        totalUsers: 26,
        canAddPaidUsers: true,
        workspaces: 1,
        bankAccounts: 5,
        storage: 500,
        projects: 500,
        invoices: 5000,
      },
    };
    const normalized = planName?.toLowerCase() || 'freelance';
    return plans[normalized] || plans.freelance;
  }),
}));

import { useSubscriptionLimits } from '@/src/hooks/useSubscriptionLimits';
import { useSubscription } from '@/src/contexts/dashboard-layout-context';
import { authClient } from '@/src/lib/auth-client';

describe('useSubscriptionLimits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns zero limits when subscription is not active', async () => {
    useSubscription.mockReturnValue({
      subscription: null,
      isActive: () => false,
    });

    const { result } = renderHook(() => useSubscriptionLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.limits).toEqual({
      users: 0,
      workspaces: 0,
      projects: 0,
      invoices: 0,
    });
    expect(result.current.usage).toEqual({ users: 0, workspaces: 0 });
    expect(result.current.canAddUser).toBe(false);
    expect(result.current.canAddWorkspace).toBe(false);
  });

  it('fetches plan limits for an active freelance subscription', async () => {
    useSubscription.mockReturnValue({
      subscription: { plan: 'freelance', referenceId: 'org-1' },
      isActive: () => true,
    });

    authClient.organization.list.mockResolvedValue({
      data: [{ id: 'org-1', name: 'Test Org' }],
    });

    authClient.organization.getFullOrganization.mockResolvedValue({
      data: {
        members: [{ id: 'user-1', role: 'owner' }],
      },
    });

    const { result } = renderHook(() => useSubscriptionLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // freelance: totalUsers=1, workspaces=1
    expect(result.current.limits).toEqual({
      users: 1,
      workspaces: 1,
      projects: 50,
      storage: 50,
      invoices: 500,
    });
    expect(result.current.usage).toEqual({ users: 1, workspaces: 1 });
    // 1 user used out of 1 limit => canAddUser = false
    expect(result.current.canAddUser).toBe(false);
    expect(result.current.planName).toBe('freelance');
  });

  it('computes remaining capacity correctly for pme plan', async () => {
    useSubscription.mockReturnValue({
      subscription: { plan: 'pme', referenceId: 'org-2' },
      isActive: () => true,
    });

    authClient.organization.list.mockResolvedValue({
      data: [{ id: 'org-2', name: 'PME Org' }],
    });

    authClient.organization.getFullOrganization.mockResolvedValue({
      data: {
        members: [
          { id: 'user-1', role: 'owner' },
          { id: 'user-2', role: 'member' },
          { id: 'user-3', role: 'accountant' }, // accountant excluded from count
        ],
      },
    });

    const { result } = renderHook(() => useSubscriptionLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // pme: totalUsers=11, workspaces=1
    expect(result.current.limits.users).toBe(11);
    // 2 non-accountant members
    expect(result.current.usage.users).toBe(2);
    expect(result.current.canAddUser).toBe(true);
    expect(result.current.remainingUsers).toBe(9);
  });

  it('handles error gracefully and returns zero limits', async () => {
    useSubscription.mockReturnValue({
      subscription: { plan: 'pme', referenceId: 'org-3' },
      isActive: () => true,
    });

    authClient.organization.list.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useSubscriptionLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.limits).toEqual({
      users: 0,
      workspaces: 0,
      projects: 0,
      invoices: 0,
    });
    expect(result.current.usage).toEqual({ users: 0, workspaces: 0 });
  });

  it('returns planName "none" when no subscription', async () => {
    useSubscription.mockReturnValue({
      subscription: null,
      isActive: () => false,
    });

    const { result } = renderHook(() => useSubscriptionLimits());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.planName).toBe('none');
  });
});
