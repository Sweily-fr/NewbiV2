/**
 * Fiche contact : historique des envois de prospection, demandé seulement
 * si l'espace a la Prospection et que le rôle permet de la voir.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { GET_CLIENT_PROSPECTING_HISTORY } from "@/src/graphql/prospectingQueries";
import { WORKSPACE_ID, recipient } from "./fixtures";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));
let featureOpen = true;
vi.mock("@/src/hooks/useWorkspaceFeatures", () => ({
  useWorkspaceFeatures: () => ({
    isReady: true,
    isEnabled: (feature) => feature === "prospecting" && featureOpen,
  }),
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({ isReady: true, canRead: () => true }),
}));

import {
  ClientProspectingHistory,
  useClientProspectingHistory,
} from "@/app/dashboard/clients/[id]/components/client-prospecting-history";

const replied = recipient({
  status: "REPLIED",
  repliedAt: "2026-11-21T09:15:00.000Z",
});

const historyMock = {
  request: {
    query: GET_CLIENT_PROSPECTING_HISTORY,
    variables: { workspaceId: WORKSPACE_ID, clientId: "c-1" },
  },
  result: { data: { clientProspectingHistory: [replied] } },
};

const wrapper = (mocks) =>
  function ApolloWrapper({ children }) {
    return <MockedProvider mocks={mocks}>{children}</MockedProvider>;
  };

describe("historique de prospection d'un contact", () => {
  beforeEach(() => {
    featureOpen = true;
  });

  it("lit les envois du contact", async () => {
    const { result } = renderHook(() => useClientProspectingHistory("c-1"), {
      wrapper: wrapper([historyMock]),
    });
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].status).toBe("REPLIED");
  });

  it("rien demandé sans la Prospection", async () => {
    featureOpen = false;
    const { result } = renderHook(() => useClientProspectingHistory("c-1"), {
      // Aucune réponse prévue : une requête ferait échouer le test
      wrapper: wrapper([]),
    });
    expect(result.current).toEqual([]);
  });

  it("une ligne par envoi : prospection liée, statut, dates, adresse", () => {
    render(<ClientProspectingHistory items={[replied]} />);
    const link = screen.getByRole("link", { name: "Menuisiers Lyon" });
    expect(link.getAttribute("href")).toBe(
      "/dashboard/outils/prospection/seq-1",
    );
    expect(screen.getByText("A répondu")).toBeTruthy();
    expect(
      screen.getByText(
        "Envoyé le 20 nov. à 10:12 · réponse le 21 nov. à 10:15",
      ),
    ).toBeTruthy();
    expect(screen.getByText("contact@menuiserie-durand.fr")).toBeTruthy();
  });
});
