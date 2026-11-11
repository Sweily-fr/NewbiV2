/**
 * Fonctions pures de la page du visiteur d'un lien client (dossiers
 * partagés) : tailles, types de fichiers, tri, recherche et arbre.
 */
import { createSearchMatcher } from "@/src/utils/search-text";

// Plusieurs dossiers partagés : accueil commun qui les liste
export const HOME = "__accueil__";

export function formatFileSize(bytes) {
  if (!bytes) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${index === 0 ? value : value.toFixed(1).replace(".", ",")} ${units[index]}`;
}

const extensionOf = (name) => {
  const match = /\.([a-z0-9]+)$/i.exec(name || "");
  return match ? match[1].toLowerCase() : "";
};

/**
 * Famille d'un fichier pour son icône : image, video, audio, pdf, sheet,
 * doc ou file (mêmes familles que Documents partagés dans Newbi).
 */
export function fileKind(document) {
  const type = (document?.mimeType || "").toLowerCase();
  const extension = extensionOf(document?.name);
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  if (type === "application/pdf" || extension === "pdf") return "pdf";
  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    ["csv", "xls", "xlsx", "ods"].includes(extension)
  ) {
    return "sheet";
  }
  if (
    type.includes("word") ||
    type.includes("document") ||
    ["doc", "docx", "odt", "txt", "rtf"].includes(extension)
  ) {
    return "doc";
  }
  return "file";
}

const PREVIEW_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];
const PREVIEW_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
];

/** Forme d'aperçu d'un document, null s'il se télécharge seulement. */
export function previewKind(document) {
  const type = (document?.mimeType || "").toLowerCase();
  if (type === "application/pdf" || /\.pdf$/i.test(document?.name || "")) {
    return "pdf";
  }
  if (PREVIEW_IMAGE_TYPES.includes(type)) return "image";
  if (PREVIEW_VIDEO_TYPES.includes(type)) return "video";
  if (type.startsWith("audio/")) return "audio";
  return null;
}

const byName = (a, b) =>
  a.name.localeCompare(b.name, "fr", { sensitivity: "base", numeric: true });

/** Dossiers dans l'ordre choisi dans Newbi, puis par nom. */
export const byFolderOrder = (a, b) =>
  (a.order || 0) - (b.order || 0) || byName(a, b);

const SORT_VALUE = {
  name: null,
  size: (document) => document.fileSize || 0,
  date: (document) => new Date(document.createdAt || 0).getTime(),
};

/**
 * Documents triés comme les colonnes de Documents partagés : nom, taille ou
 * date, croissant ou décroissant (à égalité, par nom).
 */
export function sortDocuments(documents, { by = "name", order = "asc" } = {}) {
  const value = SORT_VALUE[by];
  const direction = order === "desc" ? -1 : 1;
  return [...documents].sort((a, b) => {
    const diff = value ? value(a) - value(b) : byName(a, b);
    return (diff || byName(a, b)) * direction;
  });
}

/**
 * Arbre du partage : sous-dossiers et documents de chaque dossier, chemin
 * d'un dossier depuis sa racine partagée.
 */
export function buildShareTree({ folders, documents, rootFolderIds }) {
  const folderById = new Map(folders.map((folder) => [folder.id, folder]));
  const roots = rootFolderIds.map((id) => folderById.get(id)).filter(Boolean);
  const rootIds = new Set(roots.map((folder) => folder.id));

  const subfoldersOf = new Map();
  for (const folder of folders) {
    if (rootIds.has(folder.id) || !folder.parentId) continue;
    if (!subfoldersOf.has(folder.parentId))
      subfoldersOf.set(folder.parentId, []);
    subfoldersOf.get(folder.parentId).push(folder);
  }
  for (const list of subfoldersOf.values()) list.sort(byFolderOrder);

  const documentsOf = new Map();
  for (const document of documents) {
    if (!documentsOf.has(document.folderId)) {
      documentsOf.set(document.folderId, []);
    }
    documentsOf.get(document.folderId).push(document);
  }
  for (const list of documentsOf.values()) list.sort(byName);

  /** Dossiers de la racine partagée jusqu'à `folderId` compris. */
  const pathTo = (folderId) => {
    const path = [];
    let folder = folderById.get(folderId);
    while (folder) {
      path.unshift(folder);
      folder = rootIds.has(folder.id) ? null : folderById.get(folder.parentId);
    }
    return path;
  };

  return {
    roots,
    folderById,
    subfolders: (folderId) =>
      folderId === HOME ? roots : subfoldersOf.get(folderId) || [],
    documentsIn: (folderId) => documentsOf.get(folderId) || [],
    pathTo,
  };
}

/**
 * Recherche dans tout le partage (comme la barre de Documents partagés) :
 * dossiers et documents dont le nom contient la saisie, sans tenir compte
 * des majuscules ni des accents.
 */
export function searchShare({ folders, documents }, query) {
  const matches = createSearchMatcher(query.trim());
  return {
    folders: folders.filter((folder) => matches(folder.name)).sort(byName),
    documents: documents.filter((document) => matches(document.name)),
  };
}
