"use client";

import { useState, useEffect } from "react";
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
  RotateCcw,
  LoaderCircle,
} from "lucide-react";
import { motion } from "framer-motion";
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
import { useQuery } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  useChangePurchaseOrderStatus,
  usePurchaseOrder,
  useDeletePurchaseOrder,
  PURCHASE_ORDER_STATUS,
  PURCHASE_ORDER_STATUS_LABELS,
  PURCHASE_ORDER_STATUS_COLORS,
  PURCHASE_ORDER_DOCUMENT_URL,
} from "@/src/graphql/purchaseOrderQueries";
import { getDraftEffectiveDates } from "@/src/utils/dateFormatter";
import { toast } from "@/src/components/ui/sonner";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFDownloaderWithFacturX from "@/src/components/pdf/UniversalPDFDownloaderWithFacturX";

export default function PurchaseOrderSidebar({
  isOpen,
  onClose,
  purchaseOrder: initialPurchaseOrder,
  onRefetch,
  isViewMode = false,
}) {
  const router = useRouter();
  const { changeStatus, loading: changingStatus } =
    useChangePurchaseOrderStatus();
  const { deletePurchaseOrder, loading: deleting } = useDeletePurchaseOrder();
  const { workspaceId } = useRequiredWorkspace();

  // URL du PDF archivé (R2) — uniquement hors brouillon
  const { data: poDocData } = useQuery(PURCHASE_ORDER_DOCUMENT_URL, {
    variables: { workspaceId, purchaseOrderId: initialPurchaseOrder?.id },
    skip:
      !workspaceId ||
      !initialPurchaseOrder?.id ||
      initialPurchaseOrder?.status === PURCHASE_ORDER_STATUS.DRAFT,
    fetchPolicy: "network-only",
  });
  const purchaseOrderDocumentUrl = poDocData?.purchaseOrderDocumentUrl || null;

  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Recuperer les donnees completes du bon de commande
  const {
    purchaseOrder: fullPurchaseOrder,
    loading: loadingFullPurchaseOrder,
    error: purchaseOrderError,
  } = usePurchaseOrder(initialPurchaseOrder?.id);

  if (!initialPurchaseOrder) return null;

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
      toast.success("Bon de commande mis en attente");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de la confirmation du bon de commande");
    }
  };

  const handleValidate = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.VALIDATED);
      toast.success("Bon de commande validé par le client");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de la validation du bon de commande");
    }
  };

  const handleStartProgress = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.IN_PROGRESS);
      toast.success("Bon de commande en cours de traitement");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors du changement de statut");
    }
  };

  const handleDeliver = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.DELIVERED);
      toast.success("Bon de commande marqué comme livré");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors du changement de statut");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.CANCELED);
      toast.success("Bon de commande annulé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de l'annulation du bon de commande");
    }
  };

  const handleRevertToDraft = async () => {
    try {
      await changeStatus(purchaseOrder.id, PURCHASE_ORDER_STATUS.DRAFT);
      toast.success("Bon de commande repassé en brouillon");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors du passage en brouillon");
    }
  };

  const handleConvertToInvoice = () => {
    const po = purchaseOrder;
    sessionStorage.setItem(
      "purchaseOrderInvoiceData",
      JSON.stringify({
        sourcePurchaseOrderId: po.id,
        purchaseOrderNumber: `${po.prefix || ""}-${po.number || ""}`,
        client: po.client,
        items: po.items,
        discount: po.discount,
        discountType: po.discountType,
        customFields: po.customFields,
        shipping: po.shipping,
        isReverseCharge: po.isReverseCharge,
        retenueGarantie: po.retenueGarantie,
        escompte: po.escompte,
      }),
    );
    router.push("/dashboard/outils/factures/new");
    onClose();
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

  const isLoading = changingStatus || deleting;

  // Determiner les statuts utiles
  const isDraft = purchaseOrder.status === PURCHASE_ORDER_STATUS.DRAFT;
  const isConfirmed = purchaseOrder.status === PURCHASE_ORDER_STATUS.CONFIRMED;
  const isValidated = purchaseOrder.status === PURCHASE_ORDER_STATUS.VALIDATED;
  const isInProgress =
    purchaseOrder.status === PURCHASE_ORDER_STATUS.IN_PROGRESS;
  const isDelivered = purchaseOrder.status === PURCHASE_ORDER_STATUS.DELIVERED;
  const hasLinkedInvoices =
    !!purchaseOrder.linkedInvoices && purchaseOrder.linkedInvoices.length > 0;
  const canConvertToInvoice =
    (isValidated || isInProgress || isDelivered) && !hasLinkedInvoices;
  // Annulation possible uniquement avant validation client
  const canCancel = (isDraft || isConfirmed) && !hasLinkedInvoices;

  return (
    <>
      {/* Semi-transparent overlay (dim léger sur toute la page) */}
      <motion.div
        className="fixed inset-0 z-40 bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={onClose}
      />

      {/* Backdrop sombre sur la zone preview - fade in après la sidebar */}
      <motion.div
        className="fixed inset-y-0 left-0 md:right-[40%] right-0 z-40 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1, ease: "easeOut" } }}
        transition={{ duration: 0.2, delay: 0.2, ease: "easeOut" }}
      />

      {/* PDF Preview Section - slide depuis la gauche après le backdrop */}
      <motion.div
        className="fixed inset-y-0 left-0 md:right-[40%] right-0 z-50 pointer-events-none"
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{
          x: "-100%",
          transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
        }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <div className="absolute inset-0 p-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">
          {loadingFullPurchaseOrder && !fullPurchaseOrder ? (
            <div className="flex items-center justify-center w-full min-h-[calc(100%-4rem)] pointer-events-auto">
              <LoaderCircle className="h-8 w-8 animate-spin text-white/80" />
            </div>
          ) : (
            <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white pointer-events-auto">
              {purchaseOrderDocumentUrl &&
              purchaseOrder.status !== PURCHASE_ORDER_STATUS.DRAFT ? (
                <iframe
                  src={`${purchaseOrderDocumentUrl}#toolbar=0&navpanes=0&view=FitH`}
                  title={`Bon de commande ${purchaseOrder.prefix || ""}${purchaseOrder.number || ""}`}
                  className="w-full h-full min-h-[297mm] border-0"
                />
              ) : (
                <UniversalPreviewPDF
                  data={purchaseOrder}
                  type="purchaseOrder"
                  recalcDraftDates
                />
              )}
            </div>
          )}
        </div>

        {/* Bouton flottant pour ouvrir les détails sur mobile */}
        <Button
          onClick={() => setShowMobileDetails(true)}
          className="md:hidden fixed bottom-6 right-6 z-[60] rounded-full h-14 w-14 shadow-lg pointer-events-auto"
          size="icon"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Main Sidebar - Hidden on mobile by default, shown in modal */}
      <motion.div
        className="fixed inset-y-0 right-0 z-50 md:w-[40%] w-full bg-background border-l shadow-lg flex flex-col"
        initial={{ x: "100%" }}
        animate={{ x: isMobile && !showMobileDetails ? "100%" : 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-6 py-4 border-b">
          <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
            <h2 className="text-base font-medium">
              Bon de commande{" "}
              {purchaseOrder.prefix && purchaseOrder.number
                ? `${purchaseOrder.prefix}-${purchaseOrder.number}`
                : purchaseOrder.number || "Brouillon"}
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                  purchaseOrder.status === "DRAFT"
                    ? "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"
                    : purchaseOrder.status === "CONFIRMED"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                      : purchaseOrder.status === "VALIDATED"
                        ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : purchaseOrder.status === "IN_PROGRESS"
                          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                          : purchaseOrder.status === "DELIVERED"
                            ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {PURCHASE_ORDER_STATUS_LABELS[purchaseOrder.status] ||
                  purchaseOrder.status}
              </span>
              {isValidUntilExpired() && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  Expiré
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Bouton PDF - masque pour les brouillons */}
            {purchaseOrder.status !== PURCHASE_ORDER_STATUS.DRAFT && (
              <UniversalPDFDownloaderWithFacturX
                data={purchaseOrder}
                type="purchaseOrder"
                variant="primary"
                className="gap-1.5 font-medium"
                enableFacturX={false}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth < 768 && showMobileDetails) {
                  setShowMobileDetails(false);
                } else {
                  setShowMobileDetails(false);
                  onClose();
                }
              }}
              className="h-8 w-8 bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] dark:bg-[rgba(255,255,255,0.06)] dark:hover:bg-[rgba(255,255,255,0.1)]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client Info */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Client
            </p>
            {purchaseOrder.client ? (
              <div className="space-y-2">
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
              <p className="text-sm text-muted-foreground">
                Aucun client sélectionné
              </p>
            )}
          </div>

          <Separator />

          {/* Adresse de livraison */}
          {(() => {
            const shippingData = purchaseOrder.shipping;
            const renderShipping = (addr) => (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Adresse de livraison
                </p>
                <div className="text-sm text-muted-foreground">
                  {addr.fullName && (
                    <p className="font-medium text-foreground">
                      {addr.fullName}
                    </p>
                  )}
                  {addr.street && <p>{addr.street}</p>}
                  {(addr.postalCode || addr.city) && (
                    <p>
                      {addr.postalCode}
                      {addr.postalCode && addr.city && " "}
                      {addr.city}
                    </p>
                  )}
                  {addr.country && <p>{addr.country}</p>}
                </div>
              </div>
            );
            if (shippingData?.shippingAddress && shippingData?.billShipping) {
              return (
                <>
                  {renderShipping(shippingData.shippingAddress)}
                  <Separator />
                </>
              );
            }
            if (
              purchaseOrder.client?.hasDifferentShippingAddress &&
              purchaseOrder.client?.shippingAddress
            ) {
              return (
                <>
                  {renderShipping(purchaseOrder.client.shippingAddress)}
                  <Separator />
                </>
              );
            }
            return null;
          })()}

          {/* Dates */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Dates
            </p>
            <div className="space-y-2">
              {/* Pour un brouillon repris plus tard, on affiche les dates
                    recalées (jour J / validité) et l'ancienne date entre
                    parenthèses, car elles seront mises à jour à la finalisation. */}
              {(() => {
                const draftDates = isDraft
                  ? getDraftEffectiveDates(
                      purchaseOrder.issueDate,
                      purchaseOrder.validUntil,
                    )
                  : null;
                const refreshed = draftDates?.changed;
                return (
                  <>
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Date d'émission
                      </span>
                      <span className="flex flex-col items-end text-sm font-normal">
                        <span>
                          {formatDate(
                            refreshed
                              ? draftDates.issue.effective
                              : purchaseOrder.issueDate,
                          )}
                        </span>
                        {refreshed && draftDates.issue.original && (
                          <span className="text-xs text-muted-foreground">
                            (ancienne&nbsp;:{" "}
                            {formatDate(draftDates.issue.original)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Valide jusqu'au
                      </span>
                      <span
                        className={`flex flex-col items-end text-sm font-normal ${
                          !refreshed && isValidUntilExpired()
                            ? "text-red-600 font-medium"
                            : ""
                        }`}
                      >
                        <span>
                          {formatDate(
                            refreshed
                              ? draftDates.second.effective
                              : purchaseOrder.validUntil,
                          )}
                          {!refreshed && isValidUntilExpired() && (
                            <span className="text-xs block text-red-500">
                              Expiré
                            </span>
                          )}
                        </span>
                        {refreshed && draftDates.second.original && (
                          <span className="text-xs text-muted-foreground">
                            (ancienne&nbsp;:{" "}
                            {formatDate(draftDates.second.original)})
                          </span>
                        )}
                      </span>
                    </div>
                  </>
                );
              })()}
              {purchaseOrder.deliveryDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Date de livraison
                  </span>
                  <span className="text-sm font-normal">
                    {formatDate(purchaseOrder.deliveryDate)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Source Quote */}
          {purchaseOrder.sourceQuote && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                  Devis source
                </p>
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    {purchaseOrder.sourceQuote.prefix}-
                    {purchaseOrder.sourceQuote.number}
                  </span>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Articles */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Articles
            </p>
            <div className="space-y-2">
              {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                purchaseOrder.items.map((item, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-normal">
                      {item.description || "Article sans description"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity || 0} ×{" "}
                      {formatCurrency(item.unitPrice || 0)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucun article</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Totaux
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-muted-foreground">
                  Sous-total HT
                </span>
                <span className="text-sm font-normal">
                  {formatCurrency(purchaseOrder.totalHT || 0)}
                </span>
              </div>
              {purchaseOrder.discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground">
                    Remise
                  </span>
                  <span className="text-sm font-normal">
                    -{formatCurrency(purchaseOrder.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-muted-foreground">
                  Total HT
                </span>
                <span className="text-sm font-normal">
                  {formatCurrency(
                    purchaseOrder.finalTotalHT !== undefined &&
                      purchaseOrder.finalTotalHT !== null
                      ? purchaseOrder.finalTotalHT
                      : purchaseOrder.totalHT !== undefined &&
                          purchaseOrder.totalHT !== null
                        ? purchaseOrder.totalHT
                        : 0,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-muted-foreground">
                  TVA
                </span>
                <span className="text-sm font-normal">
                  {formatCurrency(
                    purchaseOrder.finalTotalVAT !== undefined &&
                      purchaseOrder.finalTotalVAT !== null
                      ? purchaseOrder.finalTotalVAT
                      : purchaseOrder.totalVAT !== undefined &&
                          purchaseOrder.totalVAT !== null
                        ? purchaseOrder.totalVAT
                        : 0,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total TTC</span>
                <span className="text-sm font-medium">
                  {formatCurrency(
                    purchaseOrder.finalTotalTTC !== undefined &&
                      purchaseOrder.finalTotalTTC !== null
                      ? purchaseOrder.finalTotalTTC
                      : purchaseOrder.totalTTC !== undefined &&
                          purchaseOrder.totalTTC !== null
                        ? purchaseOrder.totalTTC
                        : 0,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Invoices */}
          {purchaseOrder.linkedInvoices &&
            purchaseOrder.linkedInvoices.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Factures liées
                  </p>
                  <div className="space-y-2">
                    {purchaseOrder.linkedInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex justify-between items-center text-sm cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2"
                        onClick={() => {
                          router.push(
                            `/dashboard/outils/factures/${invoice.id}`,
                          );
                          onClose();
                        }}
                      >
                        <span className="text-muted-foreground">
                          Facture {invoice.number}
                        </span>
                        <span>
                          {formatCurrency(invoice.finalTotalTTC || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
        </div>

        {/* Action Buttons */}
        <div className="border-t px-6 py-4 space-y-3">
          {/* DRAFT: Éditer + Confirmer (paire) */}
          {isDraft && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleEdit}
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Éditer
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer
              </Button>
            </div>
          )}

          {/* CONFIRMED: Repasser brouillon / Valider (paire) + Annuler (full) */}
          {isConfirmed && (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRevertToDraft}
                  disabled={isLoading}
                  className="flex-1 font-normal"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Repasser brouillon
                </Button>
                <Button
                  variant="primary"
                  onClick={handleValidate}
                  disabled={isLoading}
                  className="flex-1 font-normal"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Valider
                </Button>
              </div>
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="w-full font-normal"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler le bon de commande
                </Button>
              )}
            </>
          )}

          {/* VALIDATED: Démarrer le traitement (single) */}
          {isValidated && (
            <Button
              variant="primary"
              onClick={handleStartProgress}
              disabled={isLoading}
              className="w-full font-normal"
            >
              <Play className="h-4 w-4 mr-2" />
              Démarrer le traitement
            </Button>
          )}

          {/* IN_PROGRESS: Marquer comme livré (single) */}
          {isInProgress && (
            <Button
              variant="primary"
              onClick={handleDeliver}
              disabled={isLoading}
              className="w-full font-normal"
            >
              <Truck className="h-4 w-4 mr-2" />
              Marquer comme livré
            </Button>
          )}

          {/* Convertir en facture - disponible pour VALIDATED, IN_PROGRESS, DELIVERED sans facture liée */}
          {canConvertToInvoice && (
            <Button
              variant="outline"
              onClick={handleConvertToInvoice}
              disabled={isLoading}
              className="w-full font-normal"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Convertir en facture
            </Button>
          )}
        </div>
      </motion.div>
    </>
  );
}
