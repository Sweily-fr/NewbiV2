"use client";

import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import {
  GET_SIGNATURE_REQUESTS,
  GET_DOCUMENT_SIGNATURE_STATUS,
  REQUEST_DOCUMENT_SIGNATURE,
  SEAL_QUOTE_DOCUMENT,
  CANCEL_SIGNATURE,
  RETRY_SIGNATURE,
} from "@/src/graphql/esignatureQueries";
import posthog from "posthog-js";

/**
 * Hook pour récupérer le statut de signature d'un document
 */
export function useDocumentSignatureStatus(documentType, documentId) {
  const { data, loading, error, refetch, startPolling, stopPolling } = useQuery(
    GET_DOCUMENT_SIGNATURE_STATUS,
    {
      variables: { documentType, documentId },
      skip: !documentType || !documentId,
    },
  );

  const signatureRequest = data?.getDocumentSignatureStatus || null;

  const isTerminal = ["DONE", "ERROR", "CANCELLED"].includes(
    signatureRequest?.status,
  );

  const isPending =
    signatureRequest &&
    ["PENDING", "WAIT_VALIDATION", "WAIT_SIGN", "WAIT_SIGNER"].includes(
      signatureRequest.status,
    );

  // Activer le polling uniquement quand une signature est en cours
  React.useEffect(() => {
    if (isPending && !isTerminal) {
      startPolling(30000);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isPending, isTerminal, startPolling, stopPolling]);

  return {
    signatureRequest,
    hasSignature: !!signatureRequest,
    isPending,
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
    REQUEST_DOCUMENT_SIGNATURE,
  );

  const requestSignature = async (input) => {
    try {
      const { data, errors } = await requestMutation({
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
        posthog.capture("esignature_requested", {
          document_type: input.documentType,
          document_id: input.documentId,
        });
        toast.success("Demande de signature envoyée", {
          description:
            "Le signataire recevra un email avec le lien de signature.",
        });
        return {
          success: true,
          signatureRequest: data.requestDocumentSignature.signatureRequest,
        };
      } else {
        const errorMessage =
          data?.requestDocumentSignature?.message ||
          errors?.[0]?.message ||
          "Impossible d'envoyer la demande de signature";
        toast.error("Erreur", { description: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message ||
        "Une erreur est survenue";
      toast.error("Erreur", { description: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  return {
    requestSignature,
    loading,
  };
}

/**
 * Hook pour apposer un cachet qualifié (QES) sur le document signé d'un devis
 */
export function useSealQuoteDocument() {
  const [sealMutation, { loading }] = useMutation(SEAL_QUOTE_DOCUMENT);

  const sealQuoteDocument = async (quoteId) => {
    try {
      const { data, errors } = await sealMutation({
        variables: { quoteId },
        refetchQueries: [
          {
            query: GET_DOCUMENT_SIGNATURE_STATUS,
            variables: { documentType: "quote", documentId: quoteId },
          },
        ],
      });

      if (data?.sealQuoteDocument?.success) {
        toast.success("Cachet appliqué", {
          description:
            "Le document signé a été cacheté avec le certificat qualifié de l'entreprise.",
        });
        return {
          success: true,
          signatureRequest: data.sealQuoteDocument.signatureRequest,
        };
      } else {
        const errorMessage =
          data?.sealQuoteDocument?.message ||
          errors?.[0]?.message ||
          "Impossible d'appliquer le cachet";
        toast.error("Erreur", { description: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message ||
        "Une erreur est survenue";
      toast.error("Erreur", { description: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  return {
    sealQuoteDocument,
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
