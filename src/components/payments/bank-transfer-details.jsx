"use client";

import { Copy } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

/**
 * Coordonnées d'un virement direct au vendeur (transferts de fichiers,
 * billetterie, rendez-vous payants) : titulaire, IBAN, BIC, banque,
 * référence à indiquer et montant, chacun copiable.
 */

/** « FR76 3000 6000 0112 3456 7890 189 ». */
export const formatIban = (iban) =>
  String(iban || "")
    .replace(/\s/g, "")
    .toUpperCase()
    .replace(/(.{4})/g, "$1 ")
    .trim();

function DetailRow({ label, value, copyValue, highlight = false, copyClass }) {
  if (!value) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(copyValue ?? value));
      toast.success(`${label} copié`);
    } catch {
      toast.error("Copie impossible, sélectionnez le texte à la main");
    }
  };
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500">{label}</p>
        <p
          className={`text-xs break-all ${
            highlight ? "font-semibold text-gray-900" : "text-gray-800"
          }`}
        >
          {value}
        </p>
      </div>
      {copyValue !== undefined && (
        <button
          type="button"
          onClick={copy}
          aria-label={`Copier ${label.toLowerCase()}`}
          className={cn(
            "mt-1 flex-shrink-0 cursor-pointer p-1 text-gray-400 transition-colors",
            copyClass || "hover:text-[#5a50ff]",
          )}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * `details` : { holder, iban, bic, bankName, reference } ; `amount` en
 * unités (euros), `formattedAmount` déjà mis en forme. `copyClass` : survol
 * des boutons de copie (couleur de la page).
 */
export function BankTransferDetails({
  details,
  amount,
  formattedAmount,
  copyClass,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "space-y-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left",
        className,
      )}
    >
      <DetailRow label="Titulaire" value={details?.holder} />
      <DetailRow
        label="IBAN"
        value={formatIban(details?.iban)}
        copyValue={String(details?.iban || "").replace(/\s/g, "")}
        copyClass={copyClass}
      />
      <DetailRow
        label="BIC"
        value={details?.bic}
        copyValue={details?.bic || undefined}
        copyClass={copyClass}
      />
      <DetailRow label="Banque" value={details?.bankName} />
      <DetailRow
        label="Référence à indiquer"
        value={details?.reference}
        copyValue={details?.reference || undefined}
        highlight
        copyClass={copyClass}
      />
      <DetailRow
        label="Montant"
        value={formattedAmount}
        copyValue={(Number(amount) || 0).toFixed(2).replace(".", ",")}
        copyClass={copyClass}
      />
      <p className="pt-1 text-[11px] leading-relaxed text-gray-500">
        Indiquez la référence dans le libellé du virement : elle permet de
        reconnaître votre paiement.
      </p>
      {children}
    </div>
  );
}

export default BankTransferDetails;
