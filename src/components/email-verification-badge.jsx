"use client";

import { useState, useEffect } from "react";
import { Mail, X, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "@/src/lib/auth-client";
import { cn } from "@/src/lib/utils";

export function EmailVerificationBadge({ className }) {
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
    setIsResending(true);
    try {
      const { data: session } = await authClient.getSession();

      if (session?.user?.email) {
        // Appeler l'API pour renvoyer l'email de vérification
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

  const handleDismiss = () => {
    setIsVisible(false);
    // Stocker dans localStorage pour ne pas réafficher pendant 24h
    localStorage.setItem("emailVerificationDismissed", Date.now().toString());
  };

  // Vérifier si l'utilisateur a déjà fermé la notification récemment
  useEffect(() => {
    const dismissed = localStorage.getItem("emailVerificationDismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (Date.now() - dismissedTime < oneDayInMs) {
        setIsVisible(false);
      } else {
        localStorage.removeItem("emailVerificationDismissed");
      }
    }
  }, []);

  if (isVerified || !isVisible) return null;

  return (
    <div
      className={cn(
        "mx-2 mb-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Mail className="h-4 w-4 text-amber-600 dark:text-amber-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Vérifiez votre email
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            Pour sécuriser votre compte et débloquer toutes les fonctionnalités
          </p>

          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendEmail}
              disabled={isResending}
              className="h-7 text-xs text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Renvoyer
                </>
              )}
            </Button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-amber-600 hover:text-amber-900 dark:text-amber-500 dark:hover:text-amber-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
