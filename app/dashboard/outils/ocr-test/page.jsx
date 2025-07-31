"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useOcr } from "@/src/hooks/useOcr";
import { OcrResultsDisplay } from "@/src/components/ocr/OcrResultsDisplay";
import {
  Upload,
  FileText,
  Loader2,
  Receipt,
  AlertCircle,
  CheckCircle,
  X,
  TestTube
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

/**
 * Page de test pour l'OCR - Pour vérifier que l'intégration fonctionne
 */
export default function OcrTestPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const { processDocument, ocrResult, isProcessing, error, resetOcr } = useOcr();

  // Types de fichiers acceptés
  const acceptedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'image/tiff',
    'image/bmp'
  ];

  const handleFileSelect = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Type de fichier non supporté. Formats acceptés: JPG, PNG, GIF, WebP, PDF, TIFF, BMP');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('Fichier trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile(file);
    resetOcr();
    toast.success(`Fichier sélectionné: ${file.name}`);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedFile) {
      toast.error('Aucun fichier sélectionné');
      return;
    }

    try {
      toast.info('Début du traitement OCR...');
      await processDocument(selectedFile, {
        model: "mistral-ocr-latest",
        includeImageBase64: false
      });
      
      if (ocrResult?.success) {
        toast.success('Traitement OCR terminé avec succès !');
      }
    } catch (err) {
      console.error('Erreur traitement OCR:', err);
      toast.error('Erreur lors du traitement OCR');
    }
  };

  const handleValidate = () => {
    if (ocrResult) {
      toast.success('Données OCR validées !');
      console.log('Données validées:', ocrResult);
      
      // Reset pour un nouveau test
      setSelectedFile(null);
      resetOcr();
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    resetOcr();
    toast.info('Fichier supprimé');
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TestTube className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Test OCR Mistral</h1>
          <p className="text-muted-foreground">
            Page de test pour vérifier l'intégration OCR avec l'API Mistral
          </p>
        </div>
      </div>

      {/* Zone de drop */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-muted-foreground/25"
        } ${selectedFile ? "border-green-500 bg-green-50" : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <CardContent className="p-8 text-center">
          <input
            id="file-input"
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <FileText className="h-12 w-12 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-700">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round(selectedFile.size / 1024)} KB • {selectedFile.type}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Glissez votre reçu ici</p>
                <p className="text-sm text-muted-foreground">
                  ou cliquez pour sélectionner un fichier
                </p>
              </div>
              <div className="flex flex-wrap gap-1 justify-center">
                <Badge variant="outline" className="text-xs">JPG</Badge>
                <Badge variant="outline" className="text-xs">PNG</Badge>
                <Badge variant="outline" className="text-xs">PDF</Badge>
                <Badge variant="outline" className="text-xs">WebP</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status et erreurs */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Erreur OCR</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {ocrResult && ocrResult.success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Traitement réussi</span>
            </div>
            <p className="text-sm text-green-600 mt-1">{ocrResult.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Bouton de traitement */}
      <Button 
        onClick={handleProcessReceipt}
        disabled={!selectedFile || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Traitement OCR en cours...
          </>
        ) : (
          <>
            <Receipt className="h-4 w-4 mr-2" />
            Traiter le reçu avec OCR
          </>
        )}
      </Button>

      {/* Résultats OCR */}
      {ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Résultats du traitement OCR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OcrResultsDisplay
              ocrResult={ocrResult}
              onValidate={handleValidate}
            />
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Instructions de test</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. Glissez ou sélectionnez un fichier (reçu, facture, document)</p>
          <p>2. Cliquez sur "Traiter le reçu avec OCR"</p>
          <p>3. Attendez le traitement (upload → Cloudflare → Mistral OCR)</p>
          <p>4. Vérifiez les données extraites</p>
          <p>5. Cliquez sur "Valider les données" pour terminer</p>
        </CardContent>
      </Card>
    </div>
  );
}
