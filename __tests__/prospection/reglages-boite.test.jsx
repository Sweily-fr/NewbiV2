/**
 * Réglages de la boîte d'envoi : contrôles de saisie, variables envoyées à
 * updateProspectingMailbox, déconnexion confirmée.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import {
  DISCONNECT_PROSPECTING_MAILBOX,
  GET_PROSPECTING_SIGNATURES,
  UPDATE_PROSPECTING_MAILBOX,
} from "@/src/graphql/prospectingQueries";
import { WORKSPACE_ID, mailbox, settings } from "./fixtures";

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import { MailboxSettingsSheet } from "@/app/dashboard/outils/prospection/components/mailbox-settings-sheet";

const signaturesMock = {
  request: { query: GET_PROSPECTING_SIGNATURES },
  result: {
    data: {
      emailSignaturesV2: [
        {
          __typename: "EmailSignatureV2",
          id: "sig-1",
          name: "Signature atelier",
          isDefault: true,
        },
      ],
    },
  },
  maxUsageCount: 5,
};

function renderSheet(mocks, onOpenChange = vi.fn()) {
  render(
    <MockedProvider mocks={[signaturesMock, ...mocks]}>
      <MailboxSettingsSheet
        open
        onOpenChange={onOpenChange}
        workspaceId={WORKSPACE_ID}
        mailbox={mailbox()}
        settings={settings()}
      />
    </MockedProvider>,
  );
  return onOpenChange;
}

describe("réglages de la boîte d'envoi", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("limite hors bornes : message et enregistrement bloqué", async () => {
    const user = userEvent.setup();
    renderSheet([]);
    const limit = screen.getByLabelText("E-mails par jour");
    await user.clear(limit);
    await user.type(limit, "3");
    expect(screen.getByText("Entre 5 et 50 e-mails par jour.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Enregistrer" }).disabled).toBe(
      true,
    );
  });

  it("aucun jour coché : message", async () => {
    const user = userEvent.setup();
    renderSheet([]);
    for (const day of ["lundi", "mardi", "mercredi", "jeudi", "vendredi"]) {
      await user.click(screen.getByRole("button", { name: day }));
    }
    expect(screen.getByText("Choisissez au moins un jour.")).toBeTruthy();
  });

  it("enregistre la limite et les jours au format de l'API", async () => {
    const user = userEvent.setup();
    const updated = mailbox({
      dailyLimit: 25,
      sendWindow: {
        __typename: "ProspectingSendWindow",
        days: [1, 2, 3, 4, 5, 6],
        startHour: 9,
        endHour: 18,
      },
    });
    const onOpenChange = renderSheet([
      {
        request: {
          query: UPDATE_PROSPECTING_MAILBOX,
          variables: {
            workspaceId: WORKSPACE_ID,
            id: "mb-1",
            input: {
              dailyLimit: 25,
              sendWindow: {
                days: [1, 2, 3, 4, 5, 6],
                startHour: 9,
                endHour: 18,
              },
              signatureId: null,
            },
          },
        },
        result: { data: { updateProspectingMailbox: updated } },
      },
    ]);
    const limit = screen.getByLabelText("E-mails par jour");
    await user.clear(limit);
    await user.type(limit, "25");
    await user.click(screen.getByRole("button", { name: "samedi" }));
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Réglages enregistrés"),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("déconnexion confirmée", async () => {
    const user = userEvent.setup();
    const onOpenChange = renderSheet([
      {
        request: {
          query: DISCONNECT_PROSPECTING_MAILBOX,
          variables: { workspaceId: WORKSPACE_ID, id: "mb-1" },
        },
        result: { data: { disconnectProspectingMailbox: true } },
      },
    ]);
    await user.click(screen.getByRole("button", { name: /Déconnecter/ }));
    expect(
      await screen.findByText("Déconnecter dylan@atelier-martin.fr ?"),
    ).toBeTruthy();
    const confirm = screen
      .getAllByRole("button", { name: /Déconnecter/ })
      .at(-1);
    await user.click(confirm);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Boîte déconnectée",
        expect.any(Object),
      ),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
