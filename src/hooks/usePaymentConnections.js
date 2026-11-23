"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CONNECT_PAYPAL,
  DISCONNECT_PAYPAL,
  DISCONNECT_SUMUP,
  GET_PAYMENT_CONNECTIONS,
} from "@/src/graphql/mutations/stripe";
import { useWorkspace } from "@/src/hooks/useWorkspace";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/+$/, "");

/** Moyens de paiement qu'un transfert peut proposer, dans l'ordre affiché. */
export const TRANSFER_PAYMENT_METHODS = [
  "stripe",
  "sumup",
  "paypal",
  "bank_transfer",
];

export const PAYMENT_METHOD_LABELS = {
  stripe: "Carte bancaire",
  sumup: "Carte bancaire (SumUp)",
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
  // needsReconnect : accès retiré ou expiré côté SumUp ; currency : seule
  // devise que le compte marchand encaisse
  sumup: {
    available: false,
    connected: false,
    needsReconnect: false,
    businessName: null,
    email: null,
    merchantCode: null,
    currency: null,
  },
  // autoDetect : compte bancaire relié à Newbi, le virement reçu débloque le
  // transfert sans « Marquer comme payé »
  bankTransfer: { available: false, ibanLast4: null, autoDetect: false },
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

/**
 * Codes de retour de la connexion SumUp (paramètre sumup_connect posé par
 * l'API sur /dashboard?parametres=applications)
 */
export const SUMUP_CONNECT_ERROR_MESSAGES = {
  access_denied: "Vous avez annulé l'autorisation sur SumUp.",
  invalid_state:
    "Le lien de connexion n'est plus valable. Recommencez depuis Paramètres, Applications.",
  state_expired:
    "Le lien de connexion a expiré. Recommencez depuis Paramètres, Applications.",
  other_browser:
    "Terminez la connexion dans le navigateur où vous l'avez commencée.",
  forbidden: "Votre rôle ne permet pas de connecter SumUp.",
  already_connected: "Ce compte SumUp est déjà relié à un autre espace Newbi.",
  missing_scope:
    "SumUp n'a pas autorisé la création de paiements pour ce compte. Recommencez en acceptant toutes les autorisations demandées.",
  no_merchant:
    "Ce compte SumUp n'a pas de compte marchand. Terminez son ouverture sur SumUp, puis recommencez.",
  error: "Une erreur est survenue. Réessayez dans quelques instants.",
};

/** SumUp peut encaisser ce transfert : compte prêt, même devise. */
export function isSumupUsable(sumup, currency) {
  if (!sumup?.available || !sumup?.connected || sumup?.needsReconnect) {
    return false;
  }
  return !currency || !sumup.currency || sumup.currency === currency;
}

/**
 * Moyens réellement utilisables pour un nouveau transfert. `currency` :
 * devise du transfert (SumUp n'encaisse que la devise du compte marchand).
 */
export function availableTransferPaymentMethods(connections, currency) {
  const c = connections || EMPTY_PAYMENT_CONNECTIONS;
  return TRANSFER_PAYMENT_METHODS.filter((method) => {
    if (method === "stripe") return Boolean(c.stripe?.ready);
    if (method === "sumup") return isSumupUsable(c.sumup, currency);
    if (method === "paypal") {
      return Boolean(c.paypal?.available && c.paypal?.connected);
    }
    return Boolean(c.bankTransfer?.available);
  });
}

/**
 * Adresse d'autorisation (OAuth) d'un prestataire pour l'espace. Appel direct
 * de l'API (et non d'un proxy du site) : elle pose le cookie qui lie le
 * retour du prestataire à ce navigateur, comme pour les agendas.
 */
async function requestOAuthUrl(path, workspaceId, unavailableMessage) {
  const tokenRes = await fetch("/api/auth/token", { credentials: "include" });
  const { token } = await tokenRes.json().catch(() => ({}));
  if (!token) throw new Error("Session expirée, reconnectez-vous.");
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "x-workspace-id": workspaceId,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.authUrl) {
    if (response.status === 503) {
      throw new Error(data?.message || unavailableMessage);
    }
    throw new Error(
      data?.message || data?.error || `Erreur ${response.status}`,
    );
  }
  return data.authUrl;
}

/** Adresse d'autorisation Stripe (OAuth) de l'espace. */
export function requestStripeOAuthUrl(workspaceId) {
  return requestOAuthUrl(
    "/stripe-connect/authorize",
    workspaceId,
    "La connexion à Stripe est momentanément indisponible.",
  );
}

/** Adresse d'autorisation SumUp (OAuth) de l'espace. */
export function requestSumupOAuthUrl(workspaceId) {
  return requestOAuthUrl(
    "/sumup/authorize",
    workspaceId,
    "La connexion à SumUp est momentanément indisponible.",
  );
}

/**
 * Ouvre la page d'autorisation d'un prestataire. `newTab` : la page reste
 * affichée (fichiers déjà choisis dans le formulaire de transfert), le
 * prestataire s'ouvre dans un nouvel onglet, ouvert pendant le clic, sinon
 * le navigateur le bloque.
 */
async function openOAuthPage(requestUrl, { newTab = false } = {}) {
  const popup = newTab ? window.open("", "_blank") : null;
  try {
    const authUrl = await requestUrl();
    if (popup && !popup.closed) {
      popup.opener = null;
      popup.location.href = authUrl;
    } else {
      window.location.href = authUrl;
    }
  } catch (error) {
    if (popup && !popup.closed) popup.close();
    throw error;
  }
}

/**
 * Moyens d'encaissement de l'espace actif (compte Stripe du vendeur, PayPal,
 * SumUp, IBAN pour les virements) et actions de connexion.
 */
export function usePaymentConnections({ skip = false } = {}) {
  const { workspaceId } = useWorkspace();
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [isConnectingSumup, setIsConnectingSumup] = useState(false);

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
      sumup: { ...EMPTY_PAYMENT_CONNECTIONS.sumup, ...(raw.sumup || {}) },
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
  const [disconnectSumupMutation, { loading: sumupDisconnecting }] =
    useMutation(DISCONNECT_SUMUP);

  const safeRefetch = useCallback(() => {
    if (!workspaceId) return Promise.resolve();
    return refetch().catch(() => {});
  }, [refetch, workspaceId]);

  /** Connexion Stripe par OAuth (voir openOAuthPage pour `newTab`). */
  const connectStripe = useCallback(
    async ({ newTab = false } = {}) => {
      if (!workspaceId) throw new Error("Aucun espace actif.");
      setIsConnectingStripe(true);
      try {
        await openOAuthPage(() => requestStripeOAuthUrl(workspaceId), {
          newTab,
        });
      } finally {
        setIsConnectingStripe(false);
      }
    },
    [workspaceId],
  );

  /** Connexion SumUp par OAuth (voir openOAuthPage pour `newTab`). */
  const connectSumup = useCallback(
    async ({ newTab = false } = {}) => {
      if (!workspaceId) throw new Error("Aucun espace actif.");
      setIsConnectingSumup(true);
      try {
        await openOAuthPage(() => requestSumupOAuthUrl(workspaceId), {
          newTab,
        });
      } finally {
        setIsConnectingSumup(false);
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

  const disconnectSumup = useCallback(async () => {
    const { data: result } = await disconnectSumupMutation();
    const response = result?.disconnectSumup;
    if (response?.success) await safeRefetch();
    return response || { success: false, message: null };
  }, [disconnectSumupMutation, safeRefetch]);

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
    connectSumup,
    isConnectingSumup,
    disconnectSumup,
    isSumupLoading: sumupDisconnecting,
  };
}

export default usePaymentConnections;
