/**
 * Suivi d'une prospection : pause, reprise et arrêt pour le propriétaire de
 * la boîte ; boîte à reconnecter (envois en attente, reprise impossible).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GET_PROSPECTING_RECIPIENTS } from "@/src/graphql/prospectingQueries";
import {
  WORKSPACE_ID,
  fullSequence,
  mailbox,
  recipient,
  stats,
} from "./fixtures";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));
vi.mock("@/src/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({ isReady: true, canDo: () => true }),
}));
vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: () => ({ isReadOnly: false, isOwner: true }),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { SequenceReport } from "@/app/dashboard/outils/prospection/components/report/sequence-report";

const recipientsMock = {
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
        items: [recipient()],
        total: 1,
      },
    },
  },
  maxUsageCount: 5,
};

function renderReport(sequence) {
  render(
    <MockedProvider mocks={[recipientsMock]}>
      <SequenceReport sequence={sequence} workspaceId={WORKSPACE_ID} />
    </MockedProvider>,
  );
}

const running = stats({ recipients: 40, pending: 26, sent: 12, replied: 2 });

describe("suivi d'une prospection", () => {
  it("en cours : avancement, fin prévue, pause et arrêt", () => {
    renderReport(fullSequence({ status: "ACTIVE", stats: running }));
    expect(screen.getByText("Envois en cours")).toBeTruthy();
    expect(screen.getByText("Fin prévue le samedi 5 décembre")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Mettre en pause/ }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Arrêter/ })).toBeTruthy();
    // 12 partis + 2 réponses sur 40 : 14 traités, 14 messages partis
    expect(screen.getByText(/sur 40 destinataires traités/)).toBeTruthy();
    expect(screen.getAllByText("14")).toHaveLength(2);
  });

  it("boîte d'un autre membre : consultation seule", () => {
    renderReport(
      fullSequence({
        status: "ACTIVE",
        stats: running,
        canSend: false,
        mailbox: mailbox({ isMine: false, ownerName: "Marie Durand" }),
      }),
    );
    expect(
      screen.queryByRole("button", { name: /Mettre en pause/ }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /Arrêter/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: /Voir le message/ }),
    ).toBeTruthy();
  });

  it("boîte expirée : envois en attente de la reconnexion", () => {
    renderReport(
      fullSequence({
        status: "ACTIVE",
        stats: running,
        mailbox: mailbox({ status: "EXPIRED" }),
      }),
    );
    expect(screen.getByText("Reconnectez votre boîte d'envoi")).toBeTruthy();
    expect(screen.getByText("Envois en attente de la boîte")).toBeTruthy();
    expect(
      screen.getByText(/repartiront d'eux-mêmes après la reconnexion/),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reconnecter/ })).toBeTruthy();
    expect(screen.queryByText(/Fin prévue/)).toBeNull();
  });

  it("en pause avec une boîte expirée : reprise impossible", () => {
    renderReport(
      fullSequence({
        status: "PAUSED",
        pauseKind: "MAILBOX",
        stats: running,
        mailbox: mailbox({ status: "EXPIRED" }),
      }),
    );
    expect(screen.getByRole("button", { name: /Reprendre/ }).disabled).toBe(
      true,
    );
  });

  it("coupe-circuit : la reprise relance aussi la boîte", () => {
    renderReport(
      fullSequence({
        status: "PAUSED",
        pauseKind: "REPUTATION",
        pausedReason: "4 désinscriptions sur les 30 derniers envois.",
        stats: running,
        mailbox: mailbox({ status: "PAUSED" }),
      }),
    );
    expect(
      screen.getByText(/relance aussi les envois de la boîte/),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reprendre/ }).disabled).toBe(
      false,
    );
  });
});
