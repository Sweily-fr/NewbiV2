/**
 * Espace du visiteur d'un lien client, au visuel de Documents partagés :
 * explorateur, fil d'Ariane, recherche dans tout le partage, colonnes
 * triables, aperçu et déconnexion ; dépôt, et sur ses propres dépôts
 * renommage, déplacement, nouvelle version et suppression.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props) => <img {...props} />,
}));
vi.mock("@/src/components/pdf/pdf-preview", () => ({
  PdfPreview: ({ src }) => <p>Aperçu PDF de {src}</p>,
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// File des dépôts : testée à part (public-upload-queue.test.jsx) ; ici on
// vérifie ce que l'explorateur lui confie
const queue = vi.hoisted(() => ({ add: vi.fn(), replace: vi.fn() }));
vi.mock("@/app/public/documents/[token]/components/upload-queue", () => ({
  useUploadQueue: () => ({
    items: [],
    busy: false,
    add: queue.add,
    replace: queue.replace,
    clear: () => {},
  }),
  UploadPanel: () => null,
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
      uploadUrl={(folderId) => `/depot/${folderId}`}
      replaceUrl={(documentId) => `/version/${documentId}`}
      onRename={props.onRename || (async () => {})}
      onMove={props.onMove || (async () => {})}
      onDelete={props.onDelete || (async () => {})}
      onChanged={props.onChanged || (() => {})}
      onSignOut={props.onSignOut || (() => {})}
    />,
  );

/** Menu « ⋯ » d'un document déposé par le visiteur. */
const openMenu = (name) =>
  fireEvent.keyDown(
    screen.getByRole("button", { name: `Actions pour ${name}` }),
    { key: "Enter" },
  );
const choose = (label) =>
  fireEvent.click(screen.getByRole("menuitem", { name: label }));

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

describe("Dépôt par le client", () => {
  beforeEach(() => {
    queue.add.mockClear();
  });

  const pdf = (name = "releve.pdf") =>
    new File(["%PDF-1.7"], name, { type: "application/pdf" });
  const fileInput = (container) =>
    container.querySelector('input[type="file"]');
  const deposited = () => {
    expect(queue.add).toHaveBeenCalledTimes(1);
    const [files, folder] = queue.add.mock.calls[0];
    return { names: [...files].map((file) => file.name), folder };
  };

  it("dépôt fermé : ni bouton, ni menu sur ses documents", () => {
    const { container } = renderFiles({
      documents: [{ ...content().documents[2], mine: true }],
    });
    expect(screen.queryByRole("button", { name: /Déposer/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Actions pour/ })).toBeNull();
    expect(fileInput(container)).toBeNull();
  });

  it("dépose dans le dossier ouvert, formats acceptés seulement", () => {
    const { container } = renderFiles({ allowUploads: true });
    expect(
      screen.getAllByRole("button", { name: /Déposer des documents/ }).length,
    ).toBeGreaterThan(0);
    const input = fileInput(container);
    expect(input.multiple).toBe(true);
    expect(input.accept).toContain(".pdf");
    fireEvent.change(input, { target: { files: [pdf("Relevé.pdf")] } });
    expect(deposited()).toEqual({
      names: ["Relevé.pdf"],
      folder: expect.objectContaining({ id: "racine", name: "Client Dupont" }),
    });
  });

  it("dépose dans un sous-dossier ouvert", () => {
    const { container } = renderFiles({ allowUploads: true });
    fireEvent.click(list().getByText("Contrats"));
    fireEvent.change(fileInput(container), { target: { files: [pdf()] } });
    expect(deposited().folder.id).toBe("contrats");
  });

  it("dépose par glisser-déposer", () => {
    renderFiles({ allowUploads: true });
    const main = screen.getByRole("main");
    const dataTransfer = { types: ["Files"], files: [pdf()] };
    fireEvent.dragEnter(main, { dataTransfer });
    expect(
      screen.getByText("Déposez vos fichiers dans « Client Dupont »"),
    ).toBeTruthy();
    fireEvent.drop(main, { dataTransfer });
    expect(deposited().folder.id).toBe("racine");
    expect(
      screen.queryByText("Déposez vos fichiers dans « Client Dupont »"),
    ).toBeNull();
  });

  it("pendant une recherche : pas de dépôt", () => {
    renderFiles({ allowUploads: true });
    fireEvent.change(screen.getByLabelText("Rechercher un document"), {
      target: { value: "contrat" },
    });
    expect(screen.queryByRole("button", { name: /Déposer/ })).toBeNull();
  });

  it("accueil de plusieurs dossiers : on dépose une fois un dossier ouvert", () => {
    renderFiles({
      allowUploads: true,
      rootFolderIds: ["racine", "autre"],
      folders: [
        ...content().folders,
        { id: "autre", name: "Factures", parentId: null, order: 1 },
      ],
    });
    expect(screen.queryByRole("button", { name: /Déposer/ })).toBeNull();
    fireEvent.click(list().getByText("Factures"));
    expect(
      screen.getAllByRole("button", { name: /Déposer des documents/ }).length,
    ).toBeGreaterThan(0);
  });

  it("supprime seulement ses propres documents, après confirmation", async () => {
    const onDelete = vi.fn(async () => {});
    const documents = content().documents.map((document) =>
      document.id === "d3" ? { ...document, mine: true } : document,
    );
    renderFiles({ allowUploads: true, documents }, { onDelete });
    expect(screen.getByText("Déposé par vous")).toBeTruthy();
    // Les autres documents du dossier : pas de menu
    expect(
      screen.getAllByRole("button", { name: /^Actions pour/ }),
    ).toHaveLength(1);
    openMenu("lettre.pdf");
    choose("Supprimer");
    expect(screen.getByText("Supprimer « lettre.pdf » ?")).toBeTruthy();
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
    expect(onDelete.mock.calls[0][0].id).toBe("d3");
  });

  it("contenu relu : un dossier ouvert qui disparaît ramène au dossier partagé", () => {
    const props = {
      fileUrl: (document, kind) => `/api/${document.id}/${kind}`,
      downloadAllUrl: "/api/tout",
      uploadUrl: (folderId) => `/depot/${folderId}`,
      onDelete: async () => {},
      onChanged: () => {},
      onSignOut: () => {},
    };
    const view = render(<SharedFiles content={content()} {...props} />);
    fireEvent.click(list().getByText("Contrats"));
    expect(list().getByText("Contrat signé.pdf")).toBeTruthy();
    const next = content({
      folders: content().folders.filter((folder) => folder.id !== "contrats"),
      documents: content().documents.filter((d) => d.folderId !== "contrats"),
    });
    view.rerender(<SharedFiles content={next} {...props} />);
    expect(list().getByText("lettre.pdf")).toBeTruthy();
    expect(list().queryByText("Contrats")).toBeNull();
  });
});

describe("Modification de ses documents par le client", () => {
  beforeEach(() => {
    queue.replace.mockClear();
  });

  // lettre.pdf (dossier « Client Dupont ») a été déposé par le visiteur
  const withMine = (overrides = {}) => ({
    allowUploads: true,
    documents: content().documents.map((document) =>
      document.id === "d3" ? { ...document, mine: true } : document,
    ),
    ...overrides,
  });

  it("menu sur ses seuls documents : renommer, déplacer, remplacer, supprimer", () => {
    renderFiles(withMine());
    expect(
      screen.getAllByRole("button", { name: /^Actions pour/ }),
    ).toHaveLength(1);
    openMenu("lettre.pdf");
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Renommer", "Déplacer", "Remplacer le fichier", "Supprimer"]);
  });

  it("renomme en gardant l'extension du fichier", async () => {
    const onRename = vi.fn(async () => {});
    renderFiles(withMine(), { onRename });
    openMenu("lettre.pdf");
    choose("Renommer");

    const field = screen.getByRole("textbox", { name: "Nouveau nom" });
    expect(field).toHaveValue("lettre");
    expect(screen.getByText(".pdf")).toBeTruthy();
    const submit = screen.getByRole("button", { name: "Renommer" });
    // Nom inchangé ou vide : rien à envoyer
    expect(submit).toBeDisabled();
    fireEvent.change(field, { target: { value: "   " } });
    expect(submit).toBeDisabled();

    fireEvent.change(field, { target: { value: "  Lettre de mission  " } });
    fireEvent.click(submit);
    await waitFor(() => expect(onRename).toHaveBeenCalledTimes(1));
    const [document, name] = onRename.mock.calls[0];
    expect(document.id).toBe("d3");
    expect(name).toBe("Lettre de mission.pdf");
    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: "Nouveau nom" })).toBeNull(),
    );
  });

  it("refus de l'API : la fenêtre reste ouverte avec son message", async () => {
    const onRename = vi.fn(async () => {
      throw new Error(
        "Les documents de cet espace ne peuvent pas être modifiés pour le moment.",
      );
    });
    renderFiles(withMine(), { onRename });
    openMenu("lettre.pdf");
    choose("Renommer");
    fireEvent.change(screen.getByRole("textbox", { name: "Nouveau nom" }), {
      target: { value: "Autre nom" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Renommer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ne peuvent pas être modifiés",
    );
    expect(screen.getByRole("textbox", { name: "Nouveau nom" })).toBeTruthy();
  });

  it("déplace dans un autre dossier du partage", async () => {
    const onMove = vi.fn(async () => {});
    renderFiles(withMine(), { onMove });
    openMenu("lettre.pdf");
    choose("Déplacer");

    const dialog = screen.getByRole("dialog");
    // Tout le partage, dans l'ordre de l'explorateur
    expect(
      within(dialog)
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("aria-label")),
    ).toEqual(["Client Dupont", "Contrats", "Archives"]);
    expect(within(dialog).getByText("Dossier actuel")).toBeTruthy();
    const submit = within(dialog).getByRole("button", { name: "Déplacer" });
    expect(submit).toBeDisabled();

    fireEvent.click(within(dialog).getByRole("radio", { name: "Contrats" }));
    fireEvent.click(submit);
    await waitFor(() => expect(onMove).toHaveBeenCalledTimes(1));
    expect(onMove.mock.calls[0][0].id).toBe("d3");
    expect(onMove.mock.calls[0][1]).toBe("contrats");
  });

  it("un seul dossier dans le partage : pas de déplacement", () => {
    renderFiles(
      withMine({
        folders: [content().folders[0]],
        documents: [{ ...content().documents[2], mine: true }],
      }),
    );
    openMenu("lettre.pdf");
    expect(screen.queryByRole("menuitem", { name: "Déplacer" })).toBeNull();
  });

  it("nouvelle version : le fichier choisi part dans la file d'envoi", () => {
    const { container } = renderFiles(withMine());
    const input = container.querySelector('[data-testid="nouvelle-version"]');
    const pick = vi.spyOn(input, "click").mockImplementation(() => {});
    openMenu("lettre.pdf");
    choose("Remplacer le fichier");
    expect(pick).toHaveBeenCalledTimes(1);
    expect(input.multiple).toBe(false);

    const file = new File(["%PDF-1.7"], "lettre-v2.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(queue.replace).toHaveBeenCalledTimes(1);
    const [sent, document] = queue.replace.mock.calls[0];
    expect(sent.name).toBe("lettre-v2.pdf");
    expect(document.id).toBe("d3");
  });

  it("document retiré entre-temps : sa fenêtre se ferme", () => {
    const props = {
      fileUrl: (document, kind) => `/api/${document.id}/${kind}`,
      downloadAllUrl: "/api/tout",
      uploadUrl: (folderId) => `/depot/${folderId}`,
      replaceUrl: (documentId) => `/version/${documentId}`,
      onRename: async () => {},
      onMove: async () => {},
      onDelete: async () => {},
      onChanged: () => {},
      onSignOut: () => {},
    };
    const view = render(
      <SharedFiles content={content(withMine())} {...props} />,
    );
    openMenu("lettre.pdf");
    choose("Renommer");
    expect(screen.getByRole("textbox", { name: "Nouveau nom" })).toBeTruthy();

    const next = content(
      withMine({
        documents: content().documents.filter((d) => d.id !== "d3"),
      }),
    );
    view.rerender(<SharedFiles content={next} {...props} />);
    expect(screen.queryByRole("textbox", { name: "Nouveau nom" })).toBeNull();
  });
});
