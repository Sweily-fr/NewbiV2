import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const hook = vi.hoisted(() => ({
  shares: [],
  createShare: vi.fn(async () => ({})),
  updateShare: vi.fn(async () => ({})),
  revokeShare: vi.fn(async () => ({})),
  deleteShare: vi.fn(async () => ({})),
}));

vi.mock("@/src/hooks/useDocumentShares", () => ({
  useDocumentShares: () => ({ ...hook, loading: false, saving: false }),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import ShareFolderDialog from "@/app/dashboard/outils/documents-partages/components/share-folder-dialog";
import { toast } from "@/src/components/ui/sonner";

const folder = { id: "dossier-1", name: "Client Dupont" };
const share = (extra = {}) => ({
  id: "lien-1",
  folderId: folder.id,
  name: "Dupont",
  isActive: true,
  expiresAt: null,
  hasPassword: false,
  isFolderAvailable: true,
  shareUrl: "https://www.newbi.fr/public/documents/abc",
  totalViews: 3,
  totalDownloads: 1,
  lastViewedAt: null,
  createdAt: new Date().toISOString(),
  ...extra,
});

const renderDialog = (props = {}) =>
  render(
    <ShareFolderDialog
      folder={folder}
      open
      onOpenChange={vi.fn()}
      isReadOnly={false}
      {...props}
    />,
  );

describe("Fenêtre des liens clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.shares = [];
  });

  it("n'affiche que les liens du dossier ouvert", () => {
    hook.shares = [
      share(),
      share({ id: "lien-2", folderId: "autre", name: "Autre client" }),
    ];
    renderDialog();
    expect(screen.getByText("Dupont")).toBeTruthy();
    expect(screen.queryByText("Autre client")).toBeNull();
    expect(screen.getByText(/3 consultations · 1 téléchargement/)).toBeTruthy();
  });

  it("crée un lien avec le nom du dossier proposé, le mot de passe et la fin de journée", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: /Nouveau lien/ }));
    expect(screen.getByLabelText("Nom du lien").value).toBe("Client Dupont");
    fireEvent.change(screen.getByLabelText(/Mot de passe/), {
      target: { value: "secret-123" },
    });
    fireEvent.change(screen.getByLabelText(/expiration/), {
      target: { value: "2030-03-15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer le lien" }));

    await waitFor(() => expect(hook.createShare).toHaveBeenCalledTimes(1));
    const input = hook.createShare.mock.calls[0][0];
    expect(input).toMatchObject({
      folderId: folder.id,
      name: "Client Dupont",
      password: "secret-123",
    });
    expect(new Date(input.expiresAt).toISOString()).toBe(
      new Date("2030-03-15T23:59:59").toISOString(),
    );
    await waitFor(() =>
      expect(screen.queryByLabelText("Nom du lien")).toBeNull(),
    );
  });

  it("modifie sans toucher au mot de passe, ou le retire sur demande", async () => {
    hook.shares = [share({ hasPassword: true })];
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Modifier le lien" }));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(hook.updateShare).toHaveBeenCalledTimes(1));
    expect(hook.updateShare.mock.calls[0]).toEqual([
      "lien-1",
      { name: "Dupont", expiresAt: null },
    ]);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Modifier le lien" }),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Modifier le lien" }));
    fireEvent.click(screen.getByRole("switch"));
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    await waitFor(() => expect(hook.updateShare).toHaveBeenCalledTimes(2));
    expect(hook.updateShare.mock.calls[1][1]).toMatchObject({ password: null });
  });

  it("désactive un lien et supprime après confirmation seulement", async () => {
    hook.shares = [share()];
    renderDialog();
    fireEvent.click(screen.getByRole("switch", { name: "Lien actif" }));
    await waitFor(() =>
      expect(hook.revokeShare).toHaveBeenCalledWith("lien-1"),
    );

    fireEvent.click(screen.getByRole("button", { name: "Supprimer le lien" }));
    expect(hook.deleteShare).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() =>
      expect(hook.deleteShare).toHaveBeenCalledWith("lien-1"),
    );
  });

  it("copie l'adresse du lien", async () => {
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

  it("signale un dossier devenu privé et affiche le refus de l'API", async () => {
    hook.shares = [share({ isFolderAvailable: false })];
    hook.revokeShare.mockRejectedValueOnce(new Error("Refusé par l'API"));
    renderDialog();
    expect(screen.getByText("Dossier fermé")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: "Lien actif" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Refusé par l'API"),
    );
  });

  it("réactive un lien désactivé", async () => {
    hook.shares = [share({ isActive: false })];
    renderDialog();
    fireEvent.click(screen.getByRole("switch", { name: "Lien actif" }));
    await waitFor(() =>
      expect(hook.updateShare).toHaveBeenCalledWith("lien-1", {
        isActive: true,
      }),
    );
    expect(hook.revokeShare).not.toHaveBeenCalled();
  });

  it("en lecture seule : ni création ni modification, mais on peut supprimer", () => {
    hook.shares = [share()];
    renderDialog({ isReadOnly: true });
    expect(screen.queryByRole("button", { name: /Nouveau lien/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Modifier le lien" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Supprimer le lien" }),
    ).toBeTruthy();
  });
});
