"use client";

import React, { useState, useMemo } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_FILE_TRANSFER_FROM_SHARED_DOCS } from "../../transferts-fichiers/graphql/mutations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { toast } from "@/src/components/ui/sonner";
import {
  Send,
  Clock,
  Lock,
  Mail,
  MessageSquare,
  Bell,
  Eye,
  EyeOff,
  FileText,
  FolderClosed,
  LoaderCircle,
} from "lucide-react";

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "Ko", "Mo", "Go"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default function TransferFromDocsModal({
  open,
  onOpenChange,
  selectedDocumentIds = [],
  selectedFolderIds = [],
  documents = [],
  folders = [],
  allDocuments = [],
  workspaceId,
  onTransferCreated,
}) {
  const [options, setOptions] = useState({
    expiration: "7d",
    recipientEmail: "",
    message: "",
    notifyOnDownload: false,
    passwordProtected: false,
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [createTransfer, { loading }] = useMutation(
    CREATE_FILE_TRANSFER_FROM_SHARED_DOCS
  );

  const handleOptionChange = (field, value) => {
    setOptions((prev) => ({ ...prev, [field]: value }));
  };

  // Calculer le résumé de la sélection
  const selectionSummary = useMemo(() => {
    const selectedDocs = documents.filter((d) =>
      selectedDocumentIds.includes(d.id || d._id)
    );
    const selectedFldrs = folders.filter((f) =>
      selectedFolderIds.includes(f.id || f._id)
    );

    // Estimer la taille des documents sélectionnés directement
    let totalSize = selectedDocs.reduce(
      (acc, d) => acc + (d.fileSize || d.size || 0),
      0
    );

    // Pour les dossiers, estimer à partir de allDocuments
    let docsInFolders = 0;
    if (selectedFolderIds.length > 0 && allDocuments.length > 0) {
      const docsInSelectedFolders = allDocuments.filter(
        (d) =>
          d.folderId && selectedFolderIds.includes(d.folderId)
      );
      docsInFolders = docsInSelectedFolders.length;
      totalSize += docsInSelectedFolders.reduce(
        (acc, d) => acc + (d.fileSize || d.size || 0),
        0
      );
    }

    return {
      docs: selectedDocs,
      folders: selectedFldrs,
      docCount: selectedDocs.length,
      folderCount: selectedFldrs.length,
      docsInFolders,
      totalSize,
    };
  }, [selectedDocumentIds, selectedFolderIds, documents, folders, allDocuments]);

  const getExpiryDays = (expiration) => {
    switch (expiration) {
      case "24h":
        return 1;
      case "48h":
        return 2;
      case "7d":
        return 7;
      case "30d":
        return 30;
      default:
        return 7;
    }
  };

  const handleCreate = async () => {
    try {
      const { data } = await createTransfer({
        variables: {
          documentIds:
            selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
          folderIds:
            selectedFolderIds.length > 0 ? selectedFolderIds : undefined,
          workspaceId,
          input: {
            expiryDays: getExpiryDays(options.expiration),
            recipientEmail: options.recipientEmail || undefined,
            message: options.message || undefined,
            notifyOnDownload: options.notifyOnDownload,
            passwordProtected: options.passwordProtected,
            password: options.passwordProtected
              ? options.password
              : undefined,
          },
        },
      });

      if (!data?.createFileTransferFromSharedDocuments) {
        throw new Error("Erreur serveur lors de la création du transfert");
      }

      const result = data.createFileTransferFromSharedDocuments;
      toast.success("Transfert créé avec succès");

      // Reset options
      setOptions({
        expiration: "7d",
        recipientEmail: "",
        message: "",
        notifyOnDownload: false,
        passwordProtected: false,
        password: "",
      });

      onTransferCreated?.(result.shareLink, result.accessKey);
    } catch (error) {
      console.error("Erreur création transfert:", error);
      toast.error(
        error.message || "Erreur lors de la création du transfert"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="size-5" />
            Transférer des fichiers
          </DialogTitle>
          <DialogDescription>
            Créez un lien de transfert partageable avec QR code pour les
            fichiers sélectionnés.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Résumé de la sélection */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">Sélection</p>
            {selectionSummary.folders.length > 0 && (
              <div className="space-y-1">
                {selectionSummary.folders.map((f) => (
                  <div
                    key={f.id || f._id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <FolderClosed className="size-3.5 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                ))}
              </div>
            )}
            {selectionSummary.docs.length > 0 && (
              <div className="space-y-1">
                {selectionSummary.docs.slice(0, 5).map((d) => (
                  <div
                    key={d.id || d._id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <FileText className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {d.name || d.originalName}
                    </span>
                    <span className="ml-auto text-xs shrink-0">
                      {formatFileSize(d.fileSize || d.size)}
                    </span>
                  </div>
                ))}
                {selectionSummary.docs.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    + {selectionSummary.docs.length - 5} autre
                    {selectionSummary.docs.length - 5 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t text-xs text-muted-foreground">
              <span>
                {selectionSummary.docCount + selectionSummary.docsInFolders}{" "}
                fichier
                {selectionSummary.docCount + selectionSummary.docsInFolders > 1
                  ? "s"
                  : ""}
                {selectionSummary.folderCount > 0 &&
                  ` · ${selectionSummary.folderCount} dossier${selectionSummary.folderCount > 1 ? "s" : ""}`}
              </span>
              {selectionSummary.totalSize > 0 && (
                <span>{formatFileSize(selectionSummary.totalSize)}</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Durée de validité */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">
                Durée de validité
              </Label>
            </div>
            <Select
              value={options.expiration}
              onValueChange={(value) =>
                handleOptionChange("expiration", value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="7 jours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 heures</SelectItem>
                <SelectItem value="48h">48 heures</SelectItem>
                <SelectItem value="7d">7 jours</SelectItem>
                <SelectItem value="30d">30 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Email destinataire */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">
                Email du destinataire
              </Label>
            </div>
            <Input
              type="email"
              placeholder="email@exemple.com (optionnel)"
              value={options.recipientEmail}
              onChange={(e) =>
                handleOptionChange("recipientEmail", e.target.value)
              }
              className="h-9"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Message</Label>
            </div>
            <Textarea
              placeholder="Ajouter un message (optionnel)"
              value={options.message}
              onChange={(e) =>
                handleOptionChange("message", e.target.value)
              }
              className="resize-none h-20"
            />
          </div>

          <Separator />

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-normal">
                Notifier au téléchargement
              </Label>
              <p className="text-xs text-muted-foreground">
                Recevoir un email quand un fichier est téléchargé
              </p>
            </div>
            <Switch
              checked={options.notifyOnDownload}
              onCheckedChange={(checked) =>
                handleOptionChange("notifyOnDownload", checked)
              }
              className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
            />
          </div>

          <Separator />

          {/* Protection par mot de passe */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Lock className="size-4 text-muted-foreground" />
                  <Label className="text-sm font-normal">
                    Mot de passe
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Protection supplémentaire
                </p>
              </div>
              <Switch
                checked={options.passwordProtected}
                onCheckedChange={(checked) =>
                  handleOptionChange("passwordProtected", checked)
                }
                className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
              />
            </div>
            {options.passwordProtected && (
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez un mot de passe"
                  value={options.password}
                  onChange={(e) =>
                    handleOptionChange("password", e.target.value)
                  }
                  className="h-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="bg-[#5a50ff] hover:bg-[#5a50ff]/90"
          >
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin mr-2" />
                Création en cours...
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Créer le transfert
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
