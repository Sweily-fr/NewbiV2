"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, LoaderCircle, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PreviewImage } from "@/src/components/ui/preview-image";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import CategorySearchSelect from "@/src/components/category-search-select";
import {
  DocumentEyeButton,
  DocumentPreviewPanel,
  isDocumentPreviewTarget,
} from "@/src/components/document-preview-panel";
import {
  OcrValueInput,
  applyOcrDrafts,
  ocrDraftValue,
} from "@/src/components/reconciliation/OcrValueInput";
import {
  AddVatRateButton,
  VatBreakdownEditor,
} from "@/app/dashboard/outils/factures-achat/components/vat-breakdown";
import {
  applyVatLinesToForm,
  invoiceVatLines,
  parseVatLines,
  splitVatIntoLines,
  summarizeVatLines,
  toVatLinesForm,
} from "@/src/utils/purchase-invoice-vat";

// Largeur de la colonne de saisie, le document occupant le reste
const FORM_PANE_WIDTH = 420;

// Largeur commune à tous les champs, sélecteur de catégorie compris
const FIELD_WIDTH = "w-44";

const PAYMENT_METHOD_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Virement" },
  { value: "CREDIT_CARD", label: "Carte bancaire" },
  { value: "DIRECT_DEBIT", label: "Prélèvement" },
  { value: "CHECK", label: "Chèque" },
  { value: "CASH", label: "Espèces" },
  { value: "OTHER", label: "Autre" },
];

// Champs confirmés avant création, groupés par nature : une colonne de dix
// lignes identiques se lisait mal.
const FIELD_GROUPS = [
  {
    title: "Fournisseur",
    fields: [
      { key: "supplierName", label: "Nom", kind: "text" },
      { key: "invoiceNumber", label: "Numéro de facture", kind: "text" },
    ],
  },
  {
    title: "Dates",
    fields: [
      { key: "issueDate", label: "Date de facture", kind: "date" },
      { key: "dueDate", label: "Échéance", kind: "date" },
    ],
  },
  {
    title: "Montants",
    // Saisie texte : pas de compteur ni de molette, et la virgule décimale
    // passe (la conversion est faite par NUMBER_KEYS).
    fields: [
      { key: "amountHT", label: "Montant HT", kind: "text" },
      { key: "amountTVA", label: "TVA", kind: "text" },
      { key: "vatRate", label: "Taux de TVA (%)", kind: "text" },
      { key: "amountTTC", label: "Montant TTC", kind: "text" },
    ],
  },
  {
    title: "Classement",
    fields: [
      { key: "category", label: "Catégorie", kind: "category" },
      { key: "paymentMethod", label: "Moyen de paiement", kind: "select" },
    ],
  },
];

const NUMBER_KEYS = new Set(["amountHT", "amountTVA", "vatRate", "amountTTC"]);
// Montants affichés avec les centimes (11,4 € se lit mal sur une facture)
const MONEY_KEYS = new Set(["amountHT", "amountTVA", "amountTTC"]);

const toNumber = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const OPTIONS_BY_KEY = {
  paymentMethod: PAYMENT_METHOD_OPTIONS,
};

// Champs acceptés par la mutation : tout le reste (qualité d'extraction,
// doublon, __typename…) ferait échouer la requête.
const INPUT_KEYS = [
  "supplierName",
  "invoiceNumber",
  "issueDate",
  "dueDate",
  "amountHT",
  "amountTVA",
  "vatRate",
  "amountTTC",
  "currency",
  "paymentMethod",
];

/**
 * Valeurs envoyées à l'API. La liste de catégories est le référentiel fin
 * (Transactions) : le choix part en `subcategory`, la catégorie large est
 * dérivée côté serveur, comme à l'enregistrement d'une facture d'achat.
 */
const toMutationValues = (values) => {
  const out = {};
  for (const key of INPUT_KEYS) {
    if (values[key] === undefined) continue;
    // Les montants sont saisis en texte (centimes affichés, virgule admise) :
    // reconvertis en nombres pour l'API.
    out[key] = NUMBER_KEYS.has(key) ? toNumber(values[key]) : values[key];
  }
  if (values.category) out.subcategory = values.category;
  return out;
};

// Pourquoi une facture existante ressemble à celle qui vient d'être lue.
const DUPLICATE_REASONS = {
  NUMBER: "elle porte le même numéro de facture",
  SUPPLIER_AMOUNT: "même fournisseur, même montant et dates proches",
  LINKED:
    "le document n'a pas pu être lu, et cette facture est déjà liée à la dépense",
};

const formatAmount = (amount, currency = "EUR") =>
  typeof amount === "number"
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || "EUR",
      }).format(amount)
    : "-";

const isPdfFile = (file) =>
  (file?.mimetype || "").includes("pdf") ||
  /\.pdf($|\?)/i.test(file?.filename || file?.url || "");

/**
 * Confirmation d'une facture d'achat proposée depuis un justificatif déposé
 * sur une transaction.
 *
 * Deux volets dans la même surface : le document à gauche, les valeurs lues
 * à droite. Confirmer, c'est comparer les deux, elles sont donc côte à côte
 * plutôt que dans un volet qui recouvre la page.
 *
 * L'analyse ne crée plus rien toute seule : la facture n'existe qu'une fois
 * confirmée. Quand une facture existante ressemble à celle lue, le choix est
 * explicite (« Rattacher » ou « Créer quand même ») au lieu d'un rattachement
 * silencieux qui donnait l'impression que rien n'avait été créé.
 *
 * @param {Object} receiptFile justificatif, porteur de `proposal` une fois
 *   l'analyse terminée (absent = lecture en cours)
 * @param {Function} onConfirm (action, values, purchaseInvoiceId) => Promise
 * @param {number} queueLength justificatifs restant à confirmer
 */
export function ReceiptInvoiceConfirmationDialog({
  open,
  onOpenChange,
  transaction,
  receiptFile,
  onConfirm,
  queueLength = 1,
}) {
  const proposal = receiptFile?.proposal || null;
  const duplicate = proposal?.duplicate || null;

  const [drafts, setDrafts] = useState({});
  // Lignes de TVA quand le justificatif mêle plusieurs taux (≥ 2 lignes)
  const [vatLines, setVatLines] = useState([]);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [pending, setPending] = useState(null);

  // Nouveau justificatif (suivant de la file) : on repart des valeurs lues,
  // sans traîner les corrections saisies pour le précédent.
  useEffect(() => {
    setDrafts({});
    setPending(null);
    setMobilePreviewOpen(false);
  }, [receiptFile?.id]);
  // Détail par taux lu, repris quand l'analyse rend ses valeurs
  const analyzed = Boolean(proposal);
  useEffect(() => {
    setVatLines(toVatLinesForm(invoiceVatLines(proposal)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptFile?.id, analyzed]);

  // La liste de catégories affiche la sous-catégorie fine (référentiel
  // Transactions), avec repli sur le code large des anciennes propositions.
  const initial = useMemo(() => {
    if (!proposal) return {};
    const out = {
      ...proposal,
      category: proposal.subcategory || proposal.category,
    };
    for (const key of MONEY_KEYS) {
      if (typeof out[key] === "number") out[key] = out[key].toFixed(2);
    }
    return out;
  }, [proposal]);

  const values = useMemo(
    () => applyOcrDrafts(initial, drafts, NUMBER_KEYS),
    [initial, drafts],
  );

  // Aperçu par le proxy same-origin : la CSP de prod interdit l'iframe vers
  // l'URL publique R2.
  const pdfSrc =
    transaction?.id && receiptFile?.id
      ? `/api/document-preview/transaction/${transaction.id}?fileId=${receiptFile.id}`
      : receiptFile?.url;

  const previewItems = useMemo(
    () =>
      receiptFile
        ? [
            {
              id: receiptFile.id,
              url: receiptFile.url,
              filename: receiptFile.filename,
              mimetype: receiptFile.mimetype,
              pdfSrc,
            },
          ]
        : [],
    [receiptFile, pdfSrc],
  );

  // Ouverte dès le dépôt du justificatif : tant que l'analyse n'a pas rendu
  // ses valeurs, les champs sont en attente et les actions désactivées. Elle
  // ne s'ouvre donc jamais à l'improviste après coup.
  const analyzing = !proposal;
  const incomplete =
    !analyzing && ["partial", "none"].includes(proposal.extractionQuality);

  // Plusieurs taux : HT / TVA / taux affichés sont le résumé des lignes. Le
  // TTC ne bouge pas, c'est la dépense bancaire.
  const handleVatLinesChange = (lines) => {
    const form = applyVatLinesToForm({ ...values, vatLines }, lines, {
      keepTTC: true,
    });
    setVatLines(form.vatLines);
    setDrafts((d) => ({
      ...d,
      amountHT: form.amountHT,
      amountTVA: form.amountTVA,
      vatRate: form.vatRate,
    }));
  };

  const mutationValues = () => {
    const out = toMutationValues(values);
    const lines = parseVatLines(vatLines);
    if (vatLines.length >= 2 && lines.length >= 2) {
      return { ...out, ...summarizeVatLines(lines), vatBreakdown: lines };
    }
    // Détail lu ramené à un seul taux
    if (invoiceVatLines(proposal).length) out.vatBreakdown = [];
    return out;
  };

  const submit = async (action, purchaseInvoiceId = null) => {
    setPending(action);
    try {
      await onConfirm(action, mutationValues(), purchaseInvoiceId);
    } finally {
      setPending(null);
    }
  };

  // Montants : un seul taux = champs habituels ; plusieurs = lignes de TVA,
  // puis le TTC.
  const renderAmounts = (fields) => {
    if (analyzing) return fields.map(renderField);
    if (vatLines.length >= 2) {
      return (
        <>
          <VatBreakdownEditor
            lines={vatLines}
            currency={values.currency}
            amountTTC={toNumber(values.amountTTC)}
            onChange={handleVatLinesChange}
            compact
          />
          {fields.filter((f) => f.key === "amountTTC").map(renderField)}
        </>
      );
    }
    return (
      <>
        {fields.map(renderField)}
        <AddVatRateButton
          onClick={() =>
            handleVatLinesChange(splitVatIntoLines({ ...values, vatLines }))
          }
        />
      </>
    );
  };

  const renderField = ({ key, label, kind }) => (
    <div key={key} className="flex items-center justify-between gap-3">
      <label className="text-sm text-muted-foreground">{label}</label>
      {analyzing ? (
        <Skeleton className={`h-8 ${FIELD_WIDTH}`} />
      ) : kind === "category" ? (
        // Même sélecteur que partout ailleurs (recherche, groupes,
        // référentiel Transactions) plutôt qu'une liste déroulante
        <CategorySearchSelect
          value={ocrDraftValue({ ...initial, ...drafts }, key, kind)}
          onValueChange={(v) => setDrafts((d) => ({ ...d, [key]: v }))}
          triggerClassName={`${FIELD_WIDTH} h-8 text-sm`}
        />
      ) : (
        <OcrValueInput
          kind={kind}
          value={ocrDraftValue({ ...initial, ...drafts }, key, kind)}
          onChange={(v) => setDrafts((d) => ({ ...d, [key]: v }))}
          options={OPTIONS_BY_KEY[key] || []}
          // Le calendrier s'ouvre vers la gauche : aligné à droite sur un
          // champ en fin de ligne, il collerait au bord.
          align="end"
          widthClassName={FIELD_WIDTH}
        />
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[96vw] max-w-[1180px] sm:max-w-[1180px] h-[88vh] p-0 gap-0 overflow-hidden flex flex-col"
        // Un clic dans l'aperçu plein écran (portail) ne ferme pas le dialogue
        onPointerDownOutside={(e) => {
          if (isDocumentPreviewTarget(e.detail?.originalEvent?.target))
            e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isDocumentPreviewTarget(e.detail?.originalEvent?.target))
            e.preventDefault();
        }}
      >
        {/* Aperçu plein écran, seulement en dessous de md où le document ne
            tient pas à côté du formulaire */}
        <DocumentPreviewPanel
          items={mobilePreviewOpen ? previewItems : []}
          index={0}
          onClose={() => setMobilePreviewOpen(false)}
          sidebarWidth={0}
          zIndex={110}
        />

        <div className="flex min-h-0 flex-1">
          {/* Volet document */}
          <div className="hidden md:flex flex-col min-h-0 flex-1 bg-muted/40 border-r">
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-background/60">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">
                {receiptFile?.filename || "Justificatif"}
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-4">
              {isPdfFile(receiptFile) && pdfSrc ? (
                <iframe
                  src={`${pdfSrc}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  title={receiptFile?.filename || "Justificatif"}
                  className="w-full h-full min-h-[60vh] border-0 bg-white rounded-md shadow-sm"
                />
              ) : receiptFile?.url ? (
                // Même rendu d'image que le volet d'aperçu (chargement,
                // repli si le fichier ne s'affiche pas)
                <PreviewImage
                  src={receiptFile.url}
                  alt={receiptFile.filename || "Justificatif"}
                  className="w-full h-auto object-contain rounded-md bg-white shadow-sm"
                  containerClassName="w-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Aucun aperçu disponible
                </div>
              )}
            </div>
          </div>

          {/* Volet saisie */}
          <div
            className="flex flex-col min-h-0 w-full md:w-[var(--form-pane)] md:shrink-0"
            style={{ "--form-pane": `${FORM_PANE_WIDTH}px` }}
          >
            <div className="px-5 py-4 border-b">
              <DialogTitle className="flex items-center gap-2 pr-8">
                Confirmer la facture d&apos;achat
                {queueLength > 1 ? (
                  // La file est consommée au fur et à mesure : on annonce ce
                  // qui reste, pas une position qui ne bougerait pas.
                  <Badge variant="secondary" className="font-normal">
                    {queueLength} à confirmer
                  </Badge>
                ) : null}
              </DialogTitle>
              <DialogDescription className="mt-1.5">
                Dépense du {formatDateToFrench(transaction?.date)} ·{" "}
                {formatAmount(
                  Math.abs(Number(transaction?.amount) || 0),
                  transaction?.currency,
                )}
                {transaction?.description ? ` · ${transaction.description}` : ""}
              </DialogDescription>
              <div className="mt-3 md:hidden">
                <DocumentEyeButton
                  active={mobilePreviewOpen}
                  onClick={() => setMobilePreviewOpen((v) => !v)}
                  label="Voir le justificatif"
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
              {analyzing ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin shrink-0" />
                  Lecture du document en cours...
                </div>
              ) : null}

              {incomplete ? (
                <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
                  <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>
                    Document lu partiellement : certaines valeurs viennent de la
                    ligne bancaire. Complétez-les avant de créer la facture.
                  </p>
                </div>
              ) : null}

              {duplicate ? (
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm dark:border-blue-900/40 dark:bg-blue-900/20">
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    Une facture d&apos;achat existante lui ressemble
                  </p>
                  <p className="mt-1 text-blue-900/90 dark:text-blue-200/90">
                    {duplicate.supplierName}
                    {duplicate.invoiceNumber
                      ? ` · ${duplicate.invoiceNumber}`
                      : ""}
                    {" · "}
                    {formatAmount(duplicate.amountTTC, duplicate.currency)}
                    {duplicate.issueDate
                      ? ` · ${formatDateToFrench(duplicate.issueDate)}`
                      : ""}
                  </p>
                  <p className="mt-1 text-xs text-blue-900/80 dark:text-blue-200/80">
                    Raison :{" "}
                    {DUPLICATE_REASONS[duplicate.reason] ||
                      "les deux documents se ressemblent"}
                    .
                    {duplicate.linkTransaction === false
                      ? " Cette facture est déjà réglée par d'autres prélèvements : en la rattachant, cette dépense-ci restera à rapprocher."
                      : ""}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2.5"
                    disabled={Boolean(pending)}
                    onClick={() => submit("ATTACH", duplicate.id)}
                  >
                    {pending === "ATTACH" ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Rattacher à cette facture
                  </Button>
                </div>
              ) : null}

              {FIELD_GROUPS.map((group) => (
                <section key={group.title} className="space-y-2.5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </h3>
                  {group.title === "Montants"
                    ? renderAmounts(group.fields)
                    : group.fields.map(renderField)}
                </section>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-t bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={Boolean(pending) || analyzing}
                onClick={() => submit("SKIP")}
              >
                {pending === "SKIP" ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Ne pas créer de facture
              </Button>
              <Button
                type="button"
                disabled={Boolean(pending) || analyzing}
                onClick={() => submit("CREATE")}
              >
                {pending === "CREATE" ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {duplicate ? "Créer quand même" : "Créer la facture"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReceiptInvoiceConfirmationDialog;
