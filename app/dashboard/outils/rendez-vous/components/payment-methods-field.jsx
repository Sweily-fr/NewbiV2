"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { PaymentMethodsChecklist } from "@/src/components/payments/payment-methods-checklist";
import { PaypalConnectDialog } from "@/src/components/payments/paypal-connect-dialog";
import { usePaymentConnections } from "@/src/hooks/usePaymentConnections";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { chosenPaymentMethods } from "@/src/utils/booking-payments";

/** Ouvre Paramètres > Coordonnées bancaires (IBAN de l'entreprise). */
const openBankSettings = () =>
  window.dispatchEvent(
    new CustomEvent("newbi:open-settings", {
      detail: { tab: "coordonnees-bancaires" },
    }),
  );

/**
 * Moyens proposés au payeur d'un type payant (créneau ou événement), comme
 * pour les transferts payants : une case et un état par moyen. Choix absent
 * (`form.paymentMethods` null) : tous les moyens prêts sont proposés, et
 * rien n'est envoyé à l'API tant que l'organisateur n'y touche pas.
 *
 * `usable` / `usableLoaded` / `refetchUsable` : moyens prêts de l'espace
 * (appointmentPaymentMethods ou eventPaymentMethods).
 */
export function PaymentMethodsField({
  kind = "event",
  idPrefix,
  form,
  set,
  error,
  usable = [],
  usableLoaded = false,
  refetchUsable,
}) {
  const payment = usePaymentConnections();
  const { canDo, isReady: permissionsReady } = useMyPermissions();
  // Connecter Stripe, SumUp ou PayPal : « Gérer les applications »
  const canManageConnections =
    !permissionsReady || canDo("integrations", "manage");
  const [paypalDialogOpen, setPaypalDialogOpen] = useState(false);
  const selected = chosenPaymentMethods(form.paymentMethods, usable);

  // Retour sur l'onglet après une connexion ouverte à côté (Stripe, SumUp,
  // IBAN dans les réglages) : moyens relus
  const refetchConnections = payment.refetch;
  useEffect(() => {
    const onFocus = () => {
      refetchConnections();
      refetchUsable?.();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetchConnections, refetchUsable]);

  const toggle = (method, checked) => {
    const next = checked
      ? [...new Set([...selected, method])]
      : selected.filter((m) => m !== method);
    set("paymentMethods")(next);
  };

  const connectError = (name) => (err) =>
    toast.error(`Impossible de se connecter à ${name}`, {
      description: err?.message || "Veuillez réessayer.",
    });

  return (
    <div className="space-y-2">
      <Label className="text-sm font-normal">Moyens de paiement proposés</Label>
      {payment.loading || !usableLoaded ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LoaderCircle className="size-3.5 animate-spin" />
          Chargement de vos moyens de paiement…
        </div>
      ) : (
        <PaymentMethodsChecklist
          idPrefix={`${idPrefix}-payment`}
          connections={payment.connections}
          availableMethods={usable}
          selected={selected}
          onToggle={toggle}
          showUnavailableProviders
          canManageConnections={canManageConnections}
          isConnectingStripe={payment.isConnectingStripe}
          onConnectStripe={() =>
            payment
              .connectStripe({ newTab: true })
              .catch(connectError("Stripe"))
          }
          onOpenStripeDashboard={() =>
            window.open("https://dashboard.stripe.com/", "_blank", "noopener")
          }
          isConnectingSumup={payment.isConnectingSumup}
          onConnectSumup={() =>
            payment.connectSumup({ newTab: true }).catch(connectError("SumUp"))
          }
          onConnectPaypal={() => setPaypalDialogOpen(true)}
          onAddIban={openBankSettings}
          addIbanLabel="Renseigner l'IBAN"
          bankReadyText={(bank) =>
            bank.autoDetect
              ? `${kind === "slot" ? "Le rendez-vous est confirmé" : "L'inscription est confirmée"} tout seul${kind === "slot" ? "" : "e"} dès que le virement arrive sur votre compte bancaire connecté. Arrivé après la garde ou après le début, il vous est signalé et vous décidez avec « Marquer comme payé ».`
              : `À réception du virement, confirmez ${kind === "slot" ? "le rendez-vous" : "l'inscription"} avec « Marquer comme payé ».`
          }
        />
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <PaypalConnectDialog
        open={paypalDialogOpen}
        onOpenChange={setPaypalDialogOpen}
        initialEmail={payment.connections.paypal.email || ""}
        onConnect={payment.connectPaypal}
        onConnected={() => refetchUsable?.()}
      />
    </div>
  );
}

export default PaymentMethodsField;
