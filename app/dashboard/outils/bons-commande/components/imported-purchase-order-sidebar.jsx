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
  Building2,
  FileText,
  Edit,
  Trash2,
  Save,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import {
  IMPORTED_PURCHASE_ORDER_STATUS_LABELS,
  IMPORTED_PURCHASE_ORDER_STATUS_COLORS,
  useUpdateImportedPurchaseOrder,
  useDeleteImportedPurchaseOrder,
  useValidateImportedPurchaseOrder,
} from "@/src/graphql/importedPurchaseOrderQueries";
import {
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/src/graphql/importedInvoiceQueries";
import { toast } from "sonner";

export function ImportedPurchaseOrderSidebar({
  purchaseOrder,
  open,
  onOpenChange,
  onUpdate,
  reviewInfo = null,
  onValidated,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const { updateImportedPurchaseOrder, loading: updateLoading } =
    useUpdateImportedPurchaseOrder();
  const { deleteImportedPurchaseOrder, loading: deleteLoading } =
    useDeleteImportedPurchaseOrder();
  const { validateImportedPurchaseOrder, loading: validateLoading } =
    useValidateImportedPurchaseOrder();

  const isLoading = updateLoading || deleteLoading || validateLoading;

  if (!purchaseOrder) return null;

  const needsValidation =
    purchaseOrder.status === "PENDING_REVIEW" ||
    purchaseOrder.status === "UPLOADED";
  const isReviewMode = !!reviewInfo;

  const handleEdit = () => {
    setEditData({
      originalPurchaseOrderNumber:
        purchaseOrder.originalPurchaseOrderNumber || "",
      vendorName: purchaseOrder.vendor?.name || "",
      vendorSiret: purchaseOrder.vendor?.siret || "",
      clientName: purchaseOrder.client?.name || "",
      clientSiret: purchaseOrder.client?.siret || "",
      purchaseOrderDate: purchaseOrder.purchaseOrderDate?.split("T")[0] || "",
      deliveryDate: purchaseOrder.deliveryDate?.split("T")[0] || "",
      dueDate: purchaseOrder.dueDate?.split("T")[0] || "",
      totalHT: purchaseOrder.totalHT || 0,
      totalVAT: purchaseOrder.totalVAT || 0,
      totalTTC: purchaseOrder.totalTTC || 0,
      category: purchaseOrder.category || "OTHER",
      paymentMethod: purchaseOrder.paymentMethod || "UNKNOWN",
      notes: purchaseOrder.notes || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateImportedPurchaseOrder({
        variables: { id: purchaseOrder.id, input: editData },
      });
      toast.success("Bon de commande mis à jour");
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleValidate = async () => {
    try {
      if (isEditing) {
        await updateImportedPurchaseOrder({
          variables: { id: purchaseOrder.id, input: editData },
        });
        setIsEditing(false);
      }
      await validateImportedPurchaseOrder({
        variables: { id: purchaseOrder.id },
      });
      toast.success("Bon de commande validé");
      onUpdate?.();
      if (isReviewMode) {
        onValidated?.();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error(
        error?.message || "Erreur lors de la validation du bon de commande",
      );
    }
  };

  const handleSkip = () => {
    setIsEditing(false);
    onValidated?.();
  };

  const handleDelete = async () => {
    try {
      await deleteImportedPurchaseOrder({
        variables: { id: purchaseOrder.id },
      });
      toast.success("Bon de commande supprimé");
      onUpdate?.();
      if (isReviewMode) {
        onValidated?.();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: purchaseOrder.currency || "EUR",
    }).format(amount || 0);
  };

  const handleDownload = () => {
    if (purchaseOrder.file?.url) {
      window.open(purchaseOrder.file.url, "_blank");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full overflow-hidden">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          {isReviewMode && (
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Validation des imports · {reviewInfo.current}/{reviewInfo.total}
            </p>
          )}
          <div className="flex items-center gap-3">
            <SheetTitle className="text-base font-medium">
              Bon de commande importé
            </SheetTitle>
            <Badge
              className={
                IMPORTED_PURCHASE_ORDER_STATUS_COLORS[purchaseOrder.status]
              }
            >
              {IMPORTED_PURCHASE_ORDER_STATUS_LABELS[purchaseOrder.status]}
            </Badge>
            {purchaseOrder.isDuplicate && (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-700"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Doublon
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 space-y-6">
            <div className="text-center py-4">
              <p className="text-3xl font-bold">
                {formatAmount(purchaseOrder.totalTTC)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                HT: {formatAmount(purchaseOrder.totalHT)} | TVA:{" "}
                {formatAmount(purchaseOrder.totalVAT)}
              </p>
            </div>

            <Separator />

            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>N° Bon de commande</Label>
                  <Input
                    value={editData.originalPurchaseOrderNumber}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        originalPurchaseOrderNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fournisseur</Label>
                  <Input
                    value={editData.vendorName}
                    onChange={(e) =>
                      setEditData({ ...editData, vendorName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SIRET Fournisseur</Label>
                  <Input
                    value={editData.vendorSiret}
                    onChange={(e) =>
                      setEditData({ ...editData, vendorSiret: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Input
                    value={editData.clientName}
                    onChange={(e) =>
                      setEditData({ ...editData, clientName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date du bon de commande</Label>
                  <Input
                    type="date"
                    value={editData.purchaseOrderDate}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        purchaseOrderDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de livraison</Label>
                  <Input
                    type="date"
                    value={editData.deliveryDate}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        deliveryDate: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label>HT</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.totalHT ?? ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          totalHT:
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TVA</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.totalVAT ?? ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          totalVAT:
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TTC</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editData.totalTTC ?? ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          totalTTC:
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2 w-full">
                  <Label>Catégorie</Label>
                  <Select
                    value={editData.category}
                    onValueChange={(value) =>
                      setEditData({ ...editData, category: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 w-full">
                  <Label>Paiement</Label>
                  <Select
                    value={editData.paymentMethod}
                    onValueChange={(value) =>
                      setEditData({ ...editData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PAYMENT_METHOD_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Fournisseur
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {purchaseOrder.vendor?.name || "Non spécifié"}
                      </p>
                      {purchaseOrder.vendor?.siret && (
                        <p className="text-xs text-muted-foreground">
                          SIRET: {purchaseOrder.vendor.siret}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Informations
                  </p>

                  {purchaseOrder.originalPurchaseOrderNumber && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        N° BC
                      </span>
                      <span className="text-sm font-medium">
                        {purchaseOrder.originalPurchaseOrderNumber}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date</span>
                    <span className="text-sm">
                      {purchaseOrder.purchaseOrderDate
                        ? formatDateToFrench(purchaseOrder.purchaseOrderDate)
                        : "Non spécifiée"}
                    </span>
                  </div>

                  {purchaseOrder.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Livraison
                      </span>
                      <span className="text-sm">
                        {formatDateToFrench(purchaseOrder.deliveryDate)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Catégorie
                    </span>
                    <span className="text-sm">
                      {EXPENSE_CATEGORY_LABELS[purchaseOrder.category] ||
                        "Autre"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Paiement
                    </span>
                    <span className="text-sm">
                      {PAYMENT_METHOD_LABELS[purchaseOrder.paymentMethod] ||
                        "Non spécifié"}
                    </span>
                  </div>

                  {purchaseOrder.ocrData?.confidence > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Confiance OCR
                      </span>
                      <span className="text-sm">
                        {Math.round(purchaseOrder.ocrData.confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <Separator />

            {purchaseOrder.file && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Document
                </p>
                <div
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50"
                  onClick={handleDownload}
                >
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {purchaseOrder.file.originalFileName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {purchaseOrder.file.fileSize
                        ? `${Math.round(purchaseOrder.file.fileSize / 1024)} KB`
                        : "PDF"}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {purchaseOrder.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Notes
                  </p>
                  <p className="text-sm">{purchaseOrder.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4 mt-auto shrink-0 bg-background">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                className="flex-1"
                onClick={isReviewMode ? handleValidate : handleSave}
                disabled={isLoading}
              >
                {updateLoading || validateLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isReviewMode ? (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isReviewMode ? "Enregistrer et valider" : "Enregistrer"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {needsValidation && (
                <Button
                  className="w-full"
                  onClick={handleValidate}
                  disabled={isLoading}
                >
                  {validateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Valider
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Supprimer ce bon de commande ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Le bon de commande sera
                        définitivement supprimé.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              {isReviewMode && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Passer
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
