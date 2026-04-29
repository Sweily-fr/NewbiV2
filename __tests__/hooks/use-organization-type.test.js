import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/src/lib/organization-client", () => ({
  useActiveOrganization: vi.fn(),
}));

import {
  useOrganizationType,
  useIsAccountingFirm,
  useOrganizationOnboarding,
} from "@/src/hooks/useOrganizationType";
import { useActiveOrganization } from "@/src/lib/organization-client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useOrganizationType", () => {
  it("returns null/false defaults when no organization", () => {
    useActiveOrganization.mockReturnValue({ organization: null });
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current).toMatchObject({
      type: null,
      isAccountingFirm: false,
      isBusiness: false,
      isOnboardingCompleted: false,
      hasType: false,
    });
  });

  it("flags isAccountingFirm correctly", () => {
    useActiveOrganization.mockReturnValue({
      organization: {
        id: "org-1",
        name: "Cabinet X",
        organizationType: "accounting_firm",
        onboardingCompleted: true,
      },
    });
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.isAccountingFirm).toBe(true);
    expect(result.current.isBusiness).toBe(false);
    expect(result.current.hasType).toBe(true);
    expect(result.current.organizationName).toBe("Cabinet X");
  });

  it("flags isBusiness correctly", () => {
    useActiveOrganization.mockReturnValue({
      organization: { organizationType: "business", onboardingCompleted: true },
    });
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.isBusiness).toBe(true);
    expect(result.current.isAccountingFirm).toBe(false);
  });

  it("isOnboardingCompleted is strict-equal to true", () => {
    useActiveOrganization.mockReturnValue({
      organization: {
        organizationType: "business",
        onboardingCompleted: false,
      },
    });
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.isOnboardingCompleted).toBe(false);
  });

  it("hasType is false when type is null/undefined", () => {
    useActiveOrganization.mockReturnValue({
      organization: { organizationType: null },
    });
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.hasType).toBe(false);
  });

  it("propagates loading and error from the underlying hook", () => {
    useActiveOrganization.mockReturnValue({
      organization: null,
      loading: true,
      error: new Error("oops"),
    });
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.loading).toBe(true);
    expect(result.current.error.message).toBe("oops");
  });
});

describe("useIsAccountingFirm", () => {
  it("returns the isAccountingFirm flag and loading", () => {
    useActiveOrganization.mockReturnValue({
      organization: { organizationType: "accounting_firm" },
      loading: false,
    });
    const { result } = renderHook(() => useIsAccountingFirm());
    expect(result.current).toEqual({ isAccountingFirm: true, loading: false });
  });
});

describe("useOrganizationOnboarding", () => {
  it("needsOnboarding=true when not completed", () => {
    useActiveOrganization.mockReturnValue({
      organization: {
        organizationType: "business",
        onboardingCompleted: false,
      },
    });
    const { result } = renderHook(() => useOrganizationOnboarding());
    expect(result.current.needsOnboarding).toBe(true);
    expect(result.current.isCompleted).toBe(false);
  });

  it("needsOnboarding=true when type missing even if completed", () => {
    useActiveOrganization.mockReturnValue({
      organization: {
        organizationType: null,
        onboardingCompleted: true,
      },
    });
    const { result } = renderHook(() => useOrganizationOnboarding());
    expect(result.current.needsOnboarding).toBe(true);
  });

  it("needsOnboarding=false when type set AND completed", () => {
    useActiveOrganization.mockReturnValue({
      organization: {
        organizationType: "business",
        onboardingCompleted: true,
      },
    });
    const { result } = renderHook(() => useOrganizationOnboarding());
    expect(result.current.needsOnboarding).toBe(false);
    expect(result.current.isCompleted).toBe(true);
  });
});
