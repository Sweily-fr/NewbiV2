"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useFileTransferR2Multipart } from "../hooks/useFileTransferR2Multipart";
import { usePaymentConnections } from "@/src/hooks/usePaymentConnections";
import { useWorkspaceFeatures } from "@/src/hooks/useWorkspaceFeatures";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { PaypalConnectDialog } from "@/src/components/payments/paypal-connect-dialog";
import { BankDetailsDialog } from "@/src/components/bank-details-dialog";
import { toast } from "@/src/components/ui/sonner";
import {
  TransferPaymentOptions,
  getTransferPaymentError,
  parsePaymentAmount,
} from "./transfer-payment-options";
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
  Trash2,
  Eye,
  EyeOff,
  CornerDownLeft,
  Clock,
  Shield,
  Plus,
  Bell,
  Lock,
  Droplet,
  Mail,
} from "lucide-react";
import { FileUploadItem } from "./file-upload-item";

import { Button } from "@/src/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { isImageFile, countWatermarkableFiles } from "../utils/watermark";
import { capture } from "@/src/lib/analytics";

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
  // Pas de limite sur le nombre de fichiers (seule la taille totale est bornée)

  // Timer pour l'upload
  const [uploadTime, setUploadTime] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const uploadStartTimeRef = useRef(0); // Temps de début de l'upload
  const speedHistoryRef = useRef([]); // Historique des vitesses pour moyenne mobile

  // Paiement demandé au destinataire : accès anticipé (transferPayments),
  // moyens d'encaissement de l'espace (compte Stripe du vendeur, PayPal,
  // IBAN pour les virements)
  const { isEnabled: isFeatureEnabled } = useWorkspaceFeatures();
  const canRequestPayment = isFeatureEnabled("transferPayments");
  const payment = usePaymentConnections({ skip: !canRequestPayment });
  const { activeOrganization } = useWorkspace();
  const { canDo, isReady: permissionsReady } = useMyPermissions();
  // Connecter Stripe ou PayPal : « Gérer les applications »
  const canManageConnections =
    !permissionsReady || canDo("integrations", "manage");
  const [paypalDialogOpen, setPaypalDialogOpen] = useState(false);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);

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
    // Moyens proposés au destinataire : stripe | paypal | bank_transfer
    paymentMethods: [],
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

  // Paiement demandé : incompatible avec le filigrane
  const paymentRequested =
    canRequestPayment && Boolean(transferOptions.isPaymentRequired);

  // Compter le nombre de fichiers supportés pour le filigrane (images + PDFs)
  const watermarkableCount = useMemo(() => {
    return countWatermarkableFiles(selectedFiles);
  }, [selectedFiles]);

  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);
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
            0,
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

  // Moyen de paiement devenu disponible pendant la saisie (PayPal ou IBAN
  // ajouté ici, Stripe connecté dans l'onglet ouvert à côté) : il est
  // proposé d'office au destinataire
  const previousAvailableRef = useRef(null);
  useEffect(() => {
    if (!canRequestPayment || !payment.isReady) return;
    const previous = previousAvailableRef.current;
    previousAvailableRef.current = payment.availableMethods;
    if (!previous) return;
    const added = payment.availableMethods.filter((m) => !previous.includes(m));
    if (added.length === 0) return;
    setTransferOptions((prev) =>
      prev.isPaymentRequired
        ? {
            ...prev,
            paymentMethods: [...new Set([...prev.paymentMethods, ...added])],
          }
        : prev,
    );
  }, [canRequestPayment, payment.isReady, payment.availableMethods]);

  // Retour sur l'onglet après une connexion Stripe ouverte à côté : on relit
  // les moyens de paiement de l'espace
  const refetchPaymentConnections = payment.refetch;
  useEffect(() => {
    if (!canRequestPayment || !transferOptions.isPaymentRequired) return;
    const onFocus = () => refetchPaymentConnections();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [
    canRequestPayment,
    transferOptions.isPaymentRequired,
    refetchPaymentConnections,
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

      // Paiement demandé : vérifié avant l'envoi des fichiers (un refus de
      // l'API après l'envoi obligerait à tout renvoyer)
      const wantsPayment =
        canRequestPayment && Boolean(transferOptions.isPaymentRequired);
      if (wantsPayment) {
        const paymentError = getTransferPaymentError(
          transferOptions,
          payment.availableMethods,
        );
        if (paymentError) {
          toast.error(paymentError);
          return;
        }
      }

      const transferOptionsWithDays = {
        ...transferOptions,
        expiryDays,
        isPaymentRequired: wantsPayment,
        paymentAmount: wantsPayment
          ? parsePaymentAmount(transferOptions.paymentAmount)
          : 0,
        paymentMethods: wantsPayment
          ? transferOptions.paymentMethods.filter((method) =>
              payment.availableMethods.includes(method),
            )
          : [],
      };

      const result = await createTransfer(transferOptionsWithDays);

      // Rediriger vers l'onglet "Mes transferts" après création réussie
      if (result && result.success) {
        const { shareLink, accessKey } = result;
        capture("file_transfer_created", {
          file_count: selectedFiles.length,
          expiry_days: expiryDays,
          is_paid: wantsPayment,
          payment_methods: wantsPayment
            ? transferOptionsWithDays.paymentMethods.join(",")
            : undefined,
          is_password_protected: !!transferOptions.accessKey,
        });

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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full min-h-0">
        {/* Upload Section */}
        <div className="flex flex-col gap-2 min-h-0">
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
                  <span>Nombre de fichiers illimité</span>
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
            <div className="flex-1 flex flex-col min-h-0">
              {/* Liste des fichiers avec scroll */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
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
                          selectedFiles.reduce(
                            (acc, f) => acc + f.file.size,
                            0,
                          ),
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
        <div className="flex flex-col min-h-0">
          {/* Header fixe */}
          <div className="flex items-center justify-between pb-4 flex-shrink-0">
            <h3 className="text-lg font-medium">Options d'envoi</h3>
          </div>

          {/* Options scrollables */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-2 pl-1 pb-2 min-h-0">
            {/* Expiration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <Label className="text-sm font-normal">Durée de validité</Label>
              </div>
              <Select
                value={transferOptions.expiration}
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
                value={transferOptions.recipientEmail}
                onChange={(e) =>
                  handleOptionChange("recipientEmail", e.target.value)
                }
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Si renseigné, le destinataire recevra un email avec le lien de
                téléchargement.
              </p>
            </div>

            {/* Paiement demandé au destinataire (accès anticipé) */}
            {canRequestPayment && (
              <>
                <Separator />
                <TransferPaymentOptions
                  value={transferOptions}
                  onChange={updateTransferOptions}
                  connections={payment.connections}
                  connectionsLoading={payment.loading}
                  availableMethods={payment.availableMethods}
                  watermarkEnabled={Boolean(transferOptions.applyWatermark)}
                  canManageConnections={canManageConnections}
                  isConnectingStripe={payment.isConnectingStripe}
                  onConnectStripe={async () => {
                    try {
                      // Nouvel onglet : les fichiers choisis restent ici
                      await payment.connectStripe({ newTab: true });
                    } catch (error) {
                      toast.error("Impossible de se connecter à Stripe", {
                        description: error?.message || "Veuillez réessayer.",
                      });
                    }
                  }}
                  onOpenStripeDashboard={() =>
                    window.open(
                      "https://dashboard.stripe.com/",
                      "_blank",
                      "noopener",
                    )
                  }
                  onConnectPaypal={() => setPaypalDialogOpen(true)}
                  onAddIban={() => setBankDialogOpen(true)}
                />
              </>
            )}

            <Separator />

            {/* Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
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
                <Lock className="size-4 text-muted-foreground" />
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
                <Eye className="size-4 text-muted-foreground" />
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
                <Droplet className="size-4 text-muted-foreground" />
                <Label className="text-sm font-normal">Filigrane</Label>
                {watermarkableCount > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {watermarkableCount} fichier
                    {watermarkableCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-normal">
                    Appliquer un filigrane
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {paymentRequested
                      ? "Non disponible avec un paiement demandé : votre client doit pouvoir télécharger les originaux."
                      : "Ajouter un filigrane sur les images et PDFs"}
                  </p>
                </div>
                <Switch
                  checked={transferOptions.applyWatermark}
                  onCheckedChange={(checked) =>
                    handleOptionChange("applyWatermark", checked)
                  }
                  // Un transfert filigrané n'est jamais téléchargeable : pas
                  // de paiement possible avec (et inversement)
                  disabled={watermarkableCount === 0 || paymentRequested}
                  className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
                />
              </div>

              {transferOptions.applyWatermark && watermarkableCount > 0 && (
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
                    Le filigrane sera appliqué sur {watermarkableCount} fichier
                    {watermarkableCount > 1 ? "s" : ""}.
                  </p>
                </div>
              )}

              {watermarkableCount === 0 && selectedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Aucune image ou PDF détecté dans les fichiers sélectionnés.
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-normal">
                Message personnalisé
              </Label>
              <Textarea
                placeholder="Ajoutez un message pour le destinataire..."
                value={transferOptions.message}
                onChange={(e) => handleOptionChange("message", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Create Transfer Button - Fixe en bas */}
          <div className="flex justify-end mt-3 pt-3 border-t border-border/40 bg-background flex-shrink-0">
            <Button
              variant="primary"
              onClick={handleCreateTransfer}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  Transférer vos fichiers
                  <kbd className="inline-flex items-center justify-center size-5 rounded bg-white/20 ml-0.5">
                    <CornerDownLeft className="size-3" />
                  </kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Connexion PayPal et IBAN depuis l'option de paiement */}
      {canRequestPayment && (
        <>
          <PaypalConnectDialog
            open={paypalDialogOpen}
            onOpenChange={setPaypalDialogOpen}
            initialEmail={payment.connections.paypal.email || ""}
            onConnect={payment.connectPaypal}
          />
          <BankDetailsDialog
            open={bankDialogOpen}
            onOpenChange={setBankDialogOpen}
            organization={activeOrganization}
            onSuccess={() => payment.refetch()}
          />
        </>
      )}
    </>
  );
}
