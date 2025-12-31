"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import { AssistiveTreeDescription, useTree } from "@headless-tree/react";
import {
  useSharedDocuments,
  useSharedFolders,
  useSharedDocumentsStats,
  useUploadSharedDocument,
  useMoveSharedDocuments,
  useDeleteSharedDocuments,
  useCreateSharedFolder,
  useDeleteSharedFolder,
  useRenameSharedDocument,
  useRenameSharedFolder,
} from "@/src/hooks/useSharedDocuments";
import {
  Tree,
  TreeItem,
  TreeItemLabel,
  TreeDragLine,
} from "@/src/components/ui/tree";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Separator } from "@/src/components/ui/separator";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/src/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  FolderPlus,
  Upload,
  Search,
  MoreHorizontal,
  Trash2,
  Download,
  FolderInput,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Folder,
  FolderOpen,
  Inbox,
  Archive,
  CheckCircle2,
  Clock,
  Plus,
  X,
  LoaderCircle,
  ChevronRight,
  Grid3X3,
  List,
  Eye,
  FolderClosed,
  Pencil,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Icône selon le type de fichier
const getFileIcon = (
  mimeType,
  extension,
  className = "size-4 text-muted-foreground"
) => {
  if (mimeType?.startsWith("image/")) {
    return <FileImage className={className} />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className={className} />;
  }
  if (
    mimeType?.includes("spreadsheet") ||
    mimeType?.includes("excel") ||
    extension === "csv"
  ) {
    return <FileSpreadsheet className={className} />;
  }
  if (mimeType?.includes("word") || mimeType?.includes("document")) {
    return <FileText className={className} />;
  }
  return <File className={className} />;
};

// Formater la taille du fichier
const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Formater la taille totale
const formatTotalSize = (bytes) => {
  if (!bytes) return "0 Mo";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (mb >= 1000) return `${(mb / 1024).toFixed(2)} Go`;
  return `${mb.toFixed(1)} Mo`;
};

export default function DocumentsPartagesPage() {
  // États
  const [selectedFolder, setSelectedFolder] = useState(null); // null = "Documents à classer"
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" ou "grid"
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Modals
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");

  // Renommage
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [itemToRename, setItemToRename] = useState(null); // { id, name, type: 'folder' | 'document' }
  const [newName, setNewName] = useState("");

  // Hooks
  // Documents du dossier sélectionné (pour la zone de droite)
  const {
    documents,
    loading: docsLoading,
    isInitialLoading: docsInitialLoading,
    isRefetching: docsRefetching,
    refetch: refetchDocs,
  } = useSharedDocuments({
    folderId: selectedFolder,
    search: searchQuery || undefined,
  });

  // Tous les documents (pour le tree)
  const {
    documents: allDocuments,
    loading: allDocsLoading,
    isInitialLoading: allDocsInitialLoading,
    refetch: refetchAllDocs,
  } = useSharedDocuments({});

  const {
    folders,
    loading: foldersLoading,
    isInitialLoading: foldersInitialLoading,
    isRefetching: foldersRefetching,
    refetch: refetchFolders,
  } = useSharedFolders();
  const { stats, loading: statsLoading } = useSharedDocumentsStats();
  const { upload, loading: uploadLoading } = useUploadSharedDocument();
  const { move, loading: moveLoading } = useMoveSharedDocuments();
  const { deleteDocuments, loading: deleteLoading } =
    useDeleteSharedDocuments();
  const { create: createFolder, loading: createFolderLoading } =
    useCreateSharedFolder();
  const { deleteFolder, loading: deleteFolderLoading } =
    useDeleteSharedFolder();
  const { rename: renameDocument, loading: renameDocLoading } =
    useRenameSharedDocument();
  const { rename: renameFolder, loading: renameFolderLoading } =
    useRenameSharedFolder();

  // Filtrer les documents par recherche
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.originalName?.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // Compter les documents "à classer"
  const pendingCount = stats?.pendingDocuments || 0;

  // État pour le parent du nouveau dossier
  const [newFolderParentId, setNewFolderParentId] = useState(null);

  // Construire les données du tree pour headless-tree (utilise allDocuments pour l'arborescence complète)
  const treeItems = useMemo(() => {
    const items = {
      root: {
        name: "Racine",
        children: [
          "inbox",
          ...folders.filter((f) => !f.parentId).map((f) => f.id),
        ],
        isFolder: true,
      },
      inbox: {
        name: "Documents à classer",
        children: allDocuments
          .filter((d) => !d.folderId)
          .map((d) => `doc-${d.id}`),
        isFolder: true,
        isInbox: true,
        count: pendingCount,
      },
    };

    // Ajouter les dossiers
    folders.forEach((folder) => {
      const childFolders = folders
        .filter((f) => f.parentId === folder.id)
        .map((f) => f.id);
      const childDocs = allDocuments
        .filter((d) => d.folderId === folder.id)
        .map((d) => `doc-${d.id}`);

      items[folder.id] = {
        name: folder.name,
        children: [...childFolders, ...childDocs],
        isFolder: true,
        color: folder.color,
        documentsCount: folder.documentsCount || childDocs.length,
        parentId: folder.parentId,
        data: folder,
      };
    });

    // Ajouter les documents
    allDocuments.forEach((doc) => {
      items[`doc-${doc.id}`] = {
        name: doc.name,
        children: [],
        isFolder: false,
        mimeType: doc.mimeType,
        fileExtension: doc.fileExtension,
        fileSize: doc.fileSize,
        fileUrl: doc.fileUrl,
        createdAt: doc.createdAt,
        data: doc,
      };
    });

    return items;
  }, [folders, allDocuments, pendingCount]);

  // Configuration du tree headless-tree
  const tree = useTree({
    rootItemId: "root",
    getItemName: (item) => item.getItemData()?.name ?? "Unknown",
    isItemFolder: (item) => item.getItemData()?.isFolder ?? false,
    dataLoader: {
      getItem: (itemId) => {
        const item = treeItems[itemId];
        if (!item) {
          // Retourner un item vide pour éviter l'erreur undefined
          return { name: "", children: [], isFolder: false };
        }
        return item;
      },
      getChildren: (itemId) => treeItems[itemId]?.children ?? [],
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
    ],
    indent: 16,
    onDrop: createOnDropHandler(async (parentItem, newChildrenIds) => {
      // Gérer le déplacement des documents/dossiers
      const parentId = parentItem.getId();
      const targetFolderId =
        parentId === "root" || parentId === "inbox" ? null : parentId;

      for (const childId of newChildrenIds) {
        if (childId.startsWith("doc-")) {
          // C'est un document
          const docId = childId.replace("doc-", "");
          try {
            await move([docId], targetFolderId);
          } catch (error) {
            console.error("Erreur déplacement document:", error);
          }
        }
      }

      refetchDocs();
      refetchAllDocs();
      refetchFolders();
    }),
  });

  // Gestion de l'upload
  const handleFileUpload = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
        for (const file of files) {
          await upload(file, {
            folderId: selectedFolder,
          });
        }
        refetchDocs();
        refetchAllDocs();
        refetchFolders();
      } catch (error) {
        console.error("Erreur upload:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [upload, selectedFolder, refetchDocs, refetchAllDocs, refetchFolders]
  );

  // Gestion du drag & drop natif
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      handleFileUpload(files);
    },
    [handleFileUpload]
  );

  const handleFileInputChange = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      handleFileUpload(files);
      e.target.value = ""; // Reset input
    },
    [handleFileUpload]
  );

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Sélection de documents
  const toggleDocumentSelection = (docId) => {
    setSelectedDocuments((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map((doc) => doc.id));
    }
  };

  // Actions
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder({
        name: newFolderName.trim(),
        parentId: newFolderParentId || null,
      });
      setNewFolderName("");
      setNewFolderParentId(null);
      setShowNewFolderModal(false);
      refetchFolders();
      refetchDocs();
      refetchAllDocs();
    } catch (error) {
      console.error("Erreur création dossier:", error);
    }
  };

  const handleMoveDocuments = async (targetFolderId) => {
    try {
      await move(selectedDocuments, targetFolderId);
      setSelectedDocuments([]);
      setShowMoveModal(false);
      refetchDocs();
      refetchAllDocs();
      refetchFolders();
    } catch (error) {
      console.error("Erreur déplacement:", error);
    }
  };

  const handleDeleteDocuments = async () => {
    try {
      await deleteDocuments(selectedDocuments);
      setSelectedDocuments([]);
      setShowDeleteModal(false);
      refetchDocs();
      refetchAllDocs();
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      await deleteFolder(folderToDelete);
      if (selectedFolder === folderToDelete) {
        setSelectedFolder(null);
      }
      setFolderToDelete(null);
      setShowDeleteFolderModal(false);
      refetchFolders();
      refetchDocs();
      refetchAllDocs();
    } catch (error) {
      console.error("Erreur suppression dossier:", error);
    }
  };

  const handleRename = async () => {
    if (!itemToRename || !newName.trim()) return;
    try {
      if (itemToRename.type === "folder") {
        await renameFolder(itemToRename.id, newName.trim());
        refetchFolders();
        refetchAllDocs();
      } else {
        await renameDocument(itemToRename.id, newName.trim());
        refetchDocs();
        refetchAllDocs();
      }
      setShowRenameModal(false);
      setItemToRename(null);
      setNewName("");
    } catch (error) {
      console.error("Erreur renommage:", error);
    }
  };

  const handleDownload = (doc) => {
    window.open(doc.fileUrl, "_blank");
  };

  // Nom du dossier sélectionné
  const selectedFolderName = useMemo(() => {
    if (selectedFolder === null) return "Documents à classer";
    const folder = folders.find((f) => f.id === selectedFolder);
    return folder?.name || "Dossier";
  }, [selectedFolder, folders]);

  return (
    <div
      className="h-full flex flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        className="hidden"
      />

      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-medium mb-2">Documents partagés</h1>
              {/* <p className="text-sm text-muted-foreground mt-0.5">
                Partagez vos documents administratifs avec votre comptable
              </p> */}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewFolderModal(true)}
                className="font-normal"
              >
                <FolderPlus className="h-4 w-4 mr-1.5" />
                Nouveau dossier
              </Button>
              <Button
                size="sm"
                onClick={openFileDialog}
                disabled={isUploading || uploadLoading}
                className="font-normal bg-[#5b4eff] hover:bg-[#4a3ecc]"
              >
                {isUploading || uploadLoading ? (
                  <LoaderCircle className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1.5" />
                )}
                Ajouter
              </Button>
            </div>
          </div>

          {/* Stats */}
          {/* <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{stats?.totalDocuments || 0} document(s)</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span>{stats?.totalFolders || 0} dossier(s)</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Archive className="h-4 w-4" />
              <span>{formatTotalSize(stats?.totalSize || 0)}</span>
            </div>
          </div> */}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Tree avec Dossiers et Documents */}
        <div className="w-72 border-r bg-muted/30 flex-shrink-0 flex flex-col">
          <div className="p-3 border-b flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Explorateur
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setNewFolderParentId(selectedFolder);
                setShowNewFolderModal(true);
              }}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="pt-2 pl-0 pr-0 relative">
              {/* Indicateur de chargement subtil pendant le refetch */}
              {(foldersRefetching || docsRefetching) && (
                <div className="absolute top-1 right-2 z-10">
                  <LoaderCircle className="h-3 w-3 animate-spin text-muted-foreground" />
                </div>
              )}
              {foldersInitialLoading || allDocsInitialLoading ? (
                <div className="space-y-2 px-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-7 w-full" />
                  ))}
                </div>
              ) : (
                <TooltipProvider>
                  <Tree indent={16} tree={tree}>
                    <AssistiveTreeDescription tree={tree} />
                    {tree.getItems().map((item) => {
                      const itemData = item.getItemData();
                      const itemId = item.getId();
                      const isFolder = item.isFolder();
                      const isInbox = itemData?.isInbox;

                      // Ne pas afficher la racine ni les items vides
                      if (itemId === "root" || !itemData?.name) return null;

                      return (
                        <ContextMenu key={itemId}>
                          <ContextMenuTrigger asChild>
                            <TreeItem
                              item={item}
                              className="pb-0 overflow-hidden"
                            >
                              <TreeItemLabel
                                className="rounded-none py-1 w-full cursor-pointer hover:bg-accent"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isFolder) {
                                    // Toggle expand/collapse
                                    if (item.isExpanded()) {
                                      item.collapse();
                                    } else {
                                      item.expand();
                                    }
                                    // Sélectionner le dossier pour afficher son contenu
                                    if (isInbox) {
                                      setSelectedFolder(null);
                                    } else {
                                      setSelectedFolder(itemId);
                                    }
                                  } else {
                                    // Sélectionner le document (ajouter à la sélection)
                                    const docId = itemId.replace("doc-", "");
                                    setSelectedDocuments([docId]);
                                  }
                                }}
                              >
                                <span className="flex items-center gap-1.5 min-w-0 w-full">
                                  {isFolder ? (
                                    isInbox ? (
                                      <Inbox className="size-4 text-amber-500 shrink-0" />
                                    ) : (
                                      <FolderClosed
                                        className="size-4 shrink-0"
                                        style={{
                                          color: itemData?.color || "#6366f1",
                                        }}
                                      />
                                    )
                                  ) : (
                                    getFileIcon(
                                      itemData?.mimeType,
                                      itemData?.fileExtension
                                    )
                                  )}
                                  <Tooltip delayDuration={500}>
                                    <TooltipTrigger asChild>
                                      <span className="truncate flex-1 text-sm min-w-0">
                                        {item.getItemName()}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="bottom"
                                      align="start"
                                      sideOffset={4}
                                      className="max-w-[280px]"
                                    >
                                      <p className="text-xs break-all">
                                        {item.getItemName()}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </span>
                              </TreeItemLabel>
                            </TreeItem>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            {isFolder && !isInbox && (
                              <>
                                <ContextMenuItem
                                  onClick={() => {
                                    setNewFolderParentId(itemId);
                                    setShowNewFolderModal(true);
                                  }}
                                >
                                  <FolderPlus className="size-4" />
                                  Nouveau sous-dossier
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                              </>
                            )}
                            <ContextMenuItem
                              onClick={() => {
                                const type = isFolder ? "folder" : "document";
                                const id = isFolder
                                  ? itemId
                                  : itemId.replace("doc-", "");
                                setItemToRename({
                                  id,
                                  name: item.getItemName(),
                                  type,
                                });
                                setNewName(item.getItemName());
                                setShowRenameModal(true);
                              }}
                            >
                              <Pencil className="size-4" />
                              Renommer
                            </ContextMenuItem>
                            {!isFolder && (
                              <ContextMenuItem
                                onClick={() => {
                                  if (itemData?.fileUrl) {
                                    window.open(itemData.fileUrl, "_blank");
                                  }
                                }}
                              >
                                <Download className="size-4 mr-2" />
                                Télécharger
                              </ContextMenuItem>
                            )}
                            {!isInbox && (
                              <>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    if (isFolder) {
                                      setFolderToDelete(itemId);
                                      setShowDeleteFolderModal(true);
                                    } else {
                                      const docId = itemId.replace("doc-", "");
                                      setSelectedDocuments([docId]);
                                      setShowDeleteModal(true);
                                    }
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                  Supprimer
                                </ContextMenuItem>
                              </>
                            )}
                          </ContextMenuContent>
                        </ContextMenu>
                      );
                    })}
                  </Tree>
                </TooltipProvider>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex-shrink-0 px-4 py-3 border-b bg-background">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-normal">{selectedFolderName}</span>
                <span className="text-sm text-muted-foreground">
                  ({filteredDocuments.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Actions de sélection - à gauche de la recherche */}
                {selectedDocuments.length > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedDocuments.length} sélectionné(s)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMoveModal(true)}
                      className="h-8 text-xs"
                    >
                      <FolderInput className="h-3.5 w-3.5 mr-1" />
                      Déplacer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteModal(true)}
                      className="h-8 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Supprimer
                    </Button>
                  </>
                )}

                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-48 h-8 text-sm"
                  />
                </div>

                {/* Vue */}
                <div className="flex items-center border rounded-md">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-l-md transition-colors",
                      viewMode === "list" ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-r-md transition-colors",
                      viewMode === "grid" ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Documents list */}
          <ScrollArea className="flex-1">
            {/* Zone de drop */}
            {isDragActive && (
              <div className="absolute inset-0 z-50 bg-primary/5 border border-dashed border-primary/40 rounded-lg flex items-center justify-center m-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    Déposez vos fichiers ici
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Images, Documents
                  </p>
                </div>
              </div>
            )}

            {docsInitialLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-1">Aucun document</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                  {searchQuery
                    ? "Aucun document ne correspond à votre recherche"
                    : "Glissez-déposez vos fichiers ou cliquez sur Ajouter"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={openFileDialog}
                    className="bg-[#5b4eff] hover:bg-[#4a3ecc]"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter un document
                  </Button>
                )}
              </div>
            ) : viewMode === "list" ? (
              /* Vue liste */
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                  <Checkbox
                    checked={
                      selectedDocuments.length === filteredDocuments.length &&
                      filteredDocuments.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                  <span className="flex-1">Nom</span>
                  <span className="w-24 text-right">Taille</span>
                  <span className="w-32 text-right">Date</span>
                  <span className="w-10"></span>
                </div>

                {/* Documents */}
                <div className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 hover:bg-accent/50 transition-colors group",
                        selectedDocuments.includes(doc.id) && "bg-accent/30"
                      )}
                    >
                      <Checkbox
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={() => toggleDocumentSelection(doc.id)}
                        className="h-4 w-4"
                      />
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(doc.mimeType, doc.fileExtension)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-normal truncate">
                            {doc.name}
                          </p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="w-24 text-right text-sm text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span className="w-32 text-right text-sm text-muted-foreground">
                        {format(new Date(doc.createdAt), "d MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(doc.fileUrl, "_blank")}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Aperçu
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocuments([doc.id]);
                              setShowMoveModal(true);
                            }}
                          >
                            <FolderInput className="h-4 w-4 mr-2" />
                            Déplacer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocuments([doc.id]);
                              setShowDeleteModal(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Vue grille */
              <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={cn(
                      "group relative border rounded-xl p-4 hover:border-[#5b4eff]/50 hover:shadow-sm transition-all cursor-pointer",
                      selectedDocuments.includes(doc.id) &&
                        "border-[#5b4eff] bg-[#5b4eff]/5"
                    )}
                    onClick={() => toggleDocumentSelection(doc.id)}
                  >
                    <div className="absolute top-2 left-2">
                      <Checkbox
                        checked={selectedDocuments.includes(doc.id)}
                        onCheckedChange={() => toggleDocumentSelection(doc.id)}
                        className="h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(doc)}>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocuments([doc.id]);
                              setShowDeleteModal(true);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-col items-center pt-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3">
                        {getFileIcon(doc.mimeType, doc.fileExtension)}
                      </div>
                      <p className="text-sm font-medium text-center truncate w-full">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(doc.fileSize)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Modal nouveau dossier */}
      <Dialog
        open={showNewFolderModal}
        onOpenChange={(open) => {
          setShowNewFolderModal(open);
          if (!open) {
            setNewFolderName("");
            setNewFolderParentId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau dossier</DialogTitle>
            <DialogDescription>
              {newFolderParentId ? (
                <>
                  Créer un sous-dossier dans{" "}
                  <span className="font-medium text-foreground">
                    {folders.find((f) => f.id === newFolderParentId)?.name ||
                      "dossier sélectionné"}
                  </span>
                </>
              ) : (
                "Créez un dossier pour organiser vos documents"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {newFolderParentId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                <FolderClosed className="h-4 w-4" />
                <span>
                  Dans : {folders.find((f) => f.id === newFolderParentId)?.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-auto"
                  onClick={() => setNewFolderParentId(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Input
              placeholder="Nom du dossier"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewFolderModal(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolderLoading}
              className="bg-[#5b4eff] hover:bg-[#4a3ecc]"
            >
              {createFolderLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal déplacer */}
      <Dialog open={showMoveModal} onOpenChange={setShowMoveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Déplacer vers</DialogTitle>
            <DialogDescription>
              Sélectionnez le dossier de destination
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <button
              onClick={() => handleMoveDocuments(null)}
              disabled={moveLoading}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Inbox className="h-4 w-4" />
              <span>Documents à classer</span>
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleMoveDocuments(folder.id)}
                disabled={moveLoading}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Folder className="h-4 w-4" style={{ color: folder.color }} />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal supprimer documents */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les documents ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. {selectedDocuments.length}{" "}
              document(s) seront définitivement supprimé(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocuments}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal supprimer dossier */}
      <AlertDialog
        open={showDeleteFolderModal}
        onOpenChange={setShowDeleteFolderModal}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le dossier sera supprimé et les documents qu'il contient seront
              déplacés vers "Documents à classer".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              disabled={deleteFolderLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteFolderLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal renommer */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Renommer{" "}
              {itemToRename?.type === "folder" ? "le dossier" : "le document"}
            </DialogTitle>
            <DialogDescription>
              Entrez le nouveau nom pour "{itemToRename?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nouveau nom"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  handleRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleRename}
              disabled={
                !newName.trim() ||
                newName === itemToRename?.name ||
                renameDocLoading ||
                renameFolderLoading
              }
            >
              {renameDocLoading || renameFolderLoading ? (
                <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Renommer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
