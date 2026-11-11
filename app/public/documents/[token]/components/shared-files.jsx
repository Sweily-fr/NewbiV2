"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Download,
  Eye,
  File as FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  FileAudio,
  FolderClosed,
  FolderOpen,
  Home,
  LogOut,
  PanelLeft,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { PdfPreview } from "@/src/components/pdf/pdf-preview";
import { cn } from "@/src/lib/utils";
import { NewbiSignature, WorkspaceIdentity } from "./access-screen";
import {
  HOME,
  buildShareTree,
  fileKind,
  formatFileSize,
  previewKind,
  searchShare,
  sortDocuments,
} from "./shared-files-utils";

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

/** Dossier de la couleur choisie dans Newbi. */
function FolderIcon({ folder, open = false, className = "size-4" }) {
  const Icon = open ? FolderOpen : FolderClosed;
  return (
    <Icon
      aria-hidden="true"
      className={cn("shrink-0", className)}
      style={{ color: folder?.color || "currentColor", opacity: 0.75 }}
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
        <div className="flex items-center gap-3 pr-8">
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

/**
 * Espace du visiteur d'un lien client : même visuel que Documents partagés
 * dans Newbi (explorateur à gauche, fil d'Ariane, recherche, colonnes Nom,
 * Taille et Date), en lecture seule.
 */
export function SharedFiles({ content, fileUrl, downloadAllUrl, onSignOut }) {
  const { folders, documents, rootFolderIds, workspace, visitor } = content;
  const tree = useMemo(
    () => buildShareTree({ folders, documents, rootFolderIds }),
    [folders, documents, rootFolderIds],
  );
  const hasHome = tree.roots.length > 1;
  const homeId = hasHome ? HOME : tree.roots[0]?.id;
  const homeLabel = content.name || "Documents partagés";

  const [currentId, setCurrentId] = useState(homeId);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ by: "name", order: "asc" });
  const [previewed, setPreviewed] = useState(null);
  const [treeOpen, setTreeOpen] = useState(false);

  const searching = query.trim().length > 0;
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

        <main className="flex-1 min-w-0 flex flex-col">
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
                  <span className="w-[60px]" aria-hidden="true" />
                </div>

                <div className="divide-y">
                  {visibleFolders.map((folder) => {
                    const inside =
                      tree.subfolders(folder.id).length +
                      tree.documentsIn(folder.id).length;
                    return (
                      <div
                        key={folder.id}
                        className="flex items-center gap-3 px-3 sm:px-4 py-1.5 min-h-11 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => openFolder(folder.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FolderIcon folder={folder} />
                          <button
                            type="button"
                            className="text-sm truncate text-left"
                            onClick={(event) => {
                              event.stopPropagation();
                              openFolder(folder.id);
                            }}
                          >
                            {folder.name}
                          </button>
                        </div>
                        <span className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
                          {inside} élément{inside > 1 ? "s" : ""}
                        </span>
                        <span className="w-28 hidden md:block" />
                        <span className="w-[60px] flex justify-end">
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
                            <p className="text-sm truncate">{document.name}</p>
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
                        <span className="w-[60px] flex justify-end gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
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
        document={previewed}
        previewUrl={previewed ? fileUrl(previewed, "preview") : undefined}
        downloadUrl={previewed ? fileUrl(previewed, "download") : undefined}
        onClose={() => setPreviewed(null)}
      />
    </div>
  );
}
