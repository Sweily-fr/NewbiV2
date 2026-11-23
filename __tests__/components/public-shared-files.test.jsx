/**
 * Espace du visiteur d'un lien client, au visuel de Documents partagés :
 * explorateur, fil d'Ariane, recherche dans tout le partage, colonnes
 * triables, aperçu et déconnexion ; dépôt de fichiers ou d'un dossier (dans
 * le dossier ouvert, ou depuis l'accueil dans le dossier choisi), nouveau
 * dossier ; sur ses propres dépôts renommage, déplacement, nouvelle version
 * et suppression, sur ses propres dossiers renommage et suppression.
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
import { toast } from "@/src/components/ui/sonner";

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
      onCreateFolders={props.onCreateFolders || (async () => [])}
      onRenameFolder={props.onRenameFolder || (async () => {})}
      onDeleteFolder={props.onDeleteFolder || (async () => {})}
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

/** Menu « Ajouter » de la barre du dossier. */
const openAddMenu = () =>
  fireEvent.keyDown(screen.getByRole("button", { name: /Ajouter/ }), {
    key: "Enter",
  });
/** Menu « ⋯ » d'un dossier créé par le visiteur. */
const openFolderMenu = (name) =>
  fireEvent.keyDown(
    screen.getByRole("button", { name: `Actions pour le dossier ${name}` }),
    { key: "Enter" },
  );
/** Deux dossiers partagés : l'accès s'ouvre sur l'accueil qui les liste. */
const twoShared = (overrides = {}) => ({
  allowUploads: true,
  rootFolderIds: ["racine", "autre"],
  folders: [
    ...content().folders,
    { id: "autre", name: "Factures", parentId: null, order: 1 },
  ],
  ...overrides,
});
/** Dossiers renvoyés par l'API, un par chemin demandé. */
const createdFolders = vi.fn(async (parentId, paths) =>
  paths.map((names) => ({
    id: `id-${names.join("-")}`,
    name: names[names.length - 1],
    created: true,
  })),
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

describe("Dépôt par le client", () => {
  beforeEach(() => {
    queue.add.mockClear();
    createdFolders.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();
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
  /** Chaque envoi confié à la file : noms des fichiers et dossier. */
  const sentGroups = () =>
    queue.add.mock.calls.map(([files, folder]) => [
      [...files].map((file) => file.name),
      folder,
    ]);
  /** Fichier d'un dossier choisi par le sélecteur, avec son chemin. */
  const inFolder = (path) => {
    const file = pdf(path.split("/").pop());
    Object.defineProperty(file, "webkitRelativePath", { value: path });
    return file;
  };
  const pickFolder = (files) =>
    fireEvent.change(screen.getByTestId("depot-dossier"), {
      target: { files },
    });

  it("dépôt fermé : ni bouton, ni menu sur ses documents", () => {
    const { container } = renderFiles({
      documents: [{ ...content().documents[2], mine: true }],
    });
    expect(screen.queryByRole("button", { name: /Ajouter/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Déposer/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Actions pour/ })).toBeNull();
    expect(fileInput(container)).toBeNull();
  });

  it("dépose dans le dossier ouvert, formats acceptés seulement", () => {
    const { container } = renderFiles({ allowUploads: true });
    openAddMenu();
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual([
      "Déposer des fichiers",
      "Déposer un dossier",
      "Nouveau dossier",
    ]);
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
    const hint = "Déposez vos fichiers ou dossiers dans « Client Dupont »";
    expect(screen.getByText(hint)).toBeTruthy();
    fireEvent.drop(main, { dataTransfer });
    expect(deposited().folder.id).toBe("racine");
    expect(screen.queryByText(hint)).toBeNull();
  });

  it("pendant une recherche : pas de dépôt", () => {
    renderFiles({ allowUploads: true });
    fireEvent.change(screen.getByLabelText("Rechercher un document"), {
      target: { value: "contrat" },
    });
    expect(screen.queryByRole("button", { name: /Ajouter/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Déposer/ })).toBeNull();
  });

  it("accueil de plusieurs dossiers : on choisit ensuite le dossier où déposer", async () => {
    const { container } = renderFiles(twoShared());
    expect(screen.getByRole("button", { name: /Ajouter/ })).toBeTruthy();
    fireEvent.change(fileInput(container), {
      target: { files: [pdf("a.pdf"), pdf("b.pdf"), pdf("c.pdf")] },
    });
    expect(queue.add).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Déposer 3 fichiers")).toBeTruthy();
    expect(within(dialog).getByText("a.pdf, b.pdf et 1 autre")).toBeTruthy();
    // Tout le partage, sous-dossiers compris, rien de choisi d'avance
    expect(
      within(dialog)
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("aria-label")),
    ).toEqual(["Client Dupont", "Contrats", "Archives", "Factures"]);
    const submit = within(dialog).getByRole("button", { name: "Déposer" });
    expect(submit).toBeDisabled();

    fireEvent.click(within(dialog).getByRole("radio", { name: "Contrats" }));
    fireEvent.click(submit);
    await waitFor(() => expect(queue.add).toHaveBeenCalledTimes(1));
    expect(deposited()).toEqual({
      names: ["a.pdf", "b.pdf", "c.pdf"],
      folder: expect.objectContaining({ id: "contrats" }),
    });
    // Le dossier choisi s'ouvre : les fichiers y arrivent sous ses yeux
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(within(breadcrumb()).getByText("Contrats")).toBeTruthy();
  });

  it("accueil : un glisser-déposer demande aussi le dossier", () => {
    renderFiles(twoShared());
    const main = screen.getByRole("main");
    const dataTransfer = { types: ["Files"], files: [pdf()] };
    fireEvent.dragEnter(main, { dataTransfer });
    expect(
      screen.getByText(
        "Déposez vos fichiers ou dossiers : vous choisirez ensuite le dossier",
      ),
    ).toBeTruthy();
    fireEvent.drop(main, { dataTransfer });
    expect(queue.add).not.toHaveBeenCalled();
    expect(
      within(screen.getByRole("dialog")).getByText("Déposer 1 fichier"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it("dépose un dossier et ses sous-dossiers dans le dossier ouvert", async () => {
    renderFiles({ allowUploads: true }, { onCreateFolders: createdFolders });
    pickFolder([
      inFolder("Factures/janvier.pdf"),
      inFolder("Factures/2026/fevrier.pdf"),
      inFolder("Factures/2026/mars.pdf"),
      // Fichiers et dossiers cachés : laissés de côté
      inFolder("Factures/.DS_Store"),
      inFolder("Factures/.git/config.pdf"),
    ]);
    await waitFor(() => expect(queue.add).toHaveBeenCalledTimes(2));
    // Les dossiers d'abord, en une fois, parents avant enfants
    expect(createdFolders).toHaveBeenCalledTimes(1);
    expect(createdFolders).toHaveBeenCalledWith("racine", [
      ["Factures"],
      ["Factures", "2026"],
    ]);
    expect(sentGroups()).toEqual([
      [
        ["janvier.pdf"],
        { id: "id-Factures", name: "Client Dupont › Factures" },
      ],
      [
        ["fevrier.pdf", "mars.pdf"],
        { id: "id-Factures-2026", name: "Client Dupont › Factures › 2026" },
      ],
    ]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("accueil : un dossier déposé attend lui aussi le choix du dossier", async () => {
    renderFiles(twoShared(), { onCreateFolders: createdFolders });
    pickFolder([inFolder("Relevés/2026/a.pdf"), inFolder("Relevés/b.pdf")]);
    expect(createdFolders).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText(/^Déposer le dossier «\sRelevés\s»$/),
    ).toBeTruthy();
    expect(within(dialog).getByText("2 fichiers dans 2 dossiers")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("radio", { name: "Factures" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Déposer" }));

    await waitFor(() => expect(queue.add).toHaveBeenCalledTimes(2));
    expect(createdFolders).toHaveBeenCalledWith("autre", [
      ["Relevés"],
      ["Relevés", "2026"],
    ]);
    expect(sentGroups().map(([names, folder]) => [names, folder.id])).toEqual([
      [["a.pdf"], "id-Relevés-2026"],
      [["b.pdf"], "id-Relevés"],
    ]);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(within(breadcrumb()).getByText("Factures")).toBeTruthy();
  });

  it("dossiers refusés par l'API : rien n'est envoyé, le message reste", async () => {
    const onCreateFolders = vi.fn(async () => {
      throw new Error(
        "Cet espace ne peut pas recevoir de documents pour le moment.",
      );
    });
    renderFiles(twoShared(), { onCreateFolders });
    pickFolder([inFolder("Relevés/a.pdf")]);
    fireEvent.click(screen.getByRole("radio", { name: "Factures" }));
    fireEvent.click(screen.getByRole("button", { name: "Déposer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ne peut pas recevoir",
    );
    expect(queue.add).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("glisser-déposer d'un dossier : parcouru avec ses sous-dossiers, même vides", async () => {
    renderFiles({ allowUploads: true }, { onCreateFolders: createdFolders });
    const fileEntry = (path) => ({
      isFile: true,
      isDirectory: false,
      name: path.split("/").pop(),
      fullPath: `/${path}`,
      file: (resolve) => resolve(pdf(path.split("/").pop())),
    });
    const directoryEntry = (path, children) => ({
      isFile: false,
      isDirectory: true,
      name: path.split("/").pop(),
      fullPath: `/${path}`,
      createReader: () => {
        let read = false;
        return {
          readEntries: (resolve) => {
            resolve(read ? [] : children);
            read = true;
          },
        };
      },
    });
    const dropped = directoryEntry("Factures", [
      fileEntry("Factures/a.pdf"),
      directoryEntry("Factures/Vide", []),
      directoryEntry("Factures/.cache", [fileEntry("Factures/.cache/x.pdf")]),
    ]);
    fireEvent.drop(screen.getByRole("main"), {
      dataTransfer: {
        types: ["Files"],
        files: [],
        items: [{ kind: "file", webkitGetAsEntry: () => dropped }],
      },
    });
    await waitFor(() => expect(queue.add).toHaveBeenCalledTimes(1));
    expect(createdFolders).toHaveBeenCalledWith("racine", [
      ["Factures"],
      ["Factures", "Vide"],
    ]);
    expect(sentGroups()).toEqual([
      [["a.pdf"], { id: "id-Factures", name: "Client Dupont › Factures" }],
    ]);
  });

  it("navigateur qui ne sait pas choisir un dossier : de simples fichiers", () => {
    renderFiles({ allowUploads: true }, { onCreateFolders: createdFolders });
    pickFolder([pdf("a.pdf")]);
    expect(createdFolders).not.toHaveBeenCalled();
    expect(deposited()).toEqual({
      names: ["a.pdf"],
      folder: expect.objectContaining({ id: "racine" }),
    });
  });

  it("dossier trop gros : refusé avant tout envoi", () => {
    renderFiles({ allowUploads: true }, { onCreateFolders: createdFolders });
    pickFolder(
      Array.from({ length: 501 }, (_, index) =>
        inFolder(`Photos/photo-${index}.pdf`),
      ),
    );
    expect(toast.error).toHaveBeenCalledWith(
      "Trop de fichiers d'un coup (500 au plus).",
    );
    expect(createdFolders).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
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

  /** « Remplacer le fichier » sur lettre.pdf, puis choix de `file`. */
  const pickNewVersion = (container, file) => {
    const input = container.querySelector('[data-testid="nouvelle-version"]');
    const pick = vi.spyOn(input, "click").mockImplementation(() => {});
    openMenu("lettre.pdf");
    choose("Remplacer le fichier");
    expect(pick).toHaveBeenCalledTimes(1);
    expect(input.multiple).toBe(false);
    fireEvent.change(input, { target: { files: [file] } });
  };
  const pdf = (name) =>
    new File(["%PDF-1.7"], name, { type: "application/pdf" });

  it("nouvelle version : le nom du nouveau fichier est proposé d'abord", () => {
    const { container } = renderFiles(withMine());
    pickNewVersion(container, pdf("Lettre signée.pdf"));
    // Rien ne part avant la confirmation
    expect(queue.replace).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading")).toHaveTextContent(
      "Remplacer « lettre.pdf »",
    );
    expect(
      within(dialog).getByRole("radio", { name: "Nom du nouveau fichier" }),
    ).toBeChecked();
    expect(
      within(dialog).getByRole("radio", { name: "Garder le nom actuel" }),
    ).not.toBeChecked();

    fireEvent.click(within(dialog).getByRole("button", { name: "Remplacer" }));
    expect(queue.replace).toHaveBeenCalledTimes(1);
    const [sent, document, name] = queue.replace.mock.calls[0];
    expect(sent.name).toBe("Lettre signée.pdf");
    expect(document.id).toBe("d3");
    expect(name).toBe("Lettre signée.pdf");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("nouvelle version : garder le nom actuel, avec l'extension du nouveau fichier", () => {
    const { container } = renderFiles(withMine());
    pickNewVersion(
      container,
      new File(["png"], "IMG_2034.png", { type: "image/png" }),
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("radio", { name: "Garder le nom actuel" }),
    );
    expect(within(dialog).getByText("lettre.png")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Remplacer" }));
    expect(queue.replace.mock.calls[0][2]).toBe("lettre.png");
  });

  it("nouvelle version du même nom : rien à choisir, juste confirmer", () => {
    const { container } = renderFiles(withMine());
    pickNewVersion(container, pdf("lettre.pdf"));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByRole("radio")).toBeNull();
    fireEvent.click(within(dialog).getByRole("button", { name: "Remplacer" }));
    expect(queue.replace.mock.calls[0][2]).toBe("lettre.pdf");
  });

  it("nouvelle version annulée : rien n'est envoyé", () => {
    const { container } = renderFiles(withMine());
    pickNewVersion(container, pdf("Lettre signée.pdf"));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(queue.replace).not.toHaveBeenCalled();
  });

  it("nouvelle version d'un format refusé : la file dit pourquoi, sans fenêtre", () => {
    const { container } = renderFiles(withMine());
    pickNewVersion(container, new File(["MZ"], "outil.exe"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(queue.replace).toHaveBeenCalledTimes(1);
    const [sent, document, name] = queue.replace.mock.calls[0];
    expect(sent.name).toBe("outil.exe");
    expect(document.id).toBe("d3");
    expect(name).toBeUndefined();
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

describe("Dossiers créés par le client", () => {
  beforeEach(() => {
    createdFolders.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();
  });

  // « Archives » (dans « Client Dupont ») a été créé par le visiteur
  const withMineFolder = (overrides = {}) => ({
    allowUploads: true,
    folders: content().folders.map((folder) =>
      folder.id === "vide" ? { ...folder, mine: true } : folder,
    ),
    ...overrides,
  });

  it("nouveau dossier dans le dossier ouvert, puis il s'ouvre", async () => {
    // L'API renvoie le dossier créé ; ici, un dossier déjà dans le partage
    const onCreateFolders = vi.fn(async () => [
      { id: "vide", name: "Archives", created: true },
    ]);
    renderFiles({ allowUploads: true }, { onCreateFolders });
    openAddMenu();
    choose("Nouveau dossier");

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Il sera créé dans/)).toHaveTextContent(
      "Client Dupont",
    );
    // Dossier ouvert : pas de choix d'emplacement
    expect(within(dialog).queryAllByRole("radio")).toHaveLength(0);
    const field = within(dialog).getByRole("textbox", {
      name: "Nom du dossier",
    });
    const submit = within(dialog).getByRole("button", { name: "Créer" });
    expect(submit).toBeDisabled();

    // Nom déjà pris à cet endroit : signalé avant l'envoi
    fireEvent.change(field, { target: { value: "Contrats " } });
    expect(
      within(dialog).getByText("Un dossier porte déjà ce nom à cet endroit."),
    ).toBeTruthy();
    expect(submit).toBeDisabled();

    fireEvent.change(field, { target: { value: "  Factures   2026 " } });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(onCreateFolders).toHaveBeenCalledWith("racine", [
        ["Factures 2026"],
      ]),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(within(breadcrumb()).getByText("Archives")).toBeTruthy();
    expect(toast.success).toHaveBeenCalledWith("Dossier « Archives » créé");
  });

  it("nouveau dossier depuis l'accueil : on choisit où le créer", async () => {
    renderFiles(twoShared(), { onCreateFolders: createdFolders });
    openAddMenu();
    choose("Nouveau dossier");
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Choisissez où le créer.")).toBeTruthy();
    fireEvent.change(
      within(dialog).getByRole("textbox", { name: "Nom du dossier" }),
      { target: { value: "Relevés" } },
    );
    const submit = within(dialog).getByRole("button", { name: "Créer" });
    expect(submit).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("radio", { name: "Factures" }));
    fireEvent.click(submit);
    await waitFor(() =>
      expect(createdFolders).toHaveBeenCalledWith("autre", [["Relevés"]]),
    );
  });

  it("ses dossiers : marqués, avec un menu ; jamais ceux des autres ni un dossier partagé", () => {
    renderFiles(withMineFolder());
    expect(list().getByText("Créé par vous")).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /^Actions pour le dossier/ }),
    ).toHaveLength(1);
    openFolderMenu("Archives");
    expect(
      screen.getAllByRole("menuitem").map((item) => item.textContent),
    ).toEqual(["Renommer", "Supprimer"]);
  });

  it("dossier partagé par le propriétaire : jamais de menu, même créé par le visiteur", () => {
    renderFiles(
      twoShared({
        folders: twoShared().folders.map((folder) =>
          folder.id === "racine" ? { ...folder, mine: true } : folder,
        ),
      }),
    );
    expect(list().getByText("Créé par vous")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /^Actions pour le dossier/ }),
    ).toBeNull();
  });

  it("dépôt fermé : ses dossiers restent marqués, sans menu", () => {
    renderFiles(withMineFolder({ allowUploads: false }));
    expect(list().getByText("Créé par vous")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /^Actions pour le dossier/ }),
    ).toBeNull();
  });

  it("renomme son dossier ; un nom déjà pris est signalé", async () => {
    const onRenameFolder = vi.fn(async () => {});
    renderFiles(withMineFolder(), { onRenameFolder });
    openFolderMenu("Archives");
    choose("Renommer");

    const field = screen.getByRole("textbox", { name: "Nouveau nom" });
    expect(field).toHaveValue("Archives");
    const submit = screen.getByRole("button", { name: "Renommer" });
    expect(submit).toBeDisabled();
    fireEvent.change(field, { target: { value: "Contrats" } });
    expect(
      screen.getByText("Un dossier porte déjà ce nom à cet endroit."),
    ).toBeTruthy();
    expect(submit).toBeDisabled();

    fireEvent.change(field, { target: { value: " Archives  2026 " } });
    fireEvent.click(submit);
    await waitFor(() => expect(onRenameFolder).toHaveBeenCalledTimes(1));
    const [folder, name] = onRenameFolder.mock.calls[0];
    expect(folder.id).toBe("vide");
    expect(name).toBe("Archives 2026");
    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: "Nouveau nom" })).toBeNull(),
    );
    expect(toast.success).toHaveBeenCalledWith("Dossier renommé");
  });

  it("supprime son dossier après confirmation ; un refus de l'API est affiché", async () => {
    const onDeleteFolder = vi.fn(async () => {
      throw new Error(
        "Ce dossier contient des éléments que vous n'avez pas ajoutés : seul votre interlocuteur peut le supprimer.",
      );
    });
    renderFiles(withMineFolder(), { onDeleteFolder });
    openFolderMenu("Archives");
    choose("Supprimer");
    expect(screen.getByText(/Supprimer le dossier/)).toHaveTextContent(
      "Archives",
    );
    expect(onDeleteFolder).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    await waitFor(() => expect(onDeleteFolder).toHaveBeenCalledTimes(1));
    expect(onDeleteFolder.mock.calls[0][0].id).toBe("vide");
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("pas ajoutés"),
      ),
    );
  });
});
