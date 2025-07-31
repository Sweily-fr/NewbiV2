"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  DollarSign,
  Building,
  Receipt,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

/**
 * Composant pour afficher les résultats de l'OCR dans le drawer existant
 */
export function OcrResultsDisplay({ ocrResult, onValidate }) {
  const [showRawData, setShowRawData] = useState(false);

  if (!ocrResult) return null;

  // Parser les données structurées depuis le JSON
  let structuredData = null;
  let rawData = null;
  
  try {
    const parsedData = JSON.parse(ocrResult.data);
    structuredData = parsedData.structured;
    rawData = parsedData.raw;
  } catch (error) {
    console.error('Erreur parsing des données OCR:', error);
  }

  // Récupérer l'ID du document depuis metadata
  const documentId = ocrResult.metadata?.documentId;

  const formatDate = (dateString) => {
    if (!dateString) return 'Non détecté';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return 'Non détecté';
    return `${amount}€`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const openDocument = () => {
    if (ocrResult.metadata?.documentUrl) {
      window.open(ocrResult.metadata.documentUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Titre et status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium">Résultats OCR</h3>
        </div>
        <div className="flex items-center gap-2">
          {ocrResult.success ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Réussi</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">Erreur</span>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* Données structurées */}
      {structuredData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Receipt className="h-4 w-4" />
              Données extraites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-xs">
                  <DollarSign className="h-3 w-3" />
                  Montant
                </Label>
                <div className="flex items-center gap-1">
                  <Input 
                    value={formatAmount(structuredData.amount)} 
                    readOnly 
                    className="text-sm h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(structuredData.amount?.toString() || '')}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  Date
                </Label>
                <div className="flex items-center gap-1">
                  <Input 
                    value={formatDate(structuredData.date)} 
                    readOnly 
                    className="text-sm h-8"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(structuredData.date || '')}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1 text-xs">
                <Building className="h-3 w-3" />
                Commerçant
              </Label>
              <div className="flex items-center gap-1">
                <Input 
                  value={structuredData.merchant || 'Non détecté'} 
                  readOnly 
                  className="text-sm h-8"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(structuredData.merchant || '')}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Description</Label>
              <div className="relative">
                <Textarea 
                  value={structuredData.description || 'Non détecté'} 
                  readOnly 
                  className="text-sm min-h-[60px] pr-8"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(structuredData.description || '')}
                  className="absolute top-1 right-1 h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Texte extrait */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            Texte extrait
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(ocrResult.extractedText || '')}
              className="h-6 px-2"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copier
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={ocrResult.extractedText || 'Aucun texte extrait'} 
            readOnly 
            className="text-xs min-h-[80px] font-mono"
          />
        </CardContent>
      </Card>

      {/* Données brutes (optionnel) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            Données brutes Mistral
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
              className="h-6 px-2"
            >
              {showRawData ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Masquer
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Afficher
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {showRawData && (
          <CardContent>
            <div className="relative">
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-[150px] pr-8">
                {JSON.stringify(rawData, null, 2)}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(rawData, null, 2))}
                className="absolute top-1 right-1 h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bouton de validation */}
      <div className="pt-2">
        <Button 
          onClick={onValidate}
          className="w-full"
          disabled={!ocrResult.success}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Valider les données
        </Button>
      </div>
    </div>
  );
}
