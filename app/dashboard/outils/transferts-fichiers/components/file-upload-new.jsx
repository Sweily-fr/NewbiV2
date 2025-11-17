"use client";

import React, { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

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
import { Callout } from "@/src/components/ui/callout";
import {
  IconClock,
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

export default function FileUploadNew({ onTransferCreated, refetchTransfers }) {
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  const maxFiles = 10;

  // Timer pour l'upload
  const [uploadTime, setUploadTime] = useState(0);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const lastProgressRef = useRef(0);
  const lastTimeRef = useRef(0);

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
  });

  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Gérer le timer d'upload et calculer le temps restant
  useEffect(() => {
    if (isUploading) {
      setUploadTime(0);
      lastProgressRef.current = 0;
      lastTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setUploadTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setEstimatedTimeLeft(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isUploading]);

  // Calculer le temps restant estimé basé sur la progression
  useEffect(() => {
    if (isUploading && uploadProgress > 0 && uploadProgress < 100) {
      const currentTime = Date.now();
      const timeDiff = (currentTime - lastTimeRef.current) / 1000; // en secondes
      const progressDiff = uploadProgress - lastProgressRef.current;

      if (progressDiff > 0 && timeDiff > 0) {
        // Vitesse de progression (% par seconde)
        const progressSpeed = progressDiff / timeDiff;

        // Temps restant estimé
        const remainingProgress = 100 - uploadProgress;
        const estimatedSeconds = Math.ceil(remainingProgress / progressSpeed);

        setEstimatedTimeLeft(estimatedSeconds);

        // Mettre à jour les références
        lastProgressRef.current = uploadProgress;
        lastTimeRef.current = currentTime;
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
    <div
      className={`${selectedFiles.length > 0 ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "flex flex-col"}`}
    >
      {/* Upload Section */}
      <div
        className={`flex flex-col gap-2 ${selectedFiles.length > 0 ? "lg:sticky lg:top-6 lg:self-start lg:max-h-screen lg:overflow-y-auto" : ""}`}
      >
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

        {/* File list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            {selectedFiles.map((fileItem) => (
              <div
                key={fileItem.id}
                className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex aspect-square size-10 bg-gray-100 shrink-0 items-center justify-center rounded border">
                    {getFileIcon(fileItem.file)}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-[13px] font-normal">
                      {fileItem.file.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                  </div>
                </div>

                {!isUploading && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                    onClick={() => removeFile(fileItem.id)}
                    aria-label="Remove file"
                  >
                    <XIcon className="size-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))}

            {/* Remove all files button */}
            {selectedFiles.length > 1 && !isUploading && (
              <div>
                <Button
                  className="font-normal cursor-pointer"
                  variant="destructive"
                  onClick={clearFiles}
                >
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
            <h3 className="text-lg font-medium">Options d'envoi</h3>
          </div>

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
                  {!stripeConnected && (
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
                  {stripeConnected
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
                disabled={!user}
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

          {/* Security */}
          {/* <div className="space-y-4">
            <div className="flex items-center gap-2">
              <IconShield className="size-4 text-muted-foreground" />
              <Label className="text-sm font-normal">Sécurité</Label>
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
                <Label className="text-sm font-normal">
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

          {/* Create Transfer Button - Bottom Right */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleCreateTransfer}
              disabled={isUploading}
              className="flex items-center gap-2 font-normal cursor-pointer"
            >
              {isUploading ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <IconSend className="size-4" />
                  Créer le transfert
                </>
              )}
            </Button>
          </div>
        </div>
      )}

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
        initialTab="securite"
      />
    </div>
  );
}
