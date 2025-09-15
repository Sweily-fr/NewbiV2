"use client";

import { useState, useCallback } from "react";
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
import { Progress } from "@/src/components/ui/progress";
import { Separator } from "@/src/components/ui/separator";
import {
  UploadIcon,
  FileTextIcon,
  FileMinus2,
  FileImage,
  XIcon,
  Info,
  CheckCircleIcon,
  AlertCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useDocumentUpload } from "@/src/hooks/useDocumentUpload";
import { useOcr } from "@/src/hooks/useOcr";
import { useExpense } from "@/src/hooks/useExpense";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import OcrEditableDisplay from "./ocr-editable-display";

export function ReceiptUploadDrawer({ open, onOpenChange, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Hook pour récupérer le workspace
  const { workspaceId } = useRequiredWorkspace();

  // Hook pour l'upload vers Cloudflare
  const {
    isUploading,
    uploadProgress,
    uploadError,
    uploadResult,
    uploadDocument,
    resetUpload,
  } = useDocumentUpload();

  // Hook OCR
  const {
    processDocumentFromUrl,
    ocrResult,
    isProcessing,
    error: ocrError,
    resetOcr,
  } = useOcr();

  // Hook pour les dépenses
  const { createExpenseFromOcrData, isCreatingExpense, expenseError } =
    useExpense();

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
    async (file) => {
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

      // Upload immédiat vers Cloudflare
      await uploadDocument(file);
    },
    [uploadDocument]
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
    resetUpload();
  }, [resetUpload]);

  // Fermeture du drawer
  const handleClose = useCallback(() => {
    handleRemoveFile();
    resetOcr();
    onOpenChange(false);
  }, [handleRemoveFile, resetOcr, onOpenChange]);

  // Traitement du reçu avec OCR
  const handleProcessReceipt = useCallback(async () => {
    if (uploadResult && selectedFile) {
      try {
        await processDocumentFromUrl(
          uploadResult.url,
          selectedFile.name,
          selectedFile.type,
          uploadResult.fileSize,
          workspaceId,
          {
            model: "mistral-ocr-latest",
            includeImageBase64: false,
          }
        );
      } catch (error) {
        console.error("❌ Erreur OCR:", error);
      }
    } else {
      console.warn("⚠️ Pas de fichier uploadé ou upload en cours");
    }
  }, [uploadResult, selectedFile, processDocumentFromUrl]);

  // Fonction pour valider les données OCR avec analyse financière
  const handleValidateOcr = useCallback(
    async (financialAnalysis) => {
      if (ocrResult && selectedFile && uploadResult) {
        try {
          // Préparer les données pour la création de dépense
          const ocrData = {
            ...ocrResult,
            financialAnalysis: financialAnalysis,
          };

          const fileData = {
            cloudflareUrl: uploadResult.url,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            mimeType: selectedFile.type,
          };

          // Créer la dépense en base de données
          const createdExpense = await createExpenseFromOcrData(
            ocrData,
            fileData
          );

          // Notifier le parent si nécessaire
          if (onUploadSuccess) {
            const enrichedData = {
              fileName: selectedFile.name,
              fileSize: selectedFile.size,
              fileType: selectedFile.type,
              cloudflareUrl: uploadResult.url,
              ocrData: ocrResult,
              financialAnalysis: financialAnalysis,
              createdExpense: createdExpense,
            };
            onUploadSuccess(enrichedData);
          }

          // Fermer le drawer
          handleClose();
        } catch (error) {
          console.error("❌ Erreur lors de la création de la dépense:", error);
          // L'erreur sera affichée via expenseError
        }
      }
    },
    [
      ocrResult,
      selectedFile,
      uploadResult,
      createExpenseFromOcrData,
      onUploadSuccess,
      handleClose,
    ]
  );

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
        className="w-[620px] max-w-[620px] max-h-[100vh]"
        style={{ width: "620px", maxWidth: "620px", minWidth: "620px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-medium flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Ajouter un reçu
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Uploadez une photo ou un PDF de votre reçu pour créer
              automatiquement une dépense
            </p>
          </div>
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

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Zone d'upload - Masquée si OCR terminé */}
          {!ocrResult && (
            <div className="space-y-4">
              <h3 className="font-medium">Fichier du reçu</h3>

              {!selectedFile ? (
                // Zone de drop
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
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
                      <UploadIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
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
                <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComponent = getFileIcon(selectedFile.type);
                        return <IconComponent className="h-5 w-5" />;
                      })()}
                      <div>
                        <p className="font-medium text-sm">
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
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Barre de progression upload */}
                  {isUploading && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Upload en cours...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                </div>
              )}

              {/* Informations sur le traitement */}
              {selectedFile && uploadResult && (
                <div className="dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-6 w-6 text-blue-600" />
                    <div className="space-y-1">
                      <h4 className="font-normal text-sm text-blue-700 dark:text-blue-100">
                        Prêt pour le traitement
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Le fichier a été uploadé avec succès. Cliquez sur
                        "Traiter le reçu" pour lancer l'analyse OCR.
                      </p>
                    </div>
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
          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
              <AlertCircleIcon className="h-4 w-4" />
              Erreur upload: {uploadError.message || uploadError}
            </div>
          )}

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
            <OcrEditableDisplay
              ocrResult={ocrResult}
              onValidate={handleValidateOcr}
              isCreatingExpense={isCreatingExpense}
            />
          )}
        </div>

        {/* Footer - Masqué si OCR terminé */}
        {!ocrResult && (
          <div className="border-t p-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                onClick={handleProcessReceipt}
                disabled={
                  !selectedFile || !uploadResult || isUploading || isProcessing
                }
                className="flex-1 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Traitement OCR...
                  </>
                ) : (
                  "Traiter le reçu"
                )}
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
