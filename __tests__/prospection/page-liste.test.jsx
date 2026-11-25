/**
 * Page Prospection : boîte d'envoi, liste des prospections, premier pas,
 * « Nouvelle prospection » sans boîte et retour de la connexion OAuth.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import {
  GET_PROSPECTING_SEQUENCES,
  GET_PROSPECTING_SETTINGS,
} from "@/src/graphql/prospectingQueries";
import {
  WORKSPACE_ID,
  listSequence,
  mailbox,
  settings as settingsFixture,
  stats,
} from "./fixtures";

const push = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
  usePathname: () => "/dashboard/outils/prospection",
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
}));
vi.mock("@/src/hooks/use-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    canDo: () => true,
    canRead: () => true,
    isReady: true,
  }),
}));
vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: () => ({ isReadOnly: false, isOwner: true }),
}));
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import ProspectionPage from "@/app/dashboard/outils/prospection/page";

const sequencesMock = (sequences) => ({
  request: {
    query: GET_PROSPECTING_SEQUENCES,
    variables: { workspaceId: WORKSPACE_ID, status: null },
  },
  result: { data: { prospectingSequences: sequences } },
  maxUsageCount: 5,
});
const settingsMock = (value) => ({
  request: {
    query: GET_PROSPECTING_SETTINGS,
    variables: { workspaceId: WORKSPACE_ID },
  },
  result: { data: { prospectingSettings: value } },
  maxUsageCount: 5,
});

function renderPage(mocks) {
  return render(
    <MockedProvider mocks={mocks}>
      <ProspectionPage />
    </MockedProvider>,
  );
}

describe("page Prospection", () => {
  beforeEach(() => {
    searchParams = new URLSearchParams();
    push.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    window.history.replaceState(null, "", "/dashboard/outils/prospection");
  });

  it("liste les prospections avec la boîte d'envoi et l'avancement", async () => {
    renderPage([
      sequencesMock([
        listSequence(),
        listSequence({
          id: "seq-2",
          name: "Plombiers Villeurbanne",
          status: "DRAFT",
          stats: stats(),
        }),
      ]),
      settingsMock(settingsFixture()),
    ]);
    expect(await screen.findByText("Menuisiers Lyon")).toBeTruthy();
    expect(screen.getByText("Plombiers Villeurbanne")).toBeTruthy();
    const table = screen.getByRole("table");
    expect(within(table).getByText("En cours")).toBeTruthy();
    expect(within(table).getByText("Brouillon")).toBeTruthy();
    expect(await screen.findByText("dylan@atelier-martin.fr")).toBeTruthy();
    expect(screen.getByText("3 / 10 envoyés aujourd'hui")).toBeTruthy();
    // Progression : 12 partis sur 40
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText(/\/ 40 envoyés/)).toBeTruthy();
    const create = screen.getByRole("button", {
      name: /Nouvelle prospection/,
    });
    expect(create.disabled).toBe(false);
  });

  it("sans boîte : boutons de connexion, Outlook non configuré, création désactivée", async () => {
    renderPage([
      sequencesMock([]),
      settingsMock(settingsFixture({ myMailbox: null, mailboxes: [] })),
    ]);
    expect(
      await screen.findByText("Écrivez à vos premiers prospects"),
    ).toBeTruthy();
    const gmail = await screen.findByRole("button", {
      name: /Connecter Gmail/,
    });
    const outlook = screen.getByRole("button", { name: /Connecter Outlook/ });
    expect(gmail.disabled).toBe(false);
    expect(outlook.disabled).toBe(true);
    expect(
      screen.getByRole("button", { name: /Nouvelle prospection/ }).disabled,
    ).toBe(true);
    expect(
      screen.getByText(
        "Commencez par connecter votre boîte d'envoi, juste au-dessus.",
      ),
    ).toBeTruthy();
  });

  it("environnement de simulation : bandeau discret", async () => {
    renderPage([
      sequencesMock([listSequence()]),
      settingsMock(settingsFixture({ sendMode: "SIMULATION" })),
    ]);
    expect(
      await screen.findByText(
        /seules les adresses autorisées reçoivent vraiment les e-mails/,
      ),
    ).toBeTruthy();
  });

  it("boîte expirée : bandeau pour la reconnecter", async () => {
    const expired = mailbox({ status: "EXPIRED" });
    renderPage([
      sequencesMock([listSequence({ status: "PAUSED", pauseKind: "MAILBOX" })]),
      settingsMock(
        settingsFixture({ myMailbox: expired, mailboxes: [expired] }),
      ),
    ]);
    expect(await screen.findByText("Reconnectez votre boîte")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reconnecter/ })).toBeTruthy();
    expect(screen.getByText("À reconnecter")).toBeTruthy();
  });

  it("retour de la connexion réussie : message puis adresse nettoyée", async () => {
    searchParams = new URLSearchParams("boite=connectee");
    window.history.replaceState(
      null,
      "",
      "/dashboard/outils/prospection?boite=connectee",
    );
    renderPage([sequencesMock([]), settingsMock(settingsFixture())]);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "Boîte connectée",
        expect.any(Object),
      ),
    );
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(window.location.search).toBe("");
  });

  it("retour en erreur : message de l'API", async () => {
    searchParams = new URLSearchParams(
      `boite_erreur=${encodeURIComponent("Autorisation refusée")}`,
    );
    renderPage([sequencesMock([]), settingsMock(settingsFixture())]);
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Connexion de la boîte impossible",
        { description: "Autorisation refusée" },
      ),
    );
  });
});
