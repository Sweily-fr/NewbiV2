"use client";

import { useState } from "react";
import { Bug, CreditCard, Landmark, ChevronUp } from "lucide-react";
import { ProSubscriptionOverlay } from "@/src/components/pro-subscription-overlay";
import { BankSyncOverlay } from "@/src/components/bank-sync-overlay";

export function DevAnimationTrigger() {
  const [open, setOpen] = useState(false);
  const [showProOverlay, setShowProOverlay] = useState(false);
  const [showBankSync, setShowBankSync] = useState(false);

  if (process.env.NODE_ENV !== "development") return null;

  const handleProAnimation = () => {
    setOpen(false);
    setShowProOverlay(true);
  };

  const handleBankSync = () => {
    setOpen(false);
    setShowBankSync(true);
    setTimeout(() => setShowBankSync(false), 3000);
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[9000]">
        {/* Dropdown */}
        {open && (
          <div className="mb-2 rounded-xl border border-[#EEEFF1] bg-white shadow-lg overflow-hidden w-56">
            <button
              onClick={handleProAnimation}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#46464A] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
            >
              <CreditCard className="size-4 text-[#5A50FF]" />
              Animation Stripe
            </button>
            <div className="h-px bg-[#EEEFF1]" />
            <button
              onClick={handleBankSync}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[#46464A] hover:bg-[#F8F9FA] transition-colors cursor-pointer"
            >
              <Landmark className="size-4 text-[#5A50FF]" />
              Animation Bancaire
            </button>
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center size-10 rounded-full bg-[#5A50FF] text-white shadow-lg hover:bg-[#4a40ef] transition-colors cursor-pointer"
        >
          {open ? <ChevronUp className="size-4" /> : <Bug className="size-4" />}
        </button>
      </div>

      <ProSubscriptionOverlay
        isVisible={showProOverlay}
        onComplete={() => setShowProOverlay(false)}
      />
      <BankSyncOverlay isVisible={showBankSync} />
    </>
  );
}
