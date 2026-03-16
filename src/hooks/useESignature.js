"use client";

import { useQuery, useMutation } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import {
  GET_SIGNATURE_REQUEST,
  GET_SIGNATURE_REQUESTS,
  GET_DOCUMENT_SIGNATURE_STATUS,
  REQUEST_DOCUMENT_SIGNATURE,
  CANCEL_SIGNATURE,
  RETRY_SIGNATURE,
} from "@/src/graphql/esignatureQueries";

/**
 * Hook pour récupérer le statut de signature d'un document
 */
export function useDocumentSignatureStatus(documentType, documentId) {
  const { data, loading, error, refetch } = useQuery(
    GET_DOCUMENT_SIGNATURE_STATUS,
    {
      variables: { documentType, documentId },
      skip: !documentType || !documentId,
      fetchPolicy: "cache-and-network",
      pollInterval: 30000, // Rafraîchir toutes les 30s pour les signatures en cours
    }
  );

  const signatureRequest = data?.getDocumentSignatureStatus || null;

  // Arrêter le polling si la signature est terminée
  const isTerminal = ["DONE", "ERROR", "CANCELLED"].includes(
    signatureRequest?.status
  );

  return {
    signatureRequest,
    hasSignature: !!signatureRequest,
    isPending:
      signatureRequest &&
      ["PENDING", "WAIT_VALIDATION", "WAIT_SIGN", "WAIT_SIGNER"].includes(
        signatureRequest.status
      ),
    isDone: signatureRequest?.status === "DONE",
    isError: signatureRequest?.status === "ERROR",
    loading,
    error,
    refetch,
  };
}

/**
 * Hook pour lister les signatures (avec filtres optionnels)
 */
export function useSignatureRequests(filters = {}) {
  const { data, loading, error, refetch } = useQuery(GET_SIGNATURE_REQUESTS, {
    variables: filters,
    fetchPolicy: "cache-and-network",
  });

  return {
    signatureRequests: data?.getSignatureRequests || [],
    loading,
    error,
    refetch,
  };
}

/**
 * Hook pour demander une signature électronique
 */
export function useRequestSignature() {
  const [requestMutation, { loading }] = useMutation(
    REQUEST_DOCUMENT_SIGNATURE
  );

  const requestSignature = async (input) => {
    try {
      const { data } = await requestMutation({
        variables: { input },
        refetchQueries: [
          {
            query: GET_DOCUMENT_SIGNATURE_STATUS,
            variables: {
              documentType: input.documentType,
              documentId: input.documentId,
            },
          },
        ],
      });

      if (data?.requestDocumentSignature?.success) {
        toast.success("Demande de signature envoyée", {
          description:
            "Le signataire recevra un email avec le lien de signature.",
        });
        return {
          success: true,
          signatureRequest: data.requestDocumentSignature.signatureRequest,
        };
      } else {
        toast.error("Erreur", {
          description:
            data?.requestDocumentSignature?.message ||
            "Impossible d'envoyer la demande de signature",
        });
        return {
          success: false,
          error: data?.requestDocumentSignature?.message,
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
    requestSignature,
    loading,
  };
}

/**
 * Hook pour annuler une signature
 */
export function useCancelSignature() {
  const [cancelMutation, { loading }] = useMutation(CANCEL_SIGNATURE);

  const cancelSignature = async (signatureId, documentType, documentId) => {
    try {
      const { data } = await cancelMutation({
        variables: { signatureId },
        refetchQueries: [
          {
            query: GET_DOCUMENT_SIGNATURE_STATUS,
            variables: { documentType, documentId },
          },
        ],
      });

      if (data?.cancelSignature?.success) {
        toast.success("Signature annulée", {
          description: "La demande de signature a été annulée.",
        });
        return { success: true };
      } else {
        toast.error("Erreur", {
          description:
            data?.cancelSignature?.message ||
            "Impossible d'annuler la signature",
        });
        return { success: false, error: data?.cancelSignature?.message };
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    cancelSignature,
    loading,
  };
}

/**
 * Hook pour relancer une signature en erreur
 */
export function useRetrySignature() {
  const [retryMutation, { loading }] = useMutation(RETRY_SIGNATURE);

  const retrySignature = async (signatureId, documentType, documentId) => {
    try {
      const { data } = await retryMutation({
        variables: { signatureId },
        refetchQueries: [
          {
            query: GET_DOCUMENT_SIGNATURE_STATUS,
            variables: { documentType, documentId },
          },
        ],
      });

      if (data?.retrySignature?.success) {
        toast.success("Signature réinitialisée", {
          description: "Vous pouvez relancer la demande de signature.",
        });
        return { success: true };
      } else {
        toast.error("Erreur", {
          description:
            data?.retrySignature?.message ||
            "Impossible de relancer la signature",
        });
        return { success: false, error: data?.retrySignature?.message };
      }
    } catch (error) {
      toast.error("Erreur", {
        description: error.message || "Une erreur est survenue",
      });
      return { success: false, error: error.message };
    }
  };

  return {
    retrySignature,
    loading,
  };
}
