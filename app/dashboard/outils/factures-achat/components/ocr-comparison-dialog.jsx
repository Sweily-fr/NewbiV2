"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, ScanSearch } from "lucide-react";
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
import { getCategoryLabel } from "@/lib/category-icons-config";
import {
  DocumentEyeButton,
  DocumentPreviewPanel,
  isDocumentPreviewTarget,
} from "@/src/components/document-preview-panel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

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
  // Fichier affiché dans le volet de gauche ; le dialogue se cale à droite
  const [previewFileId, setPreviewFileId] = useState(null);
  useEffect(() => {
    if (!open) setPreviewFileId(null);
  }, [open]);
  const previewItems = useMemo(() => {
    if (!previewFileId) return [];
    const file = (files || []).find((f) => f.id === previewFileId);
    if (!file) return [];
    return [
      {
        url: file.url,
        pdfSrc: `/api/document-preview/purchaseInvoice/${invoiceId}?fileId=${file.id}`,
        filename: file.originalFilename,
        mimeType: file.mimetype,
      },
    ];
  }, [previewFileId, files, invoiceId]);
  const canPreview = (fileId) =>
    Boolean(invoiceId && (files || []).some((f) => f.id === fileId && f.url));
  const togglePreview = (fileId) =>
    setPreviewFileId((cur) => (cur === fileId ? null : fileId));
  const previewOpen = previewItems.length > 0;
  // Largeur du dialogue (md:max-w-2xl = 42rem) + marge droite 2rem
  const DIALOG_RIGHT_OFFSET = 42 * 16 + 32;

  // Source des valeurs proposées : combinée ou un fichier précis
  const [source, setSource] = useState("combined");
  useEffect(() => {
    if (open) setSource("combined");
  }, [open, multi]);
  const proposal = useMemo(() => {
    if (!multi) return singleProposal;
    if (source === "combined") return multi.combined;
    const f = multi.files.find((x) => x.fileId === source);
    if (!f?.proposal) return multi.combined;
    const converted =
      f.convertedAmountTTC !== null && f.convertedAmountTTC !== undefined;
    return {
      ...f.proposal,
      amountHT: converted ? f.convertedAmountHT : f.proposal.amountHT,
      amountTVA: converted ? f.convertedAmountTVA : f.proposal.amountTVA,
      amountTTC: converted ? f.convertedAmountTTC : f.proposal.amountTTC,
      currency: converted ? currency : f.proposal.currency,
    };
  }, [multi, singleProposal, source, currency]);
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
  }, [proposal, current, currency, reconciled]);

  // Lignes cochées : par défaut celles qui changent et que l'OCR a lues.
  const [selected, setSelected] = useState({});
  useEffect(() => {
    if (!open) return;
    const next = {};
    for (const row of rows)
      next[row.key] = !row.same && !row.missing && !row.locked;
    setSelected(next);
  }, [open, rows]);

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
          items={previewItems}
          index={0}
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

        {/* Zone défilante : la modale garde 2 rem en haut et en bas */}
        <div className="min-h-0 flex-1 overflow-y-auto space-y-4">
          {multi ? (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {multi.files.length} justificatif
                  {multi.files.length > 1 ? "s" : ""} analysé
                  {multi.files.length > 1 ? "s" : ""}, {multi.distinctCount}{" "}
                  document{multi.distinctCount > 1 ? "s" : ""} distinct
                  {multi.distinctCount > 1 ? "s" : ""}
                </p>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-8 w-64 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combined">
                      {multi.distinctCount > 1
                        ? `Somme des ${multi.distinctCount} documents`
                        : "Valeurs combinées"}
                    </SelectItem>
                    {multi.files
                      .filter((f) => f.ok)
                      .map((f) => (
                        <SelectItem key={f.fileId} value={f.fileId}>
                          {f.filename || "Justificatif"}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <table className="w-full text-xs">
                <tbody>
                  {multi.files.map((f) => (
                    <tr key={f.fileId} className="border-t">
                      <td className="py-1 pr-2 max-w-[240px]">
                        <div className="flex items-center gap-1 min-w-0">
                          <DocumentEyeButton
                            className="h-7 w-7"
                            active={previewFileId === f.fileId}
                            disabled={!canPreview(f.fileId)}
                            onClick={() => togglePreview(f.fileId)}
                          />
                          <span className="truncate">
                            {f.filename || "Justificatif"}
                          </span>
                        </div>
                      </td>
                      <td className="py-1.5 pr-2 text-muted-foreground whitespace-nowrap">
                        {!f.ok
                          ? f.error || "Non lu"
                          : f.duplicateOf
                            ? "Même document (non compté)"
                            : "Compté"}
                      </td>
                      <td className="py-1.5 text-right whitespace-nowrap">
                        {f.ok
                          ? formatMoney(
                              f.proposal?.amountTTC,
                              f.proposal?.currency,
                            )
                          : "—"}
                        {f.ok && f.rate ? (
                          <span className="block text-muted-foreground">
                            = {formatMoney(f.convertedAmountTTC)} (taux {f.rate}
                            {f.rateDate ? `, ${f.rateDate}` : ""})
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {multi.conversionNote ? (
                <p
                  className={`text-xs ${
                    multi.conversionMethod === "unavailable"
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-muted-foreground"
                  }`}
                >
                  {multi.conversionNote}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-x-auto -mx-1 px-1">
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
                        {row.missing ? "Non lu" : row.render(row.proposedValue)}
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

        <DialogFooter className="gap-2 sm:gap-2">
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
