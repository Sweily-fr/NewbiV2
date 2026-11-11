/**
 * Espace du visiteur d'un lien client, au visuel de Documents partagés :
 * explorateur, fil d'Ariane, recherche dans tout le partage, colonnes
 * triables, aperçu et déconnexion.
 */
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props) => <img {...props} />,
}));
vi.mock("@/src/components/pdf/pdf-preview", () => ({
  PdfPreview: ({ src }) => <p>Aperçu PDF de {src}</p>,
}));

import { SharedFiles } from "@/app/public/documents/[token]/components/shared-files";

const content = (overrides = {}) => ({
  name: "Dossiers Dupont",
  expiresAt: null,
  workspace: { name: "Cabinet Martin", logo: null },
  visitor: { email: "client@dupont.fr" },
  rootFolderIds: ["racine"],
  folders: [
    {
      id: "racine",
      name: "Client Dupont",
      parentId: null,
      order: 0,
      color: "#22c55e",
    },
    { id: "contrats", name: "Contrats", parentId: "racine", order: 0 },
    { id: "vide", name: "Archives", parentId: "racine", order: 1 },
  ],
  documents: [
    {
      id: "d1",
      name: "Contrat signé.pdf",
      mimeType: "application/pdf",
      fileSize: 900_000,
      folderId: "contrats",
      createdAt: "2026-01-15T10:00:00Z",
    },
    {
      id: "d2",
      name: "annexe.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 1200,
      folderId: "contrats",
      createdAt: "2026-03-01T10:00:00Z",
    },
    {
      id: "d3",
      name: "lettre.pdf",
      mimeType: "application/pdf",
      fileSize: 300,
      folderId: "racine",
      createdAt: "2026-02-01T10:00:00Z",
    },
  ],
  ...overrides,
});

const renderFiles = (overrides, props = {}) =>
  render(
    <SharedFiles
      content={content(overrides)}
      fileUrl={(document, kind) => `/api/${document.id}/${kind}`}
      downloadAllUrl="/api/tout"
      onSignOut={props.onSignOut || (() => {})}
    />,
  );

const breadcrumb = () =>
  screen.getByRole("navigation", { name: "Emplacement" });
const list = () =>
  within(screen.getByRole("region", { name: "Contenu du dossier" }));

describe("SharedFiles", () => {
  it("s'ouvre sur le dossier partagé, avec l'explorateur et l'entreprise", () => {
    renderFiles();
    expect(screen.getAllByText("Cabinet Martin").length).toBeGreaterThan(0);
    expect(within(breadcrumb()).getByText("Client Dupont")).toBeTruthy();
    expect(within(breadcrumb()).getByText("(3)")).toBeTruthy();
    const explorer = screen.getAllByRole("navigation", {
      name: "Explorateur",
    })[0];
    expect(within(explorer).getByText("Contrats")).toBeTruthy();
    expect(list().getByText("lettre.pdf")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Tout télécharger/ }),
    ).toHaveAttribute("href", "/api/tout");
  });

  it("ouvre un sous-dossier et revient par le fil d'Ariane", () => {
    renderFiles();
    fireEvent.click(list().getByRole("button", { name: "Contrats" }));
    expect(within(breadcrumb()).getByText("Contrats")).toBeTruthy();
    expect(list().getByText("Contrat signé.pdf")).toBeTruthy();
    expect(list().queryByText("lettre.pdf")).toBeNull();
    fireEvent.click(
      within(breadcrumb()).getByRole("button", { name: "Client Dupont" }),
    );
    expect(list().getByText("lettre.pdf")).toBeTruthy();
  });

  it("dit qu'un dossier est vide", () => {
    renderFiles();
    fireEvent.click(list().getByRole("button", { name: "Archives" }));
    expect(screen.getByText("Ce dossier est vide.")).toBeTruthy();
  });

  it("cherche dans tout le partage, sans accents, et montre l'emplacement", () => {
    renderFiles();
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Rechercher un document" }),
      {
        target: { value: "signe" },
      },
    );
    expect(
      within(breadcrumb()).getByText("Résultats pour « signe »"),
    ).toBeTruthy();
    expect(list().getByText("Contrat signé.pdf")).toBeTruthy();
    expect(list().getByText("Client Dupont › Contrats")).toBeTruthy();
    expect(list().queryByText("lettre.pdf")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "zzz" },
    });
    expect(
      screen.getByText("Aucun document ne correspond à votre recherche."),
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Effacer la recherche" }),
    );
    expect(list().getByText("lettre.pdf")).toBeTruthy();
  });

  it("trie les documents par taille en cliquant sur la colonne", () => {
    renderFiles();
    fireEvent.click(list().getByRole("button", { name: "Contrats" }));
    const names = () =>
      list()
        .getAllByText(/\.(pdf|docx)$/)
        .map((element) => element.textContent);
    expect(names()).toEqual(["annexe.docx", "Contrat signé.pdf"]);
    fireEvent.click(screen.getByRole("button", { name: /^Taille/ }));
    expect(names()).toEqual(["Contrat signé.pdf", "annexe.docx"]);
    fireEvent.click(screen.getByRole("button", { name: /^Taille/ }));
    expect(names()).toEqual(["annexe.docx", "Contrat signé.pdf"]);
  });

  it("ouvre l'aperçu d'un PDF, avec son téléchargement", () => {
    renderFiles();
    fireEvent.click(screen.getByRole("button", { name: "Voir lettre.pdf" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Aperçu PDF de /api/d3/preview"),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("link", { name: /Télécharger/ }),
    ).toHaveAttribute("href", "/api/d3/download");
  });

  it("propose le téléchargement de chaque document", () => {
    renderFiles();
    expect(
      screen.getByRole("link", { name: "Télécharger lettre.pdf" }),
    ).toHaveAttribute("href", "/api/d3/download");
  });

  it("plusieurs dossiers partagés : accueil commun qui les liste", () => {
    renderFiles({
      rootFolderIds: ["racine", "contrats"],
    });
    expect(within(breadcrumb()).getByText("Dossiers Dupont")).toBeTruthy();
    expect(within(breadcrumb()).getByText("(2)")).toBeTruthy();
  });

  it("donne aux dossiers la couleur choisie dans Newbi", () => {
    const { container } = renderFiles();
    const colored = [...container.querySelectorAll("svg[style]")].filter(
      (icon) => /34, 197, 94|#22c55e/i.test(icon.getAttribute("style")),
    );
    expect(colored.length).toBeGreaterThan(0);
  });
});
