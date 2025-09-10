"use client";

import { useState } from "react";
import { toast } from "@/src/components/ui/sonner";
import { useFileTransfer } from "../hooks/useFileTransfer";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Badge } from "@/src/components/ui/badge";
import {
  IconSearch,
  IconFile,
  IconDownload,
  IconCalendar,
  IconUser,
  IconCopy,
  IconEye,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";

// Données de démonstration
const demoTransfers = [
  {
    id: "1",
    shareLink: "abc123",
    status: "active",
    files: [
      { name: "document.pdf", size: 2048000, type: "application/pdf" },
      { name: "image.jpg", size: 1024000, type: "image/jpeg" },
    ],
    recipientEmail: "user@example.com",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    downloadCount: 3,
    maxDownloads: 10,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    shareLink: "def456",
    status: "expired",
    files: [{ name: "archive.zip", size: 5120000, type: "application/zip" }],
    recipientEmail: null,
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    downloadCount: 0,
    maxDownloads: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const TRANSFER_STATUS_LABELS = {
  active: "Actif",
  expired: "Expiré",
  pending: "En attente",
};

const TRANSFER_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

export default function TransferTable() {
  // Use the file transfer hook
  const {
    transfers,
    transfersLoading,
    transfersError,
    deleteTransfer,
    copyShareLink,
    formatFileSize,
    refetchTransfers,
  } = useFileTransfer();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransfers, setSelectedTransfers] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Actions functions
  const viewTransfer = (shareLink) => {
    window.open(`/dashboard/outils/transferts-fichiers/${shareLink}`, "_blank");
  };

  const handleDeleteTransfer = async (transferId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce transfert ?")) {
      try {
        await deleteTransfer(transferId);
      } catch (error) {
        console.error("Error deleting transfer:", error);
      }
    }
  };

  // Selection functions
  const toggleSelectAll = () => {
    if (selectedTransfers.length === filteredTransfers.length) {
      setSelectedTransfers([]);
    } else {
      setSelectedTransfers(filteredTransfers.map((t) => t.id));
    }
  };

  const toggleSelectTransfer = (transferId) => {
    setSelectedTransfers((prev) =>
      prev.includes(transferId)
        ? prev.filter((id) => id !== transferId)
        : [...prev, transferId]
    );
  };

  const handleDeleteSelected = async () => {
    setIsDeleting(true);
    try {
      // Supprimer vraiment les transferts sélectionnés
      const deletePromises = selectedTransfers.map(transferId => 
        deleteTransfer(transferId)
      );
      
      await Promise.all(deletePromises);
      
      toast.success(
        `${selectedTransfers.length} transfert(s) supprimé(s) avec succès`
      );
      setSelectedTransfers([]);
    } catch (error) {
      console.error("Erreur lors de la suppression multiple:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter transfers based on search term and status
  const filteredTransfers = (transfers || []).filter((transfer) => {
    // Status filter
    if (statusFilter !== "all" && transfer.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      transfer.files.some((file) =>
        file.originalName?.toLowerCase().includes(searchLower)
      ) ||
      (transfer.recipientEmail &&
        transfer.recipientEmail.toLowerCase().includes(searchLower)) ||
      TRANSFER_STATUS_LABELS[transfer.status]
        ?.toLowerCase()
        .includes(searchLower)
    );
  });

  // Show loading state
  if (transfersLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">
          Chargement des transferts...
        </div>
      </div>
    );
  }

  // Show error state
  if (transfersError) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-red-600">
          Erreur lors du chargement des transferts
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <IconSearch
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Rechercher des transferts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="expired">Expiré</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
          </SelectContent>
        </Select>

        {/* Delete selected */}
        {selectedTransfers.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isDeleting}>
                <IconTrash size={16} className="mr-2" />
                {isDeleting
                  ? "Suppression..."
                  : `Supprimer (${selectedTransfers.length})`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer {selectedTransfers.length}{" "}
                  transfert(s) ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedTransfers.length === filteredTransfers.length &&
                    filteredTransfers.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Sélectionner tout"
                />
              </TableHead>
              <TableHead>Fichiers</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Téléchargements</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map((transfer) => {
                const totalSize = transfer.files.reduce(
                  (acc, file) => acc + (file.size || 0),
                  0
                );
                const isExpired = new Date(transfer.expiresAt) < new Date();

                return (
                  <TableRow key={transfer.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTransfers.includes(transfer.id)}
                        onCheckedChange={() =>
                          toggleSelectTransfer(transfer.id)
                        }
                        aria-label={`Sélectionner le transfert ${transfer.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <IconFile
                            size={16}
                            className="text-muted-foreground"
                          />
                          <span className="font-medium">
                            {transfer.files.length} fichier
                            {transfer.files.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatFileSize(totalSize)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transfer.recipientEmail ? (
                        <div className="flex items-center gap-1">
                          <IconUser size={14} className="text-muted-foreground" />
                          <span className="text-sm">{transfer.recipientEmail}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`font-medium ${TRANSFER_STATUS_COLORS[transfer.status] || ""}`}
                      >
                        {TRANSFER_STATUS_LABELS[transfer.status] ||
                          transfer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transfer.expiryDate ? (
                        <div
                          className={`flex items-center gap-1 ${isExpired ? "text-red-600" : ""}`}
                        >
                          <IconCalendar size={14} />
                          {formatDate(transfer.expiryDate)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconDownload
                          size={14}
                          className="text-muted-foreground"
                        />
                        <span>
                          {transfer.downloadCount}
                          {transfer.maxDownloads &&
                            ` / ${transfer.maxDownloads}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(transfer.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <IconDotsVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              copyShareLink(
                                transfer.shareLink,
                                transfer.accessKey
                              )
                            }
                          >
                            <IconCopy size={16} className="mr-2" />
                            Copier le lien
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => viewTransfer(transfer.shareLink)}
                          >
                            <IconEye size={16} className="mr-2" />
                            Voir le transfert
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteTransfer(transfer.id)}
                            variant="destructive"
                          >
                            <IconTrash size={16} className="mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {searchTerm
                    ? "Aucun transfert trouvé."
                    : "Aucun transfert disponible."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
