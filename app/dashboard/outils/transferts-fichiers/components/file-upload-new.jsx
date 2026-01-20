"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useFileTransferR2Multipart } from "../hooks/useFileTransferR2Multipart";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import StripeConnectOnboarding from "@/src/components/stripe/StripeConnectOnboarding";
import { useUser } from "@/src/lib/auth/hooks";
import { SettingsModal } from "@/src/components/settings-modal";
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
  LoaderCircle,
  CloudUpload,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { FileUploadItem } from "./file-upload-item";

import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import CircularProgress from "@/src/components/ui/circular-progress";
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
import { Callout } from "@/src/components/ui/callout";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  IconClock,
  IconShield,
  IconCreditCard,
  IconPlus,
  IconBell,
  IconLock,
  IconEye,
  IconDroplet,
} from "@tabler/icons-react";
import { isImageFile, countImageFiles } from "../utils/watermark";

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

export default function FileUploadNew({
  onTransferCreated,
  refetchTransfers,
  onUploadingChange,
}) {
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  const maxFiles = 10;

  // Timer pour l'upload
  const [uploadTime, setUploadTime] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const uploadStartTimeRef = useRef(0); // Temps de début de l'upload
  const speedHistoryRef = useRef([]); // Historique des vitesses pour moyenne mobile

  // Hooks
  const { session: user } = useUser();
  const {
    isConnected: stripeConnected,
    canReceivePayments,
    isLoading: stripeLoading,
    stripeAccount,
    checkAndUpdateAccountStatus,
    refetchStatus,
  } = useStripeConnect(user?.user?.id);

  // Utilisation directe de R2 comme stockage unique
  const {
    selectedFiles,
    isUploading,
    uploadProgress,
    transferResult,
    addFiles,
    removeFile,
    createTransfer,
    cancelTransfer,
  } = useFileTransferR2Multipart(refetchTransfers);

  // Options de transfert
  const [transferOptions, setTransferOptions] = useState({
    expiryDays: 7,
    expiration: "7d", // Valeur par défaut pour le select
    isPaymentRequired: false,
    paymentAmount: 0,
    paymentCurrency: "EUR",
    recipientEmail: "",
    message: "",
    // Nouvelles options
    notifyOnDownload: false,
    notifyBeforeExpiry: false,
    passwordProtected: false,
    password: "",
    allowPreview: true,
    // Options filigrane
    applyWatermark: false,
    watermarkText: "CONFIDENTIEL",
    watermarkPosition: "diagonal", // 'center', 'bottom-right', 'diagonal', 'tile'
  });

  // Compter le nombre d'images dans les fichiers sélectionnés
  const imageCount = useMemo(() => {
    return countImageFiles(selectedFiles);
  }, [selectedFiles]);

  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef(null);

  // Notifier le parent quand isUploading change
  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  // Gérer le timer d'upload
  useEffect(() => {
    if (isUploading) {
      setUploadTime(0);
      setEstimatedTimeLeft(0);
      uploadStartTimeRef.current = Date.now();
      speedHistoryRef.current = [];

      timerRef.current = setInterval(() => {
        setUploadTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setEstimatedTimeLeft(0);
      speedHistoryRef.current = [];
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isUploading]);

  // Calculer le temps restant estimé avec moyenne mobile + calcul depuis le début
  useEffect(() => {
    if (isUploading && uploadProgress > 0 && uploadProgress < 100) {
      const elapsedTime = (Date.now() - uploadStartTimeRef.current) / 1000; // en secondes

      if (elapsedTime > 0) {
        // Méthode 1: Vitesse moyenne depuis le début (stable)
        const averageSpeed = uploadProgress / elapsedTime; // % par seconde

        // Ajouter à l'historique pour moyenne mobile (garder les 10 dernières mesures)
        speedHistoryRef.current.push(averageSpeed);
        if (speedHistoryRef.current.length > 10) {
          speedHistoryRef.current.shift();
        }

        // Méthode 2: Moyenne mobile exponentielle pour lisser les variations
        // Combine la stabilité de la moyenne globale avec la réactivité aux changements
        const weights = speedHistoryRef.current.map((_, i) => Math.pow(1.5, i)); // Poids exponentiels
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const weightedSpeed =
          speedHistoryRef.current.reduce(
            (sum, speed, i) => sum + speed * weights[i],
            0
          ) / totalWeight;

        // Utiliser un mix: 70% moyenne globale + 30% moyenne mobile pour stabilité
        const finalSpeed = averageSpeed * 0.7 + weightedSpeed * 0.3;

        // Temps restant estimé
        const remainingProgress = 100 - uploadProgress;
        const estimatedSeconds = Math.ceil(remainingProgress / finalSpeed);

        // Limiter les valeurs aberrantes (max 24h, min 1s)
        const clampedSeconds = Math.max(1, Math.min(estimatedSeconds, 86400));

        setEstimatedTimeLeft(clampedSeconds);
      }
    }
  }, [uploadProgress, isUploading]);

  // Formater le temps en mm:ss ou "Quelques secondes"
  const formatTime = (seconds) => {
    if (seconds < 5) return "Quelques secondes";
    if (seconds < 60) return `${seconds}s`;

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}min`;
    return `${mins}min ${secs}s`;
  };

  // Sauvegarder les fichiers sélectionnés avant la redirection Stripe
  useEffect(() => {
    if (selectedFiles.length > 0) {
      const filesData = selectedFiles.map((fileObj) => ({
        id: fileObj.id,
        name: fileObj.file.name,
        size: fileObj.file.size,
        type: fileObj.file.type,
        lastModified: fileObj.file.lastModified,
      }));
      sessionStorage.setItem(
        "stripe_redirect_files",
        JSON.stringify(filesData)
      );
    }
  }, [selectedFiles]);

  // Restaurer les fichiers au retour de Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("stripe_success") === "true") {
      const savedFilesData = sessionStorage.getItem("stripe_redirect_files");
      if (savedFilesData) {
        try {
          const filesData = JSON.parse(savedFilesData);
          // Créer des objets File à partir des données sauvegardées
          const restoredFiles = filesData.map((fileData) => {
            // Créer un File object fictif avec les métadonnées
            const file = new File([""], fileData.name, {
              type: fileData.type,
              lastModified: fileData.lastModified,
            });
            // Ajouter les propriétés de taille (non modifiable sur File)
            Object.defineProperty(file, "size", {
              value: fileData.size,
              writable: false,
            });
            return file;
          });

          // Ajouter les fichiers restaurés
          if (restoredFiles.length > 0) {
            addFiles(restoredFiles);
          }

          // Nettoyer le sessionStorage
          sessionStorage.removeItem("stripe_redirect_files");

          // Nettoyer l'URL
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } catch (error) {
          console.error("Erreur lors de la restauration des fichiers:", error);
          sessionStorage.removeItem("stripe_redirect_files");
        }
      }
    }
  }, [addFiles]);

  // Vérifier automatiquement le statut Stripe au retour de redirection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    // Vérifier si on vient de Stripe
    const isFromStripe = urlParams.get("stripe_success") === "true";

    if (isFromStripe && user?.user?.id) {
      console.log("🔄 Retour de Stripe détecté, vérification du statut...");

      const timer = setTimeout(async () => {
        try {
          // Récupérer l'accountId depuis la base de données
          const response = await fetch(
            `/api/stripe/connect/account?userId=${user.user.id}`
          );
          const accountData = await response.json();

          if (accountData.success && accountData.accountId) {
            console.log("📋 Account ID trouvé:", accountData.accountId);

            // Vérifier et mettre à jour le statut du compte
            const statusResponse = await fetch("/api/stripe/connect/status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accountId: accountData.accountId,
                userId: user.user.id,
              }),
            });

            const statusData = await statusResponse.json();
            console.log("✅ Statut mis à jour:", statusData);

            // Refetch les données pour s'assurer qu'elles sont à jour
            await refetchStatus();

            // Nettoyer l'URL
            window.history.replaceState({}, "", window.location.pathname);
          }
        } catch (error) {
          console.error(
            "❌ Erreur lors de la vérification automatique:",
            error
          );
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    user?.user?.id,
    stripeAccount?.accountId,
    checkAndUpdateAccountStatus,
    refetchStatus,
  ]);

  // Fonction pour mettre à jour les options de transfert
  const updateTransferOptions = (updates) => {
    setTransferOptions((prev) => ({ ...prev, ...updates }));
  };

  // Fonction pour formater la taille des fichiers
  const formatFileSize = (bytes) => formatBytes(bytes);

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
      // Convertir la durée d'expiration en jours
      const expiryDays = (() => {
        switch (transferOptions.expiration) {
          case "24h":
            return 1;
          case "48h":
            return 2;
          case "7d":
            return 7;
          case "30d":
            return 30;
          default:
            return 7; // Par défaut 7 jours
        }
      })();

      const transferOptionsWithDays = {
        ...transferOptions,
        expiryDays,
      };

      const result = await createTransfer(transferOptionsWithDays);

      // Rediriger vers l'onglet "Mes transferts" après création réussie
      if (result && result.success) {
        const { shareLink, accessKey } = result;

        // Appeler le callback pour changer d'onglet
        if (onTransferCreated) {
          onTransferCreated(shareLink, accessKey);
        } else {
          // Fallback si pas de callback
          window.location.href = `/dashboard/outils/transferts-fichiers?shareLink=${shareLink}&accessKey=${accessKey}`;
        }
      }
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1 min-h-0">
      {/* Upload Section - Fixe */}
      <div className="flex flex-col gap-2 h-full overflow-hidden">
        {/* Drop area ou Progress */}
        {isUploading ? (
          <div className="border-input flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed p-4 animate-in fade-in duration-300">
            <div className="animate-in zoom-in duration-500">
              <CircularProgress
                value={Math.round(uploadProgress)}
                size={160}
                strokeWidth={12}
                showLabel
                labelClassName="text-2xl font-bold"
                renderLabel={(progress) => `${Math.round(progress)}%`}
                className="stroke-[#5a50ff]/25"
                progressClassName="stroke-[#5a50ff] drop-shadow-lg"
              />
            </div>
            <p className="mt-6 text-sm font-medium text-[#5a50ff] animate-pulse">
              Transfert de fichier en cours...
            </p>
            <p className="text-muted-foreground mt-1 text-xs animate-in fade-in duration-700">
              Veuillez patienter pendant l'envoi de vos fichiers
            </p>
            {estimatedTimeLeft > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/70 animate-in fade-in duration-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-[#5a50ff] animate-pulse" />
                  <span>
                    Temps restant estimé :{" "}
                    <span className="font-medium text-muted-foreground">
                      {formatTime(estimatedTimeLeft)}
                    </span>
                  </span>
                </div>
              </div>
            )}
            {/* Bouton d'annulation */}
            <Button
              variant="outline"
              size="sm"
              onClick={cancelTransfer}
              className="mt-4 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Annuler le transfert
            </Button>
          </div>
        ) : (
          <div
            role="button"
            onClick={openFileDialog}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-dragging={isDragging || undefined}
            className="border-input hover:bg-accent/50 data-[dragging=true]:border-[#5a50ff]/60 data-[dragging=true]:bg-[#5a50ff]/[0.02] has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-60 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-all duration-300 ease-in-out has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px] cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="sr-only"
              aria-label="Upload files"
            />

            <div
              className={`flex flex-col items-center justify-center text-center transition-all duration-300 ease-in-out ${isDragging ? "scale-[1.02]" : "scale-100"}`}
            >
              <div
                className={`bg-background mb-2 flex size-16 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-in-out ${isDragging ? "border-[#5a50ff]/40 bg-[#5a50ff]/5" : ""}`}
                aria-hidden="true"
              >
                <FileUpIcon
                  className={`size-4 transition-all duration-300 ease-in-out ${isDragging ? "text-[#5a50ff] opacity-100" : "opacity-60"}`}
                />
              </div>
              <p
                className={`mb-1.5 text-sm font-medium transition-all duration-300 ease-in-out ${isDragging ? "text-[#5a50ff]/90" : ""}`}
              >
                {isDragging
                  ? "Déposez vos fichiers ici"
                  : "Glissez-déposez vos fichiers ou cliquez pour sélectionner"}
              </p>
              <p
                className={`text-muted-foreground mb-2 text-xs transition-opacity duration-300 ${isDragging ? "opacity-50" : "opacity-100"}`}
              >
                Taille maximale : 5GB par fichier • Tous formats acceptés
              </p>
              <div
                className={`text-muted-foreground/70 flex flex-wrap justify-center gap-1 text-xs transition-opacity duration-300 ${isDragging ? "opacity-30" : "opacity-100"}`}
              >
                <span>Tous les fichiers</span>
                <span>∙</span>
                <span>Max {maxFiles} fichiers</span>
                <span>∙</span>
                <span>Up to {formatFileSize(maxSize)}</span>
              </div>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div
            className="text-destructive flex items-center gap-1 text-xs"
            role="alert"
          >
            <AlertCircleIcon className="size-3 shrink-0" />
            <span>{errors[0]}</span>
          </div>
        )}

        {/* Security Info - Seulement quand pas de fichiers */}
        {selectedFiles.length === 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>Chiffrement SSL</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>Suppression auto.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                <span>Lien sécurisé</span>
              </div>
            </div>
          </div>
        )}

        {/* File list */}
        {selectedFiles.length > 0 && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Liste des fichiers avec scroll */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
              {selectedFiles.map((fileItem) => (
                <FileUploadItem
                  key={fileItem.id}
                  file={fileItem.file}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  isCompleted={uploadProgress === 100}
                  onRemove={() => removeFile(fileItem.id)}
                />
              ))}
            </div>

            {/* Remove all files button + Total size */}
            {selectedFiles.length > 1 && !isUploading && (
              <div className="flex-shrink-0 mt-3 pt-3 bg-background border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{selectedFiles.length} fichiers sélectionnés</span>
                    <span>
                      Total :{" "}
                      {formatFileSize(
                        selectedFiles.reduce((acc, f) => acc + f.file.size, 0)
                      )}
                    </span>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          onClick={clearFiles}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Supprimer tous les fichiers</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Options Panel */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header fixe */}
        <div className="flex items-center justify-between pb-4 flex-shrink-0">
          <h3 className="text-lg font-medium">Options d'envoi</h3>
        </div>

        {/* Options scrollables */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2 min-h-0">
          {/* Expiration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <IconClock className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Durée de validité</Label>
            </div>
            <Select
              value={transferOptions.expiration}
              onValueChange={(value) => handleOptionChange("expiration", value)}
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

          {/* Payment */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconCreditCard className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Paiement requis</Label>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-normal">
                    Demander un paiement
                  </Label>
                  {!stripeConnected && !transferOptions.applyWatermark && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettingsModalOpen(true)}
                      className="text-xs h-6 px-2 border-[#5b4fff]/20 text-[#5b4fff] hover:bg-[#5b4fff]/5"
                    >
                      Connecter Stripe
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transferOptions.applyWatermark
                    ? "Non disponible avec le filigrane activé"
                    : stripeConnected
                      ? "Exiger un paiement avant le téléchargement"
                      : "Connectez Stripe Connect pour activer les paiements"}
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
                disabled={!user || transferOptions.applyWatermark}
                className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
              />
            </div>

            {transferOptions.requirePayment && (
              <div className="space-y-4 pt-4 border-t">
                <div className="*:not-first:mt-2">
                  <Label className="text-sm font-normal">Montant</Label>
                  <div className="relative">
                    <Input
                      className="peer ps-6 pe-12 pr-8"
                      placeholder="1.00"
                      type="text"
                      value={
                        transferOptions.paymentAmount === 0
                          ? ""
                          : transferOptions.paymentAmount
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permettre seulement les chiffres, points et virgules
                        if (value === "" || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
                          // Remplacer la virgule par un point pour le parsing
                          const normalizedValue = value.replace(",", ".");
                          handleOptionChange(
                            "paymentAmount",
                            normalizedValue === "" ? 0 : normalizedValue
                          );
                        }
                      }}
                    />
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm peer-disabled:opacity-50">
                      €
                    </span>
                    <span className="text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 text-sm peer-disabled:opacity-50">
                      EUR
                    </span>
                  </div>
                </div>
                {/* <div className="space-y-2">
                  <Label className="text-sm font-normal">Montant</Label>
                  <div className="relative">
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
                      className="pr-8"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-muted-foreground text-sm">€</span>
                    </div>
                  </div>
                </div> */}
                {stripeConnected && !canReceivePayments && (
                  <Callout type="info" noMargin>
                    <h4 className="text-sm font-medium mb-2">
                      Configuration Stripe incomplète
                    </h4>
                    <p className="text-xs mb-3">
                      Finalisez votre configuration Stripe pour recevoir des
                      paiements.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStripeOnboarding(true)}
                      className="text-xs h-7"
                    >
                      Finaliser la configuration
                    </Button>
                  </Callout>
                )}
                <p className="text-xs text-muted-foreground">
                  Le paiement sera traité via Stripe. Une commission de 2.9% +
                  0.30€ s'applique.
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconBell className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Notifications</Label>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-normal">
                  Notifier en cas de téléchargement
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir un email lorsqu'un fichier est téléchargé
                </p>
              </div>
              <Switch
                checked={transferOptions.notifyOnDownload}
                onCheckedChange={(checked) =>
                  handleOptionChange("notifyOnDownload", checked)
                }
                className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-normal">
                  Rappel avant expiration
                </Label>
                <p className="text-xs text-muted-foreground">
                  Recevoir un email 2 jours avant l'expiration
                </p>
              </div>
              <Switch
                checked={transferOptions.notifyBeforeExpiry}
                onCheckedChange={(checked) =>
                  handleOptionChange("notifyBeforeExpiry", checked)
                }
                className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
              />
            </div>
          </div>

          <Separator />

          {/* Protection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconLock className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Protection</Label>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-normal">
                  Protection par mot de passe
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ajouter une couche de sécurité supplémentaire
                </p>
              </div>
              <Switch
                checked={transferOptions.passwordProtected}
                onCheckedChange={(checked) =>
                  handleOptionChange("passwordProtected", checked)
                }
                className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
              />
            </div>

            {transferOptions.passwordProtected && (
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez un mot de passe"
                  value={transferOptions.password}
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

          <Separator />

          {/* Prévisualisation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconEye className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Prévisualisation</Label>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-normal">
                  Autoriser la prévisualisation
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permettre de visualiser les fichiers avant téléchargement
                </p>
              </div>
              <Switch
                checked={transferOptions.allowPreview}
                onCheckedChange={(checked) =>
                  handleOptionChange("allowPreview", checked)
                }
                className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
              />
            </div>
          </div>

          <Separator />

          {/* Filigrane */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconDroplet className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Filigrane</Label>
              {imageCount > 0 && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {imageCount} image{imageCount > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-normal">
                  Appliquer un filigrane
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ajouter un filigrane sur les images avant l'envoi
                </p>
              </div>
              <Switch
                checked={transferOptions.applyWatermark}
                onCheckedChange={(checked) => {
                  handleOptionChange("applyWatermark", checked);
                  // Désactiver le paiement si filigrane activé
                  if (checked && transferOptions.requirePayment) {
                    handleOptionChange("requirePayment", false);
                    handleOptionChange("paymentAmount", 0);
                  }
                }}
                disabled={imageCount === 0}
                className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
              />
            </div>

            {transferOptions.applyWatermark && imageCount > 0 && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Texte du filigrane
                  </Label>
                  <Input
                    type="text"
                    placeholder="CONFIDENTIEL"
                    value={transferOptions.watermarkText}
                    onChange={(e) =>
                      handleOptionChange("watermarkText", e.target.value)
                    }
                    className="h-9"
                    maxLength={30}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Position
                  </Label>
                  <Select
                    value={transferOptions.watermarkPosition}
                    onValueChange={(value) =>
                      handleOptionChange("watermarkPosition", value)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Position du filigrane" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagonal">
                        Diagonale (centré)
                      </SelectItem>
                      <SelectItem value="center">Centre</SelectItem>
                      <SelectItem value="bottom-right">Bas droite</SelectItem>
                      <SelectItem value="tile">Mosaïque (répété)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Le filigrane sera appliqué sur {imageCount} image
                  {imageCount > 1 ? "s" : ""}.
                </p>
              </div>
            )}

            {imageCount === 0 && selectedFiles.length > 0 && (
              <p className="text-xs text-muted-foreground italic">
                Aucune image détectée dans les fichiers sélectionnés.
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-normal">Message personnalisé</Label>
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

        {/* Create Transfer Button - Fixe en bas */}
        <div className="flex justify-end mt-2 pt-3 border-t bg-background flex-shrink-0">
          <ButtonGroup>
            <Button
              onClick={handleCreateTransfer}
              disabled={isUploading}
              className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              {isUploading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>Transférer vos fichiers</>
              )}
            </Button>
            <ButtonGroupSeparator />
            <Button
              onClick={handleCreateTransfer}
              disabled={isUploading}
              size="icon"
              className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
              <CloudUpload size={16} aria-hidden="true" />
            </Button>
          </ButtonGroup>
        </div>
      </div>
      {/* Modal Stripe Connect Onboarding */}
      <StripeConnectOnboarding
        isOpen={showStripeOnboarding}
        onClose={() => setShowStripeOnboarding(false)}
        userId={user?.user?.id}
        userEmail={user?.user?.email}
        onSuccess={() => {
          setShowStripeOnboarding(false);
          // Optionnel: afficher une notification de succès
        }}
      />
      {/* Modal Settings pour configurer Stripe Connect */}
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab="user-info"
      />
    </div>
  );
}
