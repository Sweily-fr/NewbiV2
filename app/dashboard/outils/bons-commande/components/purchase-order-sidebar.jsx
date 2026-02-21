"use client";

import { useState } from "react";
import {
  X,
  FileText,
  Building,
  Clock,
  Package,
  Percent,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  FileCheck,
  Send,
  Download,
  Play,
  Truck,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  useChangePurchaseOrderStatus,
  usePurchaseOrder,
  useConvertPurchaseOrderToInvoice,
  useDeletePurchaseOrder,
  PURCHASE_ORDER_STATUS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
} from "@/src/graphql/purchaseOrderQueries";
import { toast } from "@/src/components/ui/sonner";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFDownloader from "@/src/components/pdf/UniversalPDFDownloader";

export default function PurchaseOrderSidebar({
  isOpen,
  onClose,
  purchaseOrder: initialPurchaseOrder,
  onRefetch,
  isViewMode = false,
}) {
  const router = useRouter();
  const { changeStatus, loading: changingStatus } = useChangePurchaseOrderStatus();
  const { convertToInvoice, loading: converting } = useConvertPurchaseOrderToInvoice();
  const { deletePurchaseOrder, loading: deleting } = useDeletePurchaseOrder();

  // Recuperer les donnees completes du bon de commande
  const {
    purchaseOrder: fullPurchaseOrder,
    loading: loadingFullPurchaseOrder,
    error: purchaseOrderError,
  } = usePurchaseOrder(initialPurchaseOrder?.id);

  if (!isOpen || !initialPurchaseOrder) return null;

  // Utiliser les donnees completes si disponibles, sinon les donnees initiales
  const purchaseOrder = fullPurchaseOrder || initialPurchaseOrder;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non definie";

    let date;
    // Gerer differents formats de date
    if (typeof dateString === "string" && /^\d+$/.test(dateString)) {
      date = new Date(parseInt(dateString));
    } else if (typeof dateString === "number") {
      date = new Date(dateString);
    } else {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      return "Date invalide";
    }

    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return date.toLocaleDateString("fr-FR", options);
  };

  const isValidUntilExpired = () => {
    if (!purchaseOrder.validUntil) return false;
    const validDate = new Date(purchaseOrder.validUntil);
    const today = new Date();
    return validDate < today;
  };

  const handleEdit = () => {
    router.push(`/dashboard/outils/bons-commande/${purchaseOrder.id}/editer`);
    onClose();
  };

  const handleView = () => {
    router.push(`/dashboard/outils/bons-commande/${purchaseOrder.id}`);
    onClose();
  };

  const handleConfirm = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.CONFIRMED);
      toast.success("Bon de commande confirmé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de la confirmation du bon de commande");
    }
  };

  const handleStartProgress = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.IN_PROGRESS);
      toast.success("Bon de commande en cours de traitement");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const handleDeliver = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.DELIVERED);
      toast.success("Bon de commande marqué comme livré");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.CANCELED);
      toast.success("Bon de commande annulé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de l'annulation du bon de commande");
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      const result = await convertToInvoice(purchaseOrder.id);
      toast.success("Bon de commande converti en facture avec succès");
      if (result?.id) {
        router.push(`/dashboard/outils/factures/${result.id}/editer`);
      } else {
        router.push("/dashboard/outils/factures");
      }
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la conversion en facture");
    }
  };

  const handleDelete = async () => {
    try {
      await deletePurchaseOrder(purchaseOrder.id);
      toast.success("Bon de commande supprimé avec succès");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la suppression du bon de commande");
    }
  };

  const isLoading = changingStatus || converting || deleting;

  // Determiner les statuts utiles
  const isDraft = purchaseOrder.status === PURCHASE_ORDER_STATUS.DRAFT;
  const isConfirmed = purchaseOrder.status === PURCHASE_ORDER_STATUS.CONFIRMED;
  const isInProgress = purchaseOrder.status === PURCHASE_ORDER_STATUS.IN_PROGRESS;
  const isDelivered = purchaseOrder.status === PURCHASE_ORDER_STATUS.DELIVERED;
  const canConvertToInvoice =
    (isConfirmed || isInProgress || isDelivered) &&
    (!purchaseOrder.linkedInvoices || purchaseOrder.linkedInvoices.length === 0);

  return (
    <>
      {/* Semi-transparent overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* PDF Preview Panel */}
      <div
        className={`fixed inset-y-0 left-0 right-[35%] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-black/80 p-0 flex items-start justify-center overflow-y-auto py-12 px-24">
          <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white">
            <UniversalPreviewPDF data={purchaseOrder} type="purchaseOrder" />
          </div>
        </div>
      </div>

      {/* Main Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-[35%] bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex flex-col gap-2">
              <h2 className="font-normal text-lg">
                Bon de commande {purchaseOrder.prefix && purchaseOrder.number ? `${purchaseOrder.prefix}-${purchaseOrder.number}` : purchaseOrder.number || "Brouillon"}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    purchaseOrder.status === 'DRAFT'
                      ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                      : purchaseOrder.status === 'CONFIRMED'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                      : purchaseOrder.status === 'IN_PROGRESS'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
                      : purchaseOrder.status === 'DELIVERED'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                  }`}
                >
                  {PURCHASE_ORDER_STATUS_LABELS[purchaseOrder.status] || purchaseOrder.status}
                </span>
                {isValidUntilExpired() && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                    Expiré
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Bouton PDF - masque pour les brouillons */}
              {purchaseOrder.status !== PURCHASE_ORDER_STATUS.DRAFT && (
                <UniversalPDFDownloader data={purchaseOrder} type="purchaseOrder" />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="h-8 w-8 p-0 relative z-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* Client Info */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client</h3>
              {purchaseOrder.client ? (
                <div className="space-y-1.5">
                  <div>
                    <p className="font-medium">{purchaseOrder.client.name}</p>
                    {purchaseOrder.client.email && (
                      <p className="text-sm text-muted-foreground">
                        {purchaseOrder.client.email}
                      </p>
                    )}
                  </div>
                  {purchaseOrder.client.address && (
                    <div className="text-sm text-muted-foreground">
                      {purchaseOrder.client.address.street && (
                        <p>{purchaseOrder.client.address.street}</p>
                      )}
                      {(purchaseOrder.client.address.postalCode ||
                        purchaseOrder.client.address.city) && (
                        <p>
                          {purchaseOrder.client.address.postalCode &&
                            purchaseOrder.client.address.postalCode}
                          {purchaseOrder.client.address.postalCode &&
                            purchaseOrder.client.address.city &&
                            " "}
                          {purchaseOrder.client.address.city &&
                            purchaseOrder.client.address.city}
                        </p>
                      )}
                      {purchaseOrder.client.address.country && (
                        <p>{purchaseOrder.client.address.country}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Aucun client sélectionné
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dates</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date d'émission</span>
                  <span>{formatDate(purchaseOrder.issueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valide jusqu'au</span>
                  <span
                    className={
                      isValidUntilExpired() ? "text-red-600 font-medium" : ""
                    }
                  >
                    {formatDate(purchaseOrder.validUntil)}
                    {isValidUntilExpired() && (
                      <span className="text-xs block text-red-500">Expiré</span>
                    )}
                  </span>
                </div>
                {purchaseOrder.deliveryDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Date de livraison
                    </span>
                    <span>{formatDate(purchaseOrder.deliveryDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Source Quote */}
            {purchaseOrder.sourceQuote && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Devis source</h3>
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    {purchaseOrder.sourceQuote.prefix}-{purchaseOrder.sourceQuote.number}
                  </span>
                </div>
              </div>
            )}

            {/* Articles */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Articles</h3>
              <div className="space-y-1.5">
                {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                  purchaseOrder.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      <div className="font-medium">
                        {item.description || "Article sans description"}
                      </div>
                      <div className="text-muted-foreground">
                        {item.quantity || 0} ×{" "}
                        {formatCurrency(item.unitPrice || 0)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Aucun article</p>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Totaux</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span>{formatCurrency(purchaseOrder.totalHT || 0)}</span>
                </div>
                {purchaseOrder.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remise</span>
                    <span>-{formatCurrency(purchaseOrder.discountAmount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total HT</span>
                  <span>
                    {formatCurrency(
                      purchaseOrder.finalTotalHT !== undefined && purchaseOrder.finalTotalHT !== null
                        ? purchaseOrder.finalTotalHT
                        : purchaseOrder.totalHT !== undefined && purchaseOrder.totalHT !== null
                          ? purchaseOrder.totalHT
                          : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA</span>
                  <span>
                    {formatCurrency(
                      purchaseOrder.finalTotalVAT !== undefined && purchaseOrder.finalTotalVAT !== null
                        ? purchaseOrder.finalTotalVAT
                        : purchaseOrder.totalVAT !== undefined && purchaseOrder.totalVAT !== null
                          ? purchaseOrder.totalVAT
                          : 0
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total TTC</span>
                  <span>
                    {formatCurrency(
                      purchaseOrder.finalTotalTTC !== undefined && purchaseOrder.finalTotalTTC !== null
                        ? purchaseOrder.finalTotalTTC
                        : purchaseOrder.totalTTC !== undefined && purchaseOrder.totalTTC !== null
                          ? purchaseOrder.totalTTC
                          : 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Linked Invoices */}
            {purchaseOrder.linkedInvoices && purchaseOrder.linkedInvoices.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Factures liées</h3>
                <div className="space-y-1.5">
                  {purchaseOrder.linkedInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex justify-between items-center text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
                      onClick={() => {
                        router.push(`/dashboard/outils/factures/${invoice.id}`);
                        onClose();
                      }}
                    >
                      <span className="text-muted-foreground">
                        Facture {invoice.number}
                      </span>
                      <span>{formatCurrency(invoice.finalTotalTTC || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="border-t p-6 space-y-3">
            {/* Primary Actions */}
            <div className="flex gap-2">
              {isDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Éditer
                </Button>
              )}
            </div>

            {/* Status Actions - DRAFT: Confirm */}
            {isDraft && (
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer le bon de commande
              </Button>
            )}

            {/* Status Actions - CONFIRMED: Start / Cancel */}
            {isConfirmed && (
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={handleStartProgress}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Démarrer le traitement
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler le bon de commande
                </Button>
              </div>
            )}

            {/* Status Actions - IN_PROGRESS: Deliver / Cancel */}
            {isInProgress && (
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={handleDeliver}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Marquer comme livré
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler le bon de commande
                </Button>
              </div>
            )}

            {/* Convert to Invoice - available for CONFIRMED, IN_PROGRESS, DELIVERED */}
            {canConvertToInvoice && (
              <Button
                variant="outline"
                onClick={handleConvertToInvoice}
                disabled={isLoading}
                className="w-full font-normal text-sm"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Convertir en facture
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
