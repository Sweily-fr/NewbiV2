"use client";

import { CreditCard, LoaderCircle } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";

// Devises acceptées par l'API (TRANSFER_PAYMENT_CURRENCIES)
export const TRANSFER_PAYMENT_CURRENCIES = [
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "CHF", symbol: "CHF" },
];

// Bornes de l'API : minimum de Stripe, plafond de bon sens
export const TRANSFER_PAYMENT_MIN = 0.5;
export const TRANSFER_PAYMENT_MAX = 100000;

/** Montant saisi (virgule ou point) en nombre, NaN si invalide. */
export function parsePaymentAmount(value) {
  if (value === null || value === undefined || value === "") return NaN;
  const normalized = String(value).replace(",", ".").trim();
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return NaN;
  return Number(normalized);
}

/**
 * Erreur d'un paiement demandé (montant, moyens), null s'il est valide.
 * `availableMethods` : moyens utilisables par l'espace.
 */
export function getTransferPaymentError(options, availableMethods = []) {
  if (!options?.isPaymentRequired) return null;
  const amount = parsePaymentAmount(options.paymentAmount);
  if (
    !Number.isFinite(amount) ||
    amount < TRANSFER_PAYMENT_MIN ||
    amount > TRANSFER_PAYMENT_MAX
  ) {
    return "Indiquez un montant compris entre 0,50 et 100 000.";
  }
  const methods = (options.paymentMethods || []).filter((method) =>
    availableMethods.includes(method),
  );
  if (methods.length === 0) {
    return "Choisissez au moins un moyen de paiement.";
  }
  return null;
}

function ConnectLink({ onClick, children, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-medium text-[#5b4fff] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
    >
      {children}
    </button>
  );
}

function MethodRow({
  id,
  label,
  checked,
  disabled,
  onCheckedChange,
  children,
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3 py-2.5",
        disabled ? "bg-muted/40" : "bg-background",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <div className="min-w-0 space-y-0.5">
        <Label
          htmlFor={id}
          className={cn(
            "text-sm font-normal",
            disabled ? "text-muted-foreground" : "cursor-pointer",
          )}
        >
          {label}
        </Label>
        <div className="text-xs text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

/**
 * Option « Demander un paiement » d'un nouveau transfert : montant, devise
 * et moyens proposés au destinataire. Les fichiers se débloquent une fois
 * le paiement reçu, l'argent arrive directement sur le compte du vendeur.
 */
export function TransferPaymentOptions({
  value,
  onChange,
  connections,
  connectionsLoading = false,
  availableMethods = [],
  watermarkEnabled = false,
  canManageConnections = true,
  onConnectStripe,
  isConnectingStripe = false,
  onOpenStripeDashboard,
  onConnectPaypal,
  onAddIban,
}) {
  const selected = value.paymentMethods || [];
  const currency =
    TRANSFER_PAYMENT_CURRENCIES.find((c) => c.code === value.paymentCurrency) ||
    TRANSFER_PAYMENT_CURRENCIES[0];
  const stripe = connections.stripe;
  const paypal = connections.paypal;
  const bank = connections.bankTransfer;

  const toggleMethod = (method, checked) => {
    const next = checked
      ? [...new Set([...selected, method])]
      : selected.filter((m) => m !== method);
    onChange({ paymentMethods: next });
  };

  const handleRequiredChange = (checked) => {
    onChange({
      isPaymentRequired: checked,
      // Première activation : tous les moyens disponibles sont proposés
      ...(checked && selected.length === 0
        ? { paymentMethods: [...availableMethods] }
        : {}),
    });
  };

  const amountError =
    value.isPaymentRequired &&
    value.paymentAmount !== "" &&
    value.paymentAmount !== 0 &&
    value.paymentAmount != null &&
    (() => {
      const amount = parsePaymentAmount(value.paymentAmount);
      return (
        !Number.isFinite(amount) ||
        amount < TRANSFER_PAYMENT_MIN ||
        amount > TRANSFER_PAYMENT_MAX
      );
    })();
  const noMethod =
    value.isPaymentRequired &&
    !connectionsLoading &&
    selected.filter((m) => availableMethods.includes(m)).length === 0;

  // Rôle sans « Gérer les applications » : il ne peut pas connecter un moyen
  const askAdmin = (
    <span>Demandez à un administrateur de l&apos;espace de le connecter.</span>
  );

  const stripeHint = (() => {
    if (stripe.ready) {
      return (
        <span>
          Sur votre compte Stripe
          {stripe.displayName || stripe.accountEmail
            ? ` ${stripe.displayName || stripe.accountEmail}`
            : ""}
          .
        </span>
      );
    }
    if (!stripe.oauthAvailable) {
      return <span>Bientôt disponible pour votre espace.</span>;
    }
    if (stripe.connected && !stripe.legacy) {
      return (
        <span className="flex flex-wrap items-center gap-x-1.5">
          Terminez l&apos;activation de votre compte sur Stripe.
          {onOpenStripeDashboard && (
            <ConnectLink onClick={onOpenStripeDashboard}>
              Ouvrir Stripe
            </ConnectLink>
          )}
        </span>
      );
    }
    if (!canManageConnections) return askAdmin;
    return (
      <span className="flex flex-wrap items-center gap-x-1.5">
        {stripe.legacy
          ? "Reconnectez votre propre compte Stripe pour encaisser vos transferts."
          : "Connectez votre compte Stripe."}
        <ConnectLink onClick={onConnectStripe} disabled={isConnectingStripe}>
          {isConnectingStripe ? (
            <span className="inline-flex items-center gap-1">
              <LoaderCircle className="size-3 animate-spin" />
              Connexion…
            </span>
          ) : stripe.legacy ? (
            "Reconnecter"
          ) : (
            "Connecter"
          )}
        </ConnectLink>
      </span>
    );
  })();

  const paypalHint = paypal.connected ? (
    <span className="break-all">Sur votre compte {paypal.email}.</span>
  ) : !canManageConnections ? (
    askAdmin
  ) : (
    <span className="flex flex-wrap items-center gap-x-1.5">
      Connectez votre compte PayPal Business.
      <ConnectLink onClick={onConnectPaypal}>Connecter</ConnectLink>
    </span>
  );

  const bankHint = bank.available ? (
    <span>
      Vers votre IBAN
      {bank.ibanLast4 ? ` se terminant par ${bank.ibanLast4}` : ""}. Vous
      débloquez le transfert à réception du virement.
    </span>
  ) : (
    <span className="flex flex-wrap items-center gap-x-1.5">
      Ajoutez l&apos;IBAN de votre entreprise.
      {onAddIban && (
        <ConnectLink onClick={onAddIban}>Ajouter votre IBAN</ConnectLink>
      )}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard className="size-4 text-muted-foreground" />
        <Label className="text-sm font-normal">Paiement</Label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-normal">Demander un paiement</Label>
          <p className="text-xs text-muted-foreground">
            {watermarkEnabled
              ? "Non disponible avec le filigrane : le client ne pourrait jamais télécharger les fichiers."
              : "Les fichiers se débloquent dès que votre client a payé."}
          </p>
        </div>
        <Switch
          checked={Boolean(value.isPaymentRequired)}
          onCheckedChange={handleRequiredChange}
          disabled={watermarkEnabled}
          aria-label="Demander un paiement"
          className="data-[state=checked]:bg-[#5a50ff] scale-75 cursor-pointer"
        />
      </div>

      {value.isPaymentRequired && (
        <div className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label
              htmlFor="transfer-payment-amount"
              className="text-sm font-normal"
            >
              Montant
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="transfer-payment-amount"
                  className={cn(
                    "h-9 pe-3",
                    currency.symbol.length > 1 ? "ps-11" : "ps-7",
                    amountError && "border-red-400 focus-visible:ring-red-200",
                  )}
                  placeholder="0,00"
                  type="text"
                  inputMode="decimal"
                  value={
                    value.paymentAmount === 0 || value.paymentAmount == null
                      ? ""
                      : String(value.paymentAmount)
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "" || /^[0-9]*[.,]?[0-9]{0,2}$/.test(raw)) {
                      onChange({ paymentAmount: raw.replace(",", ".") });
                    }
                  }}
                />
                <span className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-sm">
                  {currency.symbol}
                </span>
              </div>
              <Select
                value={currency.code}
                onValueChange={(code) => onChange({ paymentCurrency: code })}
              >
                <SelectTrigger className="h-9 w-24" aria-label="Devise">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_PAYMENT_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {amountError && (
              <p className="text-xs text-red-500">
                Indiquez un montant compris entre 0,50 et 100 000.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-normal">
              Moyens de paiement proposés
            </Label>
            {connectionsLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LoaderCircle className="size-3.5 animate-spin" />
                Chargement de vos moyens de paiement…
              </div>
            ) : (
              <div className="space-y-2">
                <MethodRow
                  id="transfer-payment-stripe"
                  label="Carte bancaire (Stripe)"
                  checked={stripe.ready && selected.includes("stripe")}
                  disabled={!stripe.ready}
                  onCheckedChange={(checked) => toggleMethod("stripe", checked)}
                >
                  {stripeHint}
                </MethodRow>
                {paypal.available && (
                  <MethodRow
                    id="transfer-payment-paypal"
                    label="PayPal"
                    checked={paypal.connected && selected.includes("paypal")}
                    disabled={!paypal.connected}
                    onCheckedChange={(checked) =>
                      toggleMethod("paypal", checked)
                    }
                  >
                    {paypalHint}
                  </MethodRow>
                )}
                <MethodRow
                  id="transfer-payment-bank"
                  label="Virement bancaire"
                  checked={bank.available && selected.includes("bank_transfer")}
                  disabled={!bank.available}
                  onCheckedChange={(checked) =>
                    toggleMethod("bank_transfer", checked)
                  }
                >
                  {bankHint}
                </MethodRow>
              </div>
            )}
            {noMethod && (
              <p className="text-xs text-amber-600">
                Choisissez au moins un moyen de paiement.
              </p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            L&apos;argent arrive directement sur votre compte. Newbi ne prend
            aucune commission, seuls les frais de Stripe ou PayPal
            s&apos;appliquent.
          </p>
        </div>
      )}
    </div>
  );
}

export default TransferPaymentOptions;
