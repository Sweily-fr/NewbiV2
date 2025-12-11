"use client";

import { useState } from "react";
import {
  CheckCircle,
  AlertTriangle,
  FileText,
  Euro,
  Calendar,
  Building,
  Tag,
  CreditCard,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";

/**
 * Composant pour afficher les résultats OCR avec analyse financière
 */
export default function OcrResultsDisplay({ ocrResult, onValidate, isCreatingExpense = false }) {
  const [showRawData, setShowRawData] = useState(false);

  if (!ocrResult) return null;

  // Parser l'analyse financière si elle est en string
  let financialAnalysis = null;
  try {
    financialAnalysis =
      typeof ocrResult.financialAnalysis === "string"
        ? JSON.parse(ocrResult.financialAnalysis)
        : ocrResult.financialAnalysis;
  } catch (error) {
    console.warn("Erreur parsing analyse financière:", error);
  }

  const transactionData = financialAnalysis?.transaction_data;
  const documentAnalysis = financialAnalysis?.document_analysis;
  const extractedFields = financialAnalysis?.extracted_fields;

  return (
    <div className="space-y-4">
      {/* Analyse du document */}
      {documentAnalysis && (
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-gray-600" />
            <h4 className="font-medium text-sm">Type de document</h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                documentAnalysis.document_type === "invoice"
                  ? "default"
                  : "secondary"
              }
            >
              {documentAnalysis.document_type === "invoice"
                ? "Facture"
                : documentAnalysis.document_type === "receipt"
                  ? "Reçu"
                  : "Autre"}
            </Badge>
            <span className="text-sm text-gray-600">
              Confiance: {Math.round((documentAnalysis.confidence || 0) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Données de transaction */}
      {transactionData && (
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
            <Euro className="h-4 w-4 text-gray-600" />
            Informations financières
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type et montant */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Type
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      transactionData.type === "expense"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {transactionData.type === "expense" ? "Dépense" : "Revenu"}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Montant
                </label>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {transactionData.amount?.toFixed(2) || "0.00"}{" "}
                  {transactionData.currency || "EUR"}
                </div>
                {transactionData.tax_amount > 0 && (
                  <div className="text-sm text-gray-600">
                    TVA: {transactionData.tax_amount?.toFixed(2)} EUR (
                    {transactionData.tax_rate}%)
                  </div>
                )}
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Date
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {transactionData.transaction_date || "Non détectée"}
                  </span>
                </div>
              </div>

              {transactionData.due_date && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Échéance
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{transactionData.due_date}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {/* Fournisseur et catégorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Fournisseur
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {transactionData.vendor_name || "Non détecté"}
                </span>
              </div>
              {transactionData.document_number && (
                <div className="text-xs text-gray-500 mt-1">
                  Réf: {transactionData.document_number}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Catégorie
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Tag className="h-4 w-4 text-gray-400" />
                <Badge variant="outline">
                  {transactionData.category || "autre"}
                </Badge>
                {transactionData.subcategory &&
                  transactionData.subcategory !== "unknown" && (
                    <span className="text-xs text-gray-500">
                      • {transactionData.subcategory}
                    </span>
                  )}
              </div>
            </div>
          </div>

          {/* Statut et paiement */}
          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Statut
              </label>
              <div className="mt-1">
                <Badge
                  variant={
                    transactionData.status === "paid"
                      ? "default"
                      : transactionData.status === "overdue"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {transactionData.status === "paid"
                    ? "Payé"
                    : transactionData.status === "overdue"
                      ? "En retard"
                      : "En attente"}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Moyen de paiement
              </label>
              <div className="flex items-center gap-2 mt-1">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {transactionData.payment_method === "card"
                    ? "Carte"
                    : transactionData.payment_method === "transfer"
                      ? "Virement"
                      : transactionData.payment_method === "cash"
                        ? "Espèces"
                        : transactionData.payment_method === "check"
                          ? "Chèque"
                          : "Non détecté"}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {transactionData.description && (
            <>
              <Separator className="my-4" />
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Description
                </label>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {transactionData.description}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Articles détaillés */}
      {extractedFields?.items && extractedFields.items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
          <h4 className="font-medium text-sm mb-3">Articles détaillés</h4>
          <div className="space-y-2">
            {extractedFields.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.description}</div>
                  <div className="text-xs text-gray-500">
                    Qté: {item.quantity} × {item.unit_price?.toFixed(2)} EUR
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  {item.total?.toFixed(2)} EUR
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Données brutes (optionnel) */}
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Données techniques</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRawData(!showRawData)}
          >
            {showRawData ? "Masquer" : "Afficher"}
          </Button>
        </div>

        {showRawData && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Texte extrait
              </label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono max-h-40 overflow-y-auto">
                {ocrResult.extractedText || "Aucun texte extrait"}
              </div>
            </div>

            {financialAnalysis && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Analyse complète
                </label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono max-h-40 overflow-y-auto">
                  <pre>{JSON.stringify(financialAnalysis, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {onValidate && (
        <div className="flex gap-2">
          <Button
            onClick={() => onValidate(financialAnalysis)}
            disabled={isCreatingExpense}
            className="flex-1"
          >
            {isCreatingExpense ? (
              <>
                <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Valider et créer la dépense"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
