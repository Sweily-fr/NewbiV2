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
  ShoppingCart,
  LoaderCircle,
  Ban,
  ShieldCheck,
  ScrollText,
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
import { useLazyQuery } from "@apollo/client";
import {
  useChangeQuoteStatus,
  useQuote,
  QUOTE_STATUS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
} from "@/src/graphql/quoteQueries";
import { GET_CLIENT } from "@/src/graphql/clientQueries";
import { getDraftEffectiveDates } from "@/src/utils/dateFormatter";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFDownloaderWithFacturX from "@/src/components/pdf/UniversalPDFDownloaderWithFacturX";

import CreateLinkedInvoicePopover from "./create-linked-invoice-popover";
import LinkedInvoicesList from "./linked-invoices-list";
import { SignatureStatusBadge } from "@/src/components/esignature/signature-status-badge";
import {
  useDocumentSignatureStatus,
  useCancelSignature,
} from "@/src/hooks/useESignature";

export default function QuoteSidebar({
  isOpen,
  onClose,
  quote: initialQuote,
  onRefetch,
  isViewMode = false,
}) {
  const router = useRouter();
  const { changeStatus, loading: changingStatus } = useChangeQuoteStatus();
  const { workspaceId } = useRequiredWorkspace();

  const [fetchClient] = useLazyQuery(GET_CLIENT, {
    fetchPolicy: "network-only",
  });

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

  // Récupérer les données complètes du devis
  const {
    quote: fullQuote,
    loading: loadingFullQuote,
    error: quoteError,
  } = useQuote(initialQuote?.id);

  // Statut de signature électronique
  const { signatureRequest: signatureStatus, refetch: refetchSignature } =
    useDocumentSignatureStatus("quote", initialQuote?.id);

  const { cancelSignature, loading: cancellingSignature } =
    useCancelSignature();

  // Quand la signature se termine, rafraîchir le devis pour mettre à jour
  // l'affichage (statut accepté, document signé, certificat de preuve).
  useEffect(() => {
    if (signatureStatus?.status === "DONE" && onRefetch) {
      onRefetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureStatus?.status]);

  if (!initialQuote) return null;

  // Utiliser les données complètes si disponibles, sinon les données initiales
  const quote = fullQuote || initialQuote;

  const calculateRemainingAmount = () => {
    if (!quote.linkedInvoices || quote.linkedInvoices.length === 0) {
      return quote.finalTotalTTC;
    }
    const totalInvoiced = quote.linkedInvoices.reduce((sum, invoice) => {
      return sum + (invoice.finalTotalTTC || 0);
    }, 0);
    return quote.finalTotalTTC - totalInvoiced;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";

    let date;
    // Gérer différents formats de date
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
    if (!quote.validUntil) return false;
    const validDate = new Date(quote.validUntil);
    const today = new Date();
    return validDate < today;
  };

  const handleEdit = () => {
    router.push(`/dashboard/outils/devis/${quote.id}/editer`);
    onClose();
  };

  const handleView = () => {
    router.push(`/dashboard/outils/devis/${quote.id}`);
    onClose();
  };

  const handleSendQuote = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.PENDING);
      toast.success("Devis créé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de la création du devis");
    }
  };

  const handleAccept = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.COMPLETED);
      toast.success("Devis accepté");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de l'acceptation du devis");
    }
  };

  const handleCancelSignatureRequest = async () => {
    if (!signatureStatus?.id) return;
    const res = await cancelSignature(signatureStatus.id, "quote", quote.id);
    if (res?.success) {
      if (refetchSignature) refetchSignature();
      if (onRefetch) onRefetch();
    }
  };

  const handleConvertToPurchaseOrder = () => {
    try {
      sessionStorage.setItem(
        "quotePurchaseOrderData",
        JSON.stringify({
          sourceQuoteId: quote.id,
          purchaseOrderNumber: `${quote.prefix || ""}-${quote.number || ""}`,
          client: quote.client,
          items: quote.items,
          discount: quote.discount,
          discountType: quote.discountType,
          customFields: quote.customFields,
          shipping: quote.shipping,
          isReverseCharge: quote.isReverseCharge,
          retenueGarantie: quote.retenueGarantie,
          escompte: quote.escompte,
        }),
      );
      router.push("/dashboard/outils/bons-commande/new");
      onClose();
    } catch (error) {
      toast.error("Erreur lors de la conversion en bon de commande");
    }
  };

  const handleReject = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.CANCELED);
      toast.success("Devis rejeté");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors du rejet du devis");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(quote.id, QUOTE_STATUS.CANCELED);
      toast.success("Devis annulé");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error(error?.message || "Erreur lors de l'annulation du devis");
    }
  };

  const handleConvertToInvoice = async () => {
    let freshClient = quote.client;
    if (quote.client?.id && workspaceId) {
      try {
        const { data } = await fetchClient({
          variables: { workspaceId, id: quote.client.id },
        });
        if (data?.client) freshClient = data.client;
      } catch {
        // fallback sur le snapshot du devis si le refetch échoue
      }
    }
    sessionStorage.setItem(
      "quoteInvoiceData",
      JSON.stringify({
        sourceQuoteId: quote.id,
        purchaseOrderNumber: `${quote.prefix || ""}-${quote.number || ""}`,
        client: freshClient,
        items: quote.items,
        discount: quote.discount,
        discountType: quote.discountType,
        customFields: quote.customFields,
        shipping: quote.shipping,
        isReverseCharge: quote.isReverseCharge,
        retenueGarantie: quote.retenueGarantie,
        escompte: quote.escompte,
      }),
    );
    router.push("/dashboard/outils/factures/new");
    onClose();
  };

  const handleCreateLinkedInvoice = async ({ quoteId, amount, isDeposit }) => {
    const vatRate = 20;
    const unitPriceHT = amount / (1 + vatRate / 100);
    const remainingAmount = calculateRemainingAmount();
    const quoteRef = `${quote.prefix || ""}-${quote.number || ""}`;

    const hasOtherInvoices = quote.linkedInvoices?.length > 0;

    let description;
    if (isDeposit) {
      description = `Acompte sur devis ${quoteRef}`;
    } else if (amount >= remainingAmount - 0.01) {
      description = hasOtherInvoices
        ? `Facture de solde du devis ${quoteRef}`
        : `Facture sur devis ${quoteRef}`;
    } else {
      const percentage = quote.finalTotalTTC
        ? Math.round((amount / quote.finalTotalTTC) * 10000) / 100
        : 0;
      description = `Facture partielle de ${String(percentage).replace(".", ",")}% du devis ${quoteRef}`;
    }

    let freshClient = quote.client;
    if (quote.client?.id && workspaceId) {
      try {
        const { data } = await fetchClient({
          variables: { workspaceId, id: quote.client.id },
        });
        if (data?.client) freshClient = data.client;
      } catch {
        // fallback sur le snapshot du devis si le refetch échoue
      }
    }

    sessionStorage.setItem(
      "quoteLinkedInvoiceData",
      JSON.stringify({
        sourceQuoteId: quoteId,
        purchaseOrderNumber: quoteRef,
        client: freshClient,
        isDeposit,
        items: [
          {
            description,
            quantity: 1,
            unitPrice: unitPriceHT,
            vatRate,
            unit: "forfait",
            discount: 0,
            discountType: "FIXED",
            details: "",
            vatExemptionText: "",
          },
        ],
      }),
    );
    router.push("/dashboard/outils/factures/new");
    onClose();
  };

  const isLoading = changingStatus;

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
        {/* Aperçu : rendu HTML UniversalPreviewPDF, comme la sidebar facture.
            On n'utilise PAS l'iframe du PDF en cache (visualiseur natif = scroll). */}
        <div className="absolute inset-0 p-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">
          {loadingFullQuote && !fullQuote ? (
            <div className="flex items-center justify-center w-full min-h-[calc(100%-4rem)] pointer-events-auto">
              <LoaderCircle className="h-8 w-8 animate-spin text-white/80" />
            </div>
          ) : (
            <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white pointer-events-auto">
              <UniversalPreviewPDF data={quote} type="quote" recalcDraftDates />
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
              Devis{" "}
              {quote.prefix && quote.number
                ? `${quote.prefix}-${quote.number}`
                : quote.number || "Brouillon"}
            </h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                  quote.status === "DRAFT"
                    ? "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"
                    : quote.status === "PENDING" || quote.status === "IMPORTED"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                      : quote.status === "COMPLETED"
                        ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {QUOTE_STATUS_LABELS[quote.status] || quote.status}
              </span>
              {/* Statut de la signature CLIENT uniquement (quote.signatureStatus
                  ignore le cachet entreprise, contrairement au hook « dernière
                  demande » qui basculerait sur le cachet une fois lancé). */}
              {quote.signatureStatus && (
                <SignatureStatusBadge status={quote.signatureStatus} />
              )}
              {isValidUntilExpired() && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  Expiré
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Bouton PDF - masqué pour les brouillons */}
            {quote.status !== QUOTE_STATUS.DRAFT && (
              <UniversalPDFDownloaderWithFacturX
                data={quote}
                type="quote"
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
                // Sur mobile, fermer d'abord les détails, puis la sidebar
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
            {quote.client ? (
              <div className="space-y-0.5">
                <div>
                  <p className="font-medium">{quote.client.name}</p>
                  {quote.client.email && (
                    <p className="text-sm text-muted-foreground">
                      {quote.client.email}
                    </p>
                  )}
                </div>
                {quote.client.address && (
                  <div className="text-sm text-muted-foreground">
                    {quote.client.address.street && (
                      <p>{quote.client.address.street}</p>
                    )}
                    {(quote.client.address.postalCode ||
                      quote.client.address.city) && (
                      <p>
                        {quote.client.address.postalCode &&
                          quote.client.address.postalCode}
                        {quote.client.address.postalCode &&
                          quote.client.address.city &&
                          " "}
                        {quote.client.address.city && quote.client.address.city}
                      </p>
                    )}
                    {quote.client.address.country && (
                      <p>{quote.client.address.country}</p>
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
            const shippingData = quote.shipping;
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
              quote.client?.hasDifferentShippingAddress &&
              quote.client?.shippingAddress
            ) {
              return (
                <>
                  {renderShipping(quote.client.shippingAddress)}
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
                const draftDates =
                  quote.status === QUOTE_STATUS.DRAFT
                    ? getDraftEffectiveDates(quote.issueDate, quote.validUntil)
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
                              : quote.issueDate,
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
                              : quote.validUntil,
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
            </div>
          </div>

          <Separator />

          {/* Articles */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
              Articles
            </p>
            <div className="space-y-2">
              {quote.items && quote.items.length > 0 ? (
                quote.items.map((item, index) => (
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
                  {formatCurrency(quote.totalHT || 0)}
                </span>
              </div>
              {quote.discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-muted-foreground">
                    Remise
                  </span>
                  <span className="text-sm font-normal">
                    -{formatCurrency(quote.discountAmount || 0)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm font-normal text-muted-foreground">
                  Total HT
                </span>
                <span className="text-sm font-normal">
                  {formatCurrency(
                    quote.finalTotalHT !== undefined &&
                      quote.finalTotalHT !== null
                      ? quote.finalTotalHT
                      : quote.totalHT !== undefined && quote.totalHT !== null
                        ? quote.totalHT
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
                    quote.finalTotalVAT !== undefined &&
                      quote.finalTotalVAT !== null
                      ? quote.finalTotalVAT
                      : quote.totalVAT !== undefined && quote.totalVAT !== null
                        ? quote.totalVAT
                        : 0,
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total TTC</span>
                <span className="text-sm font-medium">
                  {formatCurrency(
                    quote.finalTotalTTC !== undefined &&
                      quote.finalTotalTTC !== null
                      ? quote.finalTotalTTC
                      : quote.totalTTC !== undefined && quote.totalTTC !== null
                        ? quote.totalTTC
                        : 0,
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Liste des factures liées */}
          {quote.status === QUOTE_STATUS.COMPLETED && (
            <>
              <Separator />
              <div className="space-y-3">
                <LinkedInvoicesList
                  quote={quote}
                  onCreateLinkedInvoice={handleCreateLinkedInvoice}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t px-6 py-4 space-y-3">
          {/* Annuler une demande de signature CLIENT en cours.
              On se base sur quote.signatureStatus (signature client) et pas sur le
              hook « dernière demande » : une fois le devis signé, ce dernier pointe
              sur le cachet entreprise et ne doit pas réafficher ce bouton. */}
          {["PENDING", "WAIT_VALIDATION", "WAIT_SIGN", "WAIT_SIGNER"].includes(
            quote.signatureStatus,
          ) &&
            signatureStatus?.id && (
              <Button
                variant="outline"
                onClick={handleCancelSignatureRequest}
                disabled={cancellingSignature}
                className="w-full font-normal text-red-600 hover:text-red-600"
              >
                {cancellingSignature ? (
                  <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                Annuler la demande de signature
              </Button>
            )}

          {/* Draft Actions */}
          {quote.status === QUOTE_STATUS.DRAFT && (
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
                onClick={handleSendQuote}
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                <Send className="h-4 w-4 mr-2" />
                Créer le devis
              </Button>
            </div>
          )}

          {/* Pending / Imported Actions */}
          {(quote.status === QUOTE_STATUS.PENDING ||
            quote.status === QUOTE_STATUS.IMPORTED) && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {quote.status === QUOTE_STATUS.IMPORTED
                  ? "Refuser le devis"
                  : "Annuler le devis"}
              </Button>
              {/* Accepter : UNIQUEMENT les devis importés. Les devis natifs sont
                  acceptés automatiquement via la signature électronique (pas de
                  bouton d'acceptation manuelle). */}
              {quote.status === QUOTE_STATUS.IMPORTED && (
                <Button
                  variant="primary"
                  onClick={handleAccept}
                  disabled={isLoading}
                  className="flex-1 font-normal"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accepter le devis
                </Button>
              )}
            </div>
          )}

          {/* Completed Actions */}
          {quote.status === QUOTE_STATUS.COMPLETED && (
            <div className="space-y-3">
              {/* Devis déjà facturé via un bon de commande : conversion directe impossible */}
              {quote.hasPurchaseOrderInvoices && (
                <p className="text-xs text-muted-foreground">
                  Ce devis a déjà été facturé via un bon de commande. Il ne peut
                  plus être converti directement en facture.
                </p>
              )}

              {/* Boutons de création de factures liées */}
              <div className="space-y-2">
                {/* Afficher le popover seulement s'il y a moins de 2 factures liées */}
                {!quote.hasPurchaseOrderInvoices &&
                  (!quote.linkedInvoices ||
                    quote.linkedInvoices.length < 2) && (
                    <CreateLinkedInvoicePopover
                      quote={quote}
                      onCreateLinkedInvoice={handleCreateLinkedInvoice}
                      isLoading={isLoading}
                    />
                  )}

                {/* Bouton pour créer la facture finale quand il y a exactement 2 factures liées */}
                {!quote.hasPurchaseOrderInvoices &&
                  quote.linkedInvoices &&
                  quote.linkedInvoices.length === 2 &&
                  (() => {
                    const totalInvoiced = quote.linkedInvoices.reduce(
                      (sum, invoice) => sum + (invoice.finalTotalTTC || 0),
                      0,
                    );
                    const remainingAmount =
                      (quote.finalTotalTTC || 0) - totalInvoiced;
                    return (
                      remainingAmount > 0 && (
                        <Button
                          onClick={() =>
                            handleCreateLinkedInvoice({
                              quoteId: quote.id,
                              amount: remainingAmount,
                              isDeposit: false,
                            })
                          }
                          disabled={isLoading}
                          className="w-full font-normal"
                        >
                          <FileCheck className="h-4 w-4 mr-2" />
                          Créer la facture finale (
                          {formatCurrency(remainingAmount)})
                        </Button>
                      )
                    );
                  })()}
              </div>

              <div className="flex flex-col gap-2">
                {/* Bouton de conversion complète */}
                {!quote.hasPurchaseOrderInvoices &&
                  (!quote.linkedInvoices ||
                    quote.linkedInvoices.length === 0) && (
                    <Button
                      variant="outline"
                      onClick={handleConvertToInvoice}
                      disabled={isLoading}
                      className="w-full font-normal"
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Conversion complète
                    </Button>
                  )}

                {/* Bouton de conversion en bon de commande */}
                <Button
                  variant="outline"
                  onClick={handleConvertToPurchaseOrder}
                  disabled={isLoading}
                  className="w-full font-normal"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Convertir en bon de commande
                </Button>
              </div>

              {/* Preuve de signature — traçabilité + document signé + certificat
                  de preuve (audit trail), disponible une fois le devis signé. */}
              {quote.signatureStatus === "DONE" && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                    Signature électronique vérifiée
                  </div>

                  {/* Signataires + date de signature */}
                  {Array.isArray(quote.signers) && quote.signers.length > 0 && (
                    <div className="space-y-1.5">
                      {quote.signers.map((signer, i) => (
                        <div
                          key={`${signer.email || "signer"}-${i}`}
                          className="flex items-start justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-foreground">
                              {[signer.name, signer.surname]
                                .filter(Boolean)
                                .join(" ") || signer.email}
                            </p>
                            {signer.email && (
                              <p className="truncate text-muted-foreground">
                                {signer.email}
                              </p>
                            )}
                          </div>
                          {signer.signedAt && (
                            <span className="shrink-0 text-muted-foreground">
                              {formatDate(signer.signedAt)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Téléchargements : document signé + certificat de preuve */}
                  <div className="flex flex-col gap-2">
                    {quote.signedDocumentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(quote.signedDocumentUrl, "_blank")
                        }
                        className="w-full font-normal"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Document signé
                      </Button>
                    )}
                    {quote.auditTrailUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(quote.auditTrailUrl, "_blank")
                        }
                        className="w-full font-normal"
                      >
                        <ScrollText className="h-4 w-4 mr-2" />
                        Certificat de preuve
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
