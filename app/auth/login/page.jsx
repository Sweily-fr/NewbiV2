"use client";

import * as React from "react";

import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import LoginForm from "./loginForm";
import { signInGoogle } from "@/src/lib/auth/api";
import router from "next/router";
import { signIn } from "../../../src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const Logo = ({ className }) => {
  return (
    <svg
      viewBox="0 0 78 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-auto", className)}
    >
      <path
        d="M3 0H5V18H3V0ZM13 0H15V18H13V0ZM18 3V5H0V3H18ZM0 15V13H18V15H0Z"
        fill="url(#logo-gradient)"
      />
      <path
        d="M27.06 7.054V12.239C27.06 12.5903 27.1393 12.8453 27.298 13.004C27.468 13.1513 27.7513 13.225 28.148 13.225H29.338V14.84H27.808C26.9353 14.84 26.2667 14.636 25.802 14.228C25.3373 13.82 25.105 13.157 25.105 12.239V7.054H24V5.473H25.105V3.144H27.06V5.473H29.338V7.054H27.06ZM30.4782 10.114C30.4782 9.17333 30.6709 8.34033 31.0562 7.615C31.4529 6.88967 31.9855 6.32867 32.6542 5.932C33.3342 5.524 34.0822 5.32 34.8982 5.32C35.6349 5.32 36.2752 5.46733 36.8192 5.762C37.3745 6.04533 37.8165 6.40233 38.1452 6.833V5.473H40.1002V14.84H38.1452V13.446C37.8165 13.888 37.3689 14.2563 36.8022 14.551C36.2355 14.8457 35.5895 14.993 34.8642 14.993C34.0595 14.993 33.3229 14.789 32.6542 14.381C31.9855 13.9617 31.4529 13.3837 31.0562 12.647C30.6709 11.899 30.4782 11.0547 30.4782 10.114ZM38.1452 10.148C38.1452 9.502 38.0092 8.941 37.7372 8.465C37.4765 7.989 37.1309 7.62633 36.7002 7.377C36.2695 7.12767 35.8049 7.003 35.3062 7.003C34.8075 7.003 34.3429 7.12767 33.9122 7.377C33.4815 7.615 33.1302 7.972 32.8582 8.448C32.5975 8.91267 32.4672 9.468 32.4672 10.114C32.4672 10.76 32.5975 11.3267 32.8582 11.814C33.1302 12.3013 33.4815 12.6753 33.9122 12.936C34.3542 13.1853 34.8189 13.31 35.3062 13.31C35.8049 13.31 36.2695 13.1853 36.7002 12.936C37.1309 12.6867 37.4765 12.324 37.7372 11.848C38.0092 11.3607 38.1452 10.794 38.1452 10.148ZM43.6317 4.232C43.2803 4.232 42.9857 4.113 42.7477 3.875C42.5097 3.637 42.3907 3.34233 42.3907 2.991C42.3907 2.63967 42.5097 2.345 42.7477 2.107C42.9857 1.869 43.2803 1.75 43.6317 1.75C43.9717 1.75 44.2607 1.869 44.4987 2.107C44.7367 2.345 44.8557 2.63967 44.8557 2.991C44.8557 3.34233 44.7367 3.637 44.4987 3.875C44.2607 4.113 43.9717 4.232 43.6317 4.232ZM44.5837 5.473V14.84H42.6457V5.473H44.5837ZM49.0661 2.26V14.84H47.1281V2.26H49.0661ZM50.9645 10.114C50.9645 9.17333 51.1572 8.34033 51.5425 7.615C51.9392 6.88967 52.4719 6.32867 53.1405 5.932C53.8205 5.524 54.5685 5.32 55.3845 5.32C56.1212 5.32 56.7615 5.46733 57.3055 5.762C57.8609 6.04533 58.3029 6.40233 58.6315 6.833V5.473H60.5865V14.84H58.6315V13.446C58.3029 13.888 57.8552 14.2563 57.2885 14.551C56.7219 14.8457 56.0759 14.993 55.3505 14.993C54.5459 14.993 53.8092 14.789 53.1405 14.381C52.4719 13.9617 51.9392 13.3837 51.5425 12.647C51.1572 11.899 50.9645 11.0547 50.9645 10.114ZM58.6315 10.148C58.6315 9.502 58.4955 8.941 58.2235 8.465C57.9629 7.989 57.6172 7.62633 57.1865 7.377C56.7559 7.12767 56.2912 7.003 55.7925 7.003C55.2939 7.003 54.8292 7.12767 54.3985 7.377C53.9679 7.615 53.6165 7.972 53.3445 8.448C53.0839 8.91267 52.9535 9.468 52.9535 10.114C52.9535 10.76 53.0839 11.3267 53.3445 11.814C53.6165 12.3013 53.9679 12.6753 54.3985 12.936C54.8405 13.1853 55.3052 13.31 55.7925 13.31C56.2912 13.31 56.7559 13.1853 57.1865 12.936C57.6172 12.6867 57.9629 12.324 58.2235 11.848C58.4955 11.3607 58.6315 10.794 58.6315 10.148ZM65.07 6.833C65.3533 6.357 65.7273 5.98867 66.192 5.728C66.668 5.456 67.229 5.32 67.875 5.32V7.326H67.382C66.6227 7.326 66.0447 7.51867 65.648 7.904C65.2627 8.28933 65.07 8.958 65.07 9.91V14.84H63.132V5.473H65.07V6.833ZM73.3624 10.165L77.6804 14.84H75.0624L71.5944 10.811V14.84H69.6564V2.26H71.5944V9.57L74.9944 5.473H77.6804L73.3624 10.165Z"
        fill="currentColor"
      />
      <defs>
        <linearGradient
          id="logo-gradient"
          x1="10"
          y1="0"
          x2="10"
          y2="20"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B99FE" />
          <stop offset="1" stopColor="#2BC8B7" />
        </linearGradient>
      </defs>
    </svg>
  );
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
        console.error(`Erreur de connexion ${provider}:`, error);

        // Vérifier si c'est une erreur de compte désactivé
        if (error.message && error.message.includes("désactivé")) {
          toast.error(error.message);
        } else if (error.message && error.message.includes("réactivation")) {
          toast.error(error.message);
        } else {
          toast.error(`Erreur lors de la connexion avec ${provider}`);
        }
        throw error;
      },
    }
  );
};

export default function LoginPage() {
  const seoData = {
    ...useAuthSEO("login"),
    robots: "noindex,nofollow",
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
                Connectez-vous
              </h3>
              <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
                Vous n'avez pas de compte ?{" "}
                <Link
                  href="/auth/signup"
                  className="font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
                >
                  Inscription
                </Link>
              </p>
              <div className="mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full items-center justify-center cursor-pointer"
                  onClick={() => signInWithProvider("google")}
                >
                  <GoogleIcon className="size-4" aria-hidden={true} />
                  Connexion avec Google
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

              <LoginForm />
              <p className="mt-6 text-sm text-muted-foreground dark:text-muted-foreground">
                Mot de passe oublié?{" "}
                <Link
                  href="/auth/forget-password"
                  className="font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
                >
                  Réinitialiser mot de passe
                </Link>
              </p>
            </div>
          </div>
          <div className="w-1/2 p-2 flex items-center min-h-screen justify-center">
            <div className="flex p-5 items-center justify-center w-full h-full rounded-lg bg-[#5A50FF]/30 relative">
              <div className="bg-white/80 shadow-md rounded-2xl p-6 w-110 mx-auto">
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
                Connexion
              </h3>

              <Button
                variant="outline"
                size="lg"
                className="w-full items-center justify-center cursor-pointer"
                onClick={() => signInWithProvider("google")}
              >
                <GoogleIcon className="size-4" aria-hidden={true} />
                Connexion avec Google
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <LoginForm />

              <p className="mt-4 text-sm text-muted-foreground text-center">
                <Link
                  href="/auth/forget-password"
                  className="font-medium text-primary hover:text-primary/90"
                >
                  Mot de passe oublié ?
                </Link>
              </p>
            </div>
          </div>

          {/* Footer en bas */}
          <div className="pb-6 px-6 text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Vous n'avez pas de compte ?{" "}
              <Link
                href="/auth/signup"
                className="font-medium text-primary hover:text-primary/90"
              >
                Inscription
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
