"use client";

import { useId, useState } from "react";
import {
  ChevronDown,
  CreditCard,
  Landmark,
  LoaderCircle,
  Lock,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";
import { BankTransferDetails } from "@/src/components/payments/bank-transfer-details";

const KNOWN_METHODS = ["stripe", "sumup", "paypal", "bank_transfer"];

// Prestataires des paiements en ligne, pour la mention sous les boutons
const ONLINE_PROVIDER_NAMES = {
  stripe: "Stripe",
  sumup: "SumUp",
  paypal: "PayPal",
};

/** « Stripe », « Stripe ou PayPal », « Stripe, SumUp ou PayPal ». */
export function onlineProvidersLabel(methods) {
  const names = KNOWN_METHODS.filter((method) => ONLINE_PROVIDER_NAMES[method])
    .filter((method) => methods.includes(method))
    .map((method) => ONLINE_PROVIDER_NAMES[method]);
  if (names.length <= 1) return names[0] || "";
  return `${names.slice(0, -1).join(", ")} ou ${names[names.length - 1]}`;
}

// Délai d'accès aux fichiers, annoncé sous chaque moyen avant le choix
export const ONLINE_PAYMENT_DELAY = "Accès immédiat aux fichiers";
export const BANK_TRANSFER_DELAY =
  "Fichiers disponibles à réception, en général sous 1 jour ouvré";

// Contrôle de forme seulement : l'API vérifie l'adresse
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Délai d'accès annoncé sous le bouton d'un moyen de paiement
function MethodDelay({ id, children }) {
  return (
    <p id={id} className="text-center text-[11px] text-gray-400">
      {children}
    </p>
  );
}

/**
 * Transfert payant pas encore payé : montant, fichiers verrouillés (sans
 * aperçu ni téléchargement) et moyens de paiement proposés par le vendeur.
 * Affiché dans la carte de la page, jamais en surimpression.
 *
 * Virement : le destinataire annonce l'avoir fait (« J'ai fait le
 * virement ») ; tant que le virement est annoncé (bankTransferDeclaredAt),
 * la carte et PayPal ne sont plus proposés et la page attend sa réception.
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
  // Virement annoncé par le destinataire (date), adresse masquée qui
  // recevra le lien au déblocage (null : aucune connue)
  bankTransferDeclaredAt = null,
  notifyEmailHint = null,
  // (email | null) => Promise : annonce du virement
  onDeclareBankTransfer,
  // () => Promise : retrait de l'annonce
  onCancelBankTransferDeclaration,
}) {
  const methods = normalizePaymentMethods(paymentMethods).filter(
    (method) => method !== "bank_transfer" || bankTransferDetails?.iban,
  );
  const onlyBankTransfer =
    methods.length === 1 && methods[0] === "bank_transfer";
  const [showBankDetails, setShowBankDetails] = useState(onlyBankTransfer);
  // Virement annoncé : coordonnées repliées, à revoir sur demande
  const [showDeclaredDetails, setShowDeclaredDetails] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  // Annonce ou retrait de l'annonce en cours : « declare » | « cancel »
  const [bankAction, setBankAction] = useState(null);
  const formattedAmount = formatPaymentAmount(amount, currency);
  const seller = sellerName || "l'expéditeur";
  const isProcessing = Boolean(processingProvider);
  const declared = Boolean(bankTransferDeclaredAt);
  const hasBankDetails = Boolean(bankTransferDetails?.iban);
  const ids = useId();
  const delayId = (method) => `${ids}-${method}-delai`;

  const handleDeclare = async (event) => {
    event?.preventDefault?.();
    if (!onDeclareBankTransfer || bankAction) return;
    const value = email.trim();
    if (!notifyEmailHint && value && !EMAIL_PATTERN.test(value)) {
      setEmailError("Saisissez une adresse e-mail valide.");
      return;
    }
    setBankAction("declare");
    try {
      await onDeclareBankTransfer(notifyEmailHint ? null : value || null);
    } catch {
      // Erreur déjà affichée par l'appelant
    } finally {
      setBankAction(null);
    }
  };

  const handleCancelDeclaration = async () => {
    if (!onCancelBankTransferDeclaration || bankAction) return;
    setBankAction("cancel");
    try {
      await onCancelBankTransferDeclaration();
    } catch {
      // Erreur déjà affichée par l'appelant
    } finally {
      setBankAction(null);
    }
  };

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
      ) : declared ? (
        /* Virement annoncé : en attente de sa réception par le vendeur */
        <div className="w-full space-y-3 px-5 py-5">
          <div className="rounded-xl border border-[#5a50ff]/20 bg-[#5a50ff]/5 p-4 text-center">
            <Landmark
              className="mx-auto h-5 w-5 text-[#5a50ff]"
              aria-hidden="true"
            />
            <p className="mt-2 text-sm font-medium text-gray-800">
              Virement en attente de réception
            </p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {sellerName || "L'expéditeur"} débloquera vos fichiers dès
              réception de votre virement de {formattedAmount}, en général sous
              1 jour ouvré.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              {notifyEmailHint ? (
                <>
                  Vous recevrez un e-mail à{" "}
                  <span className="font-medium text-gray-700">
                    {notifyEmailHint}
                  </span>{" "}
                  dès qu&apos;ils seront disponibles.
                </>
              ) : (
                "Revenez sur ce lien : vos fichiers s'afficheront dès réception."
              )}
            </p>
          </div>

          {hasBankDetails && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShowDeclaredDetails((open) => !open)}
                aria-expanded={showDeclaredDetails}
                className="mx-auto flex items-center gap-1 text-xs font-medium text-[#5a50ff] hover:underline cursor-pointer"
              >
                Revoir les coordonnées bancaires
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    showDeclaredDetails && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>
              {showDeclaredDetails && (
                <BankTransferDetails
                  details={bankTransferDetails}
                  amount={amount}
                  formattedAmount={formattedAmount}
                />
              )}
            </div>
          )}

          {onCancelBankTransferDeclaration && (
            <button
              type="button"
              onClick={handleCancelDeclaration}
              disabled={Boolean(bankAction)}
              className="mx-auto flex items-center gap-1.5 text-[11px] text-gray-400 underline underline-offset-2 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {bankAction === "cancel" && (
                <LoaderCircle
                  className="h-3 w-3 animate-spin"
                  aria-hidden="true"
                />
              )}
              Je n&apos;ai pas encore fait le virement
            </button>
          )}
        </div>
      ) : (
        <div className="w-full space-y-2.5 px-5 py-5">
          {methods.includes("stripe") && (
            <div className="space-y-1">
              <Button
                onClick={() => onPay?.("stripe")}
                disabled={isProcessing}
                aria-describedby={delayId("stripe")}
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
              <MethodDelay id={delayId("stripe")}>
                {ONLINE_PAYMENT_DELAY}
              </MethodDelay>
            </div>
          )}

          {methods.includes("sumup") && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onPay?.("sumup")}
                disabled={isProcessing}
                aria-describedby={delayId("sumup")}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {processingProvider === "sumup" ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Redirection…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    {methods.includes("stripe")
                      ? "Payer par carte avec SumUp"
                      : "Payer par carte"}
                  </>
                )}
              </button>
              <MethodDelay id={delayId("sumup")}>
                {ONLINE_PAYMENT_DELAY}
              </MethodDelay>
            </div>
          )}

          {methods.includes("paypal") && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onPay?.("paypal")}
                disabled={isProcessing}
                aria-describedby={delayId("paypal")}
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
              <MethodDelay id={delayId("paypal")}>
                {ONLINE_PAYMENT_DELAY}
              </MethodDelay>
            </div>
          )}

          {methods.includes("bank_transfer") && (
            <div className="space-y-2.5">
              <div className="space-y-1">
                {!onlyBankTransfer && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBankDetails((open) => !open)}
                    disabled={isProcessing}
                    aria-expanded={showBankDetails}
                    aria-describedby={delayId("bank_transfer")}
                    className="w-full rounded-xl"
                  >
                    <Landmark className="h-4 w-4" />
                    Payer par virement
                  </Button>
                )}
                <MethodDelay id={delayId("bank_transfer")}>
                  {BANK_TRANSFER_DELAY}
                </MethodDelay>
              </div>
              {showBankDetails && (
                <BankTransferDetails
                  details={bankTransferDetails}
                  amount={amount}
                  formattedAmount={formattedAmount}
                >
                  {onDeclareBankTransfer && (
                    /* Annonce du virement, avec une adresse facultative pour
                       recevoir le lien au déblocage */
                    <form
                      onSubmit={handleDeclare}
                      noValidate
                      className="space-y-2.5 border-t border-gray-200 pt-3"
                    >
                      {notifyEmailHint ? (
                        <p className="text-[11px] leading-relaxed text-gray-500">
                          Vous recevrez un e-mail à{" "}
                          <span className="font-medium text-gray-700">
                            {notifyEmailHint}
                          </span>{" "}
                          dès que les fichiers seront disponibles.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          <Label
                            htmlFor={`${ids}-email`}
                            className="text-xs text-gray-700"
                          >
                            Votre adresse e-mail
                          </Label>
                          <Input
                            id={`${ids}-email`}
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="vous@exemple.fr"
                            value={email}
                            onChange={(event) => {
                              setEmail(event.target.value);
                              if (emailError) setEmailError(null);
                            }}
                            disabled={Boolean(bankAction)}
                            aria-invalid={Boolean(emailError)}
                            aria-describedby={`${ids}-email-aide`}
                            className="bg-white"
                          />
                          {emailError && (
                            <p className="text-[11px] text-red-500">
                              {emailError}
                            </p>
                          )}
                          <p
                            id={`${ids}-email-aide`}
                            className="text-[11px] leading-relaxed text-gray-500"
                          >
                            Pour recevoir le lien dès que les fichiers sont
                            disponibles (facultatif).
                          </p>
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={Boolean(bankAction) || isProcessing}
                        className="w-full rounded-xl text-white"
                      >
                        {bankAction === "declare" && (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}
                        J&apos;ai fait le virement
                      </Button>
                    </form>
                  )}
                </BankTransferDetails>
              )}
            </div>
          )}

          {onlineProvidersLabel(methods) && (
            <p className="pt-1 text-center text-[11px] text-gray-400">
              Paiement sécurisé sur la page de {onlineProvidersLabel(methods)}.
              Les fichiers se débloquent dès le paiement confirmé.
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
