/**
 * Décompte des destinataires d'une campagne : les prospects générés sont
 * écartés (l'API ne les écrit jamais par une campagne) ; quand l'espace a
 * la Prospection, le décompte dit où leur écrire.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/src/hooks/useWorkspaceFeatures", () => ({
  useWorkspaceFeatures: () => ({ isEnabled: () => true, isReady: true }),
}));

import { AudienceCountPanel } from "@/app/dashboard/outils/campagnes-email/components/setup/audience-section";

describe("AudienceCountPanel", () => {
  it("prospects générés écartés, avec où leur écrire", () => {
    render(
      <AudienceCountPanel
        count={{ total: 10, sendable: 7, prospects: 3 }}
        prospectsHint
      />,
    );
    expect(screen.getByText("7")).toBeTruthy();
    expect(
      screen.getByText(
        /prospects générés, à contacter depuis votre boîte, avec la Prospection/,
      ),
    ).toBeTruthy();
  });

  it("sans la Prospection : le nombre seul", () => {
    render(
      <AudienceCountPanel count={{ total: 10, sendable: 9, prospects: 1 }} />,
    );
    expect(screen.getByText(/prospect généré/)).toBeTruthy();
    expect(screen.queryByText(/avec la Prospection/)).toBeNull();
  });

  it("API sans le compteur : aucun écart affiché pour les prospects", () => {
    render(<AudienceCountPanel count={{ total: 4, sendable: 4 }} />);
    expect(screen.queryByText(/Écartés automatiquement/)).toBeNull();
  });
});
