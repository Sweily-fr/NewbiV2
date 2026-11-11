/**
 * Page du visiteur d'un lien client : familles de fichiers, tri des
 * colonnes, arbre du partage et recherche sans accents.
 */
import { describe, it, expect } from "vitest";
import {
  HOME,
  buildShareTree,
  fileKind,
  formatFileSize,
  previewKind,
  searchShare,
  sortDocuments,
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
