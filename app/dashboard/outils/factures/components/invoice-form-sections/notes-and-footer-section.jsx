"use client";

import { Tag, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Button } from "@/src/components/ui/button";

export default function NotesAndFooterSection({ data, updateField, updateNestedField, canEdit }) {
  return (
    <Card className="shadow-none border-none p-2">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Notes et bas de page
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        {/* Notes d'en-tête */}
        <div>
          <Label htmlFor="header-notes">Notes d'en-tête</Label>
          <Textarea
            id="header-notes"
            className="mt-2"
            value={data.headerNotes || ""}
            onChange={(e) => updateField("headerNotes", e.target.value)}
            placeholder="Notes qui apparaîtront en haut de la facture..."
            rows={3}
            disabled={!canEdit}
          />
        </div>

        {/* Notes de bas de page */}
        <div>
          <Label htmlFor="footer-notes">Notes de bas de page</Label>
          <Textarea
            id="footer-notes"
            className="mt-2"
            value={data.footerNotes || ""}
            onChange={(e) => updateField("footerNotes", e.target.value)}
            placeholder="Notes qui apparaîtront en bas de la facture..."
            rows={3}
            disabled={!canEdit}
          />
        </div>

        {/* Conditions générales */}
        <div>
          <Label htmlFor="terms-conditions">Conditions générales</Label>
          <Textarea
            id="terms-conditions"
            className="mt-2"
            value={data.termsAndConditions || ""}
            onChange={(e) => updateField("termsAndConditions", e.target.value)}
            placeholder="Conditions générales de vente..."
            rows={4}
            disabled={!canEdit}
          />
        </div>

        {/* Coordonnées bancaires */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="show-bank-details"
              checked={data.showBankDetails || false}
              onCheckedChange={(checked) => updateField("showBankDetails", checked)}
              disabled={!canEdit}
              className="h-5 w-5 rounded-md border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="show-bank-details"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Afficher les coordonnées bancaires
              </Label>
              <p className="text-xs text-muted-foreground">
                Cochez pour inclure vos coordonnées bancaires dans la facture
              </p>
            </div>
          </div>

          {data.showBankDetails && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Coordonnées bancaires</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Importer les coordonnées bancaires depuis les données utilisateur
                    if (data.companyInfo?.bankDetails) {
                      updateNestedField("bankDetails", "iban", data.companyInfo.bankDetails.iban || "");
                      updateNestedField("bankDetails", "bic", data.companyInfo.bankDetails.bic || "");
                      updateNestedField("bankDetails", "bankName", data.companyInfo.bankDetails.bankName || "");
                    }
                  }}
                  disabled={!canEdit}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Importer mes coordonnées
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-iban" className="text-sm font-medium text-gray-900">
                    IBAN
                  </Label>
                  <Input
                    id="bank-iban"
                    value={data.bankDetails?.iban || ""}
                    onChange={(e) => updateNestedField("bankDetails", "iban", e.target.value)}
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                    disabled={!canEdit}
                    className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-bic" className="text-sm font-medium text-gray-900">
                    BIC/SWIFT
                  </Label>
                  <Input
                    id="bank-bic"
                    value={data.bankDetails?.bic || ""}
                    onChange={(e) => updateNestedField("bankDetails", "bic", e.target.value)}
                    placeholder="BNPAFRPPXXX"
                    disabled={!canEdit}
                    className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-name" className="text-sm font-medium text-gray-900">
                  Nom de la banque
                </Label>
                <Input
                  id="bank-name"
                  value={data.bankDetails?.bankName || ""}
                  onChange={(e) => updateNestedField("bankDetails", "bankName", e.target.value)}
                  placeholder="BNP Paribas"
                  disabled={!canEdit}
                  className="h-10 rounded-lg border-gray-300 bg-white px-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
