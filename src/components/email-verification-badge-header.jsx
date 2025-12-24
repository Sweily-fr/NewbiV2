"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/src/lib/auth-client";
import { TriangleAlert } from "lucide-react";

export function EmailVerificationBadgeHeader() {
  const [isVisible, setIsVisible] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

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

  if (isVerified || !isVisible) return null;

  return (
    <div className="flex align-items gap-2 px-2 py-1">
      <TriangleAlert className="text-amber-700 dark:text-amber-400" size={14} />
      <span className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
        Vérifier votre adresse mail
      </span>
    </div>
  );
}
