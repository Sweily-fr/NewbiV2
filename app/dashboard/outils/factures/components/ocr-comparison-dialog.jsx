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
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/src/graphql/importedInvoiceQueries";
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

// Champs modifiables à la main dans la colonne « Nouvelle analyse » (le
// client se choisit dans le tiroir, pas ici)
const FIELD_KINDS = {
  originalInvoiceNumber: "text",
  invoiceDate: "date",
  dueDate: "date",
  totalHT: "number",
  totalVAT: "number",
  totalTTC: "number",
  category: "select",
  paymentMethod: "select",
};
const NUMBER_KEYS = new Set(["totalHT", "totalVAT", "totalTTC"]);
const toOptions = (labels) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/**
 * Compare les valeurs actuelles d'une facture importée (gauche) avec celles
 * d'une nouvelle analyse OCR (droite). Chaque ligne différente est cochée
 * par défaut ; onApply reçoit le patch des champs cochés, déjà au format
 * attendu par updateImportedInvoice (dates YYYY-MM-DD, montants en nombre).
 */
export function OcrComparisonDialog({
  open,
  onOpenChange,
  current,
  proposal,
  currency,
  onApply,
  applying = false,
  // Aperçu du fichier de la facture à gauche (proxy same-origin) : ouvert
  // d'office pour vérifier les valeurs relues sur la pièce.
  invoiceId = null,
  file = null,
}) {
  const previewItem = useMemo(
    () =>
      invoiceId && file?.url
        ? {
            url: file.url,
            pdfSrc: `/api/document-preview/importedInvoice/${invoiceId}`,
            filename: file.originalFileName,
            mimeType: file.mimeType,
          }
        : null,
    [invoiceId, file],
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  useEffect(() => {
    setPreviewOpen(open && !!previewItem);
  }, [open, previewItem]);
  // Largeur du dialogue (md:max-w-2xl = 42rem) + marge droite 2rem
  const DIALOG_RIGHT_OFFSET = 42 * 16 + 32;

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
      ? toOptions(EXPENSE_CATEGORY_LABELS)
      : key === "paymentMethod"
        ? toOptions(PAYMENT_METHOD_LABELS)
        : [];

  const formatAmount = (amount) =>
    amount === null || amount === undefined
      ? "—"
      : new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: currency || "EUR",
        }).format(Number(amount) || 0);
  const formatDate = (value) => (value ? formatDateToFrench(value) : "—");
  const text = (value) => (value ? String(value) : "—");

  const rows = useMemo(() => {
    // Valeurs proposées = analyse OCR + corrections saisies
    const proposal = effectiveProposal;
    if (!proposal || !current) return [];
    const amount = (key, label) => ({
      key,
      label,
      currentValue: round2(current[key]),
      proposedValue:
        proposal[key] === null || proposal[key] === undefined
          ? null
          : round2(proposal[key]),
      render: formatAmount,
      same: round2(current[key]) === round2(proposal[key]),
      missing: proposal[key] === null || proposal[key] === undefined,
      patch: { [key]: round2(proposal[key]) },
    });
    // Client : le rapprochement est rejoué par l'API sur les valeurs relues.
    // Même client si les deux sont associés au même client Newbi, sinon
    // comparaison des noms. Appliquer = associer (ou dissocier) + nom.
    const norm = (v) => (v || "").trim().toLowerCase();
    const clientRow = () => {
      const cur = {
        id: current.clientId || null,
        name: current.clientName || "",
      };
      const prop = proposal.clientName
        ? {
            id: proposal.clientId || null,
            name: proposal.clientName,
            matched: !!proposal.clientMatched,
          }
        : null;
      const same = prop
        ? cur.id && prop.id
          ? cur.id === prop.id
          : norm(cur.name) === norm(prop.name)
        : true;
      return {
        key: "client",
        label: "Client",
        currentValue: cur,
        proposedValue: prop,
        render: (v) =>
          v && v.name ? (
            <span>
              {v.name}{" "}
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {v.id ? "(client existant)" : "(non rapproché)"}
              </span>
            </span>
          ) : (
            "—"
          ),
        same,
        missing: !prop,
        patch: prop ? { clientId: prop.id, clientName: prop.name } : {},
      };
    };
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
    return [
      plain("originalInvoiceNumber", "N° de facture"),
      clientRow(),
      date("invoiceDate", "Date d'émission"),
      date("dueDate", "Échéance"),
      amount("totalHT", "Montant HT"),
      amount("totalVAT", "Montant de TVA"),
      amount("totalTTC", "Montant TTC"),
      plain("category", "Catégorie", (v) =>
        v ? EXPENSE_CATEGORY_LABELS[v] || v : "—",
      ),
      plain("paymentMethod", "Moyen de paiement", (v) =>
        v ? PAYMENT_METHOD_LABELS[v] || v : "—",
      ),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveProposal, current, currency]);

  // Lignes cochées : par défaut celles qui changent et que l'OCR a lues.
  // Pendant la saisie, une valeur corrigée coche sa ligne sans recalculer
  // les autres.
  const [selected, setSelected] = useState({});
  useEffect(() => {
    if (!open || editing) return;
    const next = {};
    for (const row of rows) next[row.key] = !row.same && !row.missing;
    setSelected(next);
  }, [open, rows, editing]);
  const setDraft = (key, value) => {
    setDrafts((prev) => ({ ...prev, [key]: value }));
    setSelected((prev) => ({ ...prev, [key]: true }));
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const differences = rows.filter((r) => !r.same && !r.missing).length;

  const handleApply = () => {
    let patch = {};
    for (const row of rows) {
      if (selected[row.key] && !row.missing) patch = { ...patch, ...row.patch };
    }
    onApply(patch);
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
          items={previewOpen && previewItem ? [previewItem] : []}
          index={0}
          onClose={() => setPreviewOpen(false)}
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
            {previewItem ? (
              <span className="mt-1 inline-flex items-center gap-1 text-xs">
                <DocumentEyeButton
                  className="h-7 w-7"
                  active={previewOpen}
                  onClick={() => setPreviewOpen((v) => !v)}
                />
                {previewOpen
                  ? "Masquer la facture"
                  : "Voir la facture analysée"}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground uppercase tracking-wide">
                <th className="w-8 py-2" />
                <th className="text-left py-2 font-normal">Champ</th>
                <th className="text-left py-2 font-normal">
                  Valeurs actuelles
                </th>
                <th className="text-left py-2 font-normal">Nouvelle analyse</th>
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
                        disabled={row.missing || row.same}
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
