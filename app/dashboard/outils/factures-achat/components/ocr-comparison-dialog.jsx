"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Pencil, ScanSearch } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { formatDateToFrench } from "@/src/utils/dateFormatter";
import {
  EXPENSE_CATEGORY_OPTIONS,
  getCategoryLabel,
} from "@/lib/category-icons-config";
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

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Champs modifiables à la main dans la colonne « Nouvelle analyse »
const FIELD_KINDS = {
  supplierName: "text",
  invoiceNumber: "text",
  issueDate: "date",
  dueDate: "date",
  amountHT: "number",
  vatRate: "number",
  amountTVA: "number",
  amountTTC: "number",
  category: "select",
  paymentMethod: "select",
};
const NUMBER_KEYS = new Set(["amountHT", "vatRate", "amountTVA", "amountTTC"]);

/**
 * Compare les valeurs actuelles d'une facture d'achat (gauche) avec celles
 * d'une nouvelle analyse OCR (droite). Copie du dialogue des factures
 * importées, champs facture d'achat. Chaque ligne différente est cochée par
 * défaut ; onApply reçoit le patch des champs cochés au format du formulaire
 * du tiroir (dates YYYY-MM-DD, montants en nombre, category = code).
 *
 * `current` = form du tiroir (chaînes), `paymentMethodLabels` = libellés.
 * `multi` (optionnel) = résultat de l'analyse de tous les justificatifs :
 * détail par fichier, proposition combinée par défaut, chaque fichier
 * sélectionnable comme source à la place.
 */
export function PurchaseOcrComparisonDialog({
  open,
  onOpenChange,
  current,
  proposal: singleProposal,
  multi = null,
  currency,
  paymentMethodLabels = {},
  onApply,
  applying = false,
  // Aperçu des justificatifs à gauche : facture + fichiers (url, mimetype)
  invoiceId = null,
  files = [],
  sourceFileId = null,
  // Facture rapprochée : l'API refuse un changement de TTC tant que la
  // transaction est liée. La ligne est bloquée, et « Délier et appliquer »
  // délie puis applique tout (onUnlinkAndApply).
  reconciled = false,
  onUnlinkAndApply = null,
}) {
  // Fichiers affichables dans le volet de gauche (proxy same-origin, la CSP
  // interdit les URL R2 en iframe).
  const previewableFiles = useMemo(
    () => (invoiceId ? (files || []).filter((f) => f?.id && f.url) : []),
    [files, invoiceId],
  );
  const canPreview = (fileId) =>
    Boolean(fileId && previewableFiles.some((f) => f.id === fileId));
  // Fichier affiché à gauche, ouvert d'office à l'ouverture (justificatif
  // relu, sinon premier fichier lu en mode multi) : on vérifie les valeurs
  // sur la pièce. Le dialogue se cale à droite pendant ce temps.
  const [previewFileId, setPreviewFileId] = useState(null);
  useEffect(() => {
    if (!open) {
      setPreviewFileId(null);
      return;
    }
    const firstRead = multi?.files?.find(
      (f) => f.ok && canPreview(f.fileId),
    )?.fileId;
    setPreviewFileId(
      (!multi && canPreview(sourceFileId) ? sourceFileId : null) ||
        firstRead ||
        previewableFiles[0]?.id ||
        null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, multi, sourceFileId]);
  const previewItems = useMemo(
    () =>
      previewableFiles.map((file) => ({
        id: file.id,
        url: file.url,
        pdfSrc: `/api/document-preview/purchaseInvoice/${invoiceId}?fileId=${file.id}`,
        filename: file.originalFilename,
        mimeType: file.mimetype,
      })),
    [previewableFiles, invoiceId],
  );
  const previewIndex = previewItems.findIndex((it) => it.id === previewFileId);
  const previewOpen = previewIndex >= 0;
  const togglePreview = (fileId) =>
    setPreviewFileId((cur) => (cur === fileId ? null : fileId));
  const showFile = (fileId) => {
    if (canPreview(fileId)) setPreviewFileId(fileId);
  };
  // Largeur du dialogue (2xl = 42rem, 3xl = 48rem avec la barre latérale des
  // justificatifs) + marge droite 2rem
  const DIALOG_RIGHT_OFFSET = (multi ? 48 : 42) * 16 + 32;

  // Source des valeurs proposées : combinée ou un fichier précis. Choisir un
  // fichier l'affiche aussi à gauche.
  const [source, setSource] = useState("combined");
  useEffect(() => {
    if (open) setSource("combined");
  }, [open, multi]);
  const selectSource = (value) => {
    setSource(value);
    if (value !== "combined") showFile(value);
  };
  const proposal = useMemo(() => {
    if (!multi) return singleProposal;
    if (source === "combined") return multi.combined;
    const f = multi.files.find((x) => x.fileId === source);
    if (!f?.proposal) return multi.combined;
    const converted =
      f.convertedAmountTTC !== null && f.convertedAmountTTC !== undefined;
    const foreign =
      converted &&
      f.proposal.currency &&
      f.proposal.currency !== (currency || "EUR");
    return {
      ...f.proposal,
      amountHT: converted ? f.convertedAmountHT : f.proposal.amountHT,
      amountTVA: converted ? f.convertedAmountTVA : f.proposal.amountTVA,
      amountTTC: converted ? f.convertedAmountTTC : f.proposal.amountTTC,
      currency: converted ? currency : f.proposal.currency,
      // Même forme que la relance mono-fichier : valeurs lues d'origine
      originalAmountHT: foreign ? f.proposal.amountHT : null,
      originalAmountTVA: foreign ? f.proposal.amountTVA : null,
      originalAmountTTC: foreign ? f.proposal.amountTTC : null,
      originalCurrency: foreign ? f.proposal.currency : null,
      rate: f.rate ?? null,
      rateDate: f.rateDate ?? null,
      conversionMethod: foreign ? "rate" : "none",
      conversionNote: null,
    };
  }, [multi, singleProposal, source, currency]);
  // Devise étrangère lue sur le document : les montants proposés sont
  // convertis, l'original est rappelé sous chaque montant.
  const originalCurrency =
    proposal?.originalCurrency &&
    proposal.originalCurrency !== (currency || "EUR")
      ? proposal.originalCurrency
      : null;
  const unconverted =
    !originalCurrency &&
    proposal?.currency &&
    proposal.currency !== (currency || "EUR");

  // Mode « Modifier » : l'utilisateur corrige les valeurs proposées avant de
  // les appliquer (brouillons en chaînes, appliqués sur la proposition).
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState({});
  useEffect(() => {
    setEditing(false);
    setDrafts({});
  }, [open, proposal]);
  const effectiveProposal = useMemo(
    () => applyOcrDrafts(proposal, drafts, NUMBER_KEYS),
    [proposal, drafts],
  );
  const optionsFor = (key) =>
    key === "category"
      ? EXPENSE_CATEGORY_OPTIONS
      : key === "paymentMethod"
        ? Object.entries(paymentMethodLabels).map(([value, label]) => ({
            value,
            label,
          }))
        : [];
  const formatMoney = (amount, cur) =>
    amount === null || amount === undefined
      ? "—"
      : new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: cur || currency || "EUR",
        }).format(Number(amount) || 0);

  const formatAmount = (amount) =>
    amount === null || amount === undefined || amount === ""
      ? "—"
      : new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: currency || "EUR",
        }).format(Number(amount) || 0);
  const formatDate = (value) => (value ? formatDateToFrench(value) : "—");
  const formatRate = (value) =>
    value === null || value === undefined || value === ""
      ? "—"
      : `${round2(value)} %`;
  const text = (value) => (value ? String(value) : "—");

  const rows = useMemo(() => {
    // Valeurs proposées = analyse OCR + corrections saisies
    const proposal = effectiveProposal;
    if (!proposal || !current) return [];
    const numMissing = (v) => v === null || v === undefined;
    const curNum = (key) =>
      current[key] === "" || current[key] === null || current[key] === undefined
        ? null
        : round2(current[key]);
    const amount = (key, label, render = formatAmount) => ({
      key,
      label,
      currentValue: curNum(key),
      proposedValue: numMissing(proposal[key]) ? null : round2(proposal[key]),
      original: originalCurrency
        ? proposal[`original${key.charAt(0).toUpperCase()}${key.slice(1)}`]
        : null,
      render,
      same:
        curNum(key) ===
        (numMissing(proposal[key]) ? null : round2(proposal[key])),
      missing: numMissing(proposal[key]),
      patch: { [key]: round2(proposal[key]) },
    });
    const date = (key, label) => {
      const proposed = proposal[key] ? proposal[key].slice(0, 10) : null;
      return {
        key,
        label,
        currentValue: current[key] || "",
        proposedValue: proposed,
        render: formatDate,
        same: (current[key] || "") === (proposed || ""),
        missing: !proposed,
        patch: { [key]: proposed },
      };
    };
    const plain = (key, label, render = text) => ({
      key,
      label,
      currentValue: current[key] || "",
      proposedValue: proposal[key] || null,
      render,
      same: (current[key] || "") === (proposal[key] || ""),
      missing: !proposal[key],
      patch: { [key]: proposal[key] || null },
    });
    const ttcRow = amount("amountTTC", "Montant TTC");
    if (reconciled && !ttcRow.same && !ttcRow.missing) {
      ttcRow.locked = true;
      ttcRow.lockedReason =
        "Facture rapprochée : le montant TTC ne peut changer qu'après avoir délié la transaction.";
    }
    return [
      plain("supplierName", "Fournisseur"),
      plain("invoiceNumber", "N° de facture"),
      date("issueDate", "Date d'émission"),
      date("dueDate", "Échéance"),
      amount("amountHT", "Montant HT"),
      amount("vatRate", "Taux de TVA", formatRate),
      amount("amountTVA", "Montant de TVA"),
      ttcRow,
      plain("category", "Catégorie", (v) =>
        v ? getCategoryLabel(v) || v : "—",
      ),
      plain("paymentMethod", "Moyen de paiement", (v) =>
        v ? paymentMethodLabels[v] || v : "—",
      ),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveProposal, current, currency, reconciled, originalCurrency]);

  // Lignes cochées : par défaut celles qui changent et que l'OCR a lues.
  // Pendant la saisie, une valeur corrigée coche sa ligne sans recalculer
  // les autres.
  const [selected, setSelected] = useState({});
  useEffect(() => {
    if (!open || editing) return;
    const next = {};
    for (const row of rows)
      next[row.key] = !row.same && !row.missing && !row.locked;
    setSelected(next);
  }, [open, rows, editing]);
  const setDraft = (key, value) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
    setSelected((prev) => ({ ...prev, [key]: true }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const differences = rows.filter((r) => !r.same && !r.missing).length;
  const lockedRow = rows.find((r) => r.locked);
  const canUnlinkAndApply = Boolean(lockedRow && onUnlinkAndApply);
  const partial = proposal?.extractionQuality === "partial";

  const buildPatch = ({ includeLocked = false } = {}) => {
    let patch = {};
    for (const row of rows) {
      if (row.missing) continue;
      if (row.locked ? includeLocked : selected[row.key]) {
        patch = { ...patch, ...row.patch };
      }
    }
    return patch;
  };
  const handleApply = () => onApply(buildPatch());
  const handleUnlinkAndApply = () =>
    onUnlinkAndApply?.(buildPatch({ includeLocked: true }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-full ${
          multi ? "md:max-w-3xl" : "md:max-w-2xl"
        } flex flex-col max-h-[calc(100vh-4rem)] transition-[left,right,transform] duration-300 ${
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
          index={previewOpen ? previewIndex : 0}
          onIndexChange={(i) => setPreviewFileId(previewItems[i]?.id || null)}
          onClose={() => setPreviewFileId(null)}
          sidebarWidth={DIALOG_RIGHT_OFFSET}
          zIndex={110}
        />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanSearch className="h-5 w-5 text-muted-foreground" />
            Nouvelle analyse OCR
          </DialogTitle>
          <DialogDescription>
            {differences === 0
              ? "La nouvelle analyse lit les mêmes valeurs que celles enregistrées."
              : `${differences} valeur${differences > 1 ? "s" : ""} diffère${differences > 1 ? "nt" : ""}. Cochez celles à reprendre, les autres restent inchangées.`}
            {proposal?.confidence ? (
              <span className="block mt-1 text-xs">
                Confiance de l'analyse :{" "}
                {Math.round(Number(proposal.confidence) * 100)} %
              </span>
            ) : null}
            {partial ? (
              <span className="block mt-1 text-xs text-amber-700 dark:text-amber-300">
                Analyse sans IA (moteurs indisponibles) : valeurs devinées sur
                le texte, à vérifier.
              </span>
            ) : null}
            {originalCurrency ? (
              <span
                className={`block mt-1 text-xs ${
                  proposal?.conversionMethod === "unavailable"
                    ? "text-amber-700 dark:text-amber-300"
                    : ""
                }`}
              >
                Document en {originalCurrency} : montants ramenés en{" "}
                {currency || "EUR"}
                {proposal?.conversionMethod === "bank"
                  ? " sur le débit bancaire lié"
                  : proposal?.rate
                    ? ` au taux BCE 1 ${originalCurrency} = ${proposal.rate} ${currency || "EUR"}${proposal.rateDate ? ` (${proposal.rateDate})` : ""}`
                    : ""}
                .{proposal?.conversionNote ? ` ${proposal.conversionNote}` : ""}
              </span>
            ) : null}
            {unconverted ? (
              <span className="block mt-1 text-xs text-amber-700 dark:text-amber-300">
                Document lu en {proposal.currency}, non converti en{" "}
                {currency || "EUR"} : ne reprenez pas les montants tels quels.
              </span>
            ) : null}
            {!multi && sourceFileId && canPreview(sourceFileId) ? (
              <span className="mt-1 inline-flex items-center gap-1 text-xs">
                <DocumentEyeButton
                  className="h-7 w-7"
                  active={previewFileId === sourceFileId}
                  onClick={() => togglePreview(sourceFileId)}
                />
                {previewFileId === sourceFileId
                  ? "Masquer le justificatif"
                  : "Voir le justificatif analysé"}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {/* Zone défilante : la modale garde 2 rem en haut et en bas. En mode
            multi, barre latérale des justificatifs à gauche : chaque entrée
            devient la source comparée et s'affiche dans le volet. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className={multi ? "flex gap-4 min-h-full" : ""}>
            {multi ? (
              <aside className="w-52 shrink-0 border-r pr-3 space-y-1">
                <p className="px-2 pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {multi.files.length} justificatif
                  {multi.files.length > 1 ? "s" : ""} · {multi.distinctCount}{" "}
                  document{multi.distinctCount > 1 ? "s" : ""} distinct
                  {multi.distinctCount > 1 ? "s" : ""}
                </p>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => selectSource("combined")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      selectSource("combined");
                  }}
                  className={`rounded-md px-2 py-1.5 cursor-pointer text-sm transition-colors ${
                    source === "combined"
                      ? "bg-[#5A50FF]/10 text-[#5A50FF]"
                      : "hover:bg-muted"
                  }`}
                >
                  <p className="font-medium truncate">
                    {multi.distinctCount > 1
                      ? `Somme des ${multi.distinctCount} documents`
                      : "Valeurs combinées"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatMoney(multi.combined?.amountTTC)}
                  </p>
                </div>
                {multi.files.map((f) => {
                  const active = source === f.fileId;
                  const status = !f.ok
                    ? f.error || "Non lu"
                    : f.duplicateOf
                      ? "Même document (non compté)"
                      : "Compté";
                  return (
                    <div
                      key={f.fileId}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        f.ok ? selectSource(f.fileId) : showFile(f.fileId)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ")
                          f.ok ? selectSource(f.fileId) : showFile(f.fileId);
                      }}
                      className={`rounded-md px-1 py-1.5 cursor-pointer text-sm transition-colors ${
                        active
                          ? "bg-[#5A50FF]/10 text-[#5A50FF]"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-1 min-w-0">
                        <DocumentEyeButton
                          className="h-7 w-7"
                          active={previewFileId === f.fileId}
                          disabled={!canPreview(f.fileId)}
                          onClick={() => togglePreview(f.fileId)}
                        />
                        <span className="truncate font-medium">
                          {f.filename || "Justificatif"}
                        </span>
                      </div>
                      <p className="pl-8 text-[11px] text-muted-foreground truncate">
                        {status}
                        {f.ok
                          ? ` · ${formatMoney(
                              f.proposal?.amountTTC,
                              f.proposal?.currency,
                            )}`
                          : ""}
                      </p>
                      {f.ok && f.rate ? (
                        <p className="pl-8 text-[11px] text-muted-foreground truncate">
                          = {formatMoney(f.convertedAmountTTC)} (taux {f.rate}
                          {f.rateDate ? `, ${f.rateDate}` : ""})
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                {multi.conversionNote ? (
                  <p
                    className={`px-2 pt-2 text-[11px] ${
                      multi.conversionMethod === "unavailable"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {multi.conversionNote}
                  </p>
                ) : null}
              </aside>
            ) : null}

            <div className="min-w-0 flex-1 overflow-x-auto -mx-1 px-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="w-8 py-2" />
                    <th className="text-left py-2 font-normal">Champ</th>
                    <th className="text-left py-2 font-normal">
                      Valeurs actuelles
                    </th>
                    <th className="text-left py-2 font-normal">
                      Nouvelle analyse
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const changed = !row.same && !row.missing;
                    return (
                      <tr
                        key={row.key}
                        className={`border-t ${changed ? "bg-[#5A50FF]/5" : ""}`}
                      >
                        <td className="py-2 align-middle">
                          <Checkbox
                            checked={!!selected[row.key]}
                            disabled={row.missing || row.same || row.locked}
                            onCheckedChange={(checked) =>
                              setSelected((prev) => ({
                                ...prev,
                                [row.key]: !!checked,
                              }))
                            }
                            aria-label={`Reprendre ${row.label}`}
                          />
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground whitespace-nowrap">
                          {row.label}
                        </td>
                        <td
                          className={`py-2 pr-3 ${changed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {row.render(row.currentValue)}
                        </td>
                        <td
                          className={`py-2 ${changed ? "font-medium" : row.missing ? "text-muted-foreground" : ""}`}
                        >
                          {editing && FIELD_KINDS[row.key] ? (
                            <OcrValueInput
                              kind={FIELD_KINDS[row.key]}
                              value={
                                drafts[row.key] ??
                                ocrDraftValue(
                                  proposal,
                                  row.key,
                                  FIELD_KINDS[row.key],
                                )
                              }
                              onChange={(v) => setDraft(row.key, v)}
                              options={optionsFor(row.key)}
                            />
                          ) : row.missing ? (
                            "Non lu"
                          ) : (
                            row.render(row.proposedValue)
                          )}
                          {!row.missing &&
                          row.original !== null &&
                          row.original !== undefined ? (
                            <span className="block text-xs font-normal text-muted-foreground">
                              {formatMoney(row.original, originalCurrency)} lu
                              sur le document
                            </span>
                          ) : null}
                          {row.locked ? (
                            <span
                              className="block text-xs font-normal text-amber-700 dark:text-amber-300"
                              title={row.lockedReason}
                            >
                              Facture rapprochée : délier la transaction pour
                              modifier
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => setEditing((v) => !v)}
            disabled={applying}
            className="font-normal gap-1.5 sm:mr-auto"
            title="Corriger directement les valeurs de la nouvelle analyse"
          >
            <Pencil className="h-4 w-4" />
            {editing ? "Terminer la saisie" : "Modifier"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={applying}
            className="font-normal"
          >
            Garder les valeurs actuelles
          </Button>
          {canUnlinkAndApply ? (
            <Button
              variant="outline"
              onClick={handleUnlinkAndApply}
              disabled={applying}
              className="font-normal gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50 dark:text-amber-200 dark:hover:bg-amber-950/40"
              title="Détache la transaction bancaire, puis applique aussi le nouveau montant TTC"
            >
              Délier et appliquer ({selectedCount + 1})
            </Button>
          ) : null}
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={applying || selectedCount === 0}
            className="font-medium gap-1.5"
          >
            {applying ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : null}
            Appliquer {selectedCount > 0 ? `(${selectedCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
