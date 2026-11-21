"use client";

import { useState } from "react";
import {
  Copy,
  CreditCard,
  Landmark,
  LoaderCircle,
  Lock,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";

const KNOWN_METHODS = ["stripe", "paypal", "bank_transfer"];

/** Moyens proposés : un transfert antérieur (sans liste) se paie par carte. */
export function normalizePaymentMethods(methods) {
  const list = Array.isArray(methods) && methods.length ? methods : ["stripe"];
  return KNOWN_METHODS.filter((method) => list.includes(method));
}

export function formatPaymentAmount(amount, currency = "EUR") {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || "EUR"}`;
  }
}

const formatIban = (iban) =>
  String(iban || "")
    .replace(/\s/g, "")
    .toUpperCase()
    .replace(/(.{4})/g, "$1 ")
    .trim();

function DetailRow({ label, value, copyValue, highlight = false }) {
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
          className="mt-1 flex-shrink-0 p-1 text-gray-400 hover:text-[#5a50ff] transition-colors cursor-pointer"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * Transfert payant pas encore payé : montant, fichiers verrouillés (sans
 * aperçu ni téléchargement) et moyens de paiement proposés par le vendeur.
 * Affiché dans la carte de la page, jamais en surimpression.
 */
export function TransferPaymentPanel({
  amount,
  currency,
  sellerName,
  paymentMethods,
  bankTransferDetails,
  pending = false,
  pendingTimedOut = false,
  expiryLabel,
  message,
  files = [],
  formatSize = (bytes) => `${bytes || 0} o`,
  onPay,
  processingProvider = null,
}) {
  const methods = normalizePaymentMethods(paymentMethods).filter(
    (method) => method !== "bank_transfer" || bankTransferDetails?.iban,
  );
  const onlyBankTransfer =
    methods.length === 1 && methods[0] === "bank_transfer";
  const [showBankDetails, setShowBankDetails] = useState(onlyBankTransfer);
  const formattedAmount = formatPaymentAmount(amount, currency);
  const seller = sellerName || "l'expéditeur";
  const isProcessing = Boolean(processingProvider);

  return (
    <>
      {/* En-tête : montant demandé */}
      <div className="w-full px-5 pt-6 pb-4 text-center">
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#5a50ff]/10">
          <Lock className="h-5 w-5 text-[#5a50ff]" />
        </div>
        <h1 className="text-xl font-medium text-gray-800">
          Fichiers disponibles après paiement
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          {sellerName ? (
            <>
              Paiement demandé par{" "}
              <span className="font-medium text-gray-700">{sellerName}</span>
            </>
          ) : (
            "Un paiement est demandé pour accéder aux fichiers"
          )}
        </p>
        <p className="mt-3 text-3xl font-semibold tabular-nums text-gray-900">
          {formattedAmount}
        </p>
        {expiryLabel && (
          <p className="mt-1 text-xs text-gray-500">Expire le {expiryLabel}</p>
        )}
      </div>

      {/* Message de l'expéditeur */}
      {message?.trim() && (
        <div className="mx-4 mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 flex-shrink-0 text-[#5a50ff]" />
            <span className="text-xs font-medium text-gray-700">Message</span>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm text-gray-600">
            {message}
          </p>
        </div>
      )}

      {/* Fichiers verrouillés */}
      {files.length > 0 && (
        <ul
          className="max-h-40 overflow-y-auto border-y border-gray-200"
          aria-label="Fichiers du transfert"
        >
          {files.map((file, index) => (
            <li
              key={file.id || file.fileId || file.path || index}
              className="w-full border-b border-gray-200 px-5 py-3 last:border-b-0"
            >
              <div className="flex w-full items-center">
                <div className="min-w-0 flex-grow">
                  <h3 className="truncate text-sm text-gray-800">
                    {file.originalName || file.fileName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
                <Lock
                  className="ml-2 h-4 w-4 flex-shrink-0 text-gray-300"
                  aria-label="Verrouillé"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending ? (
        /* Paiement reçu par le prestataire, confirmation en attente */
        <div className="mx-4 my-5 rounded-xl border border-[#5a50ff]/20 bg-[#5a50ff]/5 p-4 text-center">
          <LoaderCircle className="mx-auto h-5 w-5 animate-spin text-[#5a50ff]" />
          <p className="mt-2 text-sm font-medium text-gray-800">
            Paiement en cours de confirmation
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {pendingTimedOut
              ? "La confirmation prend plus de temps que prévu. Rechargez la page dans quelques minutes."
              : "Les fichiers se débloquent automatiquement dans quelques instants."}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-2.5 px-5 py-5">
          {methods.includes("stripe") && (
            <Button
              onClick={() => onPay?.("stripe")}
              disabled={isProcessing}
              className="w-full rounded-xl text-white"
            >
              {processingProvider === "stripe" ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Redirection…
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Payer par carte
                </>
              )}
            </Button>
          )}

          {methods.includes("paypal") && (
            <button
              type="button"
              onClick={() => onPay?.("paypal")}
              disabled={isProcessing}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#ffc439] text-sm font-semibold text-[#003087] transition-colors hover:bg-[#f2ba36] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {processingProvider === "paypal" ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Redirection…
                </>
              ) : (
                "Payer avec PayPal"
              )}
            </button>
          )}

          {methods.includes("bank_transfer") && (
            <>
              {!onlyBankTransfer && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBankDetails((open) => !open)}
                  disabled={isProcessing}
                  aria-expanded={showBankDetails}
                  className="w-full rounded-xl"
                >
                  <Landmark className="h-4 w-4" />
                  Payer par virement
                </Button>
              )}
              {showBankDetails && (
                <div className="space-y-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-left">
                  <DetailRow
                    label="Titulaire"
                    value={bankTransferDetails?.holder}
                  />
                  <DetailRow
                    label="IBAN"
                    value={formatIban(bankTransferDetails?.iban)}
                    copyValue={String(bankTransferDetails?.iban || "").replace(
                      /\s/g,
                      "",
                    )}
                  />
                  <DetailRow
                    label="BIC"
                    value={bankTransferDetails?.bic}
                    copyValue={bankTransferDetails?.bic || undefined}
                  />
                  <DetailRow
                    label="Banque"
                    value={bankTransferDetails?.bankName}
                  />
                  <DetailRow
                    label="Référence à indiquer"
                    value={bankTransferDetails?.reference}
                    copyValue={bankTransferDetails?.reference || undefined}
                    highlight
                  />
                  <DetailRow
                    label="Montant"
                    value={formattedAmount}
                    copyValue={(Number(amount) || 0)
                      .toFixed(2)
                      .replace(".", ",")}
                  />
                  <p className="pt-1 text-[11px] leading-relaxed text-gray-500">
                    Indiquez la référence dans le libellé du virement. Les
                    fichiers seront disponibles dès que {seller} aura confirmé
                    la réception du virement.
                  </p>
                </div>
              )}
            </>
          )}

          {(methods.includes("stripe") || methods.includes("paypal")) && (
            <p className="pt-1 text-center text-[11px] text-gray-400">
              Paiement sécurisé sur la page de{" "}
              {methods.includes("stripe") && methods.includes("paypal")
                ? "Stripe ou PayPal"
                : methods.includes("paypal")
                  ? "PayPal"
                  : "Stripe"}
              . Les fichiers se débloquent dès le paiement confirmé.
            </p>
          )}

          {methods.length === 0 && (
            <p className="text-center text-xs text-gray-500">
              Le paiement en ligne n&apos;est plus disponible pour ce transfert.
              Contactez {seller}.
            </p>
          )}
        </div>
      )}
    </>
  );
}

export default TransferPaymentPanel;
