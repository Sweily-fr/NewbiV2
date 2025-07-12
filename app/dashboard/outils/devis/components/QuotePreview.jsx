"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";

export default function QuotePreview({ data }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Aucune donnée à prévisualiser</p>
      </div>
    );
  }

  const {
    companyInfo = {},
    clientInfo = {},
    quoteNumber = "",
    issueDate = "",
    validityDate = "",
    items = [],
    notes = {},
    discount = {},
    customFields = [],
    status = "DRAFT"
  } = data;

  // Calculs des totaux
  const calculateItemTotal = (item) => {
    const baseTotal = (item.quantity || 0) * (item.unitPrice || 0);
    if (item.discount && item.discountType) {
      if (item.discountType === 'PERCENTAGE') {
        return baseTotal * (1 - (item.discount || 0) / 100);
      } else {
        return baseTotal - (item.discount || 0);
      }
    }
    return baseTotal;
  };

  const subtotalHT = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  
  let discountAmount = 0;
  if (discount.value && discount.type) {
    if (discount.type === 'PERCENTAGE') {
      discountAmount = subtotalHT * (discount.value / 100);
    } else {
      discountAmount = discount.value;
    }
  }

  const totalHT = subtotalHT - discountAmount;
  const totalTVA = items.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item);
    return sum + (itemTotal * (item.taxRate || 0) / 100);
  }, 0);
  const totalTTC = totalHT + totalTVA;

  return (
    <div className="max-w-4xl mx-auto bg-white">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          {/* En-tête */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">DEVIS</h1>
              <div className="space-y-1">
                <p className="text-lg font-semibold">N° {quoteNumber}</p>
                <p className="text-sm text-muted-foreground">
                  Date d'émission : {issueDate ? new Date(issueDate).toLocaleDateString('fr-FR') : 'Non définie'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Valable jusqu'au : {validityDate ? new Date(validityDate).toLocaleDateString('fr-FR') : 'Non définie'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={status === 'DRAFT' ? 'secondary' : status === 'SENT' ? 'default' : 'outline'}>
                {status}
              </Badge>
            </div>
          </div>

          {/* Informations entreprise et client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Entreprise */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">DE :</h3>
              <div className="space-y-1">
                <p className="font-semibold">{companyInfo.name || "Nom de l'entreprise"}</p>
                {companyInfo.address && <p className="text-sm">{companyInfo.address}</p>}
                {companyInfo.email && <p className="text-sm">{companyInfo.email}</p>}
                {companyInfo.phone && <p className="text-sm">{companyInfo.phone}</p>}
                {companyInfo.siret && <p className="text-sm">SIRET : {companyInfo.siret}</p>}
              </div>
            </div>

            {/* Client */}
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">POUR :</h3>
              <div className="space-y-1">
                <p className="font-semibold">{clientInfo.name || "Nom du client"}</p>
                {clientInfo.address && <p className="text-sm">{clientInfo.address}</p>}
                {clientInfo.email && <p className="text-sm">{clientInfo.email}</p>}
                {clientInfo.phone && <p className="text-sm">{clientInfo.phone}</p>}
                {clientInfo.siret && <p className="text-sm">SIRET : {clientInfo.siret}</p>}
              </div>
            </div>
          </div>

          {/* Notes d'en-tête */}
          {notes.header && (
            <div className="mb-6">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{notes.header}</p>
              </div>
            </div>
          )}

          {/* Articles */}
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Détail des prestations</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-right p-3 font-medium w-20">Qté</th>
                    <th className="text-right p-3 font-medium w-24">Prix unit.</th>
                    <th className="text-right p-3 font-medium w-20">TVA</th>
                    <th className="text-right p-3 font-medium w-24">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center p-8 text-muted-foreground">
                        Aucun article ajouté
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{item.description || "Description"}</p>
                            {item.details && (
                              <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-right p-3">
                          {item.quantity || 0} {item.unit || ""}
                        </td>
                        <td className="text-right p-3">
                          {(item.unitPrice || 0).toFixed(2)} €
                        </td>
                        <td className="text-right p-3">
                          {item.taxRate || 0}%
                        </td>
                        <td className="text-right p-3 font-medium">
                          {calculateItemTotal(item).toFixed(2)} €
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sous-total HT :</span>
                  <span>{subtotalHT.toFixed(2)} €</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Remise {discount.type === 'PERCENTAGE' ? `(${discount.value}%)` : ''}:
                    </span>
                    <span>-{discountAmount.toFixed(2)} €</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Total HT :</span>
                  <span>{totalHT.toFixed(2)} €</span>
                </div>
                
                <div className="flex justify-between">
                  <span>TVA :</span>
                  <span>{totalTVA.toFixed(2)} €</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total TTC :</span>
                  <span>{totalTTC.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>

          {/* Champs personnalisés */}
          {customFields && customFields.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Informations complémentaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field, index) => (
                  <div key={index} className="bg-muted/30 p-3 rounded">
                    <p className="font-medium text-sm">{field.label}</p>
                    <p className="text-sm">{field.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes de bas de page */}
          {notes.footer && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{notes.footer}</p>
              </div>
            </div>
          )}

          {/* Conditions générales */}
          {notes.terms && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Conditions générales</h3>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                {notes.terms}
              </div>
            </div>
          )}

          {/* Coordonnées bancaires */}
          {notes.showBankDetails && notes.bankDetails && (
            <div>
              <h3 className="font-semibold mb-2">Coordonnées bancaires</h3>
              <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                {notes.bankDetails}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
