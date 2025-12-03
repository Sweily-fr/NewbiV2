"use client";

import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";

export function PaymentRequired({
  paymentAmount,
  paymentCurrency,
  onInitiatePayment,
  isProcessing,
}) {
  return (
    <>
      <Separator />
      <Card className="mb-6 border-none shadow-none">
        <CardContent className="p-0">
          <div className="flex item-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-lg font-normal">Paiement requis</h3>
              <p className="mb-4 text-sm">
                Ce transfert nécessite un paiement de {paymentAmount}{" "}
                {paymentCurrency}
              </p>
            </div>
            <Button
              className="cursor-pointer bg-[#5b4fff] hover:bg-[#5b4fff]/90"
              onClick={onInitiatePayment}
              disabled={isProcessing}
            >
              {isProcessing ? "Redirection..." : "Procéder au paiement"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Separator />
    </>
  );
}
