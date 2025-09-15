import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER } from '@/src/graphql/mutations/stripe';
import { toast } from '@/src/components/ui/sonner';

export const useStripePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const [createPaymentSession] = useMutation(CREATE_PAYMENT_SESSION_FOR_FILE_TRANSFER, {
    onCompleted: (data) => {
      if (data.createPaymentSessionForFileTransfer.success) {
        // Rediriger vers Stripe Checkout
        const sessionUrl = data.createPaymentSessionForFileTransfer.sessionUrl;
        if (sessionUrl) {
          window.location.href = sessionUrl;
        } else {
          toast.error('URL de paiement manquante');
        }
      } else {
        toast.error(data.createPaymentSessionForFileTransfer.message || 'Erreur lors de la création de la session de paiement');
      }
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error('Erreur lors de la création de la session de paiement');
      setIsProcessing(false);
    }
  });

  const initiatePayment = async (transferId) => {
    if (!transferId) {
      toast.error('ID de transfert manquant');
      return;
    }

    setIsProcessing(true);
    
    try {
      
      await createPaymentSession({
        variables: {
          transferId
        }
      });
    } catch (error) {
      toast.error('Erreur lors de l\'initiation du paiement');
      setIsProcessing(false);
    }
  };

  return {
    initiatePayment,
    isProcessing
  };
};

export default useStripePayment;
