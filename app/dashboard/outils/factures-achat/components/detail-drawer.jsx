"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/src/components/ui/drawer";
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
  Trash2,
  X,
  FileText,
  CheckCircle2,
  ExternalLink,
  LinkIcon,
  CalendarIcon,
  Receipt,
  Building2,
  CreditCard,
  Save,
  Edit,
  Plus,
  Hash,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  useCreatePurchaseInvoice,
  useUpdatePurchaseInvoice,
  useDeletePurchaseInvoice,
  useMarkAsPaid,
  useReconciliationSuggestions,
  useReconcilePurchaseInvoice,
} from "@/src/hooks/usePurchaseInvoices";

const STATUS_OPTIONS = [
  { value: "TO_PROCESS", label: "À traiter" },
  { value: "TO_PAY", label: "À payer" },
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Payée" },
  { value: "OVERDUE", label: "En retard" },
  { value: "ARCHIVED", label: "Archivée" },
];

const STATUS_BADGE = {
  TO_PROCESS: "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
  TO_PAY: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  PENDING: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  PAID: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  OVERDUE: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
  ARCHIVED: "bg-gray-50 text-gray-500 dark:bg-gray-900/20 dark:text-gray-500",
};

const CATEGORY_OPTIONS = [
  { value: "RENT", label: "Loyer" },
  { value: "SUBSCRIPTIONS", label: "Abonnements" },
  { value: "OFFICE_SUPPLIES", label: "Fournitures" },
  { value: "SERVICES", label: "Sous-traitance" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "MEALS", label: "Repas" },
  { value: "TELECOMMUNICATIONS", label: "Télécommunications" },
  { value: "INSURANCE", label: "Assurance" },
  { value: "ENERGY", label: "Énergie" },
  { value: "SOFTWARE", label: "Logiciels" },
  { value: "HARDWARE", label: "Matériel" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TRAINING", label: "Formation" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TAXES", label: "Impôts & taxes" },
  { value: "UTILITIES", label: "Services publics" },
  { value: "OTHER", label: "Autre" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Virement" },
  { value: "CREDIT_CARD", label: "Carte bancaire" },
  { value: "DIRECT_DEBIT", label: "Prélèvement" },
  { value: "CHECK", label: "Chèque" },
  { value: "CASH", label: "Espèces" },
  { value: "OTHER", label: "Autre" },
];

const paymentMethodLabels = Object.fromEntries(
  PAYMENT_METHOD_OPTIONS.map((o) => [o.value, o.label])
);

const categoryLabels = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

const statusLabels = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
);

function formatAmount(amount) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(date, withTime = false) {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  if (withTime) {
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("fr-FR");
}

export function PurchaseInvoiceDetailDrawer({
  open,
  onOpenChange,
  invoice,
  mode = "view",
  onSaved,
  onDeleted,
}) {
  const isCreate = mode === "create";
  const [isEditMode, setIsEditMode] = useState(isCreate);
  const [form, setForm] = useState({
    supplierName: "",
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    amountHT: "",
    amountTVA: "",
    vatRate: "20",
    amountTTC: "",
    currency: "EUR",
    status: "TO_PROCESS",
    category: "OTHER",
    notes: "",
    internalReference: "",
    paymentMethod: "",
  });

  const { createInvoice, loading: createLoading } = useCreatePurchaseInvoice();
  const { updateInvoice, loading: updateLoading } = useUpdatePurchaseInvoice();
  const { deleteInvoice } = useDeletePurchaseInvoice();
  const { markAsPaid, loading: markLoading } = useMarkAsPaid();
  const { reconcile } = useReconcilePurchaseInvoice();
  const { suggestions } = useReconciliationSuggestions(
    !isCreate && invoice?.id && invoice?.status !== "PAID" ? invoice.id : null
  );

  useEffect(() => {
    if (invoice && !isCreate) {
      const parseDate = (val) => {
        if (!val) return "";
        const d = new Date(val);
        return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
      };
      setForm({
        supplierName: invoice.supplierName || "",
        invoiceNumber: invoice.invoiceNumber || "",
        issueDate: parseDate(invoice.issueDate),
        dueDate: parseDate(invoice.dueDate),
        amountHT: invoice.amountHT?.toString() || "",
        amountTVA: invoice.amountTVA?.toString() || "",
        vatRate: invoice.vatRate?.toString() || "20",
        amountTTC: invoice.amountTTC?.toString() || "",
        currency: invoice.currency || "EUR",
        status: invoice.status || "TO_PROCESS",
        category: invoice.category || "OTHER",
        notes: invoice.notes || "",
        internalReference: invoice.internalReference || "",
        paymentMethod: invoice.paymentMethod || "",
      });
      setIsEditMode(false);
    } else if (isCreate) {
      setForm({
        supplierName: "",
        invoiceNumber: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        amountHT: "",
        amountTVA: "",
        vatRate: "20",
        amountTTC: "",
        currency: "EUR",
        status: "TO_PROCESS",
        category: "OTHER",
        notes: "",
        internalReference: "",
        paymentMethod: "",
      });
      setIsEditMode(true);
    }
  }, [invoice, isCreate, open]);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "amountHT" || field === "vatRate") {
        const ht =
          parseFloat(field === "amountHT" ? value : next.amountHT) || 0;
        const rate =
          parseFloat(field === "vatRate" ? value : next.vatRate) || 0;
        const tva = ht * (rate / 100);
        next.amountTVA = tva.toFixed(2);
        next.amountTTC = (ht + tva).toFixed(2);
      }
      if (field === "amountTTC" && !next.amountHT) {
        const ttc = parseFloat(value) || 0;
        const rate = parseFloat(next.vatRate) || 20;
        const ht = ttc / (1 + rate / 100);
        next.amountHT = ht.toFixed(2);
        next.amountTVA = (ttc - ht).toFixed(2);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.supplierName || !form.amountTTC) return;
    const data = {
      supplierName: form.supplierName,
      invoiceNumber: form.invoiceNumber || undefined,
      issueDate: form.issueDate,
      dueDate: form.dueDate || undefined,
      amountHT: parseFloat(form.amountHT) || 0,
      amountTVA: parseFloat(form.amountTVA) || 0,
      vatRate: parseFloat(form.vatRate) || 20,
      amountTTC: parseFloat(form.amountTTC),
      currency: form.currency,
      status: form.status,
      category: form.category,
      notes: form.notes || undefined,
      internalReference: form.internalReference || undefined,
      paymentMethod: form.paymentMethod || undefined,
    };
    if (isCreate) {
      await createInvoice(data);
    } else {
      await updateInvoice(invoice.id, data);
    }
    onSaved?.();
  };

  const handleDelete = async () => {
    if (!invoice?.id) return;
    await deleteInvoice(invoice.id);
    onDeleted?.();
  };

  const handleMarkAsPaid = async () => {
    if (!invoice?.id) return;
    await markAsPaid(
      invoice.id,
      new Date().toISOString(),
      form.paymentMethod || undefined
    );
    onSaved?.();
  };

  const handleReconcile = async (transactionId) => {
    if (!invoice?.id) return;
    await reconcile(invoice.id, [transactionId]);
    onSaved?.();
  };

  const saving = createLoading || updateLoading;

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="w-full h-full md:w-[500px] md:max-w-[500px] md:min-w-[500px] md:h-auto"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Header */}
        <DrawerHeader className="flex flex-row items-center justify-between px-6 py-4 border-b space-y-0">
          <div className="flex items-center gap-2">
            <DrawerTitle className="text-base font-medium">
              {isCreate
                ? "Nouvelle facture d'achat"
                : isEditMode
                ? "Modifier la facture"
                : "Détail de la facture"}
            </DrawerTitle>
            {!isCreate && invoice?.status && (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${STATUS_BADGE[invoice.status] || STATUS_BADGE.TO_PROCESS}`}
              >
                {statusLabels[invoice.status] || invoice.status}
              </span>
            )}
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Amount Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  {isEditMode ? (
                    <Input
                      value={form.supplierName}
                      onChange={(e) =>
                        handleChange("supplierName", e.target.value)
                      }
                      placeholder="Nom du fournisseur"
                      className="text-sm font-medium h-auto py-1 border-none shadow-none px-0 focus-visible:ring-0"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {form.supplierName || "Fournisseur"}
                    </p>
                  )}
                  {isEditMode ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={form.amountTTC}
                        onChange={(e) =>
                          handleChange("amountTTC", e.target.value)
                        }
                        className="text-2xl font-medium h-auto py-1 w-32 border-none shadow-none px-0 focus-visible:ring-0"
                        placeholder="0.00"
                      />
                      <span className="text-2xl font-medium text-muted-foreground">
                        €
                      </span>
                    </div>
                  ) : (
                    <p className="text-2xl font-medium">
                      {formatAmount(invoice?.amountTTC)} €
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Fournisseur */}
            {!isEditMode && (
              <>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Fournisseur
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {invoice?.supplierName || "Non spécifié"}
                      </p>
                      {invoice?.invoiceNumber && (
                        <p className="text-xs text-muted-foreground truncate">
                          N° {invoice.invoiceNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Informations */}
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                Informations
              </p>

              {isEditMode ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        N° Facture
                      </span>
                    </div>
                    <Input
                      value={form.invoiceNumber}
                      onChange={(e) =>
                        handleChange("invoiceNumber", e.target.value)
                      }
                      placeholder="F-20260001"
                      className="w-40 h-8 text-sm text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Date d'émission
                      </span>
                    </div>
                    <Input
                      type="date"
                      value={form.issueDate}
                      onChange={(e) =>
                        handleChange("issueDate", e.target.value)
                      }
                      className="w-40 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Échéance
                      </span>
                    </div>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => handleChange("dueDate", e.target.value)}
                      className="w-40 h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Référence
                      </span>
                    </div>
                    <Input
                      value={form.internalReference}
                      onChange={(e) =>
                        handleChange("internalReference", e.target.value)
                      }
                      placeholder="Optionnel"
                      className="w-40 h-8 text-sm text-right"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoice?.invoiceNumber && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          N° Facture
                        </span>
                      </div>
                      <span className="text-sm font-normal">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Date
                      </span>
                    </div>
                    <span className="text-sm font-normal">
                      {formatDate(invoice?.issueDate)}
                    </span>
                  </div>
                  {invoice?.dueDate && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          Échéance
                        </span>
                      </div>
                      <span className="text-sm font-normal">
                        {formatDate(invoice.dueDate)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Statut
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${STATUS_BADGE[invoice?.status] || STATUS_BADGE.TO_PROCESS}`}
                    >
                      {invoice?.status === "PAID" && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {invoice?.status === "OVERDUE" && (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {statusLabels[invoice?.status] || "À traiter"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Catégorie
                      </span>
                    </div>
                    <span className="text-sm font-normal">
                      {categoryLabels[invoice?.category] || "Autre"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-normal text-muted-foreground">
                        Paiement
                      </span>
                    </div>
                    <span className="text-sm font-normal">
                      {paymentMethodLabels[invoice?.paymentMethod] ||
                        "Non spécifié"}
                    </span>
                  </div>
                  {invoice?.internalReference && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-normal text-muted-foreground">
                          Référence
                        </span>
                      </div>
                      <span className="text-sm font-normal">
                        {invoice.internalReference}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Montants (edit mode) */}
            {isEditMode && (
              <>
                <Separator />
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Montants
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Montant HT
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.amountHT}
                        onChange={(e) =>
                          handleChange("amountHT", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-32 h-8 text-sm text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Taux TVA
                      </span>
                      <Select
                        value={form.vatRate}
                        onValueChange={(v) => handleChange("vatRate", v)}
                      >
                        <SelectTrigger className="w-32 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="2.1">2,1%</SelectItem>
                          <SelectItem value="5.5">5,5%</SelectItem>
                          <SelectItem value="10">10%</SelectItem>
                          <SelectItem value="20">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        TVA
                      </span>
                      <span className="text-sm font-normal">
                        {formatAmount(form.amountTVA)} €
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Montants (view mode) */}
            {!isEditMode && !isCreate && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Montants
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-muted-foreground">
                      HT
                    </span>
                    <span className="text-sm font-normal">
                      {formatAmount(invoice?.amountHT)} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-normal text-muted-foreground">
                      TVA ({invoice?.vatRate || 20}%)
                    </span>
                    <span className="text-sm font-normal">
                      {formatAmount(invoice?.amountTVA)} €
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">TTC</span>
                    <span className="text-sm font-medium">
                      {formatAmount(invoice?.amountTTC)} €
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Catégorisation (edit mode) */}
            {isEditMode && (
              <>
                <Separator />
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Catégorisation
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Catégorie
                      </span>
                      <Select
                        value={form.category}
                        onValueChange={(v) => handleChange("category", v)}
                      >
                        <SelectTrigger className="w-40 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Statut
                      </span>
                      <Select
                        value={form.status}
                        onValueChange={(v) => handleChange("status", v)}
                      >
                        <SelectTrigger className="w-40 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-muted-foreground">
                        Mode de paiement
                      </span>
                      <Select
                        value={form.paymentMethod}
                        onValueChange={(v) => handleChange("paymentMethod", v)}
                      >
                        <SelectTrigger className="w-40 h-8 text-sm">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHOD_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Justificatif */}
            {!isCreate && invoice?.files?.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                      Justificatif
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Attaché
                    </span>
                  </div>
                  <div className="space-y-2">
                    {invoice.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => window.open(file.url, "_blank")}
                      >
                        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-normal truncate">
                            {file.originalFilename}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Rapprochement bancaire */}
            {!isCreate && suggestions?.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                        Rapprochement bancaire
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      Suggestions
                    </span>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((s) => (
                      <div
                        key={s.transactionId}
                        className="p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">
                              {formatAmount(s.amount)} €
                            </span>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {s.description && <span>{s.description}</span>}
                              <span>{formatDate(s.date)}</span>
                              <span>
                                Confiance: {Math.round(s.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleReconcile(s.transactionId)}
                          >
                            <LinkIcon className="h-3.5 w-3.5 mr-1" />
                            Rapprocher
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {invoice?.isReconciled && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                      Rapprochement
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Rapprochée avec{" "}
                      {invoice.linkedTransactionIds?.length || 0} transaction(s)
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {isEditMode ? (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                    Notes
                  </p>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Commentaires internes..."
                    rows={3}
                  />
                </div>
              </>
            ) : (
              invoice?.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-normal uppercase tracking-wide">
                      Notes
                    </p>
                    <p className="text-sm font-normal text-foreground">
                      {invoice.notes}
                    </p>
                  </div>
                </>
              )
            )}

            {/* Paiement date */}
            {invoice?.paymentDate && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-normal text-muted-foreground">
                      Payée le
                    </span>
                    <span className="text-xs font-normal">
                      {formatDate(invoice.paymentDate)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Timestamps */}
            {!isCreate && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-normal text-muted-foreground">
                      Créée le
                    </span>
                    <span className="text-xs font-normal">
                      {formatDate(invoice?.createdAt, true)}
                    </span>
                  </div>
                  {invoice?.updatedAt &&
                    invoice.updatedAt !== invoice.createdAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-normal text-muted-foreground">
                          Modifiée le
                        </span>
                        <span className="text-xs font-normal">
                          {formatDate(invoice.updatedAt, true)}
                        </span>
                      </div>
                    )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <DrawerFooter className="border-t px-6 py-4">
          {isCreate ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-normal"
                onClick={handleClose}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 font-normal bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={saving || !form.supplierName || !form.amountTTC}
              >
                <Plus className="h-4 w-4 mr-2" />
                {saving ? "Création..." : "Créer"}
              </Button>
            </div>
          ) : isEditMode ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-normal"
                onClick={() => setIsEditMode(false)}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 font-normal bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={saving || !form.supplierName || !form.amountTTC}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 font-normal"
                onClick={() => setIsEditMode(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              {invoice?.status !== "PAID" && (
                <Button
                  variant="outline"
                  className="flex-1 font-normal text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={handleMarkAsPaid}
                  disabled={markLoading}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Payée
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Supprimer cette facture ?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
