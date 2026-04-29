import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/src/lib/auth-client", () => ({
  useSession: vi.fn(),
}));

import {
  useCompanyInfoGuard,
  isCompanyInfoComplete,
} from "@/src/hooks/useCompanyInfoGuard";
import { useSession } from "@/src/lib/auth-client";
import { useRouter } from "next/navigation";

const completeOrg = {
  companyName: "Acme",
  companyEmail: "contact@acme.fr",
  addressStreet: "1 rue Test",
  addressCity: "Paris",
  addressZipCode: "75001",
  addressCountry: "France",
  siret: "12345678901234",
  legalForm: "SARL",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isCompanyInfoComplete (utility)", () => {
  it("returns true when all required fields are present", () => {
    expect(isCompanyInfoComplete(completeOrg)).toBe(true);
  });

  it.each([
    "companyName",
    "companyEmail",
    "addressStreet",
    "addressCity",
    "addressZipCode",
    "addressCountry",
    "siret",
    "legalForm",
  ])("returns false when %s is missing", (missingField) => {
    const org = { ...completeOrg };
    delete org[missingField];
    expect(isCompanyInfoComplete(org)).toBe(false);
  });

  it("returns false for null or undefined input", () => {
    expect(isCompanyInfoComplete(null)).toBe(false);
    expect(isCompanyInfoComplete(undefined)).toBe(false);
  });

  it("returns false when a required field is an empty string", () => {
    expect(isCompanyInfoComplete({ ...completeOrg, siret: "" })).toBe(false);
    expect(isCompanyInfoComplete({ ...completeOrg, companyName: "" })).toBe(
      false,
    );
  });
});

describe("useCompanyInfoGuard", () => {
  it("redirects to /auth/login when there is no user session", async () => {
    useSession.mockReturnValue({ data: null, status: "unauthenticated" });

    renderHook(() => useCompanyInfoGuard());

    const router = useRouter();
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/auth/login"),
    );
  });

  it("does nothing while the session is loading", () => {
    useSession.mockReturnValue({ data: null, status: "loading" });

    renderHook(() => useCompanyInfoGuard());

    const router = useRouter();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("redirects to the company profile when company info is incomplete", async () => {
    useSession.mockReturnValue({
      data: { user: { organization: { companyName: "Only name" } } },
      status: "authenticated",
    });

    const { result } = renderHook(() => useCompanyInfoGuard());

    const router = useRouter();
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/dashboard/profile/company"),
    );
    expect(result.current.isCompanyInfoComplete).toBe(false);
  });

  it("uses a custom redirect path when provided", async () => {
    useSession.mockReturnValue({
      data: { user: { organization: { companyName: "Only name" } } },
      status: "authenticated",
    });

    renderHook(() => useCompanyInfoGuard("/custom/redirect"));

    const router = useRouter();
    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/custom/redirect"),
    );
  });

  it("does not redirect when company info is complete", async () => {
    useSession.mockReturnValue({
      data: { user: { organization: completeOrg } },
      status: "authenticated",
    });

    const { result } = renderHook(() => useCompanyInfoGuard());

    await waitFor(() =>
      expect(result.current.isCompanyInfoComplete).toBe(true),
    );

    const router = useRouter();
    expect(router.push).not.toHaveBeenCalled();
    expect(result.current.organization).toEqual(completeOrg);
    expect(result.current.isLoading).toBe(false);
  });
});
