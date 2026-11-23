/**
 * Page du visiteur d'un lien client : familles de fichiers, tri des
 * colonnes, arbre du partage, recherche sans accents, et dépôt de fichiers
 * ou d'un dossier (noms de dossiers, plan d'envoi, dossier glissé-déposé).
 */
import { describe, it, expect } from "vitest";
import {
  HOME,
  IMPORT_MAX_DEPTH,
  IMPORT_MAX_FILES,
  IMPORT_MAX_FOLDERS,
  buildShareTree,
  cleanFolderName,
  depositPlan,
  depositPlanProblem,
  depositSummary,
  fileKind,
  filesPlan,
  folderChoices,
  formatFileSize,
  isHiddenName,
  pickedFolderPlan,
  previewKind,
  readDroppedEntries,
  replacementNames,
  searchShare,
  sortDocuments,
  splitName,
  UPLOAD_ACCEPT,
  uploadProblem,
} from "@/app/public/documents/[token]/components/shared-files-utils";

const folders = [
  { id: "racine", name: "Client Dupont", parentId: null, order: 0 },
  { id: "contrats", name: "Contrats", parentId: "racine", order: 2 },
  { id: "factures", name: "Factures", parentId: "racine", order: 1 },
  { id: "annee", name: "2026", parentId: "factures", order: 0 },
  { id: "autre", name: "Équipe", parentId: null, order: 0 },
];
const documents = [
  {
    id: "d1",
    name: "facture-mars.pdf",
    mimeType: "application/pdf",
    fileSize: 2048,
    folderId: "annee",
    createdAt: "2026-03-02T10:00:00Z",
  },
  {
    id: "d2",
    name: "Contrat signé.pdf",
    mimeType: "application/pdf",
    fileSize: 900_000,
    folderId: "contrats",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "d3",
    name: "budget.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: 50,
    folderId: "contrats",
    createdAt: "2026-02-01T10:00:00Z",
  },
];

describe("formatFileSize", () => {
  it("écrit les tailles en unités françaises", () => {
    expect(formatFileSize(0)).toBe("0 o");
    expect(formatFileSize(512)).toBe("512 o");
    expect(formatFileSize(2048)).toBe("2,0 Ko");
    expect(formatFileSize(1_500_000)).toBe("1,4 Mo");
  });
});

describe("fileKind et previewKind", () => {
  it("range chaque fichier dans la famille de son icône", () => {
    expect(fileKind({ mimeType: "image/png", name: "a.png" })).toBe("image");
    expect(fileKind({ mimeType: "video/mp4", name: "a.mp4" })).toBe("video");
    expect(fileKind({ mimeType: "", name: "scan.PDF" })).toBe("pdf");
    expect(fileKind(documents[2])).toBe("sheet");
    expect(fileKind({ mimeType: "text/csv", name: "export.csv" })).toBe(
      "sheet",
    );
    expect(fileKind({ mimeType: "application/msword", name: "a.doc" })).toBe(
      "doc",
    );
    expect(fileKind({ mimeType: "application/zip", name: "a.zip" })).toBe(
      "file",
    );
  });

  it("n'ouvre en aperçu que les formats lisibles par le navigateur", () => {
    expect(previewKind(documents[0])).toBe("pdf");
    expect(previewKind({ mimeType: "image/heic", name: "a.heic" })).toBe(
      "image",
    );
    expect(previewKind(documents[2])).toBe(null);
  });
});

describe("sortDocuments", () => {
  it("trie par nom sans tenir compte des majuscules ni des accents", () => {
    expect(sortDocuments(documents).map((d) => d.id)).toEqual([
      "d3",
      "d2",
      "d1",
    ]);
  });

  it("trie par taille ou par date, dans les deux sens", () => {
    expect(
      sortDocuments(documents, { by: "size", order: "desc" }).map((d) => d.id),
    ).toEqual(["d2", "d1", "d3"]);
    expect(
      sortDocuments(documents, { by: "date", order: "asc" }).map((d) => d.id),
    ).toEqual(["d2", "d3", "d1"]);
  });

  it("ne modifie pas la liste reçue", () => {
    const copy = [...documents];
    sortDocuments(documents, { by: "size" });
    expect(documents).toEqual(copy);
  });
});

describe("buildShareTree", () => {
  const tree = buildShareTree({
    folders,
    documents,
    rootFolderIds: ["racine", "autre"],
  });

  it("liste les dossiers partagés à l'accueil, dans l'ordre choisi", () => {
    expect(tree.subfolders(HOME).map((f) => f.id)).toEqual(["racine", "autre"]);
    expect(tree.subfolders("racine").map((f) => f.id)).toEqual([
      "factures",
      "contrats",
    ]);
  });

  it("range les documents par dossier, par nom", () => {
    expect(tree.documentsIn("contrats").map((d) => d.id)).toEqual(["d3", "d2"]);
    expect(tree.documentsIn("racine")).toEqual([]);
  });

  it("donne le chemin d'un dossier depuis sa racine partagée", () => {
    expect(tree.pathTo("annee").map((f) => f.name)).toEqual([
      "Client Dupont",
      "Factures",
      "2026",
    ]);
    expect(tree.pathTo(HOME)).toEqual([]);
  });

  it("une racine partagée sous-dossier d'un autre partage reste une racine", () => {
    const nested = buildShareTree({
      folders,
      documents,
      rootFolderIds: ["factures"],
    });
    expect(nested.pathTo("annee").map((f) => f.id)).toEqual([
      "factures",
      "annee",
    ]);
  });
});

describe("searchShare", () => {
  it("cherche dans tout le partage, sans accents ni majuscules", () => {
    const found = searchShare({ folders, documents }, "  SIGNE ");
    expect(found.documents.map((d) => d.id)).toEqual(["d2"]);
    expect(searchShare({ folders, documents }, "equipe").folders).toEqual([
      folders[4],
    ]);
  });
});

describe("uploadProblem", () => {
  const file = (name, size = 1000) => ({ name, size });

  it("laisse passer les formats acceptés par l'API", () => {
    for (const name of [
      "a.pdf",
      "b.PNG",
      "c.jpeg",
      "d.heic",
      "e.docx",
      "f.xls",
      "g.csv",
      "h.txt",
      "i.mp4",
    ]) {
      expect(uploadProblem(file(name))).toBeNull();
    }
    expect(UPLOAD_ACCEPT).toContain(".pdf");
    expect(UPLOAD_ACCEPT).toContain(".mov");
  });

  it("refuse un format absent, un fichier vide ou trop lourd", () => {
    expect(uploadProblem(file("page.html"))).toMatch(/Format non accepté/);
    expect(uploadProblem(file("sans-extension"))).toMatch(/Format/);
    expect(uploadProblem(file("vide.pdf", 0))).toBe("Le fichier est vide.");
    expect(uploadProblem(file("gros.pdf", 50 * 1024 * 1024 + 1))).toMatch(
      /50 Mo/,
    );
    // Une vidéo a droit à 100 Mo
    expect(uploadProblem(file("film.mp4", 60 * 1024 * 1024))).toBeNull();
    expect(uploadProblem(file("film.mp4", 100 * 1024 * 1024 + 1))).toMatch(
      /100 Mo/,
    );
  });
});

describe("folderChoices", () => {
  it("liste tout le partage dans l'ordre de l'explorateur, avec la profondeur", () => {
    const tree = buildShareTree({
      folders,
      documents,
      rootFolderIds: ["racine", "autre"],
    });
    expect(
      folderChoices(tree).map(({ folder, depth }) => [folder.name, depth]),
    ).toEqual([
      ["Client Dupont", 0],
      ["Factures", 1],
      ["2026", 2],
      ["Contrats", 1],
      ["Équipe", 0],
    ]);
  });
});

describe("splitName", () => {
  it("sépare la partie modifiable de l'extension", () => {
    expect(splitName("Relevé mars.pdf")).toEqual({
      stem: "Relevé mars",
      extension: "pdf",
    });
    expect(splitName("Scan.JPG")).toEqual({ stem: "Scan", extension: "jpg" });
    expect(splitName("archive.tar.gz")).toEqual({
      stem: "archive.tar",
      extension: "gz",
    });
    expect(splitName("sans extension")).toEqual({
      stem: "sans extension",
      extension: "",
    });
    expect(splitName(undefined)).toEqual({ stem: "", extension: "" });
  });
});

describe("replacementNames", () => {
  it("nom du nouveau fichier ou nom actuel, avec l'extension du nouveau fichier", () => {
    expect(replacementNames("lettre.pdf", "Lettre signée.pdf")).toEqual({
      fromFile: "Lettre signée.pdf",
      keep: "lettre.pdf",
    });
    // Autre format : le nom actuel prend l'extension du nouveau fichier
    expect(replacementNames("Carte grise.png", "SCAN 12.PDF")).toEqual({
      fromFile: "SCAN 12.pdf",
      keep: "Carte grise.pdf",
    });
  });

  it("espaces et points de fin retirés, comme l'API", () => {
    expect(
      replacementNames("Relevé  mars .pdf", "  Relevé   avril. .pdf"),
    ).toEqual({
      fromFile: "Relevé avril.pdf",
      keep: "Relevé mars.pdf",
    });
  });

  it("fichier sans nom utilisable : seul le nom actuel est proposé", () => {
    expect(replacementNames("lettre.pdf", ".pdf").fromFile).toBeNull();
    expect(replacementNames("lettre.pdf", " .pdf").fromFile).toBeNull();
  });
});

describe("cleanFolderName", () => {
  it("nettoie comme l'API : espaces, séparateurs, fin du nom", () => {
    expect(cleanFolderName("  Factures   2026  ")).toBe("Factures 2026");
    expect(cleanFolderName("2025/2026")).toBe("2025-2026");
    expect(cleanFolderName("Archives... ")).toBe("Archives");
    expect(cleanFolderName("a".repeat(300))).toHaveLength(120);
  });

  it("rien d'utilisable : chaîne vide", () => {
    for (const name of ["", "   ", "...", 42, null, undefined]) {
      expect(cleanFolderName(name)).toBe("");
    }
  });
});

describe("isHiddenName", () => {
  it("fichiers et dossiers cachés ou du système", () => {
    for (const name of [".DS_Store", ".git", "__MACOSX", "Thumbs.db"]) {
      expect(isHiddenName(name)).toBe(true);
    }
    for (const name of ["Factures", "relevé.pdf", "desktop.pdf"]) {
      expect(isHiddenName(name)).toBe(false);
    }
  });
});

const file = (name) => ({ name });

describe("depositPlan", () => {
  it("dossiers à créer (parents d'abord) et dossier de chaque fichier", () => {
    const plan = depositPlan([
      { file: file("a.pdf"), path: "Factures/2026/Janvier/a.pdf" },
      { file: file("b.pdf"), path: "Factures/b.pdf" },
      { file: file("c.pdf"), path: "c.pdf" },
      { file: file("d.pdf"), path: "Factures/2026/d.pdf" },
    ]);
    expect(plan.folders).toEqual([
      ["Factures"],
      ["Factures", "2026"],
      ["Factures", "2026", "Janvier"],
    ]);
    expect(plan.files.map(({ file, folder }) => [file.name, folder])).toEqual([
      ["a.pdf", ["Factures", "2026", "Janvier"]],
      ["b.pdf", ["Factures"]],
      ["c.pdf", []],
      ["d.pdf", ["Factures", "2026"]],
    ]);
  });

  it("laisse de côté ce qui est caché, garde les dossiers vides", () => {
    const plan = depositPlan(
      [
        { file: file(".DS_Store"), path: "Factures/.DS_Store" },
        { file: file("x.pdf"), path: "Factures/.git/x.pdf" },
        { file: file("a.pdf"), path: "Factures/a.pdf" },
      ],
      ["Factures/Vide", "Factures/.cache"],
    );
    expect(plan.folders).toEqual([["Factures"], ["Factures", "Vide"]]);
    expect(plan.files.map(({ file }) => file.name)).toEqual(["a.pdf"]);
  });
});

describe("filesPlan et pickedFolderPlan", () => {
  it("fichiers choisis sans dossier : tous pour le dossier choisi", () => {
    expect(filesPlan([file("a.pdf"), file("b.pdf")])).toEqual({
      folders: [],
      files: [
        { file: file("a.pdf"), folder: [] },
        { file: file("b.pdf"), folder: [] },
      ],
    });
  });

  it("dossier choisi par le sélecteur : chemins relatifs", () => {
    const picked = [
      { name: "a.pdf", webkitRelativePath: "Relevés/2026/a.pdf" },
      { name: "b.pdf", webkitRelativePath: "Relevés/b.pdf" },
    ];
    expect(pickedFolderPlan(picked).folders).toEqual([
      ["Relevés"],
      ["Relevés", "2026"],
    ]);
  });

  it("navigateur sans choix de dossier : de simples fichiers", () => {
    const picked = [{ name: "a.pdf", webkitRelativePath: "" }];
    expect(pickedFolderPlan(picked)).toEqual(filesPlan(picked));
  });
});

describe("depositPlanProblem", () => {
  const many = (count, make) =>
    Array.from({ length: count }, (_, i) => make(i));

  it("dépôt acceptable : aucun problème", () => {
    expect(depositPlanProblem(filesPlan([file("a.pdf")]))).toBeNull();
  });

  it("vide, trop de fichiers, de dossiers ou de niveaux : refusé", () => {
    expect(depositPlanProblem({ folders: [], files: [] })).toContain("vide");
    expect(
      depositPlanProblem(
        filesPlan(many(IMPORT_MAX_FILES + 1, (i) => file(`${i}.pdf`))),
      ),
    ).toContain(`${IMPORT_MAX_FILES} au plus`);
    expect(
      depositPlanProblem({
        folders: many(IMPORT_MAX_FOLDERS + 1, (i) => [`D${i}`]),
        files: [],
      }),
    ).toContain(`${IMPORT_MAX_FOLDERS} au plus`);
    expect(
      depositPlanProblem({
        folders: [many(IMPORT_MAX_DEPTH + 1, (i) => `N${i}`)],
        files: [],
      }),
    ).toContain(`${IMPORT_MAX_DEPTH} au plus`);
  });
});

describe("depositSummary", () => {
  it("des fichiers : leur nombre et leurs noms", () => {
    expect(depositSummary(filesPlan([file("a.pdf")]))).toEqual({
      title: "Déposer 1 fichier",
      detail: "a.pdf",
      withFolders: false,
    });
    expect(
      depositSummary(filesPlan([file("a.pdf"), file("b.pdf")])).detail,
    ).toBe("a.pdf et b.pdf");
    expect(
      depositSummary(
        filesPlan(["a", "b", "c", "d"].map((name) => file(`${name}.pdf`))),
      ),
    ).toMatchObject({
      title: "Déposer 4 fichiers",
      detail: "a.pdf, b.pdf et 2 autres",
    });
  });

  it("un dossier : son nom, ses fichiers et ses sous-dossiers", () => {
    const summary = depositSummary(
      depositPlan([
        { file: file("a.pdf"), path: "Relevés/2026/a.pdf" },
        { file: file("b.pdf"), path: "Relevés/b.pdf" },
      ]),
    );
    // Insécables autour du nom : le guillemet ne part pas seul à la ligne
    expect(summary).toEqual({
      title: "Déposer le dossier «\u00a0Relevés\u00a0»",
      detail: "2 fichiers dans 2 dossiers",
      withFolders: true,
    });
  });

  it("plusieurs dossiers et des fichiers ; un dossier sans fichier", () => {
    expect(
      depositSummary(
        depositPlan([
          { file: file("a.pdf"), path: "A/a.pdf" },
          { file: file("b.pdf"), path: "B/b.pdf" },
          { file: file("c.pdf"), path: "c.pdf" },
        ]),
      ).title,
    ).toBe("Déposer 2 dossiers et 1 fichier");
    expect(depositSummary(depositPlan([], ["Vide"])).detail).toBe(
      "1 dossier, sans fichier",
    );
  });
});

describe("readDroppedEntries", () => {
  const fileEntry = (path) => ({
    isFile: true,
    isDirectory: false,
    name: path.split("/").pop(),
    fullPath: `/${path}`,
    file: (resolve) => resolve(file(path.split("/").pop())),
  });
  // Lecture par lots, comme Chrome (100 éléments au plus par lot)
  const directoryEntry = (path, children, batch = 2) => ({
    isFile: false,
    isDirectory: true,
    name: path.split("/").pop(),
    fullPath: `/${path}`,
    createReader: () => {
      let next = 0;
      return {
        readEntries: (resolve) => {
          resolve(children.slice(next, next + batch));
          next += batch;
        },
      };
    },
  });

  it("parcourt les dossiers par lots, chemins depuis l'élément déposé", async () => {
    const result = await readDroppedEntries([
      directoryEntry("Factures", [
        fileEntry("Factures/a.pdf"),
        fileEntry("Factures/b.pdf"),
        fileEntry("Factures/c.pdf"),
        directoryEntry("Factures/Vide", []),
        directoryEntry("Factures/.git", [fileEntry("Factures/.git/HEAD")]),
      ]),
      fileEntry("seul.pdf"),
    ]);
    expect(result.entries.map(({ path }) => path)).toEqual([
      "Factures/a.pdf",
      "Factures/b.pdf",
      "Factures/c.pdf",
      "seul.pdf",
    ]);
    expect(result.directories).toEqual(["Factures/Vide"]);
  });

  it("s'arrête au-delà du plafond de fichiers", async () => {
    const children = Array.from({ length: 10 }, (_, i) =>
      fileEntry(`Gros/${i}.pdf`),
    );
    const result = await readDroppedEntries(
      [directoryEntry("Gros", children, 100)],
      3,
    );
    expect(result.entries).toHaveLength(4);
  });
});
