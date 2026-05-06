"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, gql } from "@apollo/client";
import { Loader2 } from "lucide-react";

const CONSUME_PAYMENT_RETURN_TOKEN = gql`
  mutation ConsumePaymentReturnToken($token: String!) {
    consumePaymentReturnToken(token: $token) {
      success
      message
      shareLink
      accessKey
      paymentStatus
    }
  }
`;

function TransferReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState(null);

  const token = searchParams.get("token");
  const status = searchParams.get("status");

  const [consumeToken] = useMutation(CONSUME_PAYMENT_RETURN_TOKEN, {
    onCompleted: (data) => {
      const result = data.consumePaymentReturnToken;
      if (result.success && result.shareLink) {
        const params = new URLSearchParams({
          key: result.accessKey,
          payment_status: status || "success",
        });
        router.replace(`/transfer/${result.shareLink}?${params.toString()}`);
      } else {
        setError(result.message || "Lien invalide ou expiré");
      }
    },
    onError: () => {
      setError("Erreur de connexion");
    },
  });

  useEffect(() => {
    if (token) {
      consumeToken({ variables: { token } });
    } else {
      setError("Token manquant");
    }
  }, [token, consumeToken]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Contactez l&apos;expéditeur pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirection en cours...</p>
      </div>
    </div>
  );
}

export default function TransferReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <TransferReturnContent />
    </Suspense>
  );
}
