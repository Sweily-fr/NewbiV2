"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";
import {
  IconUpload,
  IconFile,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconDownload,
} from "@tabler/icons-react";
import { cn } from "@/src/lib/utils";
import { useFileTransfer } from "@/app/dashboard/outils/transferts-fichiers/hooks/useFileTransfer";
import TransferOptionsForm from "./transfer-options-form";

const FileUpload = ({ className }) => {
  const {
    selectedFiles,
    isUploading,
    uploadProgress,
    transferResult,
    transferOptions,
    setTransferOptions,
    addFiles,
    removeFile,
    createTransfer,
    formatFileSize,
    getTotalSize,
  } = useFileTransfer();

  const [showOptions, setShowOptions] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      addFiles(Array.from(event.target.files));
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      addFiles(Array.from(event.dataTransfer.files));
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.startsWith("video/")) return "🎥";
    if (fileType.startsWith("audio/")) return "🎵";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return "📊";
    if (fileType.includes("powerpoint") || fileType.includes("presentation"))
      return "📈";
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("7z")
    )
      return "🗜️";
    return "📁";
  };

  const handleUpload = async () => {
    try {
      await createTransfer();
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
    }
  };

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Zone de drop */}
      <Card className="shadow-none border-dashed transition-colors duration-200 hover:border-primary/50">
        <CardContent className="p-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center space-y-4 cursor-pointer transition-colors duration-200"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <div className="p-4 rounded-full bg-primary/10">
              <IconUpload size={22} className="text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-md font-medium">
                Glissez-déposez vos fichiers ou cliquez pour sélectionner
              </h3>
              <p className="text-sm text-muted-foreground">
                Taille maximale : 10GB par fichier • Tous formats acceptés
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des fichiers sélectionnés */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  Fichiers sélectionnés ({selectedFiles.length})
                </h4>
                <div className="text-sm text-muted-foreground">
                  Taille totale: {formatFileSize(getTotalSize())}
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-2xl">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <IconX size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barre de progression */}
      {isUploading && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Upload en cours...</h4>
                <span className="text-sm text-muted-foreground">
                  {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultat du transfert */}
      {transferResult && (
        <Card
          className={cn(
            "border-2",
            transferResult.success
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          )}
        >
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {transferResult.success ? (
                  <IconCheck className="text-green-600" size={20} />
                ) : (
                  <IconAlertCircle className="text-red-600" size={20} />
                )}
                <h4
                  className={cn(
                    "font-semibold",
                    transferResult.success ? "text-green-800" : "text-red-800"
                  )}
                >
                  {transferResult.success
                    ? "Transfert créé avec succès !"
                    : "Erreur lors du transfert"}
                </h4>
              </div>

              {transferResult.success ? (
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Lien de partage:
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const fullLink = `${window.location.origin}/transfer/${transferResult.shareLink}?key=${transferResult.accessKey}`;
                            navigator.clipboard.writeText(fullLink);
                          }}
                        >
                          Copier
                        </Button>
                      </div>
                      <code className="block p-2 bg-muted rounded text-xs break-all">
                        {`${window.location.origin}/transfer/${transferResult.shareLink}?key=${transferResult.accessKey}`}
                      </code>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>
                      Clé d'accès:{" "}
                      <code className="bg-muted px-1 rounded">
                        {transferResult.accessKey}
                      </code>
                    </p>
                    <p>
                      Expire le:{" "}
                      {new Date(transferResult.expiryDate).toLocaleDateString(
                        "fr-FR"
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-red-700 text-sm">{transferResult.error}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Options de transfert */}
      {selectedFiles.length > 0 && !isUploading && !transferResult && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Options de transfert</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOptions(!showOptions)}
                >
                  {showOptions
                    ? "Masquer les options"
                    : "Configurer les options"}
                </Button>
              </div>

              {showOptions && (
                <TransferOptionsForm
                  options={transferOptions}
                  onOptionsChange={setTransferOptions}
                  className="mt-4"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bouton d'upload */}
      {selectedFiles.length > 0 && !isUploading && !transferResult && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowOptions(!showOptions)}
          >
            Options avancées
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            className="min-w-32 font-normal"
          >
            <IconUpload size={16} className="mr-2" />
            Créer le transfert
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
