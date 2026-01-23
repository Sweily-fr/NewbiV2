"use client";
import React, { Suspense, useState, useEffect } from "react";
import { Separator } from "@/src/components/ui/separator";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { TrialCounter } from "@/src/components/trial-counter";
import { EmailVerificationBadgeHeader } from "@/src/components/email-verification-badge-header";
import { OrganizationSwitcherHeader } from "@/src/components/organization-switcher-header";
import { authClient } from "@/src/lib/auth-client";

function SiteHeaderContent() {
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  // Vérifier l'état de vérification de l'email
  useEffect(() => {
    const checkEmailVerification = async () => {
      try {
        const { data: session } = await authClient.getSession();
        setIsEmailVerified(session?.user?.emailVerified ?? true);
      } catch (error) {
        console.error("Erreur vérification email:", error);
        setIsEmailVerified(true); // Par défaut, pas de fond amber en cas d'erreur
      }
    };

    checkEmailVerification();

    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkEmailVerification, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={`flex h-10 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear sticky top-0 z-30 w-full ${!isEmailVerified ? "bg-amber-500/10 dark:bg-amber-500/10" : "bg-background"}`}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* Sélecteur d'organisation style Supabase */}
        <OrganizationSwitcherHeader />
        <EmailVerificationBadgeHeader />
        <div className="ml-auto flex items-center gap-2">
          {/* <SignatureSaveButton /> */}
          <TrialCounter />
          {/* <ModeToggle /> */}
        </div>
      </div>
    </header>
  );
}

// Composant de fallback pour le loading
function SiteHeaderFallback() {
  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear sticky top-0 z-30 bg-background w-full">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-sm bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <TrialCounter />
        </div>
      </div>
    </header>
  );
}

// Composant principal avec Suspense
export function SiteHeader() {
  return (
    <Suspense fallback={<SiteHeaderFallback />}>
      <SiteHeaderContent />
    </Suspense>
  );
}
