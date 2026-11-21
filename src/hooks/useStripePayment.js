import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER } from "@/src/graphql/mutations/stripe";
import { toast } from "@/src/components/ui/sonner";
import { capture } from "@/src/lib/analytics";

const PAYMENT_START_ERROR =
  "Le paiement n'a pas pu être lancé. Réessayez dans quelques instants.";

/**
 * Paiement d'un transfert par le destinataire du lien : la page de paiement
 * du prestataire (Stripe ou PayPal, sur le compte du vendeur) s'ouvre à la
 * place de la page du transfert.
 */
export const useStripePayment = () => {
  // Moyen en cours de redirection (« stripe » ou « paypal »)
  const [processingProvider, setProcessingProvider] = useState(null);

  const [createPaymentSession] = useMutation(
    CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER,
  );

  // Retour arrière depuis la page de paiement (cache de page de Safari) :
  // les boutons ne doivent pas rester sur « Redirection… »
  useEffect(() => {
    const onPageShow = (event) => {
      if (event.persisted) setProcessingProvider(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const initiatePayment = async (
    transferId,
    accessKey,
    provider = "stripe",
  ) => {
    if (!transferId) {
      toast.error("Transfert introuvable");
      return;
    }

    setProcessingProvider(provider);
    capture("payment_initiated", {
      transfer_id: transferId,
      has_access_key: !!accessKey,
      provider,
    });

    try {
      const { data } = await createPaymentSession({
        variables: {
          transferId,
          accessKey: accessKey || undefined,
          provider,
        },
      });
      const result = data?.createPaymentSessionForFileTransfer;
      if (result?.success && result.sessionUrl) {
        // L'état « Redirection… » reste affiché jusqu'au départ de la page
        window.location.href = result.sessionUrl;
        return;
      }
      toast.error(result?.message || PAYMENT_START_ERROR);
    } catch {
      toast.error(PAYMENT_START_ERROR);
    }
    setProcessingProvider(null);
  };

  return {
    initiatePayment,
    isProcessing: Boolean(processingProvider),
    processingProvider,
  };
};

export default useStripePayment;
