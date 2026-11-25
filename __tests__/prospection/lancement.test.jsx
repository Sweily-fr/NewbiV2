/**
 * Lancement d'une prospection : résumé, case d'attestation obligatoire,
 * `consent: true` envoyé à l'API.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { LAUNCH_PROSPECTING_SEQUENCE } from "@/src/graphql/prospectingQueries";
import { WORKSPACE_ID, fullSequence, stats, verification } from "./fixtures";

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import {
  CONSENT_LABEL,
  LaunchDialog,
} from "@/app/dashboard/outils/prospection/components/setup/launch-dialog";

const launchMock = {
  request: {
    query: LAUNCH_PROSPECTING_SEQUENCE,
    variables: { workspaceId: WORKSPACE_ID, id: "seq-1", consent: true },
  },
  result: {
    data: {
      launchProspectingSequence: fullSequence({
        status: "ACTIVE",
        consentAt: "2026-11-25T10:00:00.000Z",
        stats: stats({ recipients: 40, pending: 40 }),
      }),
    },
  },
};

function renderDialog(mocks, props = {}) {
  const onOpenChange = vi.fn();
  render(
    <MockedProvider mocks={mocks}>
      <LaunchDialog
        open
        onOpenChange={onOpenChange}
        workspaceId={WORKSPACE_ID}
        sequence={fullSequence()}
        verification={verification()}
        {...props}
      />
    </MockedProvider>,
  );
  return onOpenChange;
}

describe("fenêtre de lancement", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("résumé : destinataires, boîte, rythme et fin prévue", () => {
    renderDialog([]);
    expect(screen.getByText("40 entreprises")).toBeTruthy();
    expect(screen.getByText("dylan@atelier-martin.fr")).toBeTruthy();
    expect(screen.getByText(/30 par jour au plus/)).toBeTruthy();
    expect(screen.getByText(/samedi 5 décembre/)).toBeTruthy();
  });

  it("bouton bloqué tant que l'attestation n'est pas cochée", async () => {
    const user = userEvent.setup();
    const onOpenChange = renderDialog([launchMock]);
    const launch = screen.getByRole("button", {
      name: /Lancer la prospection/,
    });
    expect(launch.disabled).toBe(true);
    expect(screen.getByText(CONSENT_LABEL)).toBeTruthy();

    await user.click(screen.getByRole("checkbox"));
    expect(launch.disabled).toBe(false);
    await user.click(launch);

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Prospection lancée",
        expect.any(Object),
      ),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("environnement de test : envois simulés signalés", () => {
    renderDialog([], { sendMode: "RESTRICTED" });
    expect(
      screen.getByText(/Envois simulés dans cet environnement/),
    ).toBeTruthy();
  });

  it("en production : pas de bandeau", () => {
    renderDialog([], { sendMode: "LIVE" });
    expect(screen.queryByText(/Envois simulés/)).toBeNull();
  });

  it("aucun destinataire : lancement impossible même coché", async () => {
    const user = userEvent.setup();
    renderDialog([], {
      verification: verification({
        audience: { ...verification().audience, sendable: 0 },
      }),
    });
    await user.click(screen.getByRole("checkbox"));
    expect(
      screen.getByRole("button", { name: /Lancer la prospection/ }).disabled,
    ).toBe(true);
  });
});
