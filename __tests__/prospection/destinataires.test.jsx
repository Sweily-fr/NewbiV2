/**
 * Suivi d'une prospection : destinataires filtrables, « A répondu » et
 * « Ne plus contacter » (confirmé) envoyés à markProspectingRecipient.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import {
  GET_PROSPECTING_RECIPIENTS,
  MARK_PROSPECTING_RECIPIENT,
} from "@/src/graphql/prospectingQueries";
import { WORKSPACE_ID, fullSequence, recipient, stats } from "./fixtures";

vi.mock("@/src/hooks/use-mobile", () => ({ useIsMobile: () => false }));
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import { RecipientsTable } from "@/app/dashboard/outils/prospection/components/report/recipients-table";

const sequence = fullSequence({
  status: "ACTIVE",
  stats: stats({ recipients: 2, pending: 1, sent: 1 }),
});
const sent = recipient();
const pending = recipient({
  id: "r-2",
  clientId: "c-2",
  email: "bonjour@plomberie-roux.fr",
  name: "Paul Roux",
  company: "Plomberie Roux",
  status: "PENDING",
  sentAt: null,
});

const listMock = (items = [sent, pending]) => ({
  request: {
    query: GET_PROSPECTING_RECIPIENTS,
    variables: {
      workspaceId: WORKSPACE_ID,
      id: "seq-1",
      status: null,
      search: null,
      offset: 0,
      limit: 50,
    },
  },
  result: {
    data: {
      prospectingRecipients: {
        __typename: "ProspectingRecipientPage",
        items,
        total: items.length,
      },
    },
  },
  maxUsageCount: 5,
});

const markMock = (id, action, result) => ({
  request: {
    query: MARK_PROSPECTING_RECIPIENT,
    variables: { workspaceId: WORKSPACE_ID, id, action },
  },
  result: { data: { markProspectingRecipient: result } },
});

function renderTable(mocks, canMark = true) {
  render(
    <MockedProvider mocks={mocks}>
      <RecipientsTable
        workspaceId={WORKSPACE_ID}
        sequence={sequence}
        canMark={canMark}
      />
    </MockedProvider>,
  );
}

describe("destinataires d'une prospection", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("entreprise, statut, filtres avec leur nombre", async () => {
    renderTable([listMock()]);
    expect(await screen.findByText("Menuiserie Durand")).toBeTruthy();
    expect(screen.getByText("Plomberie Roux")).toBeTruthy();
    const filters = screen.getByRole("tablist", {
      name: "Filtrer les destinataires",
    });
    expect(
      within(filters)
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(["Tous2", "En attente1", "Envoyés1"]);
  });

  it("« A répondu » sur un message parti", async () => {
    const user = userEvent.setup();
    renderTable([
      listMock(),
      markMock(
        "r-1",
        "REPLIED",
        recipient({
          status: "REPLIED",
          repliedAt: "2026-11-21T10:00:00.000Z",
        }),
      ),
    ]);
    await screen.findByText("Menuiserie Durand");
    // Un seul bouton direct : la ligne du message parti
    const buttons = screen.getAllByRole("button", { name: "A répondu" });
    expect(buttons).toHaveLength(1);
    await user.click(buttons[0]);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Réponse notée", {
        description: "Menuiserie Durand a répondu.",
      }),
    );
  });

  it("« Ne plus contacter » demande confirmation", async () => {
    const user = userEvent.setup();
    renderTable([
      listMock(),
      markMock("r-2", "DO_NOT_CONTACT", { ...pending, status: "UNSUBSCRIBED" }),
    ]);
    await screen.findByText("Plomberie Roux");
    await user.click(
      screen.getByRole("button", {
        name: "Actions pour bonjour@plomberie-roux.fr",
      }),
    );
    await user.click(
      await screen.findByRole("menuitem", { name: /Ne plus contacter/ }),
    );
    expect(
      await screen.findByText("Ne plus contacter bonjour@plomberie-roux.fr ?"),
    ).toBeTruthy();
    expect(
      screen.getByText(/Son message en attente ne partira pas/),
    ).toBeTruthy();
    const dialog = screen.getByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: /Ne plus contacter/ }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Ne plus contacter", {
        description: "bonjour@plomberie-roux.fr rejoint vos désinscrits.",
      }),
    );
  });

  it("sans droit : aucune action", async () => {
    renderTable([listMock()], false);
    await screen.findByText("Menuiserie Durand");
    expect(screen.queryByRole("button", { name: "A répondu" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Actions pour/ })).toBeNull();
  });
});
