import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

vi.mock("@/src/lib/auth-client", () => ({
  authClient: {
    useActiveOrganization: vi.fn(),
  },
}));

import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
import { authClient } from "@/src/lib/auth-client";
import { useRouter } from "next/navigation";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("useOrganizationChange", () => {
  it("does not register a listener when disabled", () => {
    authClient.useActiveOrganization.mockReturnValue({
      data: { id: "org-1" },
    });
    const addSpy = vi.spyOn(window, "addEventListener");

    renderHook(() =>
      useOrganizationChange({
        resourceId: "doc-1",
        listUrl: "/list",
        enabled: false,
      }),
    );
    expect(addSpy).not.toHaveBeenCalledWith(
      "organizationChanged",
      expect.any(Function),
    );
  });

  it("does not register a listener when no resourceId", () => {
    authClient.useActiveOrganization.mockReturnValue({
      data: { id: "org-1" },
    });
    const addSpy = vi.spyOn(window, "addEventListener");

    renderHook(() => useOrganizationChange({ listUrl: "/list" }));
    expect(addSpy).not.toHaveBeenCalledWith(
      "organizationChanged",
      expect.any(Function),
    );
  });

  it("redirects to listUrl when an organizationChanged event fires on a detail page", () => {
    authClient.useActiveOrganization.mockReturnValue({
      data: { id: "org-1" },
    });

    renderHook(() =>
      useOrganizationChange({
        resourceId: "doc-1",
        listUrl: "/dashboard/factures",
      }),
    );

    const router = useRouter();

    act(() => {
      window.dispatchEvent(
        new CustomEvent("organizationChanged", {
          detail: { previousOrgId: "org-1", newOrgId: "org-2" },
        }),
      );
    });

    expect(router.push).toHaveBeenCalledWith("/dashboard/factures");
  });

  it("removes the listener on unmount", () => {
    authClient.useActiveOrganization.mockReturnValue({
      data: { id: "org-1" },
    });
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() =>
      useOrganizationChange({
        resourceId: "doc-1",
        listUrl: "/list",
      }),
    );

    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      "organizationChanged",
      expect.any(Function),
    );
  });

  it("returns the current organization id", () => {
    authClient.useActiveOrganization.mockReturnValue({
      data: { id: "org-42" },
    });
    const { result } = renderHook(() =>
      useOrganizationChange({
        resourceId: "doc-1",
        listUrl: "/list",
      }),
    );
    expect(result.current.currentOrganizationId).toBe("org-42");
  });
});
