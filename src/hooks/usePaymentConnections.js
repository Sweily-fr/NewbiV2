"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CONNECT_PAYPAL,
  DISCONNECT_PAYPAL,
  GET_PAYMENT_CONNECTIONS,
} from "@/src/graphql/mutations/stripe";
import { useWorkspace } from "@/src/hooks/useWorkspace";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/+$/, "");

/** Moyens de paiement qu'un transfert peut proposer, dans l'ordre affiché. */
export const TRANSFER_PAYMENT_METHODS = ["stripe", "paypal", "bank_transfer"];

export const PAYMENT_METHOD_LABELS = {
  stripe: "Carte bancaire",
  paypal: "PayPal",
  bank_transfer: "Virement bancaire",
  manual: "Marqué payé à la main",
};

// Réponse absente (chargement, API sans ces champs) : rien n'est disponible,
// l'ancien parcours Stripe reste proposé et PayPal reste « à venir »
export const EMPTY_PAYMENT_CONNECTIONS = Object.freeze({
  stripe: {
    connected: false,
    ready: false,
    legacy: false,
    oauthAvailable: false,
    chargesEnabled: false,
    displayName: null,
    accountEmail: null,
  },
  paypal: { available: false, connected: false, email: null },
  bankTransfer: { available: false, ibanLast4: null },
});

/**
 * Codes de retour de la connexion Stripe (paramètre stripe_connect posé par
 * l'API sur /dashboard?parametres=applications)
 */
export const STRIPE_CONNECT_ERROR_MESSAGES = {
  access_denied: "Vous avez annulé l'autorisation sur Stripe.",
  invalid_state:
    "Le lien de connexion n'est plus valable. Recommencez depuis Paramètres, Applications.",
  state_expired:
    "Le lien de connexion a expiré. Recommencez depuis Paramètres, Applications.",
  other_browser:
    "Terminez la connexion dans le navigateur où vous l'avez commencée.",
  forbidden: "Votre rôle ne permet pas de connecter Stripe.",
  already_connected: "Ce compte Stripe est déjà relié à un autre espace Newbi.",
  error: "Une erreur est survenue. Réessayez dans quelques instants.",
};

/** Moyens réellement utilisables pour un nouveau transfert. */
export function availableTransferPaymentMethods(connections) {
  const c = connections || EMPTY_PAYMENT_CONNECTIONS;
  return TRANSFER_PAYMENT_METHODS.filter((method) => {
    if (method === "stripe") return Boolean(c.stripe?.ready);
    if (method === "paypal") {
      return Boolean(c.paypal?.available && c.paypal?.connected);
    }
    return Boolean(c.bankTransfer?.available);
  });
}

/**
 * Adresse d'autorisation Stripe (OAuth) de l'espace. Appel direct de l'API
 * (et non d'un proxy du site) : elle pose le cookie qui lie le retour de
 * Stripe à ce navigateur, comme pour les agendas.
 */
export async function requestStripeOAuthUrl(workspaceId) {
  const tokenRes = await fetch("/api/auth/token", { credentials: "include" });
  const { token } = await tokenRes.json().catch(() => ({}));
  if (!token) throw new Error("Session expirée, reconnectez-vous.");
  const response = await fetch(`${API_URL}/stripe-connect/authorize`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-workspace-id": workspaceId,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.authUrl) {
    if (response.status === 503 || data?.error === "STRIPE_OAUTH_UNAVAILABLE") {
      throw new Error(
        data?.message ||
          "La connexion à Stripe est momentanément indisponible.",
      );
    }
    throw new Error(
      data?.message || data?.error || `Erreur ${response.status}`,
    );
  }
  return data.authUrl;
}

/**
 * Moyens d'encaissement de l'espace actif (compte Stripe du vendeur, PayPal,
 * IBAN pour les virements) et actions de connexion.
 */
export function usePaymentConnections({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  const { data, loading, refetch } = useQuery(GET_PAYMENT_CONNECTIONS, {
    skip: skip || !workspaceId,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    // API sans ces champs (avant sa mise à jour) : on garde l'existant
    errorPolicy: "all",
    context: { skipErrorToast: true },
  });

  const connections = useMemo(() => {
    const raw = data?.paymentConnections;
    if (!raw) return EMPTY_PAYMENT_CONNECTIONS;
    return {
      stripe: { ...EMPTY_PAYMENT_CONNECTIONS.stripe, ...(raw.stripe || {}) },
      paypal: { ...EMPTY_PAYMENT_CONNECTIONS.paypal, ...(raw.paypal || {}) },
      bankTransfer: {
        ...EMPTY_PAYMENT_CONNECTIONS.bankTransfer,
        ...(raw.bankTransfer || {}),
      },
    };
  }, [data]);

  const [connectPaypalMutation, { loading: paypalConnecting }] =
    useMutation(CONNECT_PAYPAL);
  const [disconnectPaypalMutation, { loading: paypalDisconnecting }] =
    useMutation(DISCONNECT_PAYPAL);

  const safeRefetch = useCallback(() => {
    if (!workspaceId) return Promise.resolve();
    return refetch().catch(() => {});
  }, [refetch, workspaceId]);

  /**
   * Connexion Stripe par OAuth. `newTab` : la page reste affichée (fichiers
   * déjà choisis dans le formulaire de transfert), Stripe s'ouvre dans un
   * nouvel onglet. L'onglet est ouvert pendant le clic, sinon le navigateur
   * le bloque.
   */
  const connectStripe = useCallback(
    async ({ newTab = false } = {}) => {
      if (!workspaceId) throw new Error("Aucun espace actif.");
      const popup = newTab ? window.open("", "_blank") : null;
      setIsConnectingStripe(true);
      try {
        const authUrl = await requestStripeOAuthUrl(workspaceId);
        if (popup && !popup.closed) {
          popup.opener = null;
          popup.location.href = authUrl;
        } else {
          window.location.href = authUrl;
        }
      } catch (error) {
        if (popup && !popup.closed) popup.close();
        throw error;
      } finally {
        setIsConnectingStripe(false);
      }
    },
    [workspaceId],
  );

  const connectPaypal = useCallback(
    async (email) => {
      const { data: result } = await connectPaypalMutation({
        variables: { email },
      });
      const response = result?.connectPaypal;
      if (response?.success) await safeRefetch();
      return response || { success: false, message: null };
    },
    [connectPaypalMutation, safeRefetch],
  );

  const disconnectPaypal = useCallback(async () => {
    const { data: result } = await disconnectPaypalMutation();
    const response = result?.disconnectPaypal;
    if (response?.success) await safeRefetch();
    return response || { success: false, message: null };
  }, [disconnectPaypalMutation, safeRefetch]);

  const availableMethods = useMemo(
    () => availableTransferPaymentMethods(connections),
    [connections],
  );

  return {
    connections,
    // Réponse de l'API reçue : on peut conclure qu'un moyen manque
    isReady: Boolean(data?.paymentConnections),
    loading: loading && !data?.paymentConnections,
    refetch: safeRefetch,
    availableMethods,
    connectStripe,
    isConnectingStripe,
    connectPaypal,
    disconnectPaypal,
    isPaypalLoading: paypalConnecting || paypalDisconnecting,
  };
}

export default usePaymentConnections;
