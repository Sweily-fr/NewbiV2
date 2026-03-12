import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock dependencies
vi.mock('@/src/contexts/dashboard-layout-context', () => ({
  useSubscription: vi.fn(),
}));

vi.mock('@/src/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

vi.mock('@/src/hooks/useCompanyInfoGuard', () => ({
  isCompanyInfoComplete: vi.fn(),
}));

import { useFeatureAccess } from '@/src/hooks/useFeatureAccess';
import { useSubscription } from '@/src/contexts/dashboard-layout-context';
import { useSession } from '@/src/lib/auth-client';
import { isCompanyInfoComplete } from '@/src/hooks/useCompanyInfoGuard';

describe('useFeatureAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: active subscription, authenticated user with complete company
    useSubscription.mockReturnValue({
      isActive: () => true,
      subscription: { status: 'active', plan: 'pme' },
      loading: false,
      trial: { isTrialActive: false, daysRemaining: 0 },
    });
    useSession.mockReturnValue({
      data: {
        user: {
          organization: {
            companyName: 'Test Co',
            companyEmail: 'test@test.com',
            addressStreet: '1 rue Test',
            addressCity: 'Paris',
            addressZipCode: '75001',
            addressCountry: 'France',
            siret: '12345678901234',
            legalForm: 'SARL',
          },
        },
      },
    });
    isCompanyInfoComplete.mockReturnValue(true);
  });

  // --- Free features ---

  it('grants access to free features (kanban) without subscription', () => {
    useSubscription.mockReturnValue({
      isActive: () => false,
      subscription: null,
      loading: false,
      trial: { isTrialActive: false, daysRemaining: 0 },
    });

    const { result } = renderHook(() => useFeatureAccess('kanban'));
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.reason).toBe('authorized');
  });

  it('grants access to calendar without subscription', () => {
    useSubscription.mockReturnValue({
      isActive: () => false,
      subscription: null,
      loading: false,
      trial: { isTrialActive: false, daysRemaining: 0 },
    });

    const { result } = renderHook(() => useFeatureAccess('calendar'));
    expect(result.current.hasAccess).toBe(true);
  });

  it('grants access to signatures-mail without subscription', () => {
    useSubscription.mockReturnValue({
      isActive: () => false,
      subscription: null,
      loading: false,
      trial: { isTrialActive: false, daysRemaining: 0 },
    });

    const { result } = renderHook(() => useFeatureAccess('signatures-mail'));
    expect(result.current.hasAccess).toBe(true);
  });

  // --- Pro features ---

  it('denies access to pro features (factures) without subscription', () => {
    useSubscription.mockReturnValue({
      isActive: () => false,
      subscription: null,
      loading: false,
      trial: { isTrialActive: false, daysRemaining: 0 },
    });

    const { result } = renderHook(() => useFeatureAccess('factures'));
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.reason).toBe('no_pro_subscription');
    expect(result.current.action).toBe('upgrade');
  });

  it('grants access to pro features with active subscription and complete company info', () => {
    const { result } = renderHook(() => useFeatureAccess('factures'));
    expect(result.current.hasAccess).toBe(true);
    expect(result.current.reason).toBe('authorized');
  });

  it('denies access to factures when company info is incomplete', () => {
    isCompanyInfoComplete.mockReturnValue(false);

    const { result } = renderHook(() => useFeatureAccess('factures'));
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.reason).toBe('incomplete_company_info');
    expect(result.current.action).toBe('complete_profile');
  });

  it('denies access to devis when company info is incomplete', () => {
    isCompanyInfoComplete.mockReturnValue(false);

    const { result } = renderHook(() => useFeatureAccess('devis'));
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.reason).toBe('incomplete_company_info');
  });

  // --- Paid-only features ---

  it('denies access to catalogues during trial', () => {
    useSubscription.mockReturnValue({
      isActive: () => true,
      subscription: { status: 'trialing', plan: 'pme' },
      loading: false,
      trial: { isTrialActive: true, daysRemaining: 10 },
    });

    const { result } = renderHook(() => useFeatureAccess('catalogues'));
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.reason).toBe('trial_not_allowed');
    expect(result.current.action).toBe('upgrade_paid');
  });

  it('grants access to catalogues with active paid subscription', () => {
    const { result } = renderHook(() => useFeatureAccess('catalogues'));
    expect(result.current.hasAccess).toBe(true);
  });

  it('grants access to catalogues with canceled-but-valid subscription', () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    useSubscription.mockReturnValue({
      isActive: () => true,
      subscription: { status: 'canceled', plan: 'pme', periodEnd: futureDate },
      loading: false,
      trial: { isTrialActive: false, daysRemaining: 0 },
    });

    const { result } = renderHook(() => useFeatureAccess('catalogues'));
    expect(result.current.hasAccess).toBe(true);
  });

  // --- Unknown features ---

  it('denies access to unknown features', () => {
    const { result } = renderHook(() => useFeatureAccess('nonexistent'));
    expect(result.current.hasAccess).toBe(false);
    expect(result.current.reason).toBe('unknown_feature');
  });

  // --- getAccessMessage ---

  it('returns null access message when access is granted', () => {
    const { result } = renderHook(() => useFeatureAccess('kanban'));
    expect(result.current.getAccessMessage()).toBeNull();
  });

  it('returns access message with title and CTA when denied', () => {
    useSubscription.mockReturnValue({
      isActive: () => false,
      subscription: null,
      loading: false,
      trial: { isTrialActive: false, daysRemaining: 0 },
    });

    const { result } = renderHook(() => useFeatureAccess('factures'));
    const message = result.current.getAccessMessage();
    expect(message).not.toBeNull();
    expect(message.title).toBe('Fonctionnalité Premium');
    expect(message.cta).toBe('Découvrir Pro');
  });

  // --- getSubscriptionInfo ---

  it('returns subscription info', () => {
    const { result } = renderHook(() => useFeatureAccess('kanban'));
    const info = result.current.subscriptionInfo;
    expect(info.isPro).toBe(true);
    expect(info.isPaid).toBe(true);
    expect(info.isTrial).toBe(false);
    expect(info.plan).toBe('pme');
  });
});
