"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { LoaderCircle } from "lucide-react";
import {
  CONFIRM_TRANSFER_PAYMENT,
  CONSUME_PAYMENT_RETURN_TOKEN,
} from "@/src/graphql/mutations/stripe";
import { buildPaymentReturnRequest, paymentResultParam } from "./return-params";

function ReturnMessage({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">{children}</div>
    </div>
  );
}

function TransferReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(null);
  // Une seule vérification par retour (double effet du mode strict)
  const startedRef = useRef(false);

  const [confirmPayment] = useMutation(CONFIRM_TRANSFER_PAYMENT);
  const [consumeToken] = useMutation(CONSUME_PAYMENT_RETURN_TOKEN);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const request = buildPaymentReturnRequest(searchParams);
    if (!request) {
      setError("Ce lien de retour est incomplet.");
      return;
    }

    const goToTransfer = (shareLink, accessKey, payment) => {
      const params = new URLSearchParams({ key: accessKey, payment });
      router.replace(`/transfer/${shareLink}?${params.toString()}`);
    };

    (async () => {
      try {
        if (request.kind === "confirm") {
          // Paiement vérifié par l'API auprès de Stripe ou PayPal
          const { data } = await confirmPayment({
            variables: request.variables,
          });
          const result = data?.confirmTransferPayment;
          if (result?.shareLink && result?.accessKey) {
            goToTransfer(
              result.shareLink,
              result.accessKey,
              paymentResultParam(result.status, request.canceled),
            );
            return;
          }
          setError(result?.message || "Ce lien de retour n'est plus valable.");
          return;
        }

        // Ancien format : jeton à usage unique sans vérification au retour
        const { data } = await consumeToken({ variables: request.variables });
        const result = data?.consumePaymentReturnToken;
        if (result?.success && result.shareLink && result.accessKey) {
          goToTransfer(
            result.shareLink,
            result.accessKey,
            request.canceled
              ? "canceled"
              : result.paymentStatus === "paid"
                ? "paid"
                : "pending",
          );
          return;
        }
        setError(result?.message || "Ce lien de retour n'est plus valable.");
      } catch {
        setError(
          "Connexion impossible. Vérifiez votre connexion puis rechargez la page.",
        );
      }
    })();
  }, [searchParams, confirmPayment, consumeToken, router]);

  if (error) {
    return (
      <ReturnMessage>
        <p className="text-lg text-muted-foreground">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Si vous avez payé, le lien du transfert vous donne accès aux fichiers
          dès la confirmation du paiement. Sinon, contactez l&apos;expéditeur.
        </p>
      </ReturnMessage>
    );
  }

  return (
    <ReturnMessage>
      <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#5a50ff]" />
      <p className="mt-4 text-muted-foreground">Vérification du paiement…</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Ne fermez pas cette page.
      </p>
    </ReturnMessage>
  );
}

export default function TransferReturnPage() {
  return (
    <Suspense
      fallback={
        <ReturnMessage>
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#5a50ff]" />
        </ReturnMessage>
      }
    >
      <TransferReturnContent />
    </Suspense>
  );
}
