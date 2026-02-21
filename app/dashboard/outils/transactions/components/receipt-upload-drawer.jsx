"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { Separator } from "@/src/components/ui/separator";
import {
  UploadIcon,
  FileTextIcon,
  FileMinus2,
  FileImage,
  XIcon,
  Info,
  CheckCircleIcon,
  CheckIcon,
  AlertCircleIcon,
  LoaderCircle,
  PlusIcon,
  Landmark,
  Link2,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useOcr } from "@/src/hooks/useOcr";
import { useExpense } from "@/src/hooks/useExpense";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useAutoReconcile } from "@/src/hooks/useAutoReconcile";
import { Callout } from "@/src/components/ui/callout";
import OcrEditableDisplay from "./ocr-editable-display";
import { Badge } from "@/src/components/ui/badge";

export function ReceiptUploadDrawer({ open, onOpenChange, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Hook pour récupérer le workspace
  const { workspaceId } = useRequiredWorkspace();

  // Hook OCR
  const {
    processDocument,
    ocrResult,
    isProcessing,
    error: ocrError,
    resetOcr,
  } = useOcr();

  // Hook pour les dépenses
  const { createExpenseFromOcrData, isCreatingExpense, expenseError } =
    useExpense();

  // Hook pour le rapprochement automatique
  const {
    findMatchingTransaction,
    autoReconcile,
    isSearching,
    isReconciling,
    matchResult,
    reset: resetReconcile,
  } = useAutoReconcile();

  // État pour le mode de rapprochement
  const [reconcileMode, setReconcileMode] = useState("auto"); // "auto" | "manual" | "new"
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  // Gestion du drag & drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  // Gestion de la sélection de fichier
  const handleFileSelect = useCallback(
    (file) => {
      // Validation du fichier
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        console.error("❌ Type de fichier non supporté:", file.type);
        return;
      }

      if (file.size > maxSize) {
        console.error("❌ Fichier trop volumineux:", file.size);
        return;
      }

      setSelectedFile(file);
    },
    []
  );

  // Gestion de l'input file
  const handleFileInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Suppression du fichier
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  // Fermeture du drawer
  const handleClose = useCallback(() => {
    handleRemoveFile();
    resetOcr();
    onOpenChange(false);
  }, [handleRemoveFile, resetOcr, onOpenChange]);

  // Traitement du reçu avec OCR — envoi direct du fichier au backend
  const handleProcessReceipt = useCallback(async () => {
    if (selectedFile) {
      try {
        await processDocument(selectedFile, workspaceId);
      } catch (error) {
        console.error("❌ Erreur OCR:", error);
      }
    } else {
      console.warn("⚠️ Pas de fichier sélectionné");
    }
  }, [selectedFile, processDocument, workspaceId]);

  // Chercher des correspondances après l'OCR
  const searchMatches = useCallback(
    async (financialAnalysis) => {
      let analysis = financialAnalysis;
      if (typeof analysis === "string") {
        try {
          analysis = JSON.parse(analysis);
        } catch (e) {
          console.warn("⚠️ Impossible de parser financialAnalysis");
          return;
        }
      }

      const transactionData = analysis?.transaction_data || {};
      const amount = parseFloat(transactionData.amount) || 0;
      // La date peut être dans transaction_date ou date
      const rawDate = transactionData.transaction_date || transactionData.date;
      const vendor = transactionData.vendor_name;

      // Convertir la date française DD/MM/YY en ISO YYYY-MM-DD
      let date = rawDate;
      if (rawDate) {
        const frenchMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
        if (frenchMatch) {
          const day = frenchMatch[1].padStart(2, "0");
          const month = frenchMatch[2].padStart(2, "0");
          let year = frenchMatch[3];
          if (year.length === 2) year = `20${year}`;
          date = `${year}-${month}-${day}`;
        }
      }

      console.log("🔍 Recherche correspondance:", {
        amount,
        rawDate,
        date,
        vendor,
        transactionData,
      });

      if (amount > 0) {
        await findMatchingTransaction({ amount, date, vendor });
      }
    },
    [findMatchingTransaction]
  );

  // Déclencher automatiquement la recherche de correspondances après l'OCR
  useEffect(() => {
    if (ocrResult?.financialAnalysis) {
      searchMatches(ocrResult.financialAnalysis);
    }
  }, [ocrResult?.financialAnalysis, searchMatches]);

  // Fonction pour valider les données OCR avec rapprochement automatique
  const handleValidateOcr = useCallback(
    async (financialAnalysis) => {
      if (ocrResult && selectedFile) {
        try {
          // Préparer les données OCR
          let analysis = financialAnalysis;
          if (typeof analysis === "string") {
            try {
              analysis = JSON.parse(analysis);
            } catch (e) {
              analysis = null;
            }
          }

          const transactionData = analysis?.transaction_data || {};

          // Convertir la date française DD/MM/YY en ISO YYYY-MM-DD
          const rawDate =
            transactionData.transaction_date || transactionData.date;
          let isoDate = rawDate;
          if (rawDate) {
            const frenchMatch = rawDate.match(
              /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/
            );
            if (frenchMatch) {
              const day = frenchMatch[1].padStart(2, "0");
              const month = frenchMatch[2].padStart(2, "0");
              let year = frenchMatch[3];
              if (year.length === 2) year = `20${year}`;
              isoDate = `${year}-${month}-${day}`;
            }
          }

          const ocrData = {
            amount: parseFloat(transactionData.amount) || 0,
            date: isoDate,
            vendor: transactionData.vendor_name,
            merchant: transactionData.vendor_name,
            category: transactionData.category,
            currency: transactionData.currency || "EUR",
          };

          // Utiliser le rapprochement automatique
          const result = await autoReconcile(
            selectedFile,
            ocrData,
            selectedTransactionId
          );

          if (result?.success) {
            // Notifier le parent
            if (onUploadSuccess) {
              onUploadSuccess({
                fileName: selectedFile.name,
                fileSize: selectedFile.size,
                fileType: selectedFile.type,
                action: result.action,
                transactionId: result.transactionId,
                expenseId: result.expenseId,
                matchedTransaction: result.matchedTransaction,
              });
            }

            // Fermer le drawer
            handleClose();
          }
        } catch (error) {
          console.error("❌ Erreur lors du rapprochement:", error);
        }
      }
    },
    [
      ocrResult,
      selectedFile,
      autoReconcile,
      selectedTransactionId,
      onUploadSuccess,
      handleClose,
    ]
  );

  // Sélectionner une transaction pour le rapprochement manuel
  const handleSelectTransaction = useCallback((transactionId) => {
    setSelectedTransactionId(transactionId);
    setReconcileMode("manual");
  }, []);

  // Créer une nouvelle dépense (sans rapprochement)
  const handleCreateNewExpense = useCallback(() => {
    setSelectedTransactionId(null);
    setReconcileMode("new");
  }, []);

  // Formatage de la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Icône selon le type de fichier
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/")) {
      return FileImage;
    }
    return FileMinus2;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[620px] md:max-w-[620px] md:min-w-[620px] md:max-h-[100vh]"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Header */}
        <DrawerHeader className="flex flex-col p-6 border-b space-y-0">
          <div className="flex items-center justify-between mb-2">
            <DrawerTitle className="text-lg font-medium flex items-center gap-2 m-0 p-0">
              <UploadIcon className="h-5 w-5" />
              Ajouter un reçu
            </DrawerTitle>
            <DrawerClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleClose}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>
          <DrawerDescription className="text-xs text-muted-foreground m-0 p-0">
            Scannez votre reçu pour le rattacher à une transaction bancaire ou
            créer une nouvelle dépense
          </DrawerDescription>
        </DrawerHeader>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto pb-20 md:pb-6">
          {/* Zone d'upload - Masquée si OCR terminé */}
          {!ocrResult && (
            <div className="space-y-4">
              <h3 className="font-medium">Fichier du reçu</h3>

              {!selectedFile ? (
                // Zone de drop
                <div
                  className={cn(
                    "border-1 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                    isDragging
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("receipt-file-input")?.click()
                  }
                >
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <UploadIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Glissez votre reçu ici ou cliquez pour sélectionner
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formats supportés: JPG, PNG, WebP, PDF (max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Fichier sélectionné
                <div className="bg-gray-50 dark:bg-gray-900 border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComponent = getFileIcon(selectedFile.type);
                        return <IconComponent className="h-4 w-4" />;
                      })()}
                      <div>
                        <p className="font-normal text-sm">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="h-8 w-8 cursor-pointer"
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* Input file caché */}
          <input
            id="receipt-file-input"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Erreurs */}
          {ocrError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <AlertCircleIcon className="h-4 w-4" />
              Erreur OCR: {ocrError}
            </div>
          )}

          {/* Erreur création dépense */}
          {expenseError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <AlertCircleIcon className="h-4 w-4" />
              Erreur création dépense: {expenseError.message || expenseError}
            </div>
          )}

          {/* Résultats OCR */}
          {ocrResult && (
            <>
              <OcrEditableDisplay
                ocrResult={ocrResult}
                onValidate={handleValidateOcr}
                isCreatingExpense={isCreatingExpense || isReconciling}
                imageUrl={selectedFile ? URL.createObjectURL(selectedFile) : null}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
              />

              {/* Section Rapprochement Automatique */}
              {matchResult && matchResult.allMatches?.length > 0 && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="h-4 w-4 text-primary" />
                    <h4 className="font-medium text-sm">
                      Transactions bancaires correspondantes
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {matchResult.allMatches.length} trouvée(s)
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    Sélectionnez une transaction pour y attacher ce
                    justificatif, ou créez une nouvelle dépense.
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {matchResult.allMatches.map((match) => (
                      <div
                        key={match.id}
                        onClick={() => handleSelectTransaction(match.id)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                          selectedTransactionId === match.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center",
                              selectedTransactionId === match.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {selectedTransactionId === match.id ? (
                              <CheckIcon className="h-4 w-4" />
                            ) : (
                              <Landmark className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {match.vendor || match.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {match.date
                                ? new Date(match.date).toLocaleDateString(
                                    "fr-FR"
                                  )
                                : "Date inconnue"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {Math.abs(match.amount).toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "EUR",
                            })}
                          </p>
                          <Badge
                            variant={
                              match.confidence === "high"
                                ? "default"
                                : match.confidence === "medium"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {match.confidence === "high"
                              ? "Forte"
                              : match.confidence === "medium"
                                ? "Moyenne"
                                : "Faible"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCreateNewExpense}
                      className="w-full text-muted-foreground"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Créer une nouvelle dépense (sans rapprochement)
                    </Button>
                  </div>
                </div>
              )}

              {/* Message si aucune correspondance */}
              {matchResult && matchResult.allMatches?.length === 0 && (
                <Callout type="info" noMargin className="mt-4">
                  <div>
                    <h4 className="font-normal text-sm">
                      Aucune transaction correspondante
                    </h4>
                    <p className="text-xs">
                      Aucune transaction bancaire ne correspond à ce montant.
                      Une nouvelle dépense sera créée.
                    </p>
                  </div>
                </Callout>
              )}

              {/* Indicateur de recherche */}
              {isSearching && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Recherche de transactions correspondantes...
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer fixe */}
        {!ocrResult ? (
          // Footer avant OCR
          <div className="flex-shrink-0 border-t bg-background p-4">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="cursor-pointer font-normal"
              >
                Annuler
              </Button>
              <Button
                onClick={handleProcessReceipt}
                disabled={!selectedFile || isProcessing}
                className="bg-primary hover:bg-primary/90 cursor-pointer font-normal"
              >
                {isProcessing ? (
                  <>
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    Traitement OCR...
                  </>
                ) : (
                  "Traiter le reçu"
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Footer après OCR avec logique de modification
          <div className="flex-shrink-0 border-t bg-background p-4">
            <div className="flex justify-between gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="cursor-pointer font-normal"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={() =>
                      handleValidateOcr(ocrResult?.financialAnalysis)
                    }
                    disabled={isCreatingExpense}
                    className="bg-primary hover:bg-primary/90 cursor-pointer font-normal"
                  >
                    {isCreatingExpense ? (
                      <>
                        <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      "Sauvegarder"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="cursor-pointer font-normal"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="cursor-pointer font-normal"
                    >
                      Modifier
                    </Button>
                  </div>
                  <Button
                    onClick={() =>
                      handleValidateOcr(ocrResult?.financialAnalysis)
                    }
                    disabled={isCreatingExpense || isReconciling}
                    className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-popover dark:text-popover-foreground dark:hover:bg-popover/90"
                  >
                    {isCreatingExpense || isReconciling ? (
                      <>
                        <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                        {selectedTransactionId ? "Liaison..." : "Création..."}
                      </>
                    ) : selectedTransactionId ? (
                      "Lier le justificatif"
                    ) : matchResult?.allMatches?.length > 0 ? (
                      "Créer une dépense"
                    ) : (
                      "Valider la dépense"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
