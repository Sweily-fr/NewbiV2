import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockOrganization = vi.fn();
vi.mock("@/src/lib/organization-client", () => ({
  useActiveOrganization: () => ({ organization: mockOrganization() }),
}));

import NoSubscriptionNotice from "@/src/components/gestionnaire/no-subscription-notice";

beforeEach(() => {
  mockOrganization.mockReturnValue({ id: "o1", name: "Cabinet Dupont" });
  window.history.replaceState(null, "", "/dashboard/gestionnaire");
});

describe("NoSubscriptionNotice", () => {
  it("explique le renvoi, une seule fois, et retire le paramètre", () => {
    window.history.replaceState(
      null,
      "",
      "/dashboard/gestionnaire?espace=sans-abonnement",
    );
    render(<NoSubscriptionNotice />);
    expect(screen.getByText("Cabinet Dupont")).toBeTruthy();
    expect(screen.getByText(/n'a pas d'abonnement Newbi/)).toBeTruthy();
    expect(window.location.search).toBe("");
  });

  it("ouvre l'onglet Abonnement des paramètres", () => {
    window.history.replaceState(
      null,
      "",
      "/dashboard/gestionnaire?espace=sans-abonnement",
    );
    const listener = vi.fn();
    window.addEventListener("newbi:open-settings", listener);
    render(<NoSubscriptionNotice />);
    fireEvent.click(screen.getByText("Choisir une offre pour cet espace"));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ tab: "subscription" });
    window.removeEventListener("newbi:open-settings", listener);
  });

  it("n'affiche rien sans le paramètre", () => {
    const { container } = render(<NoSubscriptionNotice />);
    expect(container.innerHTML).toBe("");
  });
});
