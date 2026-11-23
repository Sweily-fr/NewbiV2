"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FileAudio,
  FileUp,
  FolderInput,
  FolderOpen,
  FolderPlus,
  FolderUp,
  Home,
  LoaderCircle,
  LogOut,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { PdfPreview } from "@/src/components/pdf/pdf-preview";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { NewbiSignature, WorkspaceIdentity } from "./access-screen";
import {
  DepositDialog,
  FolderIcon,
  FolderPicker,
  NewFolderDialog,
  RenameFolderDialog,
  useDialogAction,
} from "./folder-dialogs";
import {
  HOME,
  UPLOAD_ACCEPT,
  buildShareTree,
  depositPlan,
  depositPlanProblem,
  fileKind,
  filesPlan,
  formatFileSize,
  pickedFolderPlan,
  previewKind,
  readDroppedEntries,
  replacementNames,
  searchShare,
  sortDocuments,
  splitName,
  uploadProblem,
} from "./shared-files-utils";
import { UploadPanel, useUploadQueue } from "./upload-queue";

const KIND_ICONS = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  pdf: FileText,
  sheet: FileSpreadsheet,
  doc: FileText,
  file: FileIcon,
};

/** Icône du type de fichier, comme dans Documents partagés. */
export function FileTypeIcon({ document, className = "size-4" }) {
  const Icon = KIND_ICONS[fileKind(document)];
  return (
    <Icon
      aria-hidden="true"
      className={cn("text-muted-foreground shrink-0", className)}
    />
  );
}

const formatDate = (value) =>
  value ? format(new Date(value), "d MMM yyyy", { locale: fr }) : "";

/** Arbre « Explorateur » : dossiers et documents, comme dans Newbi. */
function ShareTree({ tree, currentId, onOpenFolder, onOpenDocument }) {
  // Dossiers dépliés : les racines au départ
  const [expanded, setExpanded] = useState(
    () => new Set(tree.roots.map((folder) => folder.id)),
  );
  const ancestors = useMemo(
    () => new Set(tree.pathTo(currentId).map((folder) => folder.id)),
    [tree, currentId],
  );

  const toggle = (folderId) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });

  const renderFolder = (folder, level) => {
    const isOpen = expanded.has(folder.id) || ancestors.has(folder.id);
    const subfolders = tree.subfolders(folder.id);
    const documents = tree.documentsIn(folder.id);
    const hasChildren = subfolders.length + documents.length > 0;
    const isCurrent = folder.id === currentId;
    return (
      <li key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-1.5 py-1.5 pr-2 rounded-md text-sm transition-colors",
            isCurrent
              ? "bg-accent text-foreground font-medium"
              : "hover:bg-accent/50",
          )}
          style={{ paddingLeft: `${level * 16 + 4}px` }}
        >
          <button
            type="button"
            aria-label={
              isOpen ? `Replier ${folder.name}` : `Déplier ${folder.name}`
            }
            aria-expanded={isOpen}
            disabled={!hasChildren}
            onClick={() => toggle(folder.id)}
            className="p-0.5 rounded hover:bg-accent disabled:invisible"
          >
            <ChevronRight
              className={cn(
                "size-3 text-muted-foreground/70 transition-transform duration-150",
                isOpen && "rotate-90",
              )}
            />
          </button>
          <button
            type="button"
            onClick={() => onOpenFolder(folder.id)}
            aria-current={isCurrent ? "page" : undefined}
            className="flex items-center gap-2 min-w-0 flex-1 text-left"
          >
            <FolderIcon folder={folder} className="size-3.5" />
            <span className="truncate">{folder.name}</span>
          </button>
        </div>
        {isOpen && hasChildren && (
          <ul>
            {subfolders.map((child) => renderFolder(child, level + 1))}
            {documents.map((document) => (
              <li key={document.id}>
                <button
                  type="button"
                  onClick={() => onOpenDocument(document)}
                  className="w-full flex items-center gap-2 py-1.5 pr-2 rounded-md text-sm text-left hover:bg-accent/50 transition-colors"
                  style={{ paddingLeft: `${(level + 1) * 16 + 26}px` }}
                >
                  <FileTypeIcon document={document} className="size-3.5" />
                  <span className="truncate text-muted-foreground">
                    {document.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Explorateur">
      <ul className="px-2 py-2">
        {tree.roots.map((folder) => renderFolder(folder, 0))}
      </ul>
    </nav>
  );
}

function SortHeader({ label, field, sort, onSort, className }) {
  const active = sort.by === field;
  const Icon = !active
    ? ArrowUpDown
    : sort.order === "asc"
      ? ArrowUp
      : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "flex items-center gap-1 uppercase tracking-wider hover:text-foreground transition-colors",
        className,
      )}
    >
      {label}
      <Icon className={cn("size-3", !active && "text-muted-foreground/60")} />
    </button>
  );
}

function PreviewDialog({ document, previewUrl, downloadUrl, onClose }) {
  const kind = document ? previewKind(document) : null;
  return (
    <Dialog
      open={Boolean(document)}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* min-w-0 : sans lui, le nom sur une ligne élargit la fenêtre et
            pousse « Télécharger » sous la croix sur un téléphone */}
        <div className="flex min-w-0 items-center gap-3 pr-8">
          {document && <FileTypeIcon document={document} />}
          <DialogTitle className="text-base font-medium truncate flex-1 min-w-0">
            {document?.name}
          </DialogTitle>
          <Button size="sm" variant="outline" className="shrink-0" asChild>
            <a href={downloadUrl}>
              <Download className="size-4 mr-2" />
              Télécharger
            </a>
          </Button>
        </div>
        <div className="flex justify-center min-h-40 rounded-md bg-muted/30">
          {kind === "pdf" && (
            <div className="w-full">
              <PdfPreview
                src={previewUrl}
                fallback={
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aperçu indisponible. Téléchargez le document pour le
                    consulter.
                  </p>
                }
              />
            </div>
          )}
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={document.name}
              className="max-h-[75vh] object-contain"
            />
          )}
          {kind === "video" && (
            <video src={previewUrl} controls className="max-h-[75vh] w-full" />
          )}
          {kind === "audio" && (
            <audio src={previewUrl} controls className="w-full self-center" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Renommer un document déposé par le visiteur : l'extension reste. */
function RenameDialog({ document, onRename, onClose }) {
  const { stem, extension } = splitName(document.name);
  const [value, setValue] = useState(stem);
  const { busy, error, run } = useDialogAction(async (name) => {
    await onRename(document, name);
    toast.success("Document renommé");
  }, onClose);
  const cleaned = value.trim();

  const submit = (event) => {
    event.preventDefault();
    if (!cleaned || cleaned === stem || busy) return;
    run(extension ? `${cleaned}.${extension}` : cleaned);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renommer le document</DialogTitle>
          <DialogDescription>
            Votre interlocuteur verra aussi ce nouveau nom.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              aria-label="Nouveau nom"
              autoFocus
              maxLength={190}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onFocus={(event) => event.target.select()}
            />
            {extension && (
              <span className="shrink-0 text-sm text-muted-foreground">
                .{extension}
              </span>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={busy || !cleaned || cleaned === stem}
            >
              {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
              Renommer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Ranger un document déposé par le visiteur dans un autre dossier. */
function MoveDialog({ document, tree, onMove, onClose }) {
  const [target, setTarget] = useState(document.folderId);
  const { busy, error, run } = useDialogAction(async (folderId) => {
    await onMove(document, folderId);
    const folder = tree.folderById.get(folderId);
    toast.success(`Document déplacé dans « ${folder?.name || "le dossier"} »`);
  }, onClose);

  const submit = (event) => {
    event.preventDefault();
    if (target === document.folderId || busy) return;
    run(target);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* min-w-0 : dans la grille de la fenêtre, un long nom ou un long
            dossier l'élargirait au-delà de l'écran d'un téléphone */}
        <DialogHeader className="min-w-0">
          <DialogTitle className="pr-6 break-words">
            Déplacer «&nbsp;{document.name}&nbsp;»
          </DialogTitle>
          <DialogDescription>
            Choisissez le dossier où ranger ce document.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-4">
          <FolderPicker
            tree={tree}
            value={target}
            onChange={setTarget}
            currentId={document.folderId}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={busy || target === document.folderId}
            >
              {busy && <LoaderCircle className="size-4 mr-2 animate-spin" />}
              Déplacer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Nouvelle version d'un document déposé par le visiteur, avant l'envoi : il
 * choisit le nom, celui du nouveau fichier (proposé d'abord) ou le nom
 * actuel. Même nom des deux côtés : rien à choisir, juste confirmer.
 */
function ReplaceDialog({ document, file, onReplace, onClose }) {
  const labelId = useId();
  const { fromFile, keep } = replacementNames(document.name, file.name);
  const choices = [
    fromFile && {
      value: "file",
      name: fromFile,
      label: "Nom du nouveau fichier",
    },
    { value: "keep", name: keep, label: "Garder le nom actuel" },
  ].filter(Boolean);
  const [choice, setChoice] = useState(choices[0].value);
  const chosen = choices.find((option) => option.value === choice) || {};
  const sameName = choices.length < 2 || fromFile === keep;

  const submit = (event) => {
    event.preventDefault();
    onReplace(chosen.name || keep);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle className="pr-6 break-words">
            Remplacer «&nbsp;{document.name}&nbsp;»
          </DialogTitle>
          <DialogDescription>
            Votre interlocuteur verra la nouvelle version à la place de
            l&apos;ancienne.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="min-w-0 space-y-4">
          <div className="flex items-center gap-3 rounded-md border px-3 py-2">
            <FileTypeIcon
              document={{ name: file.name, mimeType: file.type }}
              className="size-5"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium break-words">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          {!sameName && (
            <div className="space-y-2">
              <p id={labelId} className="text-sm font-medium">
                Nom du document
              </p>
              <RadioGroup
                aria-labelledby={labelId}
                value={choice}
                onValueChange={setChoice}
                className="gap-0 rounded-md border py-1"
              >
                {choices.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      // min-w-0 : un long nom sans espace passe à la ligne
                      // au lieu d'élargir la liste (grille du RadioGroup)
                      "flex min-w-0 items-start gap-3 px-3 py-2 cursor-pointer hover:bg-accent/50 transition-colors",
                      choice === option.value && "bg-accent",
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      aria-label={option.label}
                      className="mt-0.5"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm break-words">
                        {option.name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.label}
                      </span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              Remplacer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Menu d'un document déposé par le visiteur : il peut le renommer, le
 * déplacer, en envoyer une nouvelle version ou le supprimer.
 */
function OwnDocumentMenu({ document, canMove, onAction }) {
  const select = (action) => () => onAction(action, document);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          aria-label={`Actions pour ${document.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onSelect={select("rename")}>
          <Pencil className="size-4" />
          Renommer
        </DropdownMenuItem>
        {canMove && (
          <DropdownMenuItem onSelect={select("move")}>
            <FolderInput className="size-4" />
            Déplacer
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={select("replace")}>
          <FileUp className="size-4" />
          Remplacer le fichier
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={select("delete")}>
          <Trash2 className="size-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Menu d'un dossier créé par le visiteur : le renommer ou le supprimer. */
function OwnFolderMenu({ folder, onAction }) {
  const select = (action) => () => onAction(action, folder);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          aria-label={`Actions pour le dossier ${folder.name}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem onSelect={select("rename")}>
          <Pencil className="size-4" />
          Renommer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={select("delete")}>
          <Trash2 className="size-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Le glisser-déposer apporte des fichiers (ou des dossiers). */
const carriesFiles = (event) =>
  [...(event.dataTransfer?.types || [])].includes("Files");

/**
 * Espace du visiteur d'un lien client : même visuel que Documents partagés
 * dans Newbi (explorateur à gauche, fil d'Ariane, recherche, colonnes Nom,
 * Taille et Date). Si l'accès le permet, le visiteur ajoute des fichiers ou
 * un dossier de son ordinateur (bouton « Ajouter » ou glisser-déposer) et
 * crée des dossiers : dans le dossier ouvert, ou depuis l'accueil dans le
 * dossier qu'il choisit. Il renomme, déplace, remplace ou supprime les
 * documents qu'il a déposés, renomme ou supprime les dossiers qu'il a créés,
 * jamais le reste. Le contenu arrive à jour en temps réel (page.jsx).
 *
 * @param {object} props
 * @param {(folderId: string) => string} props.uploadUrl adresse de dépôt
 * @param {(documentId: string) => string} props.replaceUrl adresse d'une
 *   nouvelle version
 * @param {(document: object, name: string) => Promise<void>} props.onRename
 * @param {(document: object, folderId: string) => Promise<void>} props.onMove
 * @param {(document: object) => Promise<void>} props.onDelete
 * @param {(parentId: string, paths: string[][]) => Promise<object[]>}
 *   props.onCreateFolders crée les dossiers (chacun par la liste de ses
 *   noms) et renvoie, dans l'ordre, ceux où mènent les chemins, une fois le
 *   contenu relu
 * @param {(folder: object, name: string) => Promise<void>} props.onRenameFolder
 * @param {(folder: object) => Promise<void>} props.onDeleteFolder
 * @param {() => void} props.onChanged un envoi est arrivé : relire
 */
export function SharedFiles({
  content,
  fileUrl,
  downloadAllUrl,
  onSignOut,
  uploadUrl,
  replaceUrl,
  onRename,
  onMove,
  onDelete,
  onCreateFolders,
  onRenameFolder,
  onDeleteFolder,
  onChanged,
}) {
  const { folders, documents, rootFolderIds, workspace, visitor } = content;
  const canUpload = Boolean(content.allowUploads);
  const tree = useMemo(
    () => buildShareTree({ folders, documents, rootFolderIds }),
    [folders, documents, rootFolderIds],
  );
  const hasHome = tree.roots.length > 1;
  const homeId = hasHome ? HOME : tree.roots[0]?.id;
  const homeLabel = content.name || "Documents partagés";

  const [selectedId, setCurrentId] = useState(homeId);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ by: "name", order: "asc" });
  const [previewed, setPreviewed] = useState(null);
  const [treeOpen, setTreeOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toRename, setToRename] = useState(null);
  const [toMove, setToMove] = useState(null);
  // Nouvelle version choisie, en attente du nom : { document, file }
  const [replacing, setReplacing] = useState(null);
  // Dépôt depuis l'accueil, en attente du dossier choisi (depositPlan)
  const [pending, setPending] = useState(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderToRename, setFolderToRename] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const fileInput = useRef(null);
  const folderInput = useRef(null);
  const replaceInput = useRef(null);
  const toReplace = useRef(null);
  const uploads = useUploadQueue({
    uploadUrl,
    replaceUrl,
    onUploaded: onChanged,
  });
  // Un seul dossier dans tout le partage : rien vers où déplacer
  const canMove = tree.folderById.size > 1;

  // Contenu relu en temps réel : un dossier fermé entre-temps ramène à
  // l'accueil, un document retiré ferme son aperçu
  const currentId = (
    selectedId === HOME ? hasHome : tree.folderById.has(selectedId)
  )
    ? selectedId
    : homeId;
  const currentFolder =
    currentId === HOME ? null : tree.folderById.get(currentId);
  useEffect(() => {
    const gone = (document) =>
      document && !documents.some((d) => d.id === document.id);
    if (gone(previewed)) setPreviewed(null);
    if (gone(toRename)) setToRename(null);
    if (gone(toMove)) setToMove(null);
    if (gone(toDelete)) setToDelete(null);
    if (gone(replacing?.document)) setReplacing(null);
  }, [documents, previewed, toRename, toMove, toDelete, replacing]);
  useEffect(() => {
    const gone = (folder) =>
      folder && !folders.some((other) => other.id === folder.id);
    if (gone(folderToRename)) setFolderToRename(null);
    if (gone(folderToDelete)) setFolderToDelete(null);
  }, [folders, folderToRename, folderToDelete]);
  // Aperçu d'un document renommé ou remplacé entre-temps : à jour
  const previewedDocument = previewed
    ? documents.find((d) => d.id === previewed.id) || null
    : null;

  const searching = query.trim().length > 0;
  // Ajout hors recherche : dans le dossier ouvert, ou depuis l'accueil (qui
  // liste les dossiers partagés) dans le dossier choisi ensuite
  const canAdd = canUpload && !searching;
  const dropTarget = canAdd ? currentFolder : null;
  const actionsWidth = canUpload ? "w-[88px]" : "w-[60px]";
  const results = useMemo(
    () => (searching ? searchShare({ folders, documents }, query) : null),
    [searching, folders, documents, query],
  );

  const visibleFolders = searching
    ? results.folders
    : tree.subfolders(currentId);
  const visibleDocuments = sortDocuments(
    searching ? results.documents : tree.documentsIn(currentId),
    sort,
  );
  const count = visibleFolders.length + visibleDocuments.length;

  // Fil d'Ariane : maison (accueil ou dossier partagé), puis dossiers
  const path = currentId === HOME ? [] : tree.pathTo(currentId);
  const crumbs = hasHome ? path : path.slice(1);

  const openFolder = (folderId) => {
    setCurrentId(folderId);
    setQuery("");
    setTreeOpen(false);
  };
  const openDocument = (document) => {
    setTreeOpen(false);
    if (previewKind(document)) setPreviewed(document);
    else window.location.assign(fileUrl(document, "download"));
  };
  const onSort = (field) =>
    setSort((previous) =>
      previous.by === field
        ? { by: field, order: previous.order === "asc" ? "desc" : "asc" }
        : { by: field, order: field === "name" ? "asc" : "desc" },
    );

  const pickFiles = () => fileInput.current?.click();
  const pickFolder = () => folderInput.current?.click();

  /**
   * Dépose `plan` (depositPlan) dans le dossier `target` : ses dossiers
   * d'abord, en une requête, puis chaque fichier dans le sien par la file
   * des dépôts.
   */
  const depositInto = async (plan, target) => {
    const created =
      plan.folders.length > 0
        ? await onCreateFolders(target.id, plan.folders)
        : [];
    const folderAt = new Map(
      plan.folders.map((names, index) => [
        names.join("/"),
        { folder: created[index], names },
      ]),
    );
    const groups = new Map();
    for (const { file, folder } of plan.files) {
      const key = folder.join("/");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(file);
    }
    for (const [key, files] of groups) {
      if (!key) {
        uploads.add(files, target);
        continue;
      }
      const destination = folderAt.get(key);
      if (!destination?.folder) {
        throw new Error("Un dossier n'a pas pu être créé. Réessayez.");
      }
      uploads.add(files, {
        id: destination.folder.id,
        name: [target.name, ...destination.names].join(" › "),
      });
    }
  };

  /**
   * Fichiers ou dossier reçus (bouton ou glisser-déposer) : déposés dans le
   * dossier ouvert ; sur l'accueil, le visiteur choisit d'abord le dossier.
   */
  const receive = (plan) => {
    if (!canAdd) return;
    const problem = depositPlanProblem(plan);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (!dropTarget) {
      setPending(plan);
      return;
    }
    depositInto(plan, dropTarget).catch((error) =>
      toast.error(error?.message || "Dépôt impossible"),
    );
  };

  const dropHandlers = canAdd
    ? {
        onDragEnter: (event) => {
          if (!carriesFiles(event)) return;
          event.preventDefault();
          setDragging(true);
        },
        onDragOver: (event) => {
          if (!carriesFiles(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        },
        onDragLeave: (event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setDragging(false);
          }
        },
        onDrop: (event) => {
          event.preventDefault();
          setDragging(false);
          // Lus pendant l'événement : ensuite, le navigateur n'y donne plus
          // accès
          const entries = [...(event.dataTransfer.items || [])]
            .filter((item) => item.kind === "file")
            .map((item) => item.webkitGetAsEntry?.())
            .filter(Boolean);
          if (entries.some((entry) => entry.isDirectory)) {
            readDroppedEntries(entries)
              .then(({ entries: files, directories }) =>
                receive(depositPlan(files, directories)),
              )
              .catch(() =>
                toast.error(
                  "Lecture du dossier impossible. Essayez avec le bouton « Ajouter ».",
                ),
              );
          } else if (event.dataTransfer.files?.length) {
            receive(filesPlan(event.dataTransfer.files));
          }
        },
      }
    : {};

  const createFolder = async (parent, name) => {
    const [folder] = await onCreateFolders(parent.id, [[name]]);
    if (!folder) return;
    openFolder(folder.id);
    toast.success(
      folder.created
        ? `Dossier « ${folder.name} » créé`
        : `Le dossier « ${folder.name} » existait déjà`,
    );
  };

  const onFolderAction = (action, folder) => {
    if (action === "rename") setFolderToRename(folder);
    else if (action === "delete") setFolderToDelete(folder);
  };

  const confirmDeleteFolder = async () => {
    const folder = folderToDelete;
    setFolderToDelete(null);
    try {
      await onDeleteFolder(folder);
      toast.success("Dossier supprimé");
    } catch (error) {
      toast.error(error.message || "Suppression impossible");
    }
  };

  const onDocumentAction = (action, document) => {
    if (action === "rename") setToRename(document);
    else if (action === "move") setToMove(document);
    else if (action === "delete") setToDelete(document);
    else if (action === "replace") {
      toReplace.current = document;
      replaceInput.current?.click();
    }
  };

  const confirmDelete = async () => {
    const document = toDelete;
    setToDelete(null);
    try {
      await onDelete(document);
      toast.success("Document supprimé");
    } catch (error) {
      toast.error(error.message || "Suppression impossible");
    }
  };

  const folderLocation = (document) =>
    tree
      .pathTo(document.folderId)
      .map((folder) => folder.name)
      .join(" › ");

  const explorer = (
    <>
      <div className="px-4 h-12 border-b flex items-center shrink-0">
        <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
          Explorateur
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ShareTree
          tree={tree}
          currentId={currentId}
          onOpenFolder={openFolder}
          onOpenDocument={(document) => {
            setCurrentId(document.folderId);
            openDocument(document);
          }}
        />
      </div>
      <div className="px-4 py-3 border-t space-y-1 shrink-0">
        {content.expiresAt && (
          <p className="text-xs text-muted-foreground">
            Lien valable jusqu&apos;au {formatDate(content.expiresAt)}
          </p>
        )}
        <NewbiSignature />
      </div>
    </>
  );

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* En-tête : entreprise qui partage, téléchargement, visiteur */}
      <header className="h-14 border-b flex items-center justify-between gap-3 px-3 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-8 shrink-0"
            aria-label="Afficher les dossiers"
            onClick={() => setTreeOpen(true)}
          >
            <PanelLeft className="size-5" />
          </Button>
          <WorkspaceIdentity workspace={workspace} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {documents.length > 0 && (
            <Button size="sm" variant="primary" asChild>
              <a href={downloadAllUrl}>
                <Download className="size-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Tout télécharger</span>
              </a>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label="Mon accès"
              >
                <UserRound className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <span className="block text-xs text-muted-foreground">
                  Connecté en tant que
                </span>
                <span className="block truncate text-sm">{visitor?.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="size-4 mr-2" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Explorateur (ordinateur) */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-muted/20 min-h-0">
          {explorer}
        </aside>

        {/* Explorateur (mobile) */}
        <Sheet open={treeOpen} onOpenChange={setTreeOpen}>
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
            <SheetTitle className="sr-only">Dossiers</SheetTitle>
            <SheetDescription className="sr-only">
              Dossiers et documents partagés
            </SheetDescription>
            {explorer}
          </SheetContent>
        </Sheet>

        <main
          className="relative flex-1 min-w-0 flex flex-col"
          {...dropHandlers}
        >
          {dragging && canAdd && (
            <div className="absolute inset-2 z-10 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary bg-background/90 pointer-events-none">
              <Upload className="size-6 text-primary" />
              <p className="text-sm font-medium text-center px-4">
                {dropTarget
                  ? `Déposez vos fichiers ou dossiers dans « ${dropTarget.name} »`
                  : "Déposez vos fichiers ou dossiers : vous choisirez ensuite le dossier"}
              </p>
            </div>
          )}
          {/* Fil d'Ariane et recherche */}
          <div className="min-h-12 border-b flex flex-wrap items-center gap-x-3 gap-y-2 px-3 sm:px-4 py-2 shrink-0">
            <nav
              aria-label="Emplacement"
              className="flex items-center gap-1 min-w-0 flex-1 text-sm"
            >
              <button
                type="button"
                onClick={() => openFolder(homeId)}
                aria-label={hasHome ? homeLabel : tree.roots[0]?.name}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 transition-colors",
                  !searching && crumbs.length === 0
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Home className="size-4" />
                <span className="truncate max-w-[160px]">
                  {hasHome ? homeLabel : tree.roots[0]?.name}
                </span>
              </button>
              {searching ? (
                <>
                  <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">
                    Résultats pour « {query.trim()} »
                  </span>
                </>
              ) : (
                crumbs.map((folder, index) => (
                  <span
                    key={folder.id}
                    className="flex items-center gap-1 min-w-0"
                  >
                    <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                    <button
                      type="button"
                      onClick={() => openFolder(folder.id)}
                      className={cn(
                        "truncate max-w-[160px] transition-colors",
                        index === crumbs.length - 1
                          ? "font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))
              )}
              <span className="text-xs text-muted-foreground ml-1 shrink-0">
                ({count})
              </span>
            </nav>
            {canAdd && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="shrink-0">
                    <Plus className="size-4 sm:mr-1.5" />
                    <span className="sr-only sm:not-sr-only">Ajouter</span>
                    <ChevronDown className="hidden sm:block size-3.5 ml-1 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onSelect={pickFiles}>
                    <Upload className="size-4" />
                    Déposer des fichiers
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={pickFolder}>
                    <FolderUp className="size-4" />
                    Déposer un dossier
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setCreatingFolder(true)}>
                    <FolderPlus className="size-4" />
                    Nouveau dossier
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                aria-label="Rechercher un document"
                placeholder="Rechercher..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-8 pl-8 pr-8 text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {searching && (
                <button
                  type="button"
                  aria-label="Effacer la recherche"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <section
            aria-label="Contenu du dossier"
            className="flex-1 overflow-y-auto"
          >
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 px-4 gap-3">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  {searching ? (
                    <Search className="size-5 text-muted-foreground" />
                  ) : (
                    <FolderOpen className="size-5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {searching
                    ? "Aucun document ne correspond à votre recherche."
                    : "Ce dossier est vide."}
                </p>
                {dropTarget && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Glissez vos fichiers ou dossiers ici pour les déposer.
                    </p>
                    <Button size="sm" variant="outline" onClick={pickFiles}>
                      <Upload className="size-4 mr-1.5" />
                      Déposer des documents
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div>
                {/* En-tête des colonnes */}
                <div className="flex items-center gap-3 px-3 sm:px-4 py-2 text-xs font-medium text-muted-foreground border-b">
                  <SortHeader
                    label="Nom"
                    field="name"
                    sort={sort}
                    onSort={onSort}
                    className="flex-1 text-left"
                  />
                  <SortHeader
                    label="Taille"
                    field="size"
                    sort={sort}
                    onSort={onSort}
                    className="w-24 justify-end hidden sm:flex"
                  />
                  <SortHeader
                    label="Date"
                    field="date"
                    sort={sort}
                    onSort={onSort}
                    className="w-28 justify-end hidden md:flex"
                  />
                  <span className={actionsWidth} aria-hidden="true" />
                </div>

                <div className="divide-y">
                  {visibleFolders.map((folder) => {
                    const inside =
                      tree.subfolders(folder.id).length +
                      tree.documentsIn(folder.id).length;
                    // Ses propres dossiers, jamais un dossier partagé
                    // par le propriétaire (racine de l'accès)
                    const manageable =
                      canUpload &&
                      folder.mine &&
                      !rootFolderIds.includes(folder.id);
                    return (
                      <div
                        key={folder.id}
                        className="group flex items-center gap-3 px-3 sm:px-4 py-1.5 min-h-11 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => openFolder(folder.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FolderIcon folder={folder} />
                          <button
                            type="button"
                            className="text-sm truncate text-left min-w-0"
                            onClick={(event) => {
                              event.stopPropagation();
                              openFolder(folder.id);
                            }}
                          >
                            {folder.name}
                          </button>
                          {folder.mine && (
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                              Créé par vous
                            </span>
                          )}
                        </div>
                        <span className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
                          {inside} élément{inside > 1 ? "s" : ""}
                        </span>
                        <span className="w-28 hidden md:block" />
                        <span
                          className={cn(
                            actionsWidth,
                            "flex items-center justify-end gap-0.5",
                          )}
                        >
                          {manageable && (
                            <span className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 sm:has-[[data-state=open]]:opacity-100 transition-opacity">
                              <OwnFolderMenu
                                folder={folder}
                                onAction={onFolderAction}
                              />
                            </span>
                          )}
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </span>
                      </div>
                    );
                  })}

                  {visibleDocuments.map((document) => {
                    const canPreview = Boolean(previewKind(document));
                    return (
                      <div
                        key={document.id}
                        className="group flex items-center gap-3 px-3 sm:px-4 py-1.5 min-h-11 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => openDocument(document)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileTypeIcon document={document} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 min-w-0">
                              <span className="text-sm truncate">
                                {document.name}
                              </span>
                              {document.mine && (
                                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                  Déposé par vous
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate sm:hidden">
                              {formatFileSize(document.fileSize)}
                              {document.createdAt &&
                                ` · ${formatDate(document.createdAt)}`}
                            </p>
                            {searching && (
                              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                                {folderLocation(document)}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
                          {formatFileSize(document.fileSize)}
                        </span>
                        <span className="w-28 text-right text-sm text-muted-foreground hidden md:block">
                          {formatDate(document.createdAt)}
                        </span>
                        <span
                          className={cn(
                            actionsWidth,
                            // Menu ouvert : les actions restent visibles
                            "flex justify-end gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 sm:has-[[data-state=open]]:opacity-100 transition-opacity",
                          )}
                        >
                          {canPreview && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              aria-label={`Voir ${document.name}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setPreviewed(document);
                              }}
                            >
                              <Eye className="size-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            aria-label={`Télécharger ${document.name}`}
                            asChild
                          >
                            <a
                              href={fileUrl(document, "download")}
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Download className="size-4" />
                            </a>
                          </Button>
                          {canUpload && document.mine && (
                            <OwnDocumentMenu
                              document={document}
                              canMove={canMove}
                              onAction={onDocumentAction}
                            />
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>

      <PreviewDialog
        document={previewedDocument}
        previewUrl={
          previewedDocument ? fileUrl(previewedDocument, "preview") : undefined
        }
        downloadUrl={
          previewedDocument ? fileUrl(previewedDocument, "download") : undefined
        }
        onClose={() => setPreviewed(null)}
      />

      {toRename && (
        <RenameDialog
          key={toRename.id}
          document={toRename}
          onRename={onRename}
          onClose={() => setToRename(null)}
        />
      )}

      {toMove && (
        <MoveDialog
          key={toMove.id}
          document={toMove}
          tree={tree}
          onMove={onMove}
          onClose={() => setToMove(null)}
        />
      )}

      {canUpload && (
        <>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={UPLOAD_ACCEPT}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => {
              // Lus avant la remise à zéro, qui vide la liste
              const files = [...(event.target.files || [])];
              event.target.value = "";
              if (files.length > 0) receive(filesPlan(files));
            }}
          />
          {/* Dossier entier, avec ses sous-dossiers ; un navigateur qui ne
              sait pas choisir un dossier propose de simples fichiers */}
          <input
            ref={folderInput}
            type="file"
            multiple
            webkitdirectory=""
            directory=""
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
            data-testid="depot-dossier"
            onChange={(event) => {
              const files = [...(event.target.files || [])];
              event.target.value = "";
              if (files.length > 0) receive(pickedFolderPlan(files));
            }}
          />
        </>
      )}

      {pending && (
        <DepositDialog
          plan={pending}
          tree={tree}
          onDeposit={async (folder) => {
            await depositInto(pending, folder);
            openFolder(folder.id);
          }}
          onClose={() => setPending(null)}
        />
      )}

      {creatingFolder && (
        <NewFolderDialog
          parent={currentFolder}
          tree={tree}
          onCreate={createFolder}
          onClose={() => setCreatingFolder(false)}
        />
      )}

      {folderToRename && (
        <RenameFolderDialog
          key={folderToRename.id}
          folder={folderToRename}
          tree={tree}
          onRename={onRenameFolder}
          onClose={() => setFolderToRename(null)}
        />
      )}

      <AlertDialog
        open={Boolean(folderToDelete)}
        onOpenChange={(open) => !open && setFolderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader className="min-w-0">
            <AlertDialogTitle className="break-words">
              Supprimer le dossier «&nbsp;{folderToDelete?.name}&nbsp;»&nbsp;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le dossier et tout ce qu&apos;il contient seront retirés du
              dossier partagé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {canUpload && (
        <input
          ref={replaceInput}
          type="file"
          accept={UPLOAD_ACCEPT}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          data-testid="nouvelle-version"
          onChange={(event) => {
            const file = event.target.files?.[0];
            const document = toReplace.current;
            event.target.value = "";
            toReplace.current = null;
            if (!file || !document) return;
            // Fichier refusé d'avance : la file dit pourquoi, sans fenêtre
            if (uploadProblem(file)) uploads.replace(file, document);
            else setReplacing({ document, file });
          }}
        />
      )}

      {replacing && (
        <ReplaceDialog
          key={replacing.document.id}
          document={replacing.document}
          file={replacing.file}
          onReplace={(name) => {
            uploads.replace(replacing.file, replacing.document, name);
            setReplacing(null);
          }}
          onClose={() => setReplacing(null)}
        />
      )}

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          {/* Un nom sans espace (« Scan_2026-11-22_facture.pdf ») passe à
              la ligne au lieu d'élargir la fenêtre sur un téléphone */}
          <AlertDialogHeader className="min-w-0">
            <AlertDialogTitle className="break-words">
              Supprimer «&nbsp;{toDelete?.name}&nbsp;»&nbsp;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le document sera retiré du dossier partagé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UploadPanel
        items={uploads.items}
        busy={uploads.busy}
        onClose={uploads.clear}
      />
    </div>
  );
}
