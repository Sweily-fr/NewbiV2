"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  FileText,
  XCircle,
  Download,
  LoaderCircle,
  Clock,
  Building,
  Tag,
  Package,
  Percent,
  Receipt,
  Plus,
  Landmark,
  Link2,
  Unlink,
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
  useMarkInvoiceAsPaid,
  useChangeInvoiceStatus,
  useInvoice,
  INVOICE_STATUS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/src/graphql/invoiceQueries";
import { useCreditNotesByInvoice } from "@/src/graphql/creditNoteQueries";
import { hasReachedCreditNoteLimit } from "@/src/utils/creditNoteUtils";
import { toast } from "@/src/components/ui/sonner";
import UniversalPreviewPDF from "@/src/components/pdf/UniversalPreviewPDF";
import UniversalPDFDownloaderWithFacturX from "@/src/components/pdf/UniversalPDFDownloaderWithFacturX";
import CreditNoteMobileFullscreen from "./credit-note-mobile-fullscreen";
import { useReconciliation } from "@/src/hooks/useReconciliation";
import { ScrollArea } from "@/src/components/ui/scroll-area";

export default function InvoiceSidebar({
  isOpen,
  onClose,
  invoice: initialInvoice,
  onRefetch,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [isCreditNotePreviewOpen, setIsCreditNotePreviewOpen] = useState(false);
  const [isCreditNoteMobileFullscreen, setIsCreditNoteMobileFullscreen] =
    useState(false);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const router = useRouter();
  const { markAsPaid, loading: markingAsPaid } = useMarkInvoiceAsPaid();
  const { changeStatus, loading: changingStatus } = useChangeInvoiceStatus();

  // Fetch credit notes for this invoice
  const {
    creditNotes,
    loading: loadingCreditNotes,
    error: creditNotesError,
  } = useCreditNotesByInvoice(initialInvoice?.id);

  // Récupérer les données complètes de la facture
  const {
    invoice: fullInvoice,
    loading: loadingFullInvoice,
    error: invoiceError,
  } = useInvoice(initialInvoice?.id);

  // Hook de rapprochement bancaire
  const { fetchTransactionsForInvoice, linkTransaction, unlinkTransaction } =
    useReconciliation();
  const [availableTransactions, setAvailableTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showTransactionPicker, setShowTransactionPicker] = useState(false);
  const [linkingTransaction, setLinkingTransaction] = useState(false);

  // Charger les transactions disponibles pour cette facture
  const loadAvailableTransactions = useCallback(async () => {
    if (!initialInvoice?.id) return;

    setLoadingTransactions(true);
    try {
      const { transactions } = await fetchTransactionsForInvoice(
        initialInvoice.id
      );
      setAvailableTransactions(transactions);
    } catch (err) {
      console.error("Erreur chargement transactions:", err);
    } finally {
      setLoadingTransactions(false);
    }
  }, [initialInvoice?.id, fetchTransactionsForInvoice]);

  // Charger automatiquement les transactions suggérées quand le drawer s'ouvre
  useEffect(() => {
    if (
      isOpen &&
      initialInvoice?.id &&
      initialInvoice?.status === INVOICE_STATUS.PENDING &&
      !initialInvoice?.linkedTransactionId
    ) {
      loadAvailableTransactions();
    }
  }, [
    isOpen,
    initialInvoice?.id,
    initialInvoice?.status,
    initialInvoice?.linkedTransactionId,
    loadAvailableTransactions,
  ]);

  // Filtrer les transactions avec un bon score de correspondance
  const suggestedTransactions = availableTransactions.filter(
    (tx) => tx.score >= 80
  );

  // Lier une transaction à cette facture
  const handleLinkTransaction = async (transactionId) => {
    setLinkingTransaction(true);
    try {
      const result = await linkTransaction(transactionId, initialInvoice.id);
      if (result.success) {
        toast.success("Paiement bancaire rattaché avec succès");
        setShowTransactionPicker(false);
        if (onRefetch) onRefetch();
      } else {
        toast.error(result.error || "Erreur lors du rattachement");
      }
    } catch (err) {
      toast.error("Erreur lors du rattachement");
    } finally {
      setLinkingTransaction(false);
    }
  };

  // Délier la transaction de cette facture
  const handleUnlinkTransaction = async () => {
    setLinkingTransaction(true);
    try {
      const result = await unlinkTransaction(null, initialInvoice.id);
      if (result.success) {
        toast.success("Paiement bancaire détaché");
        if (onRefetch) onRefetch();
      } else {
        toast.error(result.error || "Erreur lors du détachement");
      }
    } catch (err) {
      toast.error("Erreur lors du détachement");
    } finally {
      setLinkingTransaction(false);
    }
  };

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Réinitialiser showMobileDetails quand la sidebar se ferme
  useEffect(() => {
    if (!isOpen) {
      setShowMobileDetails(false);
    }
  }, [isOpen]);

  if (!isOpen || !initialInvoice) return null;

  // Utiliser les données complètes si disponibles, sinon les données initiales
  const invoice = fullInvoice || initialInvoice;

  // Debug: Vérifier si les données complètes sont récupérées
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
    // Gérer les timestamps en millisecondes (string ou number)
    if (typeof dateString === "string" && /^\d+$/.test(dateString)) {
      date = new Date(parseInt(dateString, 10));
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

    // Calcul du sous-total HT après remises et avancement
    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const progressPercentage = parseFloat(item.progressPercentage) || 100;

      let itemTotal = quantity * unitPrice;
      
      // Application du pourcentage d'avancement
      itemTotal = itemTotal * (progressPercentage / 100);

      // Application de la remise sur l'article
      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType || "percentage";

      if (itemDiscount > 0) {
        if (itemDiscountType === "PERCENTAGE" || itemDiscountType === "percentage") {
          itemTotal = itemTotal * (1 - Math.min(itemDiscount, 100) / 100);
        } else {
          itemTotal = Math.max(0, itemTotal - itemDiscount);
        }
      }

      subtotalAfterItemDiscounts += itemTotal;
    });

    // Application de la remise globale
    let globalDiscountAmount = 0;
    let totalAfterDiscount = subtotalAfterItemDiscounts;

    if (invoiceData?.discount && invoiceData.discount > 0) {
      if (invoiceData.discountType?.toUpperCase() === "PERCENTAGE") {
        globalDiscountAmount = (subtotalAfterItemDiscounts * invoiceData.discount) / 100;
      } else {
        globalDiscountAmount = Math.min(invoiceData.discount, subtotalAfterItemDiscounts);
      }
      totalAfterDiscount = subtotalAfterItemDiscounts - globalDiscountAmount;
    }

    // Calcul de la TVA
    items.forEach((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const progressPercentage = parseFloat(item.progressPercentage) || 100;
      const vatRate = item.vatRate !== undefined ? parseFloat(item.vatRate) : 20;

      let itemSubtotal = quantity * unitPrice;
      
      // Application du pourcentage d'avancement
      itemSubtotal = itemSubtotal * (progressPercentage / 100);

      // Application de la remise sur l'article
      const itemDiscount = parseFloat(item.discount) || 0;
      const itemDiscountType = item.discountType;

      if (itemDiscount > 0) {
        if (itemDiscountType?.toUpperCase() === "PERCENTAGE" || itemDiscountType === "percentage") {
          itemSubtotal = itemSubtotal * (1 - Math.min(itemDiscount, 100) / 100);
        } else {
          itemSubtotal = Math.max(0, itemSubtotal - itemDiscount);
        }
      }

      // Application de la remise globale au prorata
      if (globalDiscountAmount > 0) {
        const itemRatio = itemSubtotal / (subtotalAfterItemDiscounts || 1);
        itemSubtotal = Math.max(0, itemSubtotal - globalDiscountAmount * itemRatio);
      }

      // Calcul de la TVA (0 si auto-liquidation)
      const itemTax = (invoiceData?.isReverseCharge || vatRate === 0) ? 0 : itemSubtotal * (vatRate / 100);
      totalTax += itemTax;
    });

    // Ajouter les frais de livraison si applicable
    let shippingAmountHT = 0;
    let shippingTax = 0;
    const shippingData = invoiceData?.shipping;

    if (shippingData?.billShipping && shippingData?.shippingAmountHT > 0) {
      shippingAmountHT = parseFloat(shippingData.shippingAmountHT) || 0;
      const shippingVatRate = parseFloat(shippingData.shippingVatRate) || 20;
      shippingTax = (invoiceData?.isReverseCharge || shippingVatRate === 0) 
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

  // Calculer les totaux avec prise en compte de l'avancement
  const calculatedTotals = calculateTotals(invoice);

  const handleEdit = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}/editer`);
    onClose();
  };

  const handleView = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}`);
    onClose();
  };

  const handleCreateInvoice = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.PENDING);
      toast.success("Facture créée avec succès");
      if (onRefetch) onRefetch();
    } catch (error) {
      // L'erreur est gérée par errorLink dans apolloClient.js
      // qui affiche automatiquement le message du backend
      console.error("Erreur lors du changement de statut:", error);
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      await markAsPaid(invoice.id, today);
      toast.success("Facture marquée comme payée");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors du marquage comme payée");
    }
  };

  const handleCancel = async () => {
    try {
      await changeStatus(invoice.id, INVOICE_STATUS.CANCELED);
      toast.success("Facture annulée");
      if (onRefetch) onRefetch();
    } catch (error) {
      toast.error("Erreur lors de l'annulation de la facture");
    }
  };

  const handleCreateCreditNote = () => {
    router.push(`/dashboard/outils/factures/${invoice.id}/avoir/nouveau`);
    onClose();
  };

  const handleViewCreditNote = (creditNote) => {
    setSelectedCreditNote(creditNote);
    if (isMobile) {
      setIsCreditNoteMobileFullscreen(true);
    } else {
      setIsCreditNotePreviewOpen(true);
    }
  };

  // Vérifier si la facture a atteint sa limite d'avoirs
  const creditNoteLimitReached = hasReachedCreditNoteLimit(
    invoice,
    creditNotes
  );

  const isLoading = markingAsPaid || changingStatus;

  return (
    <>
      {/* Semi-transparent overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* PDF Preview Section */}
      <div
        className={`fixed inset-y-0 left-0 md:right-[40%] right-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute inset-0 bg-black/80 p-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">
          <div className="w-[210mm] max-w-full min-h-[calc(100%-4rem)] bg-white">
            <UniversalPreviewPDF data={invoice} type="invoice" />
          </div>
        </div>

        {/* Bouton flottant pour ouvrir les détails sur mobile */}
        <Button
          onClick={() => setShowMobileDetails(true)}
          className="md:hidden fixed bottom-6 right-6 z-[60] rounded-full h-14 w-14 shadow-lg"
          size="icon"
        >
          <Eye className="h-5 w-5" />
        </Button>
      </div>

      {/* Main Sidebar - Hidden on mobile by default, shown in modal */}
      <div
        className={`fixed inset-y-0 right-0 z-50 md:w-[40%] w-full bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen
            ? showMobileDetails
              ? "translate-x-0"
              : "md:translate-x-0 translate-x-full"
            : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="font-normal text-lg">
              Facture {invoice.number || "Brouillon"}
            </h2>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                invoice.status === "DRAFT"
                  ? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                  : invoice.status === "PENDING"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                    : invoice.status === "PAID"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      : invoice.status === "OVERDUE"
                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
              }`}
            >
              {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton PDF - masqué pour les brouillons */}
            {invoice.status !== INVOICE_STATUS.DRAFT && (
              <UniversalPDFDownloaderWithFacturX
                data={invoice}
                type="invoice"
                enableFacturX={true}
              />
            )}
            <Button
              variant="ghost"
              size="sm"
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
              className="h-8 w-8 p-0 relative z-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Section Suggestion de Rattachement - Affichée en haut si suggestions disponibles */}
          {invoice.status === INVOICE_STATUS.PENDING &&
            !invoice.linkedTransactionId &&
            suggestedTransactions.length > 0 && (
              <div className="p-4 rounded-lg bg-[#5a50ff]/10 border border-[#5a50ff]/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-[#5a50ff]" />
                  <div>
                    <h3 className="font-medium text-[#5a50ff]">
                      Paiement détecté
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {suggestedTransactions.length === 1
                        ? "Une transaction correspond à cette facture"
                        : `${suggestedTransactions.length} transactions correspondent à cette facture`}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {suggestedTransactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          +{formatCurrency(tx.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {tx.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(tx.date)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="ml-2 bg-[#5a50ff] hover:bg-[#4a40ef] text-white"
                        onClick={() => handleLinkTransaction(tx.id)}
                        disabled={linkingTransaction}
                      >
                        {linkingTransaction ? (
                          <LoaderCircle className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Link2 className="h-3 w-3 mr-1" />
                            Rattacher
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Client Info */}
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
              <p className="text-muted-foreground">Aucun client sélectionné</p>
            )}
          </div>

          {/* Dates */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Dates
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date d'émission</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date d'échéance</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
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
                  const progressPercentage = parseFloat(item.progressPercentage) || 100;
                  return (
                    <div key={index} className="text-sm">
                      <div className="font-medium">
                        {item.description || "Article sans description"}
                      </div>
                      <div className="text-muted-foreground">
                        {item.quantity || 0} ×{" "}
                        {formatCurrency(item.unitPrice || 0)}
                        {progressPercentage < 100 && (
                          <span style={{ color: "#5b50ff" }} className="ml-2">
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

          {/* Totals */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Totaux
            </h3>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span>{formatCurrency(calculatedTotals.subtotalHT)}</span>
              </div>
              {calculatedTotals.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remise</span>
                  <span>-{formatCurrency(calculatedTotals.discountAmount)}</span>
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

              {/* Escompte (avant Total TTC) */}
              {(() => {
                const escompteValue = parseFloat(invoice.escompte) || 0;
                if (escompteValue <= 0) return null;

                const escompteAmount = (calculatedTotals.totalHT * escompteValue) / 100;

                return (
                  <div className="flex justify-between text-sm">
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
                if (escompteValue <= 0 || invoice.isReverseCharge) return null;

                const escompteAmount = (calculatedTotals.totalHT * escompteValue) / 100;
                const htAfterEscompte = calculatedTotals.totalHT - escompteAmount;
                const tvaAfterEscompte = calculatedTotals.totalHT > 0 
                  ? (htAfterEscompte / calculatedTotals.totalHT) * calculatedTotals.totalVAT 
                  : 0;

                return (
                  <div className="flex justify-between text-sm">
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
                    const escompteValue = parseFloat(invoice.escompte) || 0;

                    // Si escompte, afficher le TTC après escompte
                    if (escompteValue > 0) {
                      const escompteAmount = (calculatedTotals.totalHT * escompteValue) / 100;
                      const htAfterEscompte = calculatedTotals.totalHT - escompteAmount;
                      const tvaAfterEscompte = invoice.isReverseCharge
                        ? 0
                        : calculatedTotals.totalHT > 0 
                          ? (htAfterEscompte / calculatedTotals.totalHT) * calculatedTotals.totalVAT 
                          : 0;
                      return formatCurrency(htAfterEscompte + tvaAfterEscompte);
                    }

                    return formatCurrency(calculatedTotals.totalTTC);
                  })()}
                </span>
              </div>

              {/* Retenue de garantie (après Total TTC) */}
              {(() => {
                const retenueValue = parseFloat(invoice.retenueGarantie) || 0;
                if (retenueValue <= 0) return null;

                const escompteValue = parseFloat(invoice.escompte) || 0;

                // Calculer la base pour la retenue (TTC ou TTC après escompte)
                let baseAmount = calculatedTotals.totalTTC;
                if (escompteValue > 0) {
                  const escompteAmount = (calculatedTotals.totalHT * escompteValue) / 100;
                  const htAfterEscompte = calculatedTotals.totalHT - escompteAmount;
                  const tvaAfterEscompte = invoice.isReverseCharge
                    ? 0
                    : calculatedTotals.totalHT > 0 
                      ? (htAfterEscompte / calculatedTotals.totalHT) * calculatedTotals.totalVAT 
                      : 0;
                  baseAmount = htAfterEscompte + tvaAfterEscompte;
                }

                const retenueAmount = (baseAmount * retenueValue) / 100;

                return (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Retenue de garantie ({retenueValue}%)
                    </span>
                    <span>-{formatCurrency(retenueAmount)}</span>
                  </div>
                );
              })()}

              {/* Net à payer */}
              {(() => {
                const retenueValue = parseFloat(invoice.retenueGarantie) || 0;
                const escompteValue = parseFloat(invoice.escompte) || 0;

                if (retenueValue <= 0 && escompteValue <= 0) return null;

                // Calculer le net à payer
                let finalAmount = calculatedTotals.totalTTC;

                // Appliquer l'escompte sur HT
                if (escompteValue > 0) {
                  const escompteAmount = (calculatedTotals.totalHT * escompteValue) / 100;
                  const htAfterEscompte = calculatedTotals.totalHT - escompteAmount;
                  const tvaAfterEscompte = invoice.isReverseCharge
                    ? 0
                    : calculatedTotals.totalHT > 0 
                      ? (htAfterEscompte / calculatedTotals.totalHT) * calculatedTotals.totalVAT 
                      : 0;
                  finalAmount = htAfterEscompte + tvaAfterEscompte;
                }

                // Appliquer la retenue sur TTC
                if (retenueValue > 0) {
                  const retenueAmount = (finalAmount * retenueValue) / 100;
                  finalAmount = finalAmount - retenueAmount;
                }

                return (
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Net à payer</span>
                    <span>{formatCurrency(finalAmount)}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <Separator />

          {/* Credit Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Avoirs</h3>
              </div>
              {(invoice.status === INVOICE_STATUS.PENDING ||
                invoice.status === INVOICE_STATUS.COMPLETED ||
                invoice.status === INVOICE_STATUS.CANCELED) &&
                !creditNoteLimitReached && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateCreditNote}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Créer
                  </Button>
                )}
            </div>

            {loadingCreditNotes ? (
              <div className="flex items-center justify-center py-4">
                <LoaderCircle className="h-4 w-4 animate-spin" />
              </div>
            ) : creditNotesError ? (
              <div className="text-sm text-red-500 py-2">
                Erreur lors du chargement des avoirs: {creditNotesError.message}
              </div>
            ) : creditNotes && creditNotes.length > 0 ? (
              <div className="space-y-2">
                {creditNotes.map((creditNote) => (
                  <div
                    key={creditNote.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex flex-col cursor-pointer flex-1 min-w-0"
                        onClick={() => handleViewCreditNote(creditNote)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Receipt className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {creditNote.number}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground ml-9">
                          {formatDate(creditNote.issueDate)} •{" "}
                          {formatCurrency(creditNote.finalTotalTTC || 0)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <UniversalPDFDownloaderWithFacturX
                          data={creditNote}
                          type="creditNote"
                          enableFacturX={true}
                          filename={`avoir-${creditNote.number}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                {invoice.status === INVOICE_STATUS.PENDING ||
                invoice.status === INVOICE_STATUS.COMPLETED ||
                invoice.status === INVOICE_STATUS.CANCELED ? (
                  <div>
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {creditNoteLimitReached ? (
                      <>
                        <p>Limite d'avoirs atteinte</p>
                        <p className="text-xs mt-1">
                          La somme des avoirs a atteint le montant de la facture
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Aucun avoir créé</p>
                        <p className="text-xs mt-1">
                          Cliquez sur "Créer" pour ajouter un avoir
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun avoir</p>
                    <p className="text-xs mt-1">
                      Les avoirs ne peuvent être créés que pour les factures en
                      attente, terminées ou annulées
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section Paiement Bancaire - Affichée uniquement si paiement rattaché ou si pas de suggestions en haut */}
          {invoice.linkedTransactionId && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Paiement bancaire</h3>
                </div>
                <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Paiement rattaché
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnlinkTransaction}
                      disabled={linkingTransaction}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                      {linkingTransaction ? (
                        <LoaderCircle className="h-3 w-3 animate-spin" />
                      ) : (
                        <Unlink className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Section Paiement Bancaire - Pour factures en attente sans suggestions */}
          {invoice.status === INVOICE_STATUS.PENDING &&
            !invoice.linkedTransactionId &&
            suggestedTransactions.length === 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">Paiement bancaire</h3>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTransactionPicker(true)}
                      disabled={linkingTransaction}
                      className="h-7 px-2 text-xs"
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Rattacher
                    </Button>
                  </div>

                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-4">
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Aucun paiement rattaché</p>
                      <p className="text-xs mt-1">
                        Rattachez une transaction bancaire pour marquer la
                        facture comme payée
                      </p>
                    </div>
                  )}

                  {/* Sélecteur de transaction */}
                  {showTransactionPicker && (
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Sélectionner une transaction
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowTransactionPicker(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {loadingTransactions ? (
                        <div className="flex items-center justify-center py-4">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        </div>
                      ) : availableTransactions.length > 0 ? (
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {availableTransactions.map((tx) => (
                              <div
                                key={tx.id || tx._id}
                                className={`p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                                  tx.score >= 80
                                    ? "border-[#5a50ff]/30 bg-[#5a50ff]/5"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleLinkTransaction(tx.id || tx._id)
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {formatCurrency(tx.amount)}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {tx.description}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(tx.date)}
                                    </div>
                                  </div>
                                  {tx.score >= 80 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-[#5a50ff]/10 text-[#5a50ff] border-[#5a50ff]/30"
                                    >
                                      Correspondance
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          <p>Aucune transaction disponible</p>
                          <p className="text-xs mt-1">
                            Connectez un compte bancaire pour voir les
                            transactions
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

          {/* Preview Thumbnail */}
          {/* <div className="space-y-3">
            <h3 className="font-medium">Aperçu</h3>
            <div
              className="border w-[200px] rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsPreviewOpen(true)}
            >
              <div className="aspect-[3/4] bg-white border rounded shadow-sm flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-xs">Cliquer pour voir l'aperçu</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Action Buttons */}
        <div className="border-t p-6 space-y-3">
          {/* Draft Actions */}
          {invoice.status === INVOICE_STATUS.DRAFT && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleEdit}
                disabled={isLoading}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Éditer
              </Button>
              <Button
                onClick={handleCreateInvoice}
                disabled={isLoading}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Créer la facture
              </Button>
            </div>
          )}

          {/* Pending Actions */}
          {invoice.status === INVOICE_STATUS.PENDING && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Annuler la facture
              </Button>
              <Button
                onClick={handleMarkAsPaid}
                disabled={isLoading}
                className="flex-1 font-normal"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marquer comme payée
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="w-full max-w-6xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              Aperçu de la facture {invoice.number || "Brouillon"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-[#F9F9F9] dark:bg-[#1a1a1a] p-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
              <UniversalPreviewPDF data={invoice} type="invoice" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Note Preview Modal - Desktop only */}
      {isCreditNotePreviewOpen && !isMobile && (
        <div className="fixed inset-0 z-[100]">
          {/* Fixed Backdrop */}
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => setIsCreditNotePreviewOpen(false)}
          />

          {/* Fixed Close Button */}
          <button
            onClick={() => setIsCreditNotePreviewOpen(false)}
            className="fixed top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Scrollable Content Area */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="w-[210mm] mx-auto bg-white my-12">
              {/* Credit Note Content */}
              {selectedCreditNote && (
                <UniversalPreviewPDF
                  data={selectedCreditNote}
                  type="creditNote"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Fullscreen - Mobile only - Ne monter que si ouvert */}
      {isCreditNoteMobileFullscreen && selectedCreditNote && (
        <CreditNoteMobileFullscreen
          creditNote={selectedCreditNote}
          isOpen={isCreditNoteMobileFullscreen}
          onClose={() => {
            setIsCreditNoteMobileFullscreen(false);
            setSelectedCreditNote(null);
          }}
        />
      )}
    </>
  );
}
