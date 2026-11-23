/**
 * Fonctions pures de la page du visiteur d'un lien client (dossiers
 * partagés) : tailles, types de fichiers, tri, recherche, arbre et
 * contrôle des fichiers déposés.
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
 * Dossiers où le visiteur peut ranger un document : tout le partage, dans
 * l'ordre de l'explorateur, chacun avec sa profondeur.
 * @returns {{ folder: object, depth: number }[]}
 */
export function folderChoices(tree) {
  const choices = [];
  const seen = new Set();
  const visit = (folder, depth) => {
    if (seen.has(folder.id)) return;
    seen.add(folder.id);
    choices.push({ folder, depth });
    for (const child of tree.subfolders(folder.id)) visit(child, depth + 1);
  };
  for (const root of tree.roots) visit(root, 0);
  return choices;
}

/**
 * Nom d'un document coupé pour le renommer : la partie modifiable et
 * l'extension, que l'API garde (« Relevé.pdf » : « Relevé » et « pdf »).
 */
export function splitName(name) {
  const text = String(name || "");
  const extension = extensionOf(text);
  return {
    stem: extension ? text.slice(0, -(extension.length + 1)) : text,
    extension,
  };
}

/**
 * Noms possibles d'une nouvelle version, toujours avec l'extension du
 * nouveau fichier (comme l'API) : `fromFile`, celui du nouveau fichier (null
 * s'il n'en a pas d'utilisable), et `keep`, le nom actuel du document.
 */
export function replacementNames(currentName, fileName) {
  const { stem: fileStem, extension } = splitName(fileName);
  const tidy = (stem) =>
    stem
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[.\s]+$/, "");
  const named = (stem) => (extension ? `${stem}.${extension}` : stem);
  const fromFile = tidy(fileStem);
  return {
    fromFile: fromFile ? named(fromFile) : null,
    keep: named(tidy(splitName(currentName).stem)),
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

// Dépôt par le client : mêmes formats et tailles que l'API
// (newbi-api, src/utils/clientUploadType.js), vérifiés avant l'envoi pour
// répondre tout de suite ; l'API refait le contrôle sur le contenu.
const MB = 1024 * 1024;
export const UPLOAD_MAX_BYTES = 50 * MB;
export const UPLOAD_VIDEO_MAX_BYTES = 100 * MB;
const UPLOAD_EXTENSIONS = [
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "heic",
  "heif",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "txt",
];
const UPLOAD_VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "mkv", "avi"];

/** Valeur de l'attribut `accept` du sélecteur de fichiers. */
export const UPLOAD_ACCEPT = [...UPLOAD_EXTENSIONS, ...UPLOAD_VIDEO_EXTENSIONS]
  .map((extension) => `.${extension}`)
  .join(",");

// Dossiers créés par le client : mêmes règles que l'API
// (newbi-api, clientFolderName et la route des dossiers du visiteur)
export const FOLDER_NAME_MAX_LENGTH = 120;
export const IMPORT_MAX_FILES = 500;
export const IMPORT_MAX_FOLDERS = 200;
export const IMPORT_MAX_DEPTH = 20;

/**
 * Nom d'un dossier comme l'API l'enregistrera : ni caractère de contrôle,
 * ni séparateur de chemin, espaces resserrés, ni point ni espace final,
 * longueur bornée. Chaîne vide s'il ne reste rien.
 */
export function cleanFolderName(rawName) {
  if (typeof rawName !== "string") return "";
  return rawName
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[/\\]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, FOLDER_NAME_MAX_LENGTH)
    .replace(/[.\s]+$/, "");
}

// Fichiers et dossiers cachés ou du système, jamais déposés
const SYSTEM_NAMES = new Set(["__macosx", "thumbs.db", "desktop.ini"]);
export const isHiddenName = (name) => {
  const lower = String(name || "").toLowerCase();
  return lower.startsWith(".") || SYSTEM_NAMES.has(lower);
};

const pathSegments = (path) =>
  String(path || "")
    .split("/")
    .filter(Boolean);

/**
 * Ce que le visiteur dépose, prêt pour l'envoi : les dossiers à créer
 * (chacun par la liste de ses noms, parents d'abord, comme l'attend l'API)
 * et chaque fichier avec le dossier qui le reçoit ([] : le dossier choisi).
 * Fichiers et dossiers cachés ou du système (« .DS_Store », « .git »,
 * « Thumbs.db ») laissés de côté.
 *
 * @param {{ file: File, path: string }[]} entries chaque fichier et son
 *   chemin depuis l'élément déposé (« Factures/2026/relevé.pdf »)
 * @param {string[]} [directories] dossiers vides (glisser-déposer)
 * @returns {{ folders: string[][], files: { file: File, folder: string[] }[] }}
 */
export function depositPlan(entries, directories = []) {
  const folders = [];
  const seen = new Set();
  const addFolder = (names) =>
    names.forEach((_, depth) => {
      const path = names.slice(0, depth + 1);
      const key = path.join("/");
      if (seen.has(key)) return;
      seen.add(key);
      folders.push(path);
    });

  const files = [];
  for (const { file, path } of entries) {
    const names = pathSegments(path);
    if (names.length === 0 || names.some(isHiddenName)) continue;
    const folder = names.slice(0, -1);
    addFolder(folder);
    files.push({ file, folder });
  }
  for (const path of directories) {
    const names = pathSegments(path);
    if (names.length > 0 && !names.some(isHiddenName)) addFolder(names);
  }
  return { folders, files };
}

/** Fichiers choisis sans dossier : tous pour le dossier choisi. */
export const filesPlan = (files) => ({
  folders: [],
  files: [...files].map((file) => ({ file, folder: [] })),
});

/**
 * Fichiers d'un dossier choisi par le sélecteur (`webkitRelativePath`,
 * « Factures/2026/relevé.pdf ») ; sans chemin (navigateur qui ne sait pas
 * choisir un dossier), ce sont de simples fichiers.
 */
export function pickedFolderPlan(files) {
  const list = [...files];
  if (!list.some((file) => file.webkitRelativePath)) return filesPlan(list);
  return depositPlan(
    list.map((file) => ({ file, path: file.webkitRelativePath || file.name })),
  );
}

/** Raison du refus d'un dépôt trop gros ou vide, ou null. */
export function depositPlanProblem({ folders, files }) {
  if (folders.length === 0 && files.length === 0) {
    return "Rien à déposer : le dossier est vide.";
  }
  if (files.length > IMPORT_MAX_FILES) {
    return `Trop de fichiers d'un coup (${IMPORT_MAX_FILES} au plus).`;
  }
  if (folders.length > IMPORT_MAX_FOLDERS) {
    return `Trop de dossiers d'un coup (${IMPORT_MAX_FOLDERS} au plus).`;
  }
  if (folders.some((names) => names.length > IMPORT_MAX_DEPTH)) {
    return `Trop de niveaux de sous-dossiers (${IMPORT_MAX_DEPTH} au plus).`;
  }
  return null;
}

const count = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;

/**
 * Titre et détail d'un dépôt, pour la fenêtre du choix du dossier :
 * « Déposer le dossier « Factures » » et « 12 fichiers dans 3 dossiers »,
 * ou « Déposer 2 fichiers » et leurs noms.
 * @returns {{ title: string, detail: string, withFolders: boolean }}
 */
export function depositSummary({ folders, files }) {
  if (folders.length === 0) {
    const names = files.map(({ file }) => file.name);
    const detail =
      names.length <= 2
        ? names.join(" et ")
        : `${names.slice(0, 2).join(", ")} et ${count(names.length - 2, "autre")}`;
    return {
      title: `Déposer ${count(files.length, "fichier")}`,
      detail,
      withFolders: false,
    };
  }
  const tops = folders.filter((names) => names.length === 1);
  const loose = files.filter(({ folder }) => folder.length === 0).length;
  // Espaces insécables : le guillemet fermant ne part pas seul à la ligne
  const title =
    tops.length === 1 && loose === 0
      ? `Déposer le dossier «\u00a0${tops[0][0]}\u00a0»`
      : `Déposer ${[
          tops.length > 0 && count(tops.length, "dossier"),
          loose > 0 && count(loose, "fichier"),
        ]
          .filter(Boolean)
          .join(" et ")}`;
  const detail =
    files.length === 0
      ? `${count(folders.length, "dossier")}, sans fichier`
      : `${count(files.length, "fichier")} dans ${count(folders.length, "dossier")}`;
  return { title, detail, withFolders: true };
}

/**
 * Éléments glissés-déposés, dossiers parcourus (FileSystemEntry, Chrome,
 * Safari et Firefox) : chaque fichier avec son chemin depuis l'élément
 * déposé, et les dossiers vides. Les dossiers cachés ne sont pas ouverts.
 * La lecture s'arrête au-delà de `maxFiles` fichiers : le dépôt sera refusé.
 *
 * @param {FileSystemEntry[]} entries
 * @returns {Promise<{ entries: { file: File, path: string }[], directories: string[] }>}
 */
export async function readDroppedEntries(entries, maxFiles = IMPORT_MAX_FILES) {
  const files = [];
  const directories = [];
  const pathOf = (entry) =>
    String(entry.fullPath || entry.name).replace(/^\/+/, "");
  const readFile = (entry) =>
    new Promise((resolve, reject) => entry.file(resolve, reject));
  // Un dossier se lit par lots (100 éléments au plus dans Chrome)
  const readChildren = async (directory) => {
    const reader = directory.createReader();
    const children = [];
    for (;;) {
      const batch = await new Promise((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      if (batch.length === 0) return children;
      children.push(...batch);
    }
  };
  const visit = async (entry) => {
    if (!entry || files.length > maxFiles || isHiddenName(entry.name)) return;
    if (entry.isFile) {
      files.push({ file: await readFile(entry), path: pathOf(entry) });
    } else if (entry.isDirectory) {
      const children = await readChildren(entry);
      if (children.length === 0) directories.push(pathOf(entry));
      for (const child of children) await visit(child);
    }
  };
  for (const entry of entries) await visit(entry);
  return { entries: files, directories };
}

/** Raison du refus d'un fichier avant l'envoi, ou null s'il peut partir. */
export function uploadProblem(file) {
  const extension = extensionOf(file?.name);
  const isVideo = UPLOAD_VIDEO_EXTENSIONS.includes(extension);
  if (!isVideo && !UPLOAD_EXTENSIONS.includes(extension)) {
    return "Format non accepté (PDF, images, Word, Excel, CSV, texte ou vidéo).";
  }
  if (!file.size) return "Le fichier est vide.";
  const max = isVideo ? UPLOAD_VIDEO_MAX_BYTES : UPLOAD_MAX_BYTES;
  if (file.size > max) {
    return `Fichier trop volumineux (${max / MB} Mo maximum).`;
  }
  return null;
}
