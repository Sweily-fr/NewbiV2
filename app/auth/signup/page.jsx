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
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
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
        <div className="md:hidden min-h-screen bg-background flex items-center justify-center pb-8">
          <div className="w-full max-w-sm px-6">
            <img src="/ni2.png" alt="Newbi Logo" className="mb-2" width={30} />
            <h3 className="text-xl font-medium text-foreground mb-2">
              Inscrivez-vous
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Vous avez déjà un compte ?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary/90 underline"
              >
                Se connecter
              </Link>
            </p>

            <div className="mb-6">
              <Button
                variant="outline"
                className="w-full items-center justify-center cursor-pointer"
                onClick={() => signInWithProvider("google")}
              >
                <GoogleIcon className="size-4 mr-2" aria-hidden={true} />
                <span className="text-sm font-medium">Google</span>
              </Button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <RegisterForm />
            <p className="mt-4 text-sm py-2 text-muted-foreground text-center">
              {""}
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
