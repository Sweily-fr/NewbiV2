"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, LoaderCircle, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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

// Largeur réservée au dialogue quand le document est affiché à gauche :
// largeur du dialogue (max-w-2xl = 42rem) + sa marge droite (right-8).
// Trop petite, le volet d'aperçu passerait sous le dialogue.
const DIALOG_RIGHT_OFFSET = 42 * 16 + 32;

const PAYMENT_METHOD_OPTIONS = [
  { value: "BANK_TRANSFER", label: "Virement" },
  { value: "CREDIT_CARD", label: "Carte bancaire" },
  { value: "DIRECT_DEBIT", label: "Prélèvement" },
  { value: "CHECK", label: "Chèque" },
  { value: "CASH", label: "Espèces" },
  { value: "OTHER", label: "Autre" },
];

// Champs confirmés avant création, dans l'ordre d'affichage
const FIELDS = [
  { key: "supplierName", label: "Fournisseur", kind: "text" },
  { key: "invoiceNumber", label: "Numéro de facture", kind: "text" },
  { key: "issueDate", label: "Date de facture", kind: "date" },
  { key: "dueDate", label: "Échéance", kind: "date" },
  // Montants en saisie texte : pas de compteur ni de molette, et la virgule
  // décimale passe (la conversion est faite par NUMBER_KEYS).
  { key: "amountHT", label: "Montant HT", kind: "text" },
  { key: "amountTVA", label: "TVA", kind: "text" },
  { key: "vatRate", label: "Taux de TVA (%)", kind: "text" },
  { key: "amountTTC", label: "Montant TTC", kind: "text" },
  { key: "category", label: "Catégorie", kind: "category" },
  { key: "paymentMethod", label: "Moyen de paiement", kind: "select" },
];

const NUMBER_KEYS = new Set(["amountHT", "amountTVA", "vatRate", "amountTTC"]);

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
    if (values[key] !== undefined) out[key] = values[key];
  }
  if (values.category) out.subcategory = values.category;
  return out;
};

// Pourquoi une facture existante ressemble à celle qui vient d'être lue.
const DUPLICATE_REASONS = {
  NUMBER: "elle porte le même numéro de facture",
  SUPPLIER_AMOUNT: "même fournisseur, même montant et dates proches",
  LINKED: "le document n'a pas pu être lu, et cette facture est déjà liée à la dépense",
};

const formatAmount = (amount, currency = "EUR") =>
  typeof amount === "number"
    ? new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: currency || "EUR",
      }).format(amount)
    : "-";

/**
 * Confirmation d'une facture d'achat proposée depuis un justificatif déposé
 * sur une transaction.
 *
 * L'analyse ne crée plus rien toute seule : les valeurs lues sont présentées
 * ici, modifiables, et la facture n'existe qu'une fois confirmée. Quand une
 * facture existante ressemble à celle lue, le choix est explicite
 * (« Rattacher » ou « Créer quand même ») au lieu d'un rattachement
 * silencieux qui donnait l'impression que rien n'avait été créé.
 *
 * @param {Object} receiptFile justificatif porteur de `proposal`
 * @param {Function} onConfirm (action, values, purchaseInvoiceId) => Promise
 * @param {number} queueIndex position dans la file (0-based), pour « 2 sur 3 »
 */
export function ReceiptInvoiceConfirmationDialog({
  open,
  onOpenChange,
  transaction,
  receiptFile,
  onConfirm,
  queueIndex = 0,
  queueLength = 1,
}) {
  const proposal = receiptFile?.proposal || null;
  const duplicate = proposal?.duplicate || null;

  const [drafts, setDrafts] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pending, setPending] = useState(null);

  // Nouvelle proposition (fichier suivant de la file) : on repart des valeurs
  // lues, sans traîner les corrections saisies pour le fichier précédent.
  useEffect(() => {
    setDrafts({});
    setPending(null);
    // Confirmer, c'est comparer les valeurs lues au document : il s'affiche
    // donc d'emblée à gauche. Sur petit écran le volet couvre tout l'écran et
    // masquerait le formulaire : il reste fermé, le bouton œil l'ouvre.
    setPreviewOpen(
      typeof window !== "undefined" &&
        window.matchMedia("(min-width: 768px)").matches,
    );
  }, [receiptFile?.id]);

  // La liste de catégories affiche la sous-catégorie fine (référentiel
  // Transactions), avec repli sur le code large des anciennes propositions.
  const initial = useMemo(
    () =>
      proposal
        ? { ...proposal, category: proposal.subcategory || proposal.category }
        : {},
    [proposal],
  );

  const values = useMemo(
    () => applyOcrDrafts(initial, drafts, NUMBER_KEYS),
    [initial, drafts],
  );

  const previewItems = useMemo(
    () =>
      receiptFile
        ? [
            {
              id: receiptFile.id,
              url: receiptFile.url,
              filename: receiptFile.filename,
              mimetype: receiptFile.mimetype,
              // Aperçu par le proxy same-origin : la CSP de prod interdit
              // l'iframe vers l'URL publique R2.
              pdfSrc:
                transaction?.id && receiptFile.id
                  ? `/api/document-preview/transaction/${transaction.id}?fileId=${receiptFile.id}`
                  : receiptFile.url,
            },
          ]
        : [],
    [receiptFile, transaction?.id],
  );

  if (!proposal) return null;

  const incomplete = ["partial", "none"].includes(proposal.extractionQuality);

  const submit = async (action, purchaseInvoiceId = null) => {
    setPending(action);
    try {
      await onConfirm(action, toMutationValues(values), purchaseInvoiceId);
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-full md:max-w-2xl flex flex-col max-h-[calc(100vh-4rem)] transition-[left,right,transform] duration-300 ${
          previewOpen ? "md:left-auto md:right-8 md:translate-x-0" : ""
        }`}
        // Un clic dans le volet d'aperçu (portail) ne ferme pas le dialogue
        onPointerDownOutside={(e) => {
          if (isDocumentPreviewTarget(e.detail?.originalEvent?.target))
            e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isDocumentPreviewTarget(e.detail?.originalEvent?.target))
            e.preventDefault();
        }}
      >
        <DocumentPreviewPanel
          items={previewOpen ? previewItems : []}
          index={0}
          onClose={() => setPreviewOpen(false)}
          sidebarWidth={DIALOG_RIGHT_OFFSET}
          zIndex={110}
        />

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Confirmer la facture d&apos;achat
            {queueLength > 1 ? (
              <Badge variant="secondary" className="ml-1 font-normal">
                {queueIndex + 1} sur {queueLength}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Vérifiez les informations lues sur{" "}
            <span className="font-medium">{receiptFile?.filename}</span> avant
            de créer la facture. Rien n&apos;est enregistré tant que vous
            n&apos;avez pas confirmé.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {receiptFile?.filename}
              </p>
              <p className="text-xs text-muted-foreground">
                Dépense du {formatDateToFrench(transaction?.date)} ·{" "}
                {formatAmount(
                  Math.abs(Number(transaction?.amount) || 0),
                  transaction?.currency,
                )}
              </p>
            </div>
            <DocumentEyeButton
              active={previewOpen}
              onClick={() => setPreviewOpen((v) => !v)}
            />
          </div>

          {incomplete ? (
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
              <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Le document n&apos;a pas pu être lu entièrement : les valeurs
                ci-dessous viennent en partie de la ligne bancaire. Complétez-les
                avant de créer la facture.
              </p>
            </div>
          ) : null}

          {duplicate ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-blue-900/40 dark:bg-blue-900/20">
              <p className="font-medium text-blue-900 dark:text-blue-200">
                Une facture d&apos;achat existante lui ressemble
              </p>
              <p className="mt-1 text-blue-900/90 dark:text-blue-200/90">
                {duplicate.supplierName}
                {duplicate.invoiceNumber ? ` · ${duplicate.invoiceNumber}` : ""}
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
                className="mt-2"
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

          <div className="space-y-2">
            {FIELDS.map(({ key, label, kind }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 border-b py-1.5 last:border-b-0"
              >
                <label className="text-sm text-muted-foreground">{label}</label>
                {kind === "category" ? (
                  // Même sélecteur que partout ailleurs (recherche, groupes,
                  // référentiel Transactions) plutôt qu'une liste déroulante
                  <CategorySearchSelect
                    value={ocrDraftValue({ ...initial, ...drafts }, key, kind)}
                    onValueChange={(v) =>
                      setDrafts((d) => ({ ...d, [key]: v }))
                    }
                    triggerClassName="w-48 h-8 text-sm"
                  />
                ) : (
                  <OcrValueInput
                    kind={kind}
                    value={ocrDraftValue({ ...initial, ...drafts }, key, kind)}
                    onChange={(v) => setDrafts((d) => ({ ...d, [key]: v }))}
                    options={OPTIONS_BY_KEY[key] || []}
                    // Le calendrier s'ouvre vers la gauche : aligné à droite
                    // sur un champ en fin de ligne, il collerait au bord.
                    align="end"
                    className={kind === "text" ? "max-w-[18rem]" : ""}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={Boolean(pending)}
            onClick={() => submit("SKIP")}
          >
            {pending === "SKIP" ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Ne pas créer de facture
          </Button>
          <Button
            type="button"
            disabled={Boolean(pending)}
            onClick={() => submit("CREATE")}
          >
            {pending === "CREATE" ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {duplicate ? "Créer quand même" : "Créer la facture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReceiptInvoiceConfirmationDialog;
