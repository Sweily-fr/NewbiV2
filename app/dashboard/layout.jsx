"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SignatureSidebar } from "@/src/components/signature-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { SearchCommand } from "@/src/components/search-command";
import { SignatureProvider, useSignatureData } from "@/src/hooks/use-signature-data";
import { TrialBanner } from "@/src/components/trial-banner";
import { PricingModal } from "@/src/components/pricing-modal";
import OnboardingModal from "@/src/components/onboarding-modal";
import { DashboardLayoutProvider, useOnboarding, useDashboardLayoutContext } from "@/src/contexts/dashboard-layout-context";
import { CacheDebugPanel } from "@/src/components/cache-debug-panel";
import { SiteHeaderSkeleton } from "@/src/components/site-header-skeleton";

// Composant interne qui utilise le contexte
function DashboardContent({ children }) {
  const pathname = usePathname();
  const isSignaturePage = pathname === "/dashboard/outils/signatures-mail/new";
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Hook pour gérer l'onboarding et les données du layout
  const { 
    isOnboardingOpen, 
    setIsOnboardingOpen, 
    completeOnboarding, 
    isLoading: onboardingLoading,
    isInitialized: layoutInitialized
  } = useOnboarding();

  // Protection contre l'erreur d'hydratation
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Déterminer si on est sur une page d'outil qui nécessite la sidebar fermée
  const isToolPage = pathname.includes("/dashboard/outils/") && 
    (pathname.includes("/new") || pathname.includes("/edit") || pathname.includes("/view"));
  
  // État pour contrôler l'ouverture de la sidebar
  const [sidebarOpen, setSidebarOpen] = useState(!isToolPage);
  
  // Mettre à jour l'état de la sidebar quand le pathname change
  useEffect(() => {
    setSidebarOpen(!isToolPage);
  }, [isToolPage]);
  
  // Désactiver complètement le banner - remplacé par le compteur dans le header
  const showTrialBanner = false;
  
  // Utiliser les données de signature si on est sur la page de signature
  let signatureContextData = null;
  try {
    signatureContextData = useSignatureData();
  } catch {
    // Pas de contexte disponible, c'est normal si on n'est pas sur la page de signature
  }

  // Afficher un loader pendant l'hydratation
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar variant="inset" />
      <SidebarInset className="font-polysans font-light md:pt-0 pt-10">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          {showTrialBanner && (
            <div className="p-4 pb-0">
              <TrialBanner 
                onUpgrade={() => setIsPricingModalOpen(true)}
                onStartTrial={() => {
                  // Le hook useTrial gère automatiquement le démarrage
                  console.log("Période d'essai démarrée");
                }}
              />
            </div>
          )}
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
      {isSignaturePage && signatureContextData && (
        <SignatureSidebar 
          signatureData={signatureContextData.signatureData}
          updateSignatureData={signatureContextData.updateSignatureData}
        />
      )}
      <SearchCommand />
      
      {/* Modal de pricing pour upgrade */}
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
      />
      
      {/* Modal d'onboarding pour les nouveaux utilisateurs */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={completeOnboarding}
      />
      
      {/* Panel de debug du cache (développement uniquement) */}
      {process.env.NODE_ENV === 'development' && (
        <CacheDebugPanel />
      )}
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const isSignaturePage = pathname === "/dashboard/outils/signatures-mail/new";

  // Wrapper avec le provider de layout optimisé
  const content = (
    <DashboardLayoutProvider>
      <DashboardContent>{children}</DashboardContent>
    </DashboardLayoutProvider>
  );

  // Si on est sur la page de signature, ajouter le provider de signature
  if (isSignaturePage) {
    return (
      <SignatureProvider>
        {content}
      </SignatureProvider>
    );
  }

  // Sinon, rendu normal avec le provider de layout
  return content;
}
