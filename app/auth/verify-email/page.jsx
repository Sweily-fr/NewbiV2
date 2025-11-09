"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, LoaderCircle, ArrowRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { toast } from "@/src/components/ui/sonner";
import { Confetti } from "@/src/components/magicui/confetti";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const confettiRef = useRef(null);

  useEffect(() => {
    const handleVerification = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");
      const verified = searchParams.get("verified");

      console.log("🔍 [VERIFY PAGE] Params:", { token: !!token, error, verified });

      if (error) {
        setVerificationStatus("error");
        setMessage("Erreur lors de la vérification");
        toast.error("Lien de vérification invalide ou expiré");
        return;
      }

      if (!token) {
        setVerificationStatus("error");
        setMessage("Token manquant");
        toast.error("Lien de vérification invalide");
        return;
      }

      // ✅ Si verified=true, la vérification a déjà été faite par notre route
      if (verified === "true") {
        console.log("✅ [VERIFY PAGE] Vérification déjà effectuée, vérification session...");
        
        try {
          // Vérifier que l'utilisateur est bien connecté
          const sessionResponse = await fetch("/api/auth/get-session", {
            credentials: "include",
          });

          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            console.log("📊 [VERIFY PAGE] Session:", sessionData ? "✅" : "❌");
            
            if (sessionData && sessionData.user) {
              // ✅ Utilisateur connecté après vérification
              setVerificationStatus("success");
              setMessage("Votre email a été vérifié avec succès !");
              toast.success(
                "Email vérifié avec succès ! Redirection vers votre espace..."
              );

          setTimeout(() => {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = {
              startVelocity: 30,
              spread: 360,
              ticks: 60,
              zIndex: 0,
            };

            const randomInRange = (min, max) =>
              Math.random() * (max - min) + min;

            const interval = setInterval(() => {
              const timeLeft = animationEnd - Date.now();

              if (timeLeft <= 0) {
                return clearInterval(interval);
              }

              const particleCount = 50 * (timeLeft / duration);

              confettiRef.current?.fire({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
              });

              confettiRef.current?.fire({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
              });
            }, 250);
          }, 300);

            // Redirection vers le dashboard
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 3000);
          } else {
            // ❌ Pas de session = autoSignInAfterVerification n'a pas fonctionné
            setVerificationStatus("error");
            setMessage("Email vérifié, veuillez vous connecter");
            toast.info("Email vérifié ! Connectez-vous pour continuer.");
            setTimeout(() => {
              router.push("/auth/login?verified=true");
            }, 2000);
          }
        } else {
          setVerificationStatus("error");
          setMessage("Erreur lors de la vérification");
          toast.error("Erreur lors de la vérification");
        }
        } catch (error) {
          console.error("❌ [VERIFY PAGE] Erreur vérification session:", error);
          setVerificationStatus("error");
          setMessage("Erreur lors de la vérification");
          toast.error("Erreur lors de la vérification");
        }
      } else {
        // ❌ verified n'est pas true, ne devrait pas arriver
        console.error("❌ [VERIFY PAGE] Paramètre verified manquant");
        setVerificationStatus("error");
        setMessage("Erreur de vérification");
        toast.error("Erreur lors de la vérification");
      }
    };

    handleVerification();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4 relative">
      {/* Confetti Canvas */}
      {verificationStatus === "success" && (
        <Confetti
          ref={confettiRef}
          className="fixed inset-0 w-full h-full z-50 pointer-events-none"
        />
      )}

      {/* Main content */}
      <div className="relative z-10 w-full max-w-sm">
        {/* Loading State */}
        {verificationStatus === "loading" && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-[#5a50ff] p-3 rounded-lg">
              <LoaderCircle className="h-5 w-5 text-white animate-spin" />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                Vérification en cours
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nous vérifions votre adresse email...
              </p>
            </div>
          </div>
        )}

        {/* Success State */}
        {verificationStatus === "success" && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-[#5a50ff] p-3 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                Email vérifié !
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Redirection vers votre espace en cours...
              </p>
            </div>
            <Button
              asChild
              className="w-full bg-[#5a50ff] hover:bg-[#4a40ef] text-white font-normal h-10 rounded-lg"
            >
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2"
              >
                Accéder au dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}

        {/* Error State */}
        {verificationStatus === "error" && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-red-500 p-3 rounded-lg">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                Erreur de vérification
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message || "Une erreur s'est produite."}
              </p>
            </div>
            <div className="w-full space-y-2">
              <Button
                asChild
                className="w-full bg-[#5a50ff] hover:bg-[#4a40ef] text-white h-10 rounded-lg"
              >
                <Link href="/auth/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Branding */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600">
            Propulsé par{" "}
            <span className="font-medium text-[#5a50ff]">Newbi</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Composant de fallback pour le loading
function VerifyEmailFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="bg-[#5a50ff] p-3 rounded-xl">
            <LoaderCircle className="h-5 w-5 text-white animate-spin" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg font-medium text-gray-900 dark:text-white">
              Chargement...
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Préparation de la vérification...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant principal avec Suspense
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
