/**
 * Paramètres du retour de la page de paiement d'un transfert.
 *
 * Adresses construites par l'API :
 * - Stripe : ?rt=<jeton>&provider=stripe&session_id=<id> (annulation :
 *   &canceled=1 sans session_id) ;
 * - PayPal : ?rt=<jeton>&provider=paypal, PayPal ajoute &token=<commande>
 *   et &PayerID=… (annulation : &canceled=1, avec &token=<commande>) ;
 * - ancien format (sessions ouvertes avant la vérification au retour) :
 *   ?token=<jeton>&status=success|cancel.
 */
export function buildPaymentReturnRequest(searchParams) {
  const get = (name) => {
    const value = searchParams?.get?.(name);
    return typeof value === "string" && value.trim() ? value.trim() : null;
  };

  const returnToken = get("rt");
  if (returnToken) {
    const provider = get("provider") === "paypal" ? "paypal" : "stripe";
    return {
      kind: "confirm",
      canceled: get("canceled") === "1",
      variables: {
        token: returnToken,
        provider,
        sessionId: provider === "stripe" ? get("session_id") : null,
        // PayPal renvoie l'identifiant de sa commande dans « token »
        orderId: provider === "paypal" ? get("token") : null,
      },
    };
  }

  const legacyToken = get("token");
  if (legacyToken) {
    return {
      kind: "legacy",
      canceled: get("status") === "cancel",
      variables: { token: legacyToken },
    };
  }

  return null;
}

/** Paramètre « payment » de la page du transfert après vérification. */
export function paymentResultParam(status, canceled = false) {
  if (status === "paid") return "paid";
  if (status === "pending") return "pending";
  return canceled ? "canceled" : "unpaid";
}
