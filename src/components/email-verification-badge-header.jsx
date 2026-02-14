"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/src/lib/auth-client";
import { TriangleAlert, RefreshCw } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";

export function EmailVerificationBadgeHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(true);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        const { data: session } = await authClient.getSession();
        const emailVerified = session?.user?.emailVerified;

        setIsVerified(emailVerified);
        setIsVisible(!emailVerified);
      } catch (error) {
        console.error("Erreur vérification email:", error);
      }
    };

    checkEmailVerification();

    // Vérifier toutes les 30 secondes si l'email a été vérifié
    const interval = setInterval(checkEmailVerification, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResendEmail = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const { data: session } = await authClient.getSession();

      if (session?.user?.email) {
        await authClient.sendVerificationEmail({
          email: session.user.email,
          callbackURL: `${window.location.origin}/api/auth/verify-email`,
        });

        toast.success("Email de vérification renvoyé !");
      }
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
