"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";

// enabled : false tant qu'on ne doit pas lire ce client (ex. abonnement payé
// par le cabinet du client : son client Stripe n'est pas celui de l'espace)
export function useStripeCustomer({ enabled = true } = {}) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: session } = authClient.useSession();
  const { subscription } = useSubscription();
  const stripeCustomerId = subscription?.stripeCustomerId;

  const fetchCustomer = useCallback(async () => {
    if (!enabled || !session?.user || !stripeCustomerId) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/stripe/customer?customerId=${encodeURIComponent(stripeCustomerId)}`,
        { method: "GET", headers: { "Content-Type": "application/json" } },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Erreur ${response.status}`);
      }

      setCustomer(data.customer);
    } catch (err) {
      console.error("Erreur récupération customer Stripe:", err);
      setError(err.message);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, session?.user, stripeCustomerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return { customer, loading, error, refetch: fetchCustomer };
}
