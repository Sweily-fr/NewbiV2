"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Clock, Shield, LogIn, ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";

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
          icon: Shield,
          title: "Session terminee pour votre securite",
          description:
            "Votre session a ete fermee pour proteger votre compte. Cela peut arriver si une activite inhabituelle a ete detectee.",
          color: "text-orange-500",
          bgColor: "bg-orange-50",
        };
      case "revoked":
        return {
          icon: Shield,
          title: "Session revoquee",
          description:
            "Votre session a ete revoquee depuis un autre appareil ou par un administrateur.",
          color: "text-red-500",
          bgColor: "bg-red-50",
        };
      case "inactivity":
      default:
        return {
          icon: Clock,
          title: "Session expiree pour inactivite",
          description:
            "Pour des raisons de securite, votre session a expire apres une periode d'inactivite. Reconnectez-vous pour continuer.",
          color: "text-blue-500",
          bgColor: "bg-blue-50",
        };
    }
  };

  const content = getReasonContent();
  const IconComponent = content.icon;

  return (
    <div className="w-full max-w-md">
      {/* Card principale */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="/ni2.png"
            alt="Newbi Logo"
            className="h-8 w-auto"
          />
        </div>

        {/* Icone avec animation */}
        <div className="flex justify-center">
          <div
            className={`${content.bgColor} dark:bg-opacity-20 p-4 rounded-full animate-pulse`}
          >
            <IconComponent
              className={`w-12 h-12 ${content.color}`}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Titre et description */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {content.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Informations de securite */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Vos donnees sont protegees</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Aucune donnee n'a ete perdue. Vous retrouverez votre espace exactement comme vous l'avez laisse.
          </p>
        </div>

        {/* Bouton de connexion */}
        <Button
          onClick={() => router.push("/auth/login")}
          className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-xl transition-all duration-200 hover:shadow-lg"
        >
          <LogIn className="w-5 h-5 mr-2" />
          Se reconnecter
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Countdown */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          Redirection automatique dans{" "}
          <span className="font-medium text-slate-600 dark:text-slate-300">
            {countdown}s
          </span>
        </p>

        {/* Lien support */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Un probleme ?{" "}
            <Link
              href="/support"
              className="text-primary hover:text-primary/80 font-medium"
            >
              Contactez le support
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
        Pour votre securite, les sessions expirent apres 1 heure d'inactivite.
      </p>
    </div>
  );
}

// Fallback de chargement
function LoadingFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 flex items-center justify-center min-h-[400px]">
        <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
      </div>
    </div>
  );
}

// Page principale avec Suspense boundary
export default function SessionExpiredPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <SessionExpiredContent />
      </Suspense>
    </main>
  );
}
