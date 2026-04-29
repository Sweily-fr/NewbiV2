import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

let currentSearch = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => currentSearch,
  usePathname: () => "/dashboard",
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    success: (...args) => toastSuccess(...args),
    error: (...args) => toastError(...args),
  },
}));

import { OAuthCallbackHandler } from "@/src/components/oauth-callback-handler";

describe("OAuthCallbackHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentSearch = new URLSearchParams();
    // Reset URL
    window.history.replaceState({}, "", "/dashboard");
  });

  it("returns null and does nothing when no openSettings flag is set", () => {
    const onOpenSettings = vi.fn();
    const onSetSettingsTab = vi.fn();
    const { container } = render(
      <OAuthCallbackHandler
        onOpenSettings={onOpenSettings}
        onSetSettingsTab={onSetSettingsTab}
      />,
    );
    expect(container.firstChild).toBeNull();
    expect(onOpenSettings).not.toHaveBeenCalled();
    expect(onSetSettingsTab).not.toHaveBeenCalled();
  });

  it("opens settings when openSettings=true", () => {
    currentSearch = new URLSearchParams("openSettings=true");
    const onOpenSettings = vi.fn();
    render(<OAuthCallbackHandler onOpenSettings={onOpenSettings} />);
    expect(onOpenSettings).toHaveBeenCalledWith(true);
  });

  it("sets the settings tab when settingsTab is provided", () => {
    currentSearch = new URLSearchParams(
      "openSettings=true&settingsTab=integrations",
    );
    const onOpenSettings = vi.fn();
    const onSetSettingsTab = vi.fn();
    render(
      <OAuthCallbackHandler
        onOpenSettings={onOpenSettings}
        onSetSettingsTab={onSetSettingsTab}
      />,
    );
    expect(onSetSettingsTab).toHaveBeenCalledWith("integrations");
    expect(onOpenSettings).toHaveBeenCalledWith(true);
  });

  it("shows a success toast when success=true and message present", () => {
    currentSearch = new URLSearchParams(
      "openSettings=true&success=true&message=" +
        encodeURIComponent("Connecté !"),
    );
    render(<OAuthCallbackHandler onOpenSettings={vi.fn()} />);
    expect(toastSuccess).toHaveBeenCalledWith("Connecté !");
  });

  it("shows an error toast when error param is present", () => {
    currentSearch = new URLSearchParams(
      "openSettings=true&error=" + encodeURIComponent("Échec"),
    );
    render(<OAuthCallbackHandler onOpenSettings={vi.fn()} />);
    expect(toastError).toHaveBeenCalledWith("Échec");
  });

  it("cleans up URL params after handling", () => {
    window.history.replaceState(
      {},
      "",
      "/dashboard?openSettings=true&settingsTab=foo&success=true&message=ok",
    );
    currentSearch = new URLSearchParams(
      "openSettings=true&settingsTab=foo&success=true&message=ok",
    );
    render(<OAuthCallbackHandler onOpenSettings={vi.fn()} />);
    // After handler, URL should not contain these params
    expect(window.location.search).toBe("");
  });

  it("does nothing if onOpenSettings prop is not provided", () => {
    currentSearch = new URLSearchParams("openSettings=true");
    expect(() => render(<OAuthCallbackHandler />)).not.toThrow();
  });
});
