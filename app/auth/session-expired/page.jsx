"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Clock, LogIn, LoaderCircle } from "lucide-react";

function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") || "inactivity";
  const [countdown, setCountdown] = useState(30);

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
          title: "Session terminée",
          description:
            "Votre session a été fermée pour protéger votre compte. Vos données sont intactes, reconnectez-vous pour continuer.",
        };
      case "revoked":
        return {
          title: "Session révoquée",
          description:
            "Votre session a été révoquée depuis un autre appareil. Vos données sont intactes, reconnectez-vous pour continuer.",
        };
      case "inactivity":
      default:
        return {
          title: "Session expirée",
          description:
            "Votre session a expiré après une période d'inactivité. Vos données sont intactes, reconnectez-vous pour continuer.",
        };
    }
  };

  const content = getReasonContent();

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <img
          src="/newbiLetter.png"
          alt="Newbi"
          className="h-5 w-auto mx-auto mb-8"
        />

        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-6" strokeWidth={1.5} />

        <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
          {content.title}
        </h1>

        <p className="text-sm text-gray-500 text-center leading-relaxed mb-8">
          {content.description}
        </p>

        <Button
          onClick={() => router.push("/auth/login")}
          className="w-full py-2.5 text-sm font-medium rounded-lg cursor-pointer"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Se reconnecter
        </Button>

        <p className="mt-3 text-xs text-gray-400 text-center">
          Redirection automatique dans{" "}
          <span className="font-medium text-gray-500">{countdown}s</span>
        </p>

        <p className="mt-8 text-xs text-gray-400 text-center">
          Un problème ?{" "}
          <a
            href="mailto:contact@newbi.fr"
            className="text-gray-500 hover:text-gray-700 underline"
          >
            Contactez le support
          </a>
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoaderCircle className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export default function SessionExpiredPage() {
  return (
    <main>
      <Suspense fallback={<LoadingFallback />}>
        <SessionExpiredContent />
      </Suspense>
    </main>
  );
}
