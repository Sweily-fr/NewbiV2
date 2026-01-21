"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
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
  useUpdateSharedDocument,
  useMoveSharedFolder,
  useCreateDefaultFolders,
} from "@/src/hooks/useSharedDocuments";
import { DraggableTree } from "./components/DraggableTree";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Home,
  ChevronDown,
  Tag,
  MessageSquare,
  User,
  Calendar,
  Info,
  ExternalLink,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { Progress } from "@/src/components/ui/progress";
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

  // Tri
  const [sortBy, setSortBy] = useState("createdAt"); // "name", "fileSize", "createdAt"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc", "desc"

  // Upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [totalFilesToUpload, setTotalFilesToUpload] = useState(0);

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

  // Document details panel
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [selectedDocumentDetails, setSelectedDocumentDetails] = useState(null);
  const [newTag, setNewTag] = useState("");

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Hooks
  // Documents du dossier sélectionné (pour la zone de droite)
  const {
    documents,
    total: totalDocuments,
    hasMore,
    loading: docsLoading,
    isInitialLoading: docsInitialLoading,
    isRefetching: docsRefetching,
    refetch: refetchDocs,
    loadMore,
  } = useSharedDocuments({
    folderId: selectedFolder,
    search: debouncedSearch || undefined, // Use debounced search for server-side filtering
    sortBy,
    sortOrder,
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
  const { update: updateDocument, loading: updateDocLoading } =
    useUpdateSharedDocument();
  const { moveFolder, loading: moveFolderLoading } = useMoveSharedFolder();
  const { createDefaultFolders, isCreating: isCreatingDefaultFolders, workspaceId } =
    useCreateDefaultFolders();

  // Créer les dossiers par défaut si aucun dossier n'existe
  const [defaultFoldersCreated, setDefaultFoldersCreated] = useState(false);

  useEffect(() => {
    const initDefaultFolders = async () => {
      // Ne créer les dossiers par défaut que si:
      // 1. workspaceId est disponible
      // 2. Les dossiers ont été chargés (pas en loading initial)
      // 3. On n'a pas déjà essayé de les créer
      if (
        workspaceId &&
        !foldersInitialLoading &&
        !defaultFoldersCreated &&
        !isCreatingDefaultFolders
      ) {
        setDefaultFoldersCreated(true);
        // Passer les noms des dossiers existants pour éviter les doublons
        const existingNames = folders.map((f) => f.name);
        const created = await createDefaultFolders(existingNames);
        if (created.length > 0) {
          refetchFolders();
        }
      }
    };

    initDefaultFolders();
  }, [
    workspaceId,
    foldersInitialLoading,
    folders,
    defaultFoldersCreated,
    isCreatingDefaultFolders,
    createDefaultFolders,
    refetchFolders,
  ]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return;
      }

      // Delete key - delete selected documents
      if (e.key === "Delete" && selectedDocuments.length > 0) {
        e.preventDefault();
        setShowDeleteModal(true);
      }

      // Escape - clear selection or close panels
      if (e.key === "Escape") {
        if (showDetailsPanel) {
          setShowDetailsPanel(false);
          setSelectedDocumentDetails(null);
        } else if (selectedDocuments.length > 0) {
          setSelectedDocuments([]);
        }
      }

      // Ctrl/Cmd + A - select all documents
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (filteredDocuments.length > 0) {
          setSelectedDocuments(filteredDocuments.map((doc) => doc.id));
        }
      }

      // Ctrl/Cmd + F - focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        document.querySelector('input[placeholder="Rechercher..."]')?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDocuments, filteredDocuments, showDetailsPanel]);

  // Compter les documents "à classer"
  const pendingCount = stats?.pendingDocuments || 0;

  // État pour le parent du nouveau dossier
  const [newFolderParentId, setNewFolderParentId] = useState(null);

  // Handler pour le déplacement de documents via drag & drop
  const handleTreeMove = useCallback(
    async (docIds, targetFolderId) => {
      try {
        await move(docIds, targetFolderId, { silent: true });
        refetchFolders();
        refetchAllDocs();
        refetchDocs();
      } catch (error) {
        console.error("Erreur déplacement document:", error);
      }
    },
    [move, refetchFolders, refetchAllDocs, refetchDocs]
  );

  // Handler pour le déplacement de dossiers via drag & drop
  const handleTreeMoveFolder = useCallback(
    async (folderId, targetFolderId) => {
      try {
        await moveFolder(folderId, targetFolderId, { silent: true });
        refetchFolders();
        refetchAllDocs();
        refetchDocs();
      } catch (error) {
        console.error("Erreur déplacement dossier:", error);
      }
    },
    [moveFolder, refetchFolders, refetchAllDocs, refetchDocs]
  );

  // État pour le context menu du tree
  const [treeContextMenu, setTreeContextMenu] = useState(null);

  // Gestion de l'upload avec progression
  const handleFileUpload = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      setIsUploading(true);
      setTotalFilesToUpload(fileArray.length);
      setUploadingFiles(fileArray.map((f) => f.name));
      setUploadProgress(0);

      try {
        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          setUploadingFiles([file.name]);
          await upload(file, {
            folderId: selectedFolder,
          });
          // Update progress after each file
          setUploadProgress(Math.round(((i + 1) / fileArray.length) * 100));
        }
        refetchDocs();
        refetchAllDocs();
        refetchFolders();
      } catch (error) {
        console.error("Erreur upload:", error);
      } finally {
        // Reset after a short delay to show 100%
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          setUploadingFiles([]);
          setTotalFilesToUpload(0);
        }, 500);
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

  // Open document details panel
  const handleOpenDetails = (doc) => {
    setSelectedDocumentDetails(doc);
    setShowDetailsPanel(true);
  };

  // Add tag to document
  const handleAddTag = async () => {
    if (!newTag.trim() || !selectedDocumentDetails) return;
    const currentTags = selectedDocumentDetails.tags || [];
    if (currentTags.includes(newTag.trim())) {
      toast.error("Ce tag existe déjà");
      return;
    }
    try {
      await updateDocument(selectedDocumentDetails.id, {
        tags: [...currentTags, newTag.trim()],
      });
      // Update local state
      setSelectedDocumentDetails({
        ...selectedDocumentDetails,
        tags: [...currentTags, newTag.trim()],
      });
      setNewTag("");
      toast.success("Tag ajouté");
      refetchDocs();
      refetchAllDocs();
    } catch (error) {
      console.error("Erreur ajout tag:", error);
    }
  };

  // Remove tag from document
  const handleRemoveTag = async (tagToRemove) => {
    if (!selectedDocumentDetails) return;
    const currentTags = selectedDocumentDetails.tags || [];
    try {
      await updateDocument(selectedDocumentDetails.id, {
        tags: currentTags.filter((t) => t !== tagToRemove),
      });
      // Update local state
      setSelectedDocumentDetails({
        ...selectedDocumentDetails,
        tags: currentTags.filter((t) => t !== tagToRemove),
      });
      toast.success("Tag supprimé");
      refetchDocs();
      refetchAllDocs();
    } catch (error) {
      console.error("Erreur suppression tag:", error);
    }
  };

  // Nom du dossier sélectionné
  const selectedFolderName = useMemo(() => {
    if (selectedFolder === null) return "Documents à classer";
    const folder = folders.find((f) => f.id === selectedFolder);
    return folder?.name || "Dossier";
  }, [selectedFolder, folders]);

  // Breadcrumb - chemin du dossier sélectionné
  const breadcrumbPath = useMemo(() => {
    const path = [];

    if (selectedFolder === null) {
      return [{ id: null, name: "Documents à classer", isInbox: true }];
    }

    // Remonter la hiérarchie des dossiers
    let currentFolderId = selectedFolder;
    while (currentFolderId) {
      const folder = folders.find((f) => f.id === currentFolderId);
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name, color: folder.color });
        currentFolderId = folder.parentId;
      } else {
        break;
      }
    }

    return path;
  }, [selectedFolder, folders]);

  // Toggle sort
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setShowNewFolderModal(true)}
                    >
                      <FolderPlus className="h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="bg-[#202020] text-white border-0"
                  >
                    <p>Nouveau dossier</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <ButtonGroup>
                <Button
                  onClick={openFileDialog}
                  disabled={isUploading || uploadLoading}
                  className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Ajouter
                </Button>
                <ButtonGroupSeparator />
                <Button
                  onClick={openFileDialog}
                  disabled={isUploading || uploadLoading}
                  size="icon"
                  className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  {isUploading || uploadLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus size={16} aria-hidden="true" />
                  )}
                </Button>
              </ButtonGroup>
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
        <div className="w-64 border-r bg-muted/20 flex-shrink-0 flex flex-col">
          <div className="px-3 h-14 border-b flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
              Explorateur
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
              onClick={() => {
                setNewFolderParentId(selectedFolder);
                setShowNewFolderModal(true);
              }}
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            {foldersInitialLoading || allDocsInitialLoading ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </div>
            ) : (
              <div className="pt-2">
                <DraggableTree
                  folders={folders}
                  documents={allDocuments}
                  pendingCount={pendingCount}
                  selectedFolder={selectedFolder}
                  onMove={handleTreeMove}
                  onMoveFolder={handleTreeMoveFolder}
                  onSelectFolder={setSelectedFolder}
                  onSelectDocument={(docId) => setSelectedDocuments([docId])}
                  onContextMenu={(e, itemId, item) => {
                    e.preventDefault();
                    setTreeContextMenu({ x: e.clientX, y: e.clientY, itemId, item });
                  }}
                />

                {/* Context Menu for tree items - using DropdownMenu for programmatic control */}
                {treeContextMenu && (
                  <DropdownMenu
                    open={!!treeContextMenu}
                    onOpenChange={(open) => !open && setTreeContextMenu(null)}
                  >
                    <DropdownMenuTrigger asChild>
                      <div
                        style={{
                          position: "fixed",
                          left: treeContextMenu.x,
                          top: treeContextMenu.y,
                          width: 1,
                          height: 1,
                          pointerEvents: "none",
                        }}
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="bottom">
                      {treeContextMenu.item.isFolder && !treeContextMenu.item.isInbox && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setNewFolderParentId(treeContextMenu.itemId);
                              setShowNewFolderModal(true);
                              setTreeContextMenu(null);
                            }}
                          >
                            <FolderPlus className="size-4 mr-2" />
                            Nouveau sous-dossier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {/* Renommer - pas pour les dossiers système */}
                      {!treeContextMenu.item.isSystem && (
                        <DropdownMenuItem
                          onClick={() => {
                            const isFolder = treeContextMenu.item.isFolder;
                            const itemId = treeContextMenu.itemId;
                            const id = isFolder ? itemId : itemId.replace("doc-", "");
                            setItemToRename({
                              id,
                              name: treeContextMenu.item.name,
                              type: isFolder ? "folder" : "document",
                            });
                            setNewName(treeContextMenu.item.name);
                            setShowRenameModal(true);
                            setTreeContextMenu(null);
                          }}
                        >
                          <Pencil className="size-4 mr-2" />
                          Renommer
                        </DropdownMenuItem>
                      )}
                      {!treeContextMenu.item.isFolder && (
                        <DropdownMenuItem
                          onClick={() => {
                            if (treeContextMenu.item.data?.fileUrl) {
                              window.open(treeContextMenu.item.data.fileUrl, "_blank");
                            }
                            setTreeContextMenu(null);
                          }}
                        >
                          <Download className="size-4 mr-2" />
                          Télécharger
                        </DropdownMenuItem>
                      )}
                      {/* Supprimer - pas pour inbox ni dossiers système */}
                      {!treeContextMenu.item.isInbox && !treeContextMenu.item.isSystem && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (treeContextMenu.item.isFolder) {
                                setFolderToDelete(treeContextMenu.itemId);
                                setShowDeleteFolderModal(true);
                              } else {
                                const docId = treeContextMenu.itemId.replace("doc-", "");
                                setSelectedDocuments([docId]);
                                setShowDeleteModal(true);
                              }
                              setTreeContextMenu(null);
                            }}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex-shrink-0 px-4 min-h-14 border-b bg-background flex flex-col justify-center py-2">
            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="mb-2 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Upload en cours... {uploadingFiles[0] && `(${uploadingFiles[0]})`}
                  </span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Home className="h-4 w-4" />
                </button>
                {breadcrumbPath.map((item, index) => (
                  <div key={item.id || "inbox"} className="flex items-center gap-1 min-w-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <button
                      onClick={() => setSelectedFolder(item.id)}
                      className={cn(
                        "truncate max-w-[150px] text-sm transition-colors",
                        index === breadcrumbPath.length - 1
                          ? "font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.isInbox ? (
                        <span className="flex items-center gap-1">
                          <Inbox className="h-3.5 w-3.5 text-amber-500" />
                          {item.name}
                        </span>
                      ) : (
                        item.name
                      )}
                    </button>
                  </div>
                ))}
                <span className="text-xs text-muted-foreground ml-1">
                  ({filteredDocuments.length}{hasMore ? "+" : ""})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Actions de sélection */}
                {selectedDocuments.length > 0 && (
                  <>
                    <span className="text-xs font-normal text-muted-foreground">
                      {selectedDocuments.length} sélectionné(s)
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setShowMoveModal(true)}
                          >
                            <FolderInput className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-[#202020] text-white border-0"
                        >
                          <p>Déplacer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowDeleteModal(true)}
                            className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="bottom"
                          className="bg-[#202020] text-white border-0"
                        >
                          <p>Supprimer</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </>
                )}

                {/* Tri */}
                <TooltipProvider>
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon">
                            <ArrowUpDown className="h-4 w-4" strokeWidth={1.5} />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        className="bg-[#202020] text-white border-0"
                      >
                        <p>Trier</p>
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => handleSort("name")} className="justify-between">
                        Nom
                        {getSortIcon("name")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort("createdAt")} className="justify-between">
                        Date
                        {getSortIcon("createdAt")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSort("fileSize")} className="justify-between">
                        Taille
                        {getSortIcon("fileSize")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipProvider>

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
              <div className="space-y-2 py-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="h-full min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground/60">
                  <FileText className="h-5 w-5" />
                  <p className="text-sm">
                    {searchQuery
                      ? "Aucun résultat"
                      : "Aucun document"}
                  </p>
                </div>
              </div>
            ) : viewMode === "list" ? (
              /* Vue liste */
              <div>
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
                  <Checkbox
                    checked={
                      selectedDocuments.length === filteredDocuments.length &&
                      filteredDocuments.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                    className="h-4 w-4"
                  />
                  <button
                    className="flex-1 flex items-center gap-1 hover:text-foreground transition-colors text-left"
                    onClick={() => handleSort("name")}
                  >
                    Nom
                    {getSortIcon("name")}
                  </button>
                  <button
                    className="w-24 flex items-center gap-1 justify-end hover:text-foreground transition-colors"
                    onClick={() => handleSort("fileSize")}
                  >
                    Taille
                    {getSortIcon("fileSize")}
                  </button>
                  <button
                    className="w-32 flex items-center gap-1 justify-end hover:text-foreground transition-colors"
                    onClick={() => handleSort("createdAt")}
                  >
                    Date
                    {getSortIcon("createdAt")}
                  </button>
                  <span className="w-10"></span>
                </div>

                {/* Documents */}
                <div className="divide-y">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors group",
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
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-normal truncate">
                              {doc.name}
                            </p>
                            {/* Tags inline */}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {doc.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 h-4"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {doc.tags.length > 2 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +{doc.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* Comments indicator */}
                            {doc.comments && doc.comments.length > 0 && (
                              <div className="flex items-center gap-0.5 text-muted-foreground flex-shrink-0">
                                <MessageSquare className="h-3 w-3" />
                                <span className="text-[10px]">{doc.comments.length}</span>
                              </div>
                            )}
                          </div>
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
                          <DropdownMenuItem onClick={() => handleOpenDetails(doc)}>
                            <Info className="h-4 w-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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

                {/* Load More Button - List View */}
                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={docsLoading}
                      className="gap-2"
                    >
                      {docsLoading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Charger plus de documents
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Vue grille */
              <div className="px-4 py-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                          <DropdownMenuItem onClick={() => handleOpenDetails(doc)}>
                            <Info className="h-4 w-4 mr-2" />
                            Détails
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-3 relative">
                        {getFileIcon(doc.mimeType, doc.fileExtension)}
                        {/* Comments/Tags indicator on grid card */}
                        {((doc.tags && doc.tags.length > 0) || (doc.comments && doc.comments.length > 0)) && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#5b4eff] rounded-full flex items-center justify-center">
                            <span className="text-[8px] text-white font-medium">
                              {(doc.tags?.length || 0) + (doc.comments?.length || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-center truncate w-full">
                        {doc.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(doc.fileSize)}
                      </p>
                      {/* Tags on grid */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                          {doc.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[9px] px-1 py-0 h-3.5"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                </div>

                {/* Load More Button - Grid View */}
                {hasMore && (
                  <div className="flex justify-center py-4 col-span-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadMore}
                      disabled={docsLoading}
                      className="gap-2"
                    >
                      {docsLoading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Charger plus de documents
                    </Button>
                  </div>
                )}
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

      {/* Document Details Panel */}
      <Dialog
        open={showDetailsPanel}
        onOpenChange={(open) => {
          setShowDetailsPanel(open);
          if (!open) {
            setSelectedDocumentDetails(null);
            setNewTag("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocumentDetails &&
                getFileIcon(
                  selectedDocumentDetails.mimeType,
                  selectedDocumentDetails.fileExtension,
                  "size-5"
                )}
              <span className="truncate">{selectedDocumentDetails?.name}</span>
            </DialogTitle>
            <DialogDescription>
              Détails et métadonnées du document
            </DialogDescription>
          </DialogHeader>

          {selectedDocumentDetails && (
            <div className="space-y-4 py-2">
              {/* File Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <File className="h-4 w-4" />
                  <span>Taille</span>
                </div>
                <div>{formatFileSize(selectedDocumentDetails.fileSize)}</div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Ajouté le</span>
                </div>
                <div>
                  {format(
                    new Date(selectedDocumentDetails.createdAt),
                    "d MMMM yyyy à HH:mm",
                    { locale: fr }
                  )}
                </div>

                {selectedDocumentDetails.uploadedByName && (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Par</span>
                    </div>
                    <div>{selectedDocumentDetails.uploadedByName}</div>
                  </>
                )}
              </div>

              <Separator />

              {/* Tags Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Tag className="h-4 w-4" />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedDocumentDetails.tags || []).length > 0 ? (
                    (selectedDocumentDetails.tags || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive transition-colors"
                          disabled={updateDocLoading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Aucun tag
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ajouter un tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || updateDocLoading}
                    className="h-8"
                  >
                    {updateDocLoading ? (
                      <LoaderCircle className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Comments Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4" />
                  Commentaires
                  {(selectedDocumentDetails.comments || []).length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedDocumentDetails.comments.length}
                    </Badge>
                  )}
                </div>
                <ScrollArea className="max-h-40">
                  {(selectedDocumentDetails.comments || []).length > 0 ? (
                    <div className="space-y-2">
                      {selectedDocumentDetails.comments.map((comment, idx) => (
                        <div
                          key={idx}
                          className="bg-muted/50 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs">
                              {comment.authorName || "Utilisateur"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(
                                new Date(comment.createdAt),
                                "d MMM yyyy",
                                { locale: fr }
                              )}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Aucun commentaire
                    </p>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(selectedDocumentDetails)}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(selectedDocumentDetails?.fileUrl, "_blank")}
              className="gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
