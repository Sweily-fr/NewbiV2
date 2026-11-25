/**
 * Fin de « Générer des prospects » : « Écrire à ces prospects » crée un
 * brouillon avec la liste en destinataires et l'ouvre ; sans boîte, la page
 * Prospection pour la connecter ; caché sans la Prospection.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import {
  CREATE_PROSPECTING_SEQUENCE,
  GET_PROSPECTING_SETTINGS,
} from "@/src/graphql/prospectingQueries";
import { WORKSPACE_ID, fullSequence, mailbox, settings } from "./fixtures";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));
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
let canCreate = true;
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({
    isReady: true,
    canDo: (module, action) =>
      module === "prospecting" && (action !== "create" || canCreate),
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

import {
  WriteToProspectsStep,
  useCanWriteToProspects,
} from "@/app/dashboard/clients/components/write-to-prospects-step";

const settingsMock = (value) => ({
  request: {
    query: GET_PROSPECTING_SETTINGS,
    variables: { workspaceId: WORKSPACE_ID },
  },
  result: { data: { prospectingSettings: value } },
  maxUsageCount: 5,
});

const added = {
  listId: "liste-9",
  listName: "Menuisiers Lyon 10 km",
  count: 12,
  spent: "13 crédits utilisés",
};

describe("« Écrire à ces prospects »", () => {
  beforeEach(() => {
    push.mockClear();
    featureOpen = true;
    canCreate = true;
  });

  it("proposé seulement avec la Prospection et le droit de créer", () => {
    expect(renderHook(() => useCanWriteToProspects()).result.current).toBe(
      true,
    );
    featureOpen = false;
    expect(renderHook(() => useCanWriteToProspects()).result.current).toBe(
      false,
    );
    featureOpen = true;
    canCreate = false;
    expect(renderHook(() => useCanWriteToProspects()).result.current).toBe(
      false,
    );
  });

  it("crée le brouillon avec la liste et la signature de la boîte, puis l'ouvre", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    // Même boîte dans myMailbox et mailboxes (même entrée du cache)
    const own = mailbox({ signatureId: "sig-1" });
    const withSignature = settings({ myMailbox: own, mailboxes: [own] });
    render(
      <MockedProvider
        mocks={[
          settingsMock(withSignature),
          {
            request: {
              query: CREATE_PROSPECTING_SEQUENCE,
              variables: {
                workspaceId: WORKSPACE_ID,
                input: {
                  name: "Menuisiers Lyon 10 km",
                  audience: {
                    mode: "LISTS",
                    listIds: ["liste-9"],
                    excludeListIds: [],
                  },
                  signatureId: "sig-1",
                },
              },
            },
            result: {
              data: {
                createProspectingSequence: fullSequence({
                  id: "seq-9",
                  name: "Menuisiers Lyon 10 km",
                }),
              },
            },
          },
        ]}
      >
        <WriteToProspectsStep added={added} onClose={onClose} />
      </MockedProvider>,
    );
    expect(
      screen.getByText("12 prospects ajoutés à vos contacts"),
    ).toBeTruthy();
    expect(
      screen.getByText("Liste « Menuisiers Lyon 10 km » · 13 crédits utilisés"),
    ).toBeTruthy();
    const write = await screen.findByRole("button", {
      name: /Écrire à ces prospects/,
    });
    await waitFor(() => expect(write.disabled).toBe(false));
    await user.click(write);
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/dashboard/outils/prospection/seq-9"),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("sans boîte : direction la page Prospection", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MockedProvider
        mocks={[settingsMock(settings({ myMailbox: null, mailboxes: [] }))]}
      >
        <WriteToProspectsStep added={added} onClose={onClose} />
      </MockedProvider>,
    );
    const connect = await screen.findByRole("button", {
      name: /Connecter ma boîte d'envoi/,
    });
    await user.click(connect);
    expect(push).toHaveBeenCalledWith("/dashboard/outils/prospection");
    expect(onClose).toHaveBeenCalled();
  });
});
