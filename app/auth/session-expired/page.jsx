"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Shield, LogIn, LoaderCircle } from "lucide-react";


// Composant interne qui utilise useSearchParams
function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "inactivity";
  const [countdown, setCountdown] = useState(30);

  // Countdown pour redirection automatique
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/auth/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const getReasonContent = () => {
    switch (reason) {
      case "security":
        return {
          title: "Session terminée pour votre sécurité",
          description:
            "Votre session a été fermée pour protéger votre compte. Cela peut arriver si une activité inhabituelle a été détectée.",
        };
      case "revoked":
        return {
          title: "Session révoquée",
          description:
            "Votre session a été révoquée depuis un autre appareil ou par un administrateur.",
        };
      case "inactivity":
      default:
        return {
          title: "Session expirée pour inactivité",
          description:
            "Pour des raisons de sécurité, votre session a expiré après une période d'inactivité. Reconnectez-vous pour continuer.",
        };
    }
  };

  const content = getReasonContent();

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <div className="w-1/2 flex items-center justify-center p-8">
          <div className="mx-auto sm:max-w-md w-full -mt-16">
            {/* Logo */}
            <img
              src="/newbiLetter.png"
              alt="Newbi Logo"
              className="h-5 w-auto mb-8"
            />

            {/* Titre et description */}
            <h3 className="text-3xl font-medium text-foreground dark:text-foreground">
              {content.title}
            </h3>
            <p className="mt-3 text-sm text-muted-foreground dark:text-muted-foreground leading-relaxed">
              {content.description}
            </p>

            {/* Informations de sécurité */}
            <div className="mt-6 bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Vos données sont protégées</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aucune donnée n'a été perdue. Vous retrouverez votre espace
                exactement comme vous l'avez laissé.
              </p>
            </div>

            {/* Bouton de connexion */}
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full h-12 mt-8 text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-md transition-all duration-200 hover:shadow-lg cursor-pointer"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Se reconnecter
            </Button>

            {/* Countdown */}
            <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
              Redirection automatique dans{" "}
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {countdown}s
              </span>
            </p>

            {/* Footer info */}
            <p className="mt-6 text-xs text-muted-foreground dark:text-muted-foreground">
              Pour votre sécurité, les sessions expirent après 1 heure
              d'inactivité.
            </p>

            {/* Lien support */}
            <p className="mt-4 text-sm text-muted-foreground dark:text-muted-foreground">
              Un problème ?{" "}
              <a
                href="mailto:contact@newbi.fr"
                className="font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
              >
                Contactez le support
              </a>
            </p>
          </div>
        </div>
        <div className="w-1/2 p-2 flex items-center min-h-screen justify-center">
          <div className="flex p-5 items-center justify-center w-full h-full rounded-lg relative">
            <img
              src="/undraw_security_0ubl.svg"
              alt="Security illustration"
              className="w-[60%] h-auto max-w-sm"
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen bg-background flex items-center justify-center pb-8">
        <div className="w-full max-w-sm px-6">
          {/* Logo */}
          <img
            src="/newbiLetter.png"
            alt="Newbi Logo"
            className="mb-6 h-4 w-auto"
          />

          {/* Titre et description */}
          <h3 className="text-xl font-medium text-foreground mb-2">
            {content.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            {content.description}
          </p>

          {/* Informations de sécurité */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Vos données sont protégées</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aucune donnée n'a été perdue. Vous retrouverez votre espace
              exactement comme vous l'avez laissé.
            </p>
          </div>

          {/* Bouton de connexion */}
          <Button
            onClick={() => router.push("/auth/login")}
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-md transition-all duration-200 cursor-pointer"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Se reconnecter
          </Button>

          {/* Countdown */}
          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            Redirection automatique dans{" "}
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {countdown}s
            </span>
          </p>

          {/* Footer info */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Pour votre sécurité, les sessions expirent après 1 heure
            d'inactivité.
          </p>

          {/* Lien support */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <a
              href="mailto:contact@newbi.fr"
              className="font-medium text-primary hover:text-primary/90"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

// Fallback de chargement
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

// Page principale avec Suspense boundary
export default function SessionExpiredPage() {
  return (
    <main>
      <Suspense fallback={<LoadingFallback />}>
        <SessionExpiredContent />
      </Suspense>
    </main>
  );
}
