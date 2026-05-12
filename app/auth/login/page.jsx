"use client";

import * as React from "react";
import { useState, Suspense } from "react";
import { Button } from "@/src/components/ui/button";
import LoginForm from "./loginForm";
import { signIn, clearSessionStorage } from "../../../src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useAuthSEO } from "@/src/hooks/use-seo";

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="currentColor"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="currentColor"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="currentColor"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="currentColor"
    />
  </svg>
);

const signInWithProvider = async (provider) => {
  try {
    clearSessionStorage();
    await signIn.social(
      { provider, callbackURL: "/dashboard" },
      {
        onSuccess: () => {},
        onError: (error) => {
          const msg = error?.message || "";
          if (msg.includes("désactivé") || msg.includes("réactivation")) {
            toast.error(msg);
          } else {
            toast.error(`Erreur lors de la connexion avec ${provider}`);
          }
        },
      },
    );
  } catch {}
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const isMobileSource = searchParams.get("source") === "mobile";

  const seoData = {
    ...useAuthSEO("login"),
    robots: "noindex,nofollow",
  };

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const switchView = (toEmail) => {
    setIsAnimating(true);
    setTimeout(() => {
      setShowEmailForm(toEmail);
      setTimeout(() => setIsAnimating(false), 20);
    }, 150);
  };

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <main
        className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6"
        style={{ backgroundColor: "rgb(251, 251, 252)" }}
      >
        {/* Logo */}
        <div className="absolute top-0 left-0 right-0 flex justify-center pt-20 md:pt-46">
          <img
            src="/newbi-icon.png"
            alt="Newbi"
            className="h-10 w-10 rounded-xl"
          />
        </div>

        {/* Animated content */}
        <div
          className="flex flex-col items-center w-full transition-all duration-200 ease-in-out"
          style={{
            opacity: isAnimating ? 0 : 1,
            transform: isAnimating ? "scale(0.97)" : "scale(1)",
          }}
        >
          {/* Title */}
          <h1 className="text-xl font-medium mb-8" style={{ color: "#2f2f31" }}>
            {showEmailForm
              ? "Connectez-vous avec votre email"
              : "Connectez-vous"}
          </h1>

          {/* Actions */}
          <div className="w-full max-w-[320px] space-y-4">
            {showEmailForm ? (
              <div>
                <LoginForm />
                <p className="mt-3 text-center">
                  <Link
                    href="/auth/forget-password"
                    className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <Button
                  className="w-full h-11 bg-[#5A50FF]/90 hover:bg-[#5A50FF] text-white cursor-pointer border-0 [box-shadow:none] rounded-lg"
                  onClick={() => signInWithProvider("google")}
                >
                  <GoogleIcon className="size-4 mr-2" aria-hidden />
                  Continuer avec Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11 cursor-pointer bg-white rounded-lg"
                  onClick={() => switchView(true)}
                >
                  Continuer avec l'email
                </Button>
              </>
            )}
          </div>

          {/* Footer */}
          <div
            className={`text-center space-y-4 max-w-[320px] ${showEmailForm ? "mt-4" : "mt-8"}`}
          >
            {showEmailForm ? (
              <button
                type="button"
                onClick={() => switchView(false)}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Retour à la connexion
              </button>
            ) : (
              <>
                <p className="text-[13px] text-muted-foreground">
                  En continuant, vous acceptez nos{" "}
                  <Link
                    href="/mentions-legales"
                    className="text-foreground hover:underline"
                  >
                    Conditions générales
                  </Link>{" "}
                  et notre{" "}
                  <Link
                    href="/politique-confidentialite"
                    className="text-foreground hover:underline"
                  >
                    Politique de confidentialité
                  </Link>
                  .
                </p>
                <p className="text-[13px] text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <Link
                    href={
                      isMobileSource
                        ? "/auth/signup?source=mobile"
                        : "/auth/signup"
                    }
                    className="text-foreground font-medium hover:underline"
                  >
                    S'inscrire
                  </Link>{" "}
                  ou{" "}
                  <Link
                    href="/"
                    className="text-foreground font-medium hover:underline"
                  >
                    en savoir plus
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
