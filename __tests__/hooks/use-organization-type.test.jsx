import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const { orgState } = vi.hoisted(() => ({
  orgState: {
    organization: null,
    loading: false,
    error: null,
  },
}));

vi.mock("@/src/lib/organization-client", () => ({
  useActiveOrganization: () => orgState,
}));

import {
  useOrganizationType,
  useIsAccountingFirm,
  useOrganizationOnboarding,
} from "@/src/hooks/useOrganizationType";

beforeEach(() => {
  orgState.organization = null;
  orgState.loading = false;
  orgState.error = null;
});

describe("useOrganizationType", () => {
  it("returns null/false when no organization", () => {
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.type).toBeNull();
    expect(result.current.isAccountingFirm).toBe(false);
    expect(result.current.isBusiness).toBe(false);
    expect(result.current.hasType).toBe(false);
  });

  it("returns isAccountingFirm=true for accounting_firm", () => {
    orgState.organization = {
      id: "1",
      organizationType: "accounting_firm",
      onboardingCompleted: true,
      name: "Cabinet",
    };
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.isAccountingFirm).toBe(true);
    expect(result.current.isBusiness).toBe(false);
    expect(result.current.isOnboardingCompleted).toBe(true);
    expect(result.current.hasType).toBe(true);
  });

  it("returns isBusiness=true for business", () => {
    orgState.organization = {
      id: "1",
      organizationType: "business",
      onboardingCompleted: false,
      name: "Newbi",
    };
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.isBusiness).toBe(true);
    expect(result.current.isAccountingFirm).toBe(false);
    expect(result.current.isOnboardingCompleted).toBe(false);
    expect(result.current.organizationName).toBe("Newbi");
  });

  it("hasType=false when type undefined", () => {
    orgState.organization = { id: "1", name: "X" };
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.hasType).toBe(false);
  });

  it("propagates loading and error", () => {
    orgState.loading = true;
    orgState.error = new Error("oops");
    const { result } = renderHook(() => useOrganizationType());
    expect(result.current.loading).toBe(true);
    expect(result.current.error.message).toBe("oops");
  });
});

describe("useIsAccountingFirm", () => {
  it("returns false for business", () => {
    orgState.organization = { organizationType: "business" };
    const { result } = renderHook(() => useIsAccountingFirm());
    expect(result.current.isAccountingFirm).toBe(false);
  });

  it("returns true for accounting_firm", () => {
    orgState.organization = { organizationType: "accounting_firm" };
    const { result } = renderHook(() => useIsAccountingFirm());
    expect(result.current.isAccountingFirm).toBe(true);
  });
});

describe("useOrganizationOnboarding", () => {
  it("needsOnboarding when onboardingCompleted=false", () => {
    orgState.organization = {
      organizationType: "business",
      onboardingCompleted: false,
    };
    const { result } = renderHook(() => useOrganizationOnboarding());
    expect(result.current.isCompleted).toBe(false);
    expect(result.current.needsOnboarding).toBe(true);
  });

  it("isCompleted=true when onboardingCompleted=true and hasType", () => {
    orgState.organization = {
      organizationType: "business",
      onboardingCompleted: true,
    };
    const { result } = renderHook(() => useOrganizationOnboarding());
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.needsOnboarding).toBe(false);
  });

  it("needsOnboarding when no type set even if completed", () => {
    orgState.organization = {
      onboardingCompleted: true,
    };
    const { result } = renderHook(() => useOrganizationOnboarding());
    expect(result.current.needsOnboarding).toBe(true);
  });
});
