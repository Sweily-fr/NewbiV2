"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SignatureSidebar } from "@/src/components/signature-sidebar";
import { CommunitySidebar } from "@/src/components/community-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { SearchCommand } from "@/src/components/search-command";
import {
  SignatureProvider,
  useSignatureData,
} from "@/src/hooks/use-signature-data";
import { TrialBanner } from "@/src/components/trial-banner";
import { PricingModal } from "@/src/components/pricing-modal";
import OnboardingModal from "@/src/components/onboarding-modal";
import {
  DashboardLayoutProvider,
  useOnboarding,
  useDashboardLayoutContext,
} from "@/src/contexts/dashboard-layout-context";
import { CacheDebugPanel } from "@/src/components/cache-debug-panel";
import { SiteHeaderSkeleton } from "@/src/components/site-header-skeleton";
import { useInactivityTimer } from "@/src/hooks/useInactivityTimer";
import { useSessionValidator } from "@/src/hooks/useSessionValidator";
import { authClient } from "@/src/lib/auth-client";
import { SubscriptionSuccessModal } from "@/src/components/subscription-success-modal";
import { SettingsModal } from "@/src/components/settings-modal";

// Composant interne qui utilise le contexte
function DashboardContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSignaturePage = pathname === "/dashboard/outils/signatures-mail/new";
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCommunitySidebarOpen, setIsCommunitySidebarOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("notifications");

  // Hook pour gérer l'onboarding et les données du layout
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    isLoading: onboardingLoading,
    isInitialized: layoutInitialized,
  } = useOnboarding();

  // Hook pour vérifier le statut de l'abonnement
  const { isActive } = useDashboardLayoutContext();

  // Hook pour valider la session et détecter les révocations
  useSessionValidator();

  // Hook pour gérer la déconnexion automatique après 15 minutes d'inactivité
  useInactivityTimer(15, true);

  // Vérification de l'authentification côté client (après hydratation)
  useEffect(() => {
    // Attendre l'hydratation pour éviter les erreurs d'hydratation
    if (!isHydrated) return;

    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();

        if (!session?.data?.user) {
          // Pas de session, rediriger vers la page de connexion
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router, isHydrated]);

  // Protection contre l'erreur d'hydratation
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Déterminer si on est sur une page d'outil qui nécessite la sidebar fermée
  const isToolPage =
    pathname.includes("/dashboard/outils/") &&
    (pathname.includes("/new") ||
      pathname.includes("/nouveau") ||
      pathname.includes("/edit") ||
      pathname.includes("/editer") ||
      pathname.includes("/view") ||
      pathname.includes("/avoir/"));

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

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <AppSidebar
        variant="inset"
        onCommunityClick={() => {
          // Ouvrir la sidebar communautaire uniquement si l'utilisateur a un plan Pro
          if (isActive()) {
            setIsCommunitySidebarOpen(true);
          }
        }}
        onOpenNotifications={() => {
          setSettingsInitialTab("notifications");
          setSettingsModalOpen(true);
        }}
      />
      <SidebarInset className="md:pt-0 pt-10">
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
          editingSignatureId={signatureContextData.editingSignatureId}
        />
      )}
      <SearchCommand />

      {/* Modal de pricing pour upgrade - DÉSACTIVÉ car géré dans chaque page */}
      {/* <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      /> */}

      {/* Modal d'onboarding pour les nouveaux utilisateurs */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={completeOnboarding}
      />

      {/* Sidebar communautaire */}
      <CommunitySidebar
        open={isCommunitySidebarOpen}
        onOpenChange={setIsCommunitySidebarOpen}
      />

      {/* Modal de succès d'abonnement */}
      <SubscriptionSuccessModal />

      {/* Modal de paramètres avec notifications */}
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab={settingsInitialTab}
      />

      {/* Bouton de test pour le modal (à retirer en production) */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => {
            window.history.pushState({}, "", "/dashboard?subscription_success=true&payment_success=true");
            window.location.reload();
          }}
          className="fixed bottom-4 right-4 z-50 bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-medium"
        >
          Test Modal Success
        </button>
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
    return <SignatureProvider>{content}</SignatureProvider>;
  }

  // Sinon, rendu normal avec le provider de layout
  return content;
}
