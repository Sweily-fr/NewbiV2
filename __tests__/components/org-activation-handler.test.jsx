import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import React from "react";

const mockReplace = vi.fn();
let currentSearch = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  useSearchParams: () => currentSearch,
  usePathname: () => "/dashboard",
}));

const mockOrgList = vi.fn();
const mockOrgSetActive = vi.fn();

vi.mock("@/src/lib/auth-client", () => ({
  authClient: {
    organization: {
      list: (...args) => mockOrgList(...args),
      setActive: (...args) => mockOrgSetActive(...args),
    },
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    success: (...args) => toastSuccess(...args),
    error: (...args) => toastError(...args),
  },
}));

import { OrgActivationHandler } from "@/src/components/org-activation-handler";

describe("OrgActivationHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearch = new URLSearchParams();
    sessionStorage.clear();
    mockOrgList.mockReset();
    mockOrgSetActive.mockReset();
  });

  it("returns null and does nothing when params not present", () => {
    const { container } = render(<OrgActivationHandler />);
    expect(container.firstChild).toBeNull();
    expect(mockOrgList).not.toHaveBeenCalled();
  });

  it("does not run twice when already processed", () => {
    sessionStorage.setItem("org_activation_processed", "true");
    currentSearch = new URLSearchParams(
      "org_created=true&payment_success=true",
    );
    render(<OrgActivationHandler />);
    expect(mockOrgList).not.toHaveBeenCalled();
  });

  it("activates the newest organization on success", async () => {
    currentSearch = new URLSearchParams(
      "org_created=true&payment_success=true",
    );

    const recent = new Date().toISOString();
    mockOrgList.mockResolvedValue({
      data: [{ id: "new-org", createdAt: recent }],
    });
    mockOrgSetActive.mockResolvedValue({});

    render(<OrgActivationHandler />);

    await waitFor(() => {
      expect(mockOrgSetActive).toHaveBeenCalledWith({
        organizationId: "new-org",
      });
    });
    await waitFor(() => {
      expect(toastSuccess).toHaveBeenCalled();
    });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });

  it("marks processed in sessionStorage immediately to dedupe", async () => {
    currentSearch = new URLSearchParams(
      "org_created=true&payment_success=true",
    );

    mockOrgList.mockResolvedValue({ data: [] });

    render(<OrgActivationHandler />);

    // Should be set synchronously when the effect kicks off
    await waitFor(() => {
      expect(sessionStorage.getItem("org_activation_processed")).toBe("true");
    });
  });

  it("shows error toast when no organization is found after retries", async () => {
    currentSearch = new URLSearchParams(
      "org_created=true&payment_success=true",
    );
    mockOrgList.mockResolvedValue({ data: [] });

    render(<OrgActivationHandler />);

    await waitFor(
      () => {
        expect(toastError).toHaveBeenCalled();
      },
      { timeout: 8000 },
    );
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  }, 10000);

  it("shows error toast when authClient throws", async () => {
    currentSearch = new URLSearchParams(
      "org_created=true&payment_success=true",
    );
    mockOrgList.mockRejectedValue(new Error("network failure"));

    render(<OrgActivationHandler />);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalled();
    });
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
  });
});
