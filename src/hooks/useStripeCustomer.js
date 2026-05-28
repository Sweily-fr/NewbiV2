"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/src/lib/auth-client";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";

export function useStripeCustomer() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: session } = authClient.useSession();
  const { subscription } = useSubscription();
  const stripeCustomerId = subscription?.stripeCustomerId;

  const fetchCustomer = useCallback(async () => {
    if (!session?.user || !stripeCustomerId) {
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
  }, [session?.user, stripeCustomerId]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return { customer, loading, error, refetch: fetchCustomer };
}
