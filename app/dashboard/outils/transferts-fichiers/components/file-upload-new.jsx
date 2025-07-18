"use client";

import React, { useState, useRef } from "react";
import { useFileTransfer } from "../hooks/useFileTransfer";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import { useUser } from "@/src/lib/auth/hooks";
import StripeConnectOnboarding from "@/src/components/stripe/StripeConnectOnboarding";
import {
  AlertCircleIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileUpIcon,
  HeadphonesIcon,
  ImageIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import {
  IconClock,
  IconMail,
  IconShield,
  IconSend,
  IconCreditCard,
} from "@tabler/icons-react";

// Format bytes utility function
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getFileIcon = (file) => {
  const fileType = file.type;
  const fileName = file.name;

  if (
    fileType.includes("pdf") ||
    fileName.endsWith(".pdf") ||
    fileType.includes("word") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".docx")
  ) {
    return <FileTextIcon className="size-4 opacity-60" />;
  } else if (
    fileType.includes("zip") ||
    fileType.includes("archive") ||
    fileName.endsWith(".zip") ||
    fileName.endsWith(".rar")
  ) {
    return <FileArchiveIcon className="size-4 opacity-60" />;
  } else if (
    fileType.includes("excel") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx")
  ) {
    return <FileSpreadsheetIcon className="size-4 opacity-60" />;
  } else if (fileType.includes("video/")) {
    return <VideoIcon className="size-4 opacity-60" />;
  } else if (fileType.includes("audio/")) {
    return <HeadphonesIcon className="size-4 opacity-60" />;
  } else if (fileType.startsWith("image/")) {
    return <ImageIcon className="size-4 opacity-60" />;
  }
  return <FileIcon className="size-4 opacity-60" />;
};

export default function FileUploadNew() {
  const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
  const maxFiles = 10;

  // Hooks
  const { user } = useUser();
  const {
    isConnected: stripeConnected,
    canReceivePayments,
    isLoading: stripeLoading
  } = useStripeConnect(user?.id);

  // Use the file transfer hook
  const {
    selectedFiles,
    transferOptions,
    isUploading,
    uploadProgress,
    transferResult,
    addFiles,
    removeFile,
    updateTransferOptions,
    createTransfer,
    formatFileSize,
  } = useFileTransfer();

  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `Le fichier "${file.name}" est trop volumineux (max ${formatFileSize(maxSize)})`;
    }
    return null;
  };

  const handleFilesAdd = (newFiles) => {
    const validFiles = [];
    const newErrors = [];

    for (const file of newFiles) {
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} fichiers autorisés`);
        break;
      }

      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      addFiles(validFiles);
    }
    setErrors(newErrors);
  };

  const clearFiles = () => {
    selectedFiles.forEach((fileObj) => removeFile(fileObj.id));
    setErrors([]);
  };

  const handleOptionChange = (field, value) => {
    updateTransferOptions({ [field]: value });
  };

  const handleCreateTransfer = async () => {
    try {
      await createTransfer();
    } catch (error) {
      console.error("Error creating transfer:", error);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFilesAdd(Array.from(event.target.files));
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdd(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      className={`${selectedFiles.length > 0 ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "flex flex-col"}`}
    >
      {/* Upload Section */}
      <div className="flex flex-col gap-2">
        {/* Drop area */}
        <div
          role="button"
          onClick={openFileDialog}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-dragging={isDragging || undefined}
          className="border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Upload files"
          />

          <div className="flex flex-col items-center justify-center text-center">
            <div
              className="bg-background mb-2 flex size-16 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <FileUpIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">
              Glissez-déposez vos fichiers ou cliquez pour sélectionner
            </p>
            <p className="text-muted-foreground mb-2 text-xs">
              Taille maximale : 10GB par fichier • Tous formats acceptés
            </p>
            <div className="text-muted-foreground/70 flex flex-wrap justify-center gap-1 text-xs">
              <span>Tous les fichiers</span>
              <span>∙</span>
              <span>Max {maxFiles} fichiers</span>
              <span>∙</span>
              <span>Up to {formatFileSize(maxSize)}</span>
            </div>
          </div>
        </div>

        {errors.length > 0 && (
          <div
            className="text-destructive flex items-center gap-1 text-xs"
            role="alert"
          >
            <AlertCircleIcon className="size-3 shrink-0" />
            <span>{errors[0]}</span>
          </div>
        )}

        {/* File list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                    {getFileIcon(fileItem.file)}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-[13px] font-medium">
                      {fileItem.file.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                  </div>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                  onClick={() => removeFile(fileItem.id)}
                  aria-label="Remove file"
                >
                  <XIcon className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}

            {/* Remove all files button */}
            {selectedFiles.length > 1 && (
              <div>
                <Button size="sm" variant="outline" onClick={clearFiles}>
                  Supprimer tous les fichiers
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options Panel - Only show when files are selected */}
      {selectedFiles.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Options d'envoi</h3>
            <Button
              onClick={handleCreateTransfer}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <IconSend className="size-4" />
              {isUploading ? "Création..." : "Créer le transfert"}
            </Button>
          </div>

          {/* Expiration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconClock className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Durée de validité</Label>
            </div>
            <Select
              value={transferOptions.expiration}
              onValueChange={(value) => handleOptionChange("expiration", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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

          {/* Email */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconMail className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                Email du destinataire
              </Label>
            </div>
            <Input
              type="email"
              placeholder="destinataire@exemple.com"
              value={transferOptions.recipientEmail}
              onChange={(e) =>
                handleOptionChange("recipientEmail", e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Optionnel - Le destinataire recevra le lien par email
            </p>
          </div>

          <Separator />

          {/* Payment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconCreditCard className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Paiement requis</Label>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Demander un paiement</Label>
                  {!stripeConnected && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                      Stripe requis
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stripeConnected 
                    ? "Exiger un paiement avant le téléchargement"
                    : "Connectez Stripe Connect pour activer les paiements"
                  }
                </p>
              </div>
              <Switch
                checked={transferOptions.requirePayment}
                onCheckedChange={(checked) => {
                  if (checked && !stripeConnected) {
                    setShowStripeOnboarding(true);
                    return;
                  }
                  handleOptionChange("requirePayment", checked);
                }}
                disabled={!stripeConnected && transferOptions.requirePayment}
              />
            </div>

            {transferOptions.requirePayment && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Montant</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={transferOptions.paymentAmount}
                      onChange={(e) =>
                        handleOptionChange(
                          "paymentAmount",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Devise</Label>
                    <Select
                      value={transferOptions.currency}
                      onValueChange={(value) =>
                        handleOptionChange("currency", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {stripeConnected && !canReceivePayments && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 font-medium">
                      ⚠️ Configuration Stripe incomplète
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Finalisez votre configuration Stripe pour recevoir des paiements.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStripeOnboarding(true)}
                      className="mt-2 text-xs h-7 bg-amber-100 hover:bg-amber-200 border-amber-300"
                    >
                      Finaliser la configuration
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Le paiement sera traité via Stripe. Une commission de 2.9% +
                  0.30€ s'applique.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Security */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconShield className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Sécurité</Label>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm">Protection par mot de passe</Label>
                <p className="text-xs text-muted-foreground">
                  Ajouter une couche de sécurité supplémentaire
                </p>
              </div>
              <Switch
                checked={transferOptions.passwordProtected}
                onCheckedChange={(checked) =>
                  handleOptionChange("passwordProtected", checked)
                }
              />
            </div>

            {transferOptions.passwordProtected && (
              <Input
                type="password"
                placeholder="Mot de passe"
                value={transferOptions.password}
                onChange={(e) => handleOptionChange("password", e.target.value)}
              />
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm">
                  Notification de téléchargement
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir un email lors du téléchargement
                </p>
              </div>
              <Switch
                checked={transferOptions.notifyOnDownload}
                onCheckedChange={(checked) =>
                  handleOptionChange("notifyOnDownload", checked)
                }
              />
            </div>
          </div>

          <Separator />

          {/* Custom Message */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Message personnalisé</Label>
            <Textarea
              placeholder="Ajoutez un message pour le destinataire..."
              value={transferOptions.customMessage}
              onChange={(e) =>
                handleOptionChange("customMessage", e.target.value)
              }
              rows={3}
            />
          </div>
        </div>
      )}
      
      {/* Modal Stripe Connect Onboarding */}
      <StripeConnectOnboarding
        isOpen={showStripeOnboarding}
        onClose={() => setShowStripeOnboarding(false)}
        userId={user?.id}
        userEmail={user?.email}
        onSuccess={() => {
          setShowStripeOnboarding(false);
          // Optionnel: afficher une notification de succès
        }}
      />
    </div>
  );
}
