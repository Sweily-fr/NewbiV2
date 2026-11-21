"use client";

import { CircleCheck, CreditCard, Landmark } from "lucide-react";
import {
  TRANSFER_PAYMENT_STATE_LABELS,
  formatTransferAmount,
  transferPaymentState,
} from "../utils/transfer-payment";

// Badge du paiement demandé au destinataire (montant compris), dans la
// liste des transferts
export function TransferPaymentBadge({ transfer }) {
  const state = transferPaymentState(transfer);
  if (!state) return null;
  const amount = formatTransferAmount(
    state === "paid" && transfer.paidAmount != null
      ? transfer.paidAmount
      : transfer.paymentAmount,
    transfer.paymentCurrency,
  );
  if (state === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium whitespace-nowrap dark:bg-emerald-900/20 dark:text-emerald-400">
        <CircleCheck className="w-3 h-3" />
        {TRANSFER_PAYMENT_STATE_LABELS.paid} · {amount}
      </span>
    );
  }
  // Virement annoncé par le client : à vérifier sur le compte avant de
  // débloquer le transfert
  const Icon = state === "declared" ? Landmark : CreditCard;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#5b4fff]/10 text-[#5b4fff] text-xs font-medium whitespace-nowrap">
      <Icon className="w-3 h-3" />
      {TRANSFER_PAYMENT_STATE_LABELS[state]} · {amount}
    </span>
  );
}

export default TransferPaymentBadge;
