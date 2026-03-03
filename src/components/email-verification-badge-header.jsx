"use client";

import { useState } from "react";
import { TriangleAlert, RefreshCw } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useEmailVerification } from "@/src/hooks/useEmailVerification";

export function EmailVerificationBadgeHeader() {
  const { isVerified, resendVerificationEmail } = useEmailVerification();
  const [isVisible, setIsVisible] = useState(true);
  const [isResending, setIsResending] = useState(false);

  const handleResendEmail = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      await resendVerificationEmail();
      toast.success("Email de vérification renvoyé !");
    } catch (error) {
      console.error("Erreur renvoi email:", error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified || !isVisible) return null;

  return (
    <div
      className="flex align-items gap-2 px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity"
      onClick={handleResendEmail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleResendEmail(); }}
    >
      {isResending ? (
        <RefreshCw className="text-amber-700 dark:text-amber-400 animate-spin" size={14} />
      ) : (
        <TriangleAlert className="text-amber-700 dark:text-amber-400" size={14} />
      )}
      <span className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
        {isResending ? "Envoi en cours..." : "Vérifier votre adresse mail"}
      </span>
    </div>
  );
}
