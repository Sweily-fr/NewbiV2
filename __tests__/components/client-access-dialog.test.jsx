import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";

const hook = vi.hoisted(() => ({ shares: [] }));
const actions = vi.hoisted(() => ({
  createShare: vi.fn(async () => ({})),
  updateShare: vi.fn(async () => ({})),
  revokeShare: vi.fn(async () => ({})),
  deleteShare: vi.fn(async () => ({})),
  revokeVisitor: vi.fn(async () => ({})),
  unbanVisitor: vi.fn(async () => ({})),
  approveRequest: vi.fn(async () => ({})),
  rejectRequest: vi.fn(async () => ({})),
}));

vi.mock("@/src/hooks/useDocumentShares", () => ({
  useDocumentShares: () => ({
    shares: hook.shares,
    loading: false,
    saving: false,
    ...actions,
  }),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import ClientAccessDialog from "@/app/dashboard/outils/documents-partages/components/client-access-dialog";
import { toast } from "@/src/components/ui/sonner";

const folders = [
  { id: "f-dupont", name: "Client Dupont", parentId: null, order: 0 },
  { id: "f-contrats", name: "Contrats", parentId: "f-dupont", order: 0 },
  {
    id: "f-rh",
    name: "RH",
    parentId: "f-dupont",
    order: 1,
    visibility: "private",
  },
  { id: "f-sous-rh", name: "Sous RH", parentId: "f-rh", order: 0 },
  { id: "f-factures", name: "Factures", parentId: null, order: 1 },
];

const share = (extra = {}) => ({
  id: "acces-1",
  folderIds: ["f-dupont"],
  folders: [{ id: "f-dupont", name: "Client Dupont", available: true }],
  name: "Dupont",
  isActive: true,
  expiresAt: null,
  hasPassword: false,
  isFolderAvailable: true,
  shareUrl: "https://www.newbi.fr/public/documents/abc",
  totalViews: 3,
  totalDownloads: 1,
  lastViewedAt: null,
  visitors: [],
  bannedEmails: [],
  accessRequests: [],
  pendingRequestsCount: 0,
  createdAt: new Date().toISOString(),
  ...extra,
});

const visitor = (extra = {}) => ({
  email: "jeanne@dupont.fr",
  name: "Jeanne Dupont",
  firstVisitAt: new Date().toISOString(),
  lastVisitAt: new Date().toISOString(),
  visitCount: 2,
  downloadCount: 1,
  isBanned: false,
  ...extra,
});

// Case d'un dossier dans le choix des dossiers
const folderCheckbox = (name) =>
  within(
    screen.getByText(name, { selector: "label span" }).closest("label"),
  ).getByRole("checkbox");

const renderDialog = (props = {}) =>
  render(
    <ClientAccessDialog
      open
      onOpenChange={vi.fn()}
      folders={folders}
      initialFolderId={null}
      isReadOnly={false}
      {...props}
    />,
  );

describe("Fenêtre des accès clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.shares = [];
  });

  it("liste les accès avec leurs dossiers et leurs compteurs", () => {
    hook.shares = [
      share({
        folders: [
          { id: "f-dupont", name: "Client Dupont", available: true },
          { id: "f-factures", name: "Factures", available: false },
        ],
        visitors: [visitor()],
      }),
    ];
    renderDialog();
    expect(screen.getByText("Dupont")).toBeTruthy();
    expect(screen.getByText("Client Dupont")).toBeTruthy();
    expect(screen.getByText("Factures").closest("span").className).toContain(
      "line-through",
    );
    expect(
      screen.getByText(/1 visiteur · 3 consultations · 1 téléchargement/),
    ).toBeTruthy();
  });

  it("crée un accès sur plusieurs dossiers, dossier d'origine pré-coché", async () => {
    renderDialog({ initialFolderId: "f-dupont" });
    fireEvent.click(screen.getByRole("button", { name: /Nouvel accès/ }));
    expect(screen.getByLabelText("Nom de l'accès").value).toBe("Client Dupont");
    expect(folderCheckbox("Client Dupont").getAttribute("data-state")).toBe(
      "checked",
    );
    fireEvent.click(folderCheckbox("Factures"));
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "secret-123" },
    });
    fireEvent.change(screen.getByLabelText(/expiration/), {
      target: { value: "2030-03-15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer l'accès" }));

    await waitFor(() => expect(actions.createShare).toHaveBeenCalledTimes(1));
    const input = actions.createShare.mock.calls[0][0];
    expect(input.folderIds).toEqual(["f-dupont", "f-factures"]);
    expect(input).toMatchObject({
      name: "Client Dupont",
      password: "secret-123",
    });
    expect(new Date(input.expiresAt).toISOString()).toBe(
      new Date("2030-03-15T23:59:59").toISOString(),
    );
  });

  it("ne laisse pas cocher un dossier privé ni ce qu'il contient", () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Nouvel accès/ }));
    for (const name of ["RH", "Sous RH"]) {
      expect(
        within(screen.getByText(name).closest("label"))
          .getByRole("checkbox")
          .hasAttribute("disabled"),
      ).toBe(true);
    }
    expect(
      within(screen.getByText("Contrats").closest("label"))
        .getByRole("checkbox")
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("refuse un accès sans dossier", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Nouvel accès/ }));
    fireEvent.click(screen.getByRole("button", { name: "Créer l'accès" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Choisissez au moins un dossier",
      ),
    );
    expect(actions.createShare).not.toHaveBeenCalled();
  });

  it("modifie les dossiers, garde le mot de passe ou le retire", async () => {
    hook.shares = [share({ hasPassword: true })];
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'accès" }));
    fireEvent.click(folderCheckbox("Factures"));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(actions.updateShare).toHaveBeenCalledTimes(1));
    expect(actions.updateShare.mock.calls[0]).toEqual([
      "acces-1",
      {
        name: "Dupont",
        folderIds: ["f-dupont", "f-factures"],
        expiresAt: null,
      },
    ]);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Modifier l'accès" }),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Modifier l'accès" }));
    fireEvent.click(
      screen.getByRole("switch", { name: "Retirer le mot de passe" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(actions.updateShare).toHaveBeenCalledTimes(2));
    expect(actions.updateShare.mock.calls[1][1]).toMatchObject({
      password: null,
    });
  });

  it("désactive par révocation, réactive par modification", async () => {
    hook.shares = [share()];
    const { rerender } = renderDialog();
    fireEvent.click(screen.getByRole("switch", { name: "Accès actif" }));
    await waitFor(() =>
      expect(actions.revokeShare).toHaveBeenCalledWith("acces-1"),
    );

    hook.shares = [share({ isActive: false })];
    rerender(
      <ClientAccessDialog
        open
        onOpenChange={vi.fn()}
        folders={folders}
        initialFolderId={null}
        isReadOnly={false}
      />,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Accès actif" }));
    await waitFor(() =>
      expect(actions.updateShare).toHaveBeenCalledWith("acces-1", {
        isActive: true,
      }),
    );
  });

  it("retire l'accès d'un visiteur après confirmation, et le rétablit", async () => {
    hook.shares = [
      share({
        visitors: [
          visitor(),
          visitor({ email: "ancien@dupont.fr", name: "", isBanned: true }),
        ],
      }),
    ];
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Visiteurs \(2\)/ }));
    expect(screen.getByText("Jeanne Dupont")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Retirer l'accès/ }));
    expect(actions.revokeVisitor).not.toHaveBeenCalled();
    expect(screen.getByText("Retirer l'accès de Jeanne Dupont ?")).toBeTruthy();
    fireEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", {
        name: "Retirer l'accès",
      }),
    );
    await waitFor(() =>
      expect(actions.revokeVisitor).toHaveBeenCalledWith(
        "acces-1",
        "jeanne@dupont.fr",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: /Rétablir/ }));
    await waitFor(() =>
      expect(actions.unbanVisitor).toHaveBeenCalledWith(
        "acces-1",
        "ancien@dupont.fr",
      ),
    );
  });

  it("approuve ou refuse une demande d'accès", async () => {
    hook.shares = [
      share({
        accessRequests: [
          {
            id: "demande-1",
            email: "jeanne@dupont.fr",
            name: "Jeanne Dupont",
            message: "Je n'ai plus accès",
            requestedAt: new Date().toISOString(),
          },
        ],
        pendingRequestsCount: 1,
      }),
    ];
    renderDialog();
    expect(screen.getByText(/Demandes d'accès \(1\)/)).toBeTruthy();
    expect(screen.getByText("« Je n'ai plus accès »")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Approuver" }));
    await waitFor(() =>
      expect(actions.approveRequest).toHaveBeenCalledWith(
        "acces-1",
        "demande-1",
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Refuser" }));
    await waitFor(() =>
      expect(actions.rejectRequest).toHaveBeenCalledWith(
        "acces-1",
        "demande-1",
      ),
    );
  });

  it("supprime un accès après confirmation seulement", async () => {
    hook.shares = [share()];
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer l'accès" }));
    expect(actions.deleteShare).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() =>
      expect(actions.deleteShare).toHaveBeenCalledWith("acces-1"),
    );
  });

  it("copie l'adresse de l'accès", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    hook.shares = [share()];
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Copier le lien" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "https://www.newbi.fr/public/documents/abc",
      ),
    );
  });

  it("en lecture seule : ni création, ni modification, ni réponse aux demandes", () => {
    hook.shares = [
      share({
        accessRequests: [
          {
            id: "demande-1",
            email: "jeanne@dupont.fr",
            name: "",
            message: "",
            requestedAt: null,
          },
        ],
      }),
    ];
    renderDialog({ isReadOnly: true });
    expect(screen.queryByRole("button", { name: /Nouvel accès/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Modifier l'accès" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Approuver" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Supprimer l'accès" }),
    ).toBeTruthy();
  });
});
