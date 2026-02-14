"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  Calendar,
  Building2,
  FileText,
  Edit,
  Trash2,
  Save,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import {
  IMPORTED_QUOTE_STATUS_LABELS,
  IMPORTED_QUOTE_STATUS_COLORS,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  useUpdateImportedQuote,
  useDeleteImportedQuote,
} from "@/src/graphql/importedQuoteQueries";
import { toast } from "sonner";

export function ImportedQuoteSidebar({ quote, open, onOpenChange, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const { updateImportedQuote, loading: updateLoading } = useUpdateImportedQuote();
  const { deleteImportedQuote, loading: deleteLoading } = useDeleteImportedQuote();

  const isLoading = updateLoading || deleteLoading;

  if (!quote) return null;

  const handleEdit = () => {
    setEditData({
      originalQuoteNumber: quote.originalQuoteNumber || "",
      clientName: quote.client?.name || quote.vendor?.name || "",
      clientSiret: quote.client?.siret || quote.vendor?.siret || "",
      quoteDate: quote.quoteDate?.split("T")[0] || "",
      validUntil: quote.validUntil?.split("T")[0] || "",
      totalHT: quote.totalHT || 0,
      totalVAT: quote.totalVAT || 0,
      totalTTC: quote.totalTTC || 0,
      category: quote.category || "OTHER",
      paymentMethod: quote.paymentMethod || "UNKNOWN",
      notes: quote.notes || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateImportedQuote({
        variables: { id: quote.id, input: editData },
      });
      toast.success("Devis mis à jour");
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteImportedQuote({ variables: { id: quote.id } });
      toast.success("Devis supprimé");
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: quote.currency || "EUR",
    }).format(amount || 0);
  };

  const handleDownload = () => {
    if (quote.file?.url) {
      window.open(quote.file.url, "_blank");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-base font-medium">
              Devis importé
            </SheetTitle>
            <Badge className={IMPORTED_QUOTE_STATUS_COLORS[quote.status]}>
              {IMPORTED_QUOTE_STATUS_LABELS[quote.status]}
            </Badge>
            {quote.isDuplicate && (
              <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Doublon
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            {/* Montant principal */}
            <div className="text-center py-4">
              <p className="text-3xl font-bold">{formatAmount(quote.totalTTC)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                HT: {formatAmount(quote.totalHT)} | TVA: {formatAmount(quote.totalVAT)}
              </p>
            </div>

            <Separator />

            {/* Mode édition ou affichage */}
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>N° Devis</Label>
                  <Input
                    value={editData.originalQuoteNumber}
                    onChange={(e) => setEditData({ ...editData, originalQuoteNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input
                    value={editData.clientName}
                    onChange={(e) => setEditData({ ...editData, clientName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SIRET Client</Label>
                  <Input
                    value={editData.clientSiret}
                    onChange={(e) => setEditData({ ...editData, clientSiret: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date du devis</Label>
                  <Input
                    type="date"
                    value={editData.quoteDate}
                    onChange={(e) => setEditData({ ...editData, quoteDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de validité</Label>
                  <Input
                    type="date"
                    value={editData.validUntil}
                    onChange={(e) => setEditData({ ...editData, validUntil: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.totalHT ?? ""}
                      onChange={(e) => setEditData({ ...editData, totalHT: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TVA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.totalVAT ?? ""}
                      onChange={(e) => setEditData({ ...editData, totalVAT: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TTC</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.totalTTC ?? ""}
                      onChange={(e) => setEditData({ ...editData, totalTTC: e.target.value === "" ? 0 : parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2 w-full">
                  <Label>Catégorie</Label>
                  <Select
                    value={editData.category}
                    onValueChange={(value) => setEditData({ ...editData, category: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full">
                  <Label>Paiement</Label>
                  <Select
                    value={editData.paymentMethod}
                    onValueChange={(value) => setEditData({ ...editData, paymentMethod: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                {/* Client */}
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Client</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{quote.client?.name || quote.vendor?.name || "Non spécifié"}</p>
                      {(quote.client?.siret || quote.vendor?.siret) && (
                        <p className="text-xs text-muted-foreground">SIRET: {quote.client?.siret || quote.vendor?.siret}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Informations */}
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Informations</p>

                  {quote.originalQuoteNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">N° Devis</span>
                      <span className="text-sm font-medium">{quote.originalQuoteNumber}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm">{quote.quoteDate ? formatDateToFrench(quote.quoteDate) : "Non spécifiée"}</span>
                  </div>

                  {quote.validUntil && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Validité</span>
                      <span className="text-sm">{formatDateToFrench(quote.validUntil)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Catégorie</span>
                    <span className="text-sm">{EXPENSE_CATEGORY_LABELS[quote.category] || "Autre"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Paiement</span>
                    <span className="text-sm">{PAYMENT_METHOD_LABELS[quote.paymentMethod] || "Non spécifié"}</span>
                  </div>

                  {quote.ocrData?.confidence > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Confiance OCR</span>
                      <span className="text-sm">{Math.round(quote.ocrData.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Fichier joint */}
            {quote.file && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Document</p>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50"
                  onClick={handleDownload}
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{quote.file.originalFileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {quote.file.fileSize ? `${Math.round(quote.file.fileSize / 1024)} KB` : "PDF"}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Notes */}
            {quote.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
                  <p className="text-sm">{quote.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Actions - Footer fixe en bas */}
        <div className="border-t p-4 mt-auto shrink-0 bg-background">
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)} disabled={isLoading}>
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isLoading}>
                {updateLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Enregistrer
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleEdit} disabled={isLoading}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1" disabled={isLoading}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le devis sera définitivement supprimé.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
