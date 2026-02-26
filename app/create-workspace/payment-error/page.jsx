"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function PaymentErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <img src="/newbiLetter.png" alt="Newbi" className="h-6 mb-6" />
        <div className="w-full max-w-md rounded-3xl border border-[#EEEFF1] bg-white p-10 text-center">
          {/* Error icon */}
          <div className="mx-auto mb-6 flex items-center justify-center size-14 rounded-2xl bg-red-50 border border-red-100">
            <AlertCircle className="size-7 text-red-500" />
          </div>

          <h1 className="text-xl font-semibold text-[#46464A] mb-2">
            Paiement échoué
          </h1>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Le paiement n&apos;a pas pu être finalisé. Aucun montant n&apos;a été prélevé. Vous pouvez réessayer ou modifier vos informations.
          </p>

          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.push("/create-workspace")}
            >
              Réessayer
            </Button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
