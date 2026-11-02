/**
 * Prévision : supprimer un scénario (avec ses saisies propres) demande une
 * confirmation ; « Annuler » ne supprime rien.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const deleteScenario = vi.fn(async () => ({ success: true }));

vi.mock("@/src/hooks/useTreasuryForecast", () => ({
  useForecastScenarios: () => ({
    scenarios: [{ id: "s1", name: "Optimiste", incomeMultiplier: 1.2, expenseMultiplier: 0.9 }],
  }),
  useUpsertForecastScenario: () => ({ upsertScenario: vi.fn(), loading: false }),
  useDeleteForecastScenario: () => ({ deleteScenario, loading: false }),
}));
// Rôle qui supprime sans modifier : « Supprimer » directement dans le menu
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({ isReady: true, canDo: (_m, action) => action === "delete" || action === "view" }),
}));

import { ScenarioSelector } from "@/app/dashboard/outils/prevision/components/scenario-selector";

async function ouvrirSuppression(user) {
  render(<ScenarioSelector activeScenarioId={null} onScenarioChange={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: /Base/ }));
  await user.click(await screen.findByText("Supprimer"));
  return screen.findByRole("alertdialog");
}

describe("Suppression d'un scénario de prévision", () => {
  beforeEach(() => deleteScenario.mockClear());

  it("demande une confirmation qui nomme le scénario ; Annuler ne supprime rien", async () => {
    const user = userEvent.setup();
    const confirmation = await ouvrirSuppression(user);
    expect(confirmation.textContent).toContain("Optimiste");
    expect(deleteScenario).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Annuler" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(deleteScenario).not.toHaveBeenCalled();
  });

  it("confirmer supprime le scénario", async () => {
    const user = userEvent.setup();
    await ouvrirSuppression(user);
    await user.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(deleteScenario).toHaveBeenCalledWith("s1"));
  });
});
