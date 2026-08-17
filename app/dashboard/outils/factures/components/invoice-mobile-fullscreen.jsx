"use client";

import { useEffect, useState } from "react";
import {
  X,
  CheckCircle,
  FileText,
  XCircle,
  LoaderCircle,
  Receipt,
  Pencil,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  useMarkInvoiceAsPaid,
  useChangeInvoiceStatus,
  useInvoice,
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  GET_SITUATION_INVOICES_BY_QUOTE_REF,
} from "@/src/graphql/invoiceQueries";
import { useLazyQuery } from "@apollo/client";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import { useCreditNotesByInvoice } from "@/src/graphql/creditNoteQueries";
import { hasReachedCreditNoteLimit } from "@/src/utils/creditNoteUtils";
import { toast } from "@/src/components/ui/sonner";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/src/hooks/usePermissions";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFDownloaderWithFacturX from "@/src/components/pdf/UniversalPDFDownloaderWithFacturX";
import { LinkedDocumentRow } from "@/src/components/documents/linked-document-row";
import {
  EInvoiceStatusBadge,
  EReportingErrorBadge,
} from "./einvoice-status-badge";
import {
  formatLocalDate,
  getDraftEffectiveDates,
} from "@/src/utils/dateFormatter";

export default function InvoiceMobileFullscreen({
  isOpen,
  onClose,
  invoice: initialInvoice,
  onRefetch,
}) {
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [canCreateCreditNote, setCanCreateCreditNote] = useState(false);
  const [previousSituationInvoices, setPreviousSituationInvoices] = useState(
    [],
  );
  const [showPreview, setShowPreview] = useState(false);
  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();
  const { workspaceId } = useRequiredWorkspace();

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canCreate("creditNotes");
      setCanCreateCreditNote(allowed);
    };
    checkPermission();
  }, [canCreate]);

  const { creditNotes, loading: loadingCreditNotes } = useCreditNotesByInvoice(
    initialInvoice?.id,
  );

  const { invoice: fullInvoice, loading: loadingFullInvoice } = useInvoice(
    initialInvoice?.id,
  );

  const [fetchSituationInvoices, { data: situationData }] = useLazyQuery(
    GET_SITUATION_INVOICES_BY_QUOTE_REF,
    { fetchPolicy: "cache-and-network" },
  );

  useEffect(() => {
    const invoice = fullInvoice || initialInvoice;
    const reference =
      invoice?.situationReference || invoice?.purchaseOrderNumber;

    if (
      isOpen &&
      workspaceId &&
      invoice?.invoiceType === "situation" &&
      reference
    ) {
      fetchSituationInvoices({
        variables: {
          workspaceId,
          purchaseOrderNumber: reference,
        },
      });
    } else {
      setPreviousSituationInvoices([]);
    }
  }, [
    isOpen,
    workspaceId,
    fullInvoice,
    initialInvoice,
    fetchSituationInvoices,
  ]);

  useEffect(() => {
    const invoice = fullInvoice || initialInvoice;
    if (situationData?.situationInvoicesByQuoteRef && invoice?.id) {
      const currentSituationNumber = invoice.situationNumber || 1;
      const previousInvoices = situationData.situationInvoicesByQuoteRef
        .filter(
          (inv) =>
            inv.id !== invoice.id &&
            (inv.situationNumber || 0) < currentSituationNumber,
        )
        .sort((a, b) => (a.situationNumber || 0) - (b.situationNumber || 0));

      setPreviousSituationInvoices(previousInvoices);
    }
  }, [situationData, fullInvoice, initialInvoice]);

  if (!isOpen || !initialInvoice) return null;

  const invoice = fullInvoice || initialInvoice;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non définie";

    let date;
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

  // Fonction pour calculer les totaux en prenant en compte le pourcentage d'avancement
  const calculateTotals = (invoiceData) => {
    const items = invoiceData?.items || [];
    let subtotalAfterItemDiscounts = 0;
    let totalTax = 0;

    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const progressPercentage =
        item.progressPercentage != null
          ? parseFloat(item.progressPercentage)
          : 100;

      let itemTotal = quantity * unitPrice;
      itemTotal = itemTotal * (progressPercentage / 100);

      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType || "percentage";

      if (itemDiscount > 0) {
        if (
          itemDiscountType === "PERCENTAGE" ||
          itemDiscountType === "percentage"
        ) {
          itemTotal = itemTotal * (1 - Math.min(itemDiscount, 100) / 100);
        } else {
          itemTotal = Math.max(0, itemTotal - itemDiscount);
        }
      }

      subtotalAfterItemDiscounts += itemTotal;
    });

    let globalDiscountAmount = 0;
    let totalAfterDiscount = subtotalAfterItemDiscounts;

    if (invoiceData?.discount && invoiceData.discount > 0) {
      if (invoiceData.discountType?.toUpperCase() === "PERCENTAGE") {
        globalDiscountAmount =
          (subtotalAfterItemDiscounts * invoiceData.discount) / 100;
      } else {
        globalDiscountAmount = Math.min(
          invoiceData.discount,
          subtotalAfterItemDiscounts,
        );
      }
      totalAfterDiscount = subtotalAfterItemDiscounts - globalDiscountAmount;
    }

    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const progressPercentage =
        item.progressPercentage != null
          ? parseFloat(item.progressPercentage)
          : 100;
      const vatRate =
        item.vatRate !== undefined ? parseFloat(item.vatRate) : 20;

      let itemSubtotal = quantity * unitPrice;
      itemSubtotal = itemSubtotal * (progressPercentage / 100);

      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType;

      if (itemDiscount > 0) {
        if (
          itemDiscountType?.toUpperCase() === "PERCENTAGE" ||
          itemDiscountType === "percentage"
        ) {
          itemSubtotal = itemSubtotal * (1 - Math.min(itemDiscount, 100) / 100);
        } else {
          itemSubtotal = Math.max(0, itemSubtotal - itemDiscount);
        }
      }

      if (globalDiscountAmount > 0) {
        const itemRatio = itemSubtotal / (subtotalAfterItemDiscounts || 1);
        itemSubtotal = Math.max(
          0,
          itemSubtotal - globalDiscountAmount * itemRatio,
        );
      }

      const itemTax =
        invoiceData?.isReverseCharge || vatRate === 0
          ? 0
          : itemSubtotal * (vatRate / 100);
      totalTax += itemTax;
    });

    let shippingAmountHT = 0;
    let shippingTax = 0;
    const shippingData = invoiceData?.shipping;

    if (shippingData?.billShipping && shippingData?.shippingAmountHT > 0) {
      shippingAmountHT = parseFloat(shippingData.shippingAmountHT) || 0;
      const shippingVatRate = parseFloat(shippingData.shippingVatRate) || 20;
      shippingTax =
        invoiceData?.isReverseCharge || shippingVatRate === 0
          ? 0
          : shippingAmountHT * (shippingVatRate / 100);
      totalTax += shippingTax;
    }

    const totalHT = totalAfterDiscount + shippingAmountHT;
    const totalTTC = totalHT + totalTax;

    return {
      subtotalHT: subtotalAfterItemDiscounts,
      discountAmount: globalDiscountAmount,
      totalHT: totalHT,
      totalVAT: totalTax,
      totalTTC: totalTTC,
    };
  };

  const calculatedTotals = calculateTotals(invoice);

  const handleMarkAsPaid = async () => {
    try {
      const today = formatLocalDate();
      await markAsPaid(invoice.id, today);
      toast.success("Facture marquée comme payée");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors du marquage comme payée");
    }
  };

  // La mutation changeInvoiceStatus recale côté serveur les dates d'un
  // brouillon repris plus tard (émission ramenée à aujourd'hui, échéance
  // décalée d'autant).
  const handleCreateInvoice = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.PENDING);
      toast.success("Facture créée avec succès");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      // errorLink ne toaste pas les mutations : afficher l'erreur ici
      console.error("Erreur lors du changement de statut:", error);
      toast.error(error?.message || "Erreur lors de la création de la facture");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.CANCELED);
      toast.success("Facture annulée");
      if (onRefetch) onRefetch();
      onClose();
    } catch (error) {
      toast.error("Erreur lors de l'annulation de la facture");
    }
  };

  const handleCreateCreditNote = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}/avoir/nouveau`);
    onClose();
  };

  const creditNoteLimitReached = hasReachedCreditNoteLimit(
    invoice,
    creditNotes,
  );

  const isLoading = markingAsPaid || changingStatus || loadingFullInvoice;

  const statusLabel = INVOICE_STATUS_LABELS[invoice.status] || invoice.status;

  return (
    <div className="fixed inset-0 z-[100] bg-background md:hidden overflow-hidden">
      {/* Container des deux panneaux avec slide */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{
          width: "200%",
          transform: showPreview ? "translateX(-50%)" : "translateX(0)",
        }}
      >
        {/* ===== PANNEAU 1 : Informations facture ===== */}
        <div className="w-1/2 h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-background border-b">
            <div className="flex items-start justify-between p-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-normal">
                  Facture{" "}
                  {invoice.prefix && invoice.number
                    ? `${invoice.prefix}-${invoice.number}`
                    : invoice.number || "Brouillon"}
                </h2>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium w-fit ${
                    invoice.status === "DRAFT"
                      ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                      : invoice.status === "PENDING"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        : invoice.status === "PAID" ||
                            invoice.status === "COMPLETED"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : invoice.status === "OVERDUE"
                            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}
                >
                  {statusLabel}
                </span>
                {/* Statut du cycle de vie e-invoicing (SuperPDP) — masqué hors e-invoicing */}
                <EInvoiceStatusBadge
                  status={invoice.eInvoiceStatus}
                  lastCode={invoice.eInvoiceLastCode}
                />
                {/* Alerte e-reporting en erreur (B2C / international) — relancé par cron */}
                <EReportingErrorBadge
                  status={invoice.eReportingStatus}
                  paymentStatus={invoice.eReportingPaymentStatus}
                  error={invoice.eReportingError}
                />
              </div>
              <div className="flex items-center gap-2">
                {invoice.status !== INVOICE_STATUS.DRAFT && (
                  <UniversalPDFDownloaderWithFacturX
                    data={invoice}
                    type="invoice"
                    enableFacturX={true}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    previousSituationInvoices={previousSituationInvoices}
                  >
                    Télécharger
                  </UniversalPDFDownloaderWithFacturX>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto">
            {loadingFullInvoice ? (
              <div className="flex items-center justify-center h-full">
                <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="p-4 space-y-6 pb-56">
                {/* Client */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Client
                  </h3>
                  {invoice.client ? (
                    <div className="space-y-1.5">
                      <div>
                        <p className="font-medium">
                          {invoice.client.type === "COMPANY"
                            ? String(invoice.client?.name || "")
                            : `${String(invoice.client?.firstName || "")} ${String(invoice.client?.lastName || "")}`.trim() ||
                              String(invoice.client?.name || "")}
                        </p>
                        {invoice.client.email && (
                          <p className="text-sm text-muted-foreground">
                            {String(invoice.client.email)}
                          </p>
                        )}
                      </div>
                      {invoice.client.address && (
                        <div className="text-sm text-muted-foreground">
                          {invoice.client.address.street && (
                            <p>{String(invoice.client.address.street)}</p>
                          )}
                          {(invoice.client.address.postalCode ||
                            invoice.client.address.city) && (
                            <p>
                              {invoice.client.address.postalCode &&
                                String(invoice.client.address.postalCode)}
                              {invoice.client.address.postalCode &&
                                invoice.client.address.city &&
                                " "}
                              {invoice.client.address.city &&
                                String(invoice.client.address.city)}
                            </p>
                          )}
                          {invoice.client.address.country && (
                            <p>{String(invoice.client.address.country)}</p>
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

                {/* Adresse de livraison */}
                {(() => {
                  const shippingData = invoice.shipping;
                  if (
                    shippingData?.shippingAddress &&
                    shippingData?.billShipping
                  ) {
                    return (
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Adresse de livraison
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {shippingData.shippingAddress.fullName && (
                            <p className="font-medium text-foreground">
                              {shippingData.shippingAddress.fullName}
                            </p>
                          )}
                          {shippingData.shippingAddress.street && (
                            <p>{shippingData.shippingAddress.street}</p>
                          )}
                          {(shippingData.shippingAddress.postalCode ||
                            shippingData.shippingAddress.city) && (
                            <p>
                              {shippingData.shippingAddress.postalCode}
                              {shippingData.shippingAddress.postalCode &&
                                shippingData.shippingAddress.city &&
                                " "}
                              {shippingData.shippingAddress.city}
                            </p>
                          )}
                          {shippingData.shippingAddress.country && (
                            <p>{shippingData.shippingAddress.country}</p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  if (
                    invoice.client?.hasDifferentShippingAddress &&
                    invoice.client?.shippingAddress
                  ) {
                    return (
                      <div className="space-y-2.5">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Adresse de livraison
                        </h3>
                        <div className="text-sm text-muted-foreground">
                          {invoice.client.shippingAddress.fullName && (
                            <p className="font-medium text-foreground">
                              {invoice.client.shippingAddress.fullName}
                            </p>
                          )}
                          {invoice.client.shippingAddress.street && (
                            <p>{invoice.client.shippingAddress.street}</p>
                          )}
                          {(invoice.client.shippingAddress.postalCode ||
                            invoice.client.shippingAddress.city) && (
                            <p>
                              {invoice.client.shippingAddress.postalCode}
                              {invoice.client.shippingAddress.postalCode &&
                                invoice.client.shippingAddress.city &&
                                " "}
                              {invoice.client.shippingAddress.city}
                            </p>
                          )}
                          {invoice.client.shippingAddress.country && (
                            <p>{invoice.client.shippingAddress.country}</p>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Dates */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Dates
                  </h3>
                  <div className="space-y-1.5">
                    {/* Pour un brouillon repris plus tard, afficher les dates
                        recalées (jour J / échéance) et l'ancienne date entre
                        parenthèses, car elles seront mises à jour à la
                        finalisation — même logique que la sidebar desktop. */}
                    {(() => {
                      const draftDates =
                        invoice.status === "DRAFT"
                          ? getDraftEffectiveDates(
                              invoice.issueDate,
                              invoice.dueDate,
                            )
                          : null;
                      const refreshed = draftDates?.changed;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Date d'émission
                            </span>
                            <span className="flex flex-col items-end">
                              <span>
                                {formatDate(
                                  refreshed
                                    ? draftDates.issue.effective
                                    : invoice.issueDate,
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
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Date d'échéance
                            </span>
                            <span className="flex flex-col items-end">
                              <span>
                                {formatDate(
                                  refreshed
                                    ? draftDates.second.effective
                                    : invoice.dueDate,
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
                    {invoice.paymentDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Date de paiement
                        </span>
                        <span>{formatDate(invoice.paymentDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Articles */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Articles
                  </h3>
                  <div className="space-y-1.5">
                    {invoice.items && invoice.items.length > 0 ? (
                      invoice.items.map((item, index) => {
                        const progressPercentage =
                          item.progressPercentage != null
                            ? parseFloat(item.progressPercentage)
                            : 100;
                        return (
                          <div key={index} className="text-sm">
                            <div className="font-medium">
                              {item.description || "Article sans description"}
                            </div>
                            <div className="text-muted-foreground">
                              {item.quantity || 0} ×{" "}
                              {formatCurrency(item.unitPrice || 0)}
                              {progressPercentage < 100 && (
                                <span className="text-[#5b50ff] ml-2">
                                  ({progressPercentage}% avancement)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground">Aucun article</p>
                    )}
                  </div>
                </div>

                {/* Totaux */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Totaux
                  </h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Sous-total HT
                      </span>
                      <span>{formatCurrency(calculatedTotals.subtotalHT)}</span>
                    </div>
                    {calculatedTotals.discountAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remise</span>
                        <span>
                          -{formatCurrency(calculatedTotals.discountAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total HT</span>
                      <span>{formatCurrency(calculatedTotals.totalHT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">TVA</span>
                      <span>
                        {invoice.isReverseCharge ? (
                          <span className="text-xs italic text-muted-foreground">
                            Auto-liquidation
                          </span>
                        ) : (
                          formatCurrency(calculatedTotals.totalVAT)
                        )}
                      </span>
                    </div>

                    {/* Escompte */}
                    {(() => {
                      const escompteValue = parseFloat(invoice.escompte) || 0;
                      if (escompteValue <= 0) return null;
                      const escompteAmount =
                        (calculatedTotals.totalHT * escompteValue) / 100;
                      return (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Escompte sur HT ({escompteValue}%)
                          </span>
                          <span>-{formatCurrency(escompteAmount)}</span>
                        </div>
                      );
                    })()}

                    {/* TVA après escompte */}
                    {(() => {
                      const escompteValue = parseFloat(invoice.escompte) || 0;
                      if (escompteValue <= 0 || invoice.isReverseCharge)
                        return null;
                      const escompteAmount =
                        (calculatedTotals.totalHT * escompteValue) / 100;
                      const htAfterEscompte =
                        calculatedTotals.totalHT - escompteAmount;
                      const tvaAfterEscompte =
                        calculatedTotals.totalHT > 0
                          ? (htAfterEscompte / calculatedTotals.totalHT) *
                            calculatedTotals.totalVAT
                          : 0;
                      return (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            TVA après escompte
                          </span>
                          <span>{formatCurrency(tvaAfterEscompte)}</span>
                        </div>
                      );
                    })()}

                    <div className="flex justify-between font-medium">
                      <span>Total TTC</span>
                      <span>
                        {(() => {
                          const escompteValue =
                            parseFloat(invoice.escompte) || 0;
                          if (escompteValue > 0) {
                            const escompteAmount =
                              (calculatedTotals.totalHT * escompteValue) / 100;
                            const htAfterEscompte =
                              calculatedTotals.totalHT - escompteAmount;
                            const tvaAfterEscompte = invoice.isReverseCharge
                              ? 0
                              : calculatedTotals.totalHT > 0
                                ? (htAfterEscompte / calculatedTotals.totalHT) *
                                  calculatedTotals.totalVAT
                                : 0;
                            return formatCurrency(
                              htAfterEscompte + tvaAfterEscompte,
                            );
                          }
                          return formatCurrency(calculatedTotals.totalTTC);
                        })()}
                      </span>
                    </div>

                    {/* Retenue de garantie */}
                    {(() => {
                      const retenueValue =
                        parseFloat(invoice.retenueGarantie) || 0;
                      if (retenueValue <= 0) return null;
                      const escompteValue = parseFloat(invoice.escompte) || 0;
                      let baseAmount = calculatedTotals.totalTTC;
                      if (escompteValue > 0) {
                        const escompteAmount =
                          (calculatedTotals.totalHT * escompteValue) / 100;
                        const htAfterEscompte =
                          calculatedTotals.totalHT - escompteAmount;
                        const tvaAfterEscompte = invoice.isReverseCharge
                          ? 0
                          : calculatedTotals.totalHT > 0
                            ? (htAfterEscompte / calculatedTotals.totalHT) *
                              calculatedTotals.totalVAT
                            : 0;
                        baseAmount = htAfterEscompte + tvaAfterEscompte;
                      }
                      const retenueAmount = (baseAmount * retenueValue) / 100;
                      return (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Retenue de garantie ({retenueValue}%)
                          </span>
                          <span>-{formatCurrency(retenueAmount)}</span>
                        </div>
                      );
                    })()}

                    {/* Net à payer */}
                    {(() => {
                      const retenueValue =
                        parseFloat(invoice.retenueGarantie) || 0;
                      const escompteValue = parseFloat(invoice.escompte) || 0;
                      if (retenueValue <= 0 && escompteValue <= 0) return null;
                      let finalAmount = calculatedTotals.totalTTC;
                      if (escompteValue > 0) {
                        const escompteAmount =
                          (calculatedTotals.totalHT * escompteValue) / 100;
                        const htAfterEscompte =
                          calculatedTotals.totalHT - escompteAmount;
                        const tvaAfterEscompte = invoice.isReverseCharge
                          ? 0
                          : calculatedTotals.totalHT > 0
                            ? (htAfterEscompte / calculatedTotals.totalHT) *
                              calculatedTotals.totalVAT
                            : 0;
                        finalAmount = htAfterEscompte + tvaAfterEscompte;
                      }
                      if (retenueValue > 0) {
                        const retenueAmount =
                          (finalAmount * retenueValue) / 100;
                        finalAmount = finalAmount - retenueAmount;
                      }
                      return (
                        <div className="flex justify-between pt-2 border-t font-medium">
                          <span>Net à payer</span>
                          <span>{formatCurrency(finalAmount)}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Bouton Aperçu */}
                <Button
                  variant="ghost"
                  onClick={() => setShowPreview(true)}
                  className="w-full justify-between font-normal"
                >
                  Aperçu de la facture
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {/* Avoirs liés */}
                {creditNotes && creditNotes.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Avoirs créés ({creditNotes.length})
                    </h3>
                    <div className="space-y-2">
                      {creditNotes.map((cn) => (
                        <div
                          key={cn.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-normal">{cn.number}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(cn.issueDate)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <UniversalPDFDownloaderWithFacturX
                              data={cn}
                              type="creditNote"
                              enableFacturX={true}
                              variant="ghost"
                              size="sm"
                            >
                              Télécharger
                            </UniversalPDFDownloaderWithFacturX>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Devis lié (devis à l'origine de cette facture) */}
                {invoice.sourceQuote && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Devis lié
                    </h3>
                    <div className="space-y-1">
                      <LinkedDocumentRow
                        type="quote"
                        document={invoice.sourceQuote}
                        onClick={() => {
                          router.push(
                            `/dashboard/outils/devis?id=${invoice.sourceQuote.id}`,
                          );
                          onClose();
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Bon de commande lié (BC à l'origine de cette facture) */}
                {invoice.sourcePurchaseOrder && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Bon de commande lié
                    </h3>
                    <div className="space-y-1">
                      <LinkedDocumentRow
                        type="purchaseOrder"
                        document={invoice.sourcePurchaseOrder}
                        onClick={() => {
                          router.push(
                            `/dashboard/outils/bons-commande?id=${invoice.sourcePurchaseOrder.id}`,
                          );
                          onClose();
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer avec actions */}
          <div
            className="flex-shrink-0 bg-background border-t px-4 py-3 flex flex-col gap-1.5"
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            {invoice.status === INVOICE_STATUS.DRAFT && (
              <>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push(
                        `/dashboard/outils/factures/${invoice.id}/editer`,
                      );
                      onClose();
                    }}
                    size="sm"
                    className="font-normal"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Éditer
                  </Button>
                  <Button
                    onClick={handleCreateInvoice}
                    disabled={isLoading}
                    size="sm"
                    className="font-normal"
                  >
                    {changingStatus ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Créer la facture
                  </Button>
                </div>
                <UniversalPDFDownloaderWithFacturX
                  data={invoice}
                  type="invoice"
                  enableFacturX={true}
                  variant="outline"
                  size="sm"
                  previousSituationInvoices={previousSituationInvoices}
                >
                  Télécharger
                </UniversalPDFDownloaderWithFacturX>
              </>
            )}

            {invoice.status === INVOICE_STATUS.PENDING && (
              <>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button
                    onClick={handleMarkAsPaid}
                    disabled={isLoading}
                    size="sm"
                    className="font-normal"
                  >
                    {markingAsPaid ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Payée
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="destructive"
                    size="sm"
                    className="font-normal"
                    disabled={isLoading}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Annuler
                  </Button>
                </div>
                {!creditNoteLimitReached && canCreateCreditNote && (
                  <Button
                    onClick={handleCreateCreditNote}
                    variant="outline"
                    size="sm"
                    className="w-full font-normal"
                  >
                    <Receipt className="mr-2 h-4 w-4" />
                    Créer un avoir
                  </Button>
                )}
              </>
            )}

            {(invoice.status === INVOICE_STATUS.COMPLETED ||
              invoice.status === INVOICE_STATUS.CANCELED) &&
              !creditNoteLimitReached &&
              canCreateCreditNote && (
                <Button
                  onClick={handleCreateCreditNote}
                  variant="outline"
                  size="sm"
                  className="w-full font-normal"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Créer un avoir
                </Button>
              )}
          </div>
        </div>

        {/* ===== PANNEAU 2 : Aperçu PDF ===== */}
        <div className="w-1/2 h-full flex flex-col">
          {/* Header blanc avec bouton retour */}
          <div className="flex-shrink-0 bg-background border-b">
            <div className="flex items-center justify-between p-4">
              <Button
                variant="ghost"
                onClick={() => setShowPreview(false)}
                className="gap-2 font-normal"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Aperçu
              </span>
              <div className="w-[72px]" />
            </div>
          </div>

          {/* Contenu PDF scrollable */}
          <div className="flex-1 overflow-y-auto bg-muted/30">
            <div className="p-4">
              <div className="w-full rounded-lg overflow-hidden bg-white">
                <UniversalPreviewPDF
                  data={invoice}
                  type="invoice"
                  isMobile={true}
                  previousSituationInvoices={previousSituationInvoices}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
