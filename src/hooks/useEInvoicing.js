"use client";

import { useQuery, useMutation } from "@apollo/client";
import { useRequiredWorkspace } from "./useWorkspace";
import { toast } from "@/src/components/ui/sonner";
import {
  GET_EINVOICING_SETTINGS,
  GET_EINVOICING_STATS,
  ENABLE_EINVOICING,
  DISABLE_EINVOICING,
  TEST_SUPERPDP_CONNECTION,
  RESEND_INVOICE_TO_SUPERPDP,
  CHECK_RECIPIENT_EINVOICING,
} from "@/src/graphql/eInvoicingQueries";

/**
 * Hook pour gérer les paramètres de facturation électronique
 */
export function useEInvoicingSettings() {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_EINVOICING_SETTINGS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  return {
    settings: data?.eInvoicingSettings || {
      eInvoicingEnabled: false,
      superPdpConfigured: false,
      superPdpWebhookConfigured: false,
      superPdpClientId: null,
      superPdpEnvironment: "sandbox",
      eInvoicingActivatedAt: null,
    },
    loading,
    error,
    refetch,
  };
}

/**
 * Hook pour récupérer les statistiques e-invoicing
 */
export function useEInvoicingStats() {
  const { workspaceId } = useRequiredWorkspace();

  const { data, loading, error, refetch } = useQuery(GET_EINVOICING_STATS, {
    variables: { workspaceId },
    skip: !workspaceId,
    fetchPolicy: "cache-and-network",
  });

  return {
    stats: data?.eInvoicingStats || {
      NOT_SENT: 0,
      PENDING_VALIDATION: 0,
      VALIDATED: 0,
      SENT_TO_RECIPIENT: 0,
      RECEIVED: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      PAID: 0,
      ERROR: 0,
      totalSent: 0,
      successRate: 0,
    },
    loading,
    error,
    refetch,
  };
}

/**
 * Hook pour activer/désactiver la facturation électronique
 */
export function useToggleEInvoicing() {
  const { workspaceId } = useRequiredWorkspace();

  const [enableMutation, { loading: enabling }] = useMutation(
    ENABLE_EINVOICING,
    {
      refetchQueries: [
        { query: GET_EINVOICING_SETTINGS, variables: { workspaceId } },
      ],
    }
  );

  const [disableMutation, { loading: disabling }] = useMutation(
    DISABLE_EINVOICING,
    {
      refetchQueries: [
        { query: GET_EINVOICING_SETTINGS, variables: { workspaceId } },
      ],
    }
  );

  const enable = async (environment = "sandbox") => {
    try {
      const { data } = await enableMutation({
        variables: { workspaceId, environment },
      });

      if (data?.enableEInvoicing?.success) {
        const connectionVerified = data.enableEInvoicing.connectionVerified;

        if (connectionVerified) {
          toast.success("Facturation électronique activée", {
            description:
              "Connexion à SuperPDP vérifiée. Vos factures seront envoyées automatiquement.",
          });
        } else {
          toast.warning("Facturation électronique activée", {
            description:
              "Attention : la connexion à SuperPDP n'a pas pu être vérifiée. Vérifiez vos credentials.",
          });
        }
        return { success: true, connectionVerified };
      } else {
        toast.error("Erreur", {
          description:
            data?.enableEInvoicing?.message ||
            "Impossible d'activer la facturation électronique",
        });
        return { success: false, error: data?.enableEInvoicing?.message };
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      });
      return { success: false, error: error.message };
    }
  };

  const disable = async () => {
    try {
      const { data } = await disableMutation({
        variables: { workspaceId },
      });

      if (data?.disableEInvoicing?.success) {
        toast.success("Facturation électronique désactivée", {
          description: "Vos factures ne seront plus envoyées automatiquement",
        });
        return { success: true };
      } else {
        toast.error("Erreur", {
          description:
            data?.disableEInvoicing?.message || "Impossible de désactiver",
        });
        return { success: false, error: data?.disableEInvoicing?.message };
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    enable,
    disable,
    loading: enabling || disabling,
  };
}

/**
 * Hook pour tester la connexion SuperPDP
 */
export function useTestSuperPdpConnection() {
  const { workspaceId } = useRequiredWorkspace();

  const [testMutation, { loading }] = useMutation(TEST_SUPERPDP_CONNECTION);

  const testConnection = async () => {
    try {
      const { data } = await testMutation({
        variables: { workspaceId },
      });

      if (data?.testSuperPdpConnection?.success) {
        toast.success("Connexion réussie", {
          description: "La connexion à SuperPDP fonctionne correctement",
        });
        return { success: true, profile: data.testSuperPdpConnection.profile };
      } else {
        toast.error("Échec de connexion", {
          description:
            data?.testSuperPdpConnection?.message ||
            "Impossible de se connecter à SuperPDP",
        });
        return { success: false, error: data?.testSuperPdpConnection?.message };
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    testConnection,
    loading,
  };
}

/**
 * Hook pour renvoyer une facture à SuperPDP
 */
export function useResendInvoice() {
  const { workspaceId } = useRequiredWorkspace();

  const [resendMutation, { loading }] = useMutation(RESEND_INVOICE_TO_SUPERPDP);

  const resend = async (invoiceId) => {
    try {
      const { data } = await resendMutation({
        variables: { workspaceId, invoiceId },
      });

      if (data?.resendInvoiceToSuperPdp?.success) {
        toast.success("Facture renvoyée", {
          description: "La facture a été envoyée à SuperPDP avec succès",
        });
        return {
          success: true,
          superPdpInvoiceId: data.resendInvoiceToSuperPdp.superPdpInvoiceId,
          status: data.resendInvoiceToSuperPdp.status,
        };
      } else {
        toast.error("Échec de l'envoi", {
          description:
            data?.resendInvoiceToSuperPdp?.message ||
            "Impossible d'envoyer la facture",
        });
        return {
          success: false,
          error: data?.resendInvoiceToSuperPdp?.message,
        };
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    resend,
    loading,
  };
}

/**
 * Hook pour vérifier si un destinataire peut recevoir des e-factures
 */
export function useCheckRecipient() {
  const { workspaceId } = useRequiredWorkspace();

  const [checkMutation, { loading }] = useMutation(CHECK_RECIPIENT_EINVOICING);

  const checkRecipient = async (siret) => {
    try {
      const { data } = await checkMutation({
        variables: { workspaceId, siret },
      });

      const result = data?.checkRecipientEInvoicing;

      if (result?.success && result?.canReceiveEInvoices) {
        toast.success("Destinataire compatible", {
          description: `Ce destinataire peut recevoir des factures électroniques${result.pdpName ? ` via ${result.pdpName}` : ""}`,
        });
      } else if (result?.success && !result?.canReceiveEInvoices) {
        toast.warning("Destinataire non compatible", {
          description:
            "Ce destinataire n'est pas encore inscrit pour recevoir des factures électroniques",
        });
      } else {
        toast.error("Erreur de vérification", {
          description:
            result?.error || "Impossible de vérifier le destinataire",
        });
      }

      return result;
    } catch (error) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    checkRecipient,
    loading,
  };
}
