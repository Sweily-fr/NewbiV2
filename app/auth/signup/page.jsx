"use client";

import * as React from "react";

import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { signIn } from "../../../src/lib/auth-client";
import RegisterForm from "./registerForm";
import Link from "next/link";
import { toast } from "@/src/components/ui/sonner";
import { Typewriter } from "@/src/components/ui/typewriter-text";
import { CircleArrowUp } from "lucide-react";
import SEOHead from "@/src/components/seo/seo-head";
import { JsonLd } from "@/src/components/seo/seo-metadata";
import { useAuthSEO } from "@/src/hooks/use-seo";

const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function SignUpPage() {
  const seoData = {
    ...useAuthSEO("signup"),
    robots: "noindex,nofollow",
  };

  const signInWithProvider = async (provider) => {
    // Vider tous les caches avant la connexion OAuth
    try {
      console.log("🧹 Nettoyage des caches avant connexion OAuth...");

      // Vider le cache utilisateur
      localStorage.removeItem("user-cache");

      // Vider tous les caches d'abonnement (on ne connaît pas l'ID à l'avance)
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("subscription-")) {
          localStorage.removeItem(key);
          console.log(`🗑️ Cache supprimé: ${key}`);
        }
      });

      console.log("✅ Caches nettoyés avec succès");
    } catch (error) {
      console.warn("⚠️ Erreur lors du nettoyage des caches:", error);
    }

    await signIn.social(
      { provider, callbackURL: "/dashboard" },
      {
        onSuccess: () => {
          toast.success(`Vous etes connecté avec ${provider}`);
        },
        onError: (error) => {
          toast.error(`Erreur lors de la connexion avec ${provider}`);
          throw error;
        },
      }
    );
  };

  return (
    <>
      <SEOHead {...seoData} />
      <JsonLd jsonLd={seoData.jsonLd} />
      <main>
        {/* Desktop Layout */}
        <div className="hidden md:flex h-screen">
          <div className="w-1/2 flex items-center justify-center p-8">
            <div className="mx-auto sm:max-w-md w-full">
              <h3 className="text-3xl font-medium text-foreground dark:text-foreground">
                Inscrivez-vous
              </h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
                >
                  Se connecter
                </Link>
              </p>
              <div className="mt-8">
                <Button
                  variant="outline"
                  className="w-full items-center justify-center"
                  onClick={() => signInWithProvider("google")}
                  asChild
                >
                  <a href="#">
                    <GoogleIcon className="size-4" aria-hidden={true} />
                    <span className="text-sm font-medium">
                      Connexion avec Google
                    </span>
                  </a>
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    ou
                  </span>
                </div>
              </div>

              <RegisterForm />
            </div>
          </div>
          <div className="w-1/2 p-2 flex items-center min-h-screen justify-center">
            <div
              className="flex p-5 items-center justify-center w-full h-full rounded-lg bg-[#5A50FF]/30 relative"
              style={{
                transform: "rotate(180deg)",
              }}
            >
              <div
                className="bg-white/80 shadow-md rounded-2xl p-6 w-110 mx-auto"
                style={{ transform: "rotate(180deg)" }}
              >
                <div className="text-lg min-h-[27px] flex items-center justify-between">
                  <div className="flex-1">
                    <Typewriter
                      text={[
                        "Créez votre compte en quelques secondes.",
                        "Rejoignez notre communauté.",
                        "Commencez votre aventure dès maintenant.",
                      ]}
                      speed={30}
                      deleteSpeed={30}
                      delay={2000}
                      loop={true}
                      className="font-medium text-left text-[#1C1C1C] text-[15px]"
                    />
                  </div>
                  <CircleArrowUp className="ml-4 text-[#1C1C1C] flex-shrink-0" />
                </div>
              </div>
              <img
                src="/ni.svg"
                alt="Newbi Logo"
                className="absolute bottom-2 right-3 w-5 h-auto filter brightness-0 invert"
                style={{ opacity: 0.9 }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden min-h-screen bg-background flex flex-col">
          {/* Logo en haut centré */}
          <div className="pt-10 flex justify-center">
            <img src="/newbiLetter.png" alt="Newbi" className="h-5 w-auto object-contain" />
          </div>

          {/* Contenu centré verticalement */}
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-sm">
              <h3 className="text-2xl font-medium text-foreground text-center mb-8">
                Inscription
              </h3>

              <Button
                variant="outline"
                size="lg"
                className="w-full items-center justify-center cursor-pointer"
                onClick={() => signInWithProvider("google")}
              >
                <GoogleIcon className="size-4" aria-hidden={true} />
                Inscription avec Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <RegisterForm />
            </div>
          </div>

          {/* Footer en bas */}
          <div className="pb-6 px-6 text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary/90"
              >
                Se connecter
              </Link>
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              En continuant, vous acceptez nos{" "}
              <Link href="/mentions-legales" className="underline">Conditions générales</Link>
              {" "}et{" "}
              <Link href="/politique-confidentialite" className="underline">Politique de confidentialité</Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
