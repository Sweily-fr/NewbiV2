"use client";

import { LoaderCircle } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { cn } from "@/src/lib/utils";

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

const COMING_SOON = <span>Bientôt disponible pour votre espace.</span>;

/**
 * Moyens d'encaissement proposés au payeur, avec une case et un état par
 * moyen : prêt (« Sur votre compte… »), à connecter (« Connecter »), pas
 * encore ouvert à l'espace (« Bientôt disponible pour votre espace. »), IBAN
 * à renseigner, ou « Demandez à un administrateur… » sans le droit de
 * connecter. Partagé par les transferts payants et les rendez-vous payants.
 *
 * - `availableMethods` : moyens réellement utilisables (cochables) ;
 * - `selected` : moyens choisis ; `onToggle(method, checked)` ;
 * - `showUnavailableProviders` : SumUp et PayPal listés même quand la
 *   plateforme ne les a pas ouverts à l'espace (« Bientôt disponible »),
 *   sinon masqués (transferts) ;
 * - `bankReadyText(bank)` : phrase après « Votre client voit votre IBAN… ».
 */
export function PaymentMethodsChecklist({
  idPrefix,
  connections,
  availableMethods = [],
  selected = [],
  onToggle,
  canManageConnections = true,
  onConnectStripe,
  isConnectingStripe = false,
  onOpenStripeDashboard,
  onConnectSumup,
  isConnectingSumup = false,
  onConnectPaypal,
  onAddIban,
  addIbanLabel = "Ajouter votre IBAN",
  showUnavailableProviders = false,
  bankReadyText = (bank) =>
    bank.autoDetect
      ? "Le transfert se débloque tout seul dès que le virement arrive sur votre compte bancaire connecté, en général sous 1 jour ouvré."
      : "À réception du virement, débloquez le transfert avec « Marquer comme payé ».",
}) {
  const stripe = connections.stripe;
  const paypal = connections.paypal;
  // Réponse d'une API sans SumUp : rien à proposer
  const sumup = connections.sumup || {};
  const bank = connections.bankTransfer;
  const usable = (method) => availableMethods.includes(method);
  const sumupUsable = usable("sumup");
  const paypalUsable = usable("paypal");

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
    if (!stripe.oauthAvailable) return COMING_SOON;
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

  const connectSumupLink = (label) => (
    <ConnectLink onClick={onConnectSumup} disabled={isConnectingSumup}>
      {isConnectingSumup ? (
        <span className="inline-flex items-center gap-1">
          <LoaderCircle className="size-3 animate-spin" />
          Connexion…
        </span>
      ) : (
        label
      )}
    </ConnectLink>
  );

  // SumUp : compte marchand du vendeur, connecté par OAuth ; une seule
  // devise encaissable (celle du compte)
  const sumupHint = (() => {
    if (!sumup.available && !sumupUsable) return COMING_SOON;
    if (sumup.connected && sumup.needsReconnect) {
      if (!canManageConnections) {
        return (
          <span>
            La connexion SumUp a expiré. Demandez à un administrateur de
            l&apos;espace de la renouveler.
          </span>
        );
      }
      return (
        <span className="flex flex-wrap items-center gap-x-1.5">
          La connexion à votre compte SumUp a expiré.
          {connectSumupLink("Reconnecter")}
        </span>
      );
    }
    if (sumup.connected) {
      if (!sumupUsable && sumup.currency) {
        return (
          <span>
            Votre compte SumUp encaisse uniquement en {sumup.currency}.
          </span>
        );
      }
      const label = sumup.businessName || sumup.email;
      return (
        <span className="break-all">
          Sur votre compte SumUp{label ? ` ${label}` : ""}.
        </span>
      );
    }
    if (!canManageConnections) return askAdmin;
    return (
      <span className="flex flex-wrap items-center gap-x-1.5">
        Connectez votre compte SumUp.
        {connectSumupLink("Connecter")}
      </span>
    );
  })();

  const paypalHint =
    !paypal.available && !paypalUsable ? (
      COMING_SOON
    ) : paypal.connected ? (
      <span className="break-all">Sur votre compte {paypal.email}.</span>
    ) : !canManageConnections ? (
      askAdmin
    ) : (
      <span className="flex flex-wrap items-center gap-x-1.5">
        Connectez votre compte PayPal Business.
        <ConnectLink onClick={onConnectPaypal}>Connecter</ConnectLink>
      </span>
    );

  // Compte bancaire relié à Newbi (autoDetect) : le virement reçu est
  // repéré tout seul ; sinon le vendeur le valide à la main
  const bankHint = bank.available ? (
    <span>
      Votre client voit votre IBAN
      {bank.ibanLast4 ? ` se terminant par ${bank.ibanLast4}` : ""} et une
      référence. {bankReadyText(bank)}
    </span>
  ) : (
    <span className="flex flex-wrap items-center gap-x-1.5">
      Ajoutez l&apos;IBAN de votre entreprise.
      {onAddIban && (
        <ConnectLink onClick={onAddIban}>{addIbanLabel}</ConnectLink>
      )}
    </span>
  );

  return (
    <div className="space-y-2">
      <MethodRow
        id={`${idPrefix}-stripe`}
        label="Carte bancaire (Stripe)"
        checked={usable("stripe") && selected.includes("stripe")}
        disabled={!usable("stripe")}
        onCheckedChange={(checked) => onToggle("stripe", checked)}
      >
        {stripeHint}
      </MethodRow>
      {(sumup.available || sumupUsable || showUnavailableProviders) && (
        <MethodRow
          id={`${idPrefix}-sumup`}
          label="Carte bancaire (SumUp)"
          checked={sumupUsable && selected.includes("sumup")}
          disabled={!sumupUsable}
          onCheckedChange={(checked) => onToggle("sumup", checked)}
        >
          {sumupHint}
        </MethodRow>
      )}
      {(paypal.available || paypalUsable || showUnavailableProviders) && (
        <MethodRow
          id={`${idPrefix}-paypal`}
          label="PayPal"
          checked={paypalUsable && selected.includes("paypal")}
          disabled={!paypalUsable}
          onCheckedChange={(checked) => onToggle("paypal", checked)}
        >
          {paypalHint}
        </MethodRow>
      )}
      <MethodRow
        id={`${idPrefix}-bank`}
        label="Virement bancaire"
        checked={usable("bank_transfer") && selected.includes("bank_transfer")}
        disabled={!usable("bank_transfer")}
        onCheckedChange={(checked) => onToggle("bank_transfer", checked)}
      >
        {bankHint}
      </MethodRow>
    </div>
  );
}

export default PaymentMethodsChecklist;
