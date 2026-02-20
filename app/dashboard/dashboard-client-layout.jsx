"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { CommunitySidebar } from "@/src/components/community-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { SearchCommand } from "@/src/components/search-command";
import { SignatureProvider } from "@/src/hooks/use-signature-data";
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
import { initializeActivityTracker } from "@/src/lib/activityTracker";
import { ProSubscriptionOverlayHandler } from "@/src/components/pro-subscription-overlay-handler";
import { SettingsModal } from "@/src/components/settings-modal";
import { OrgActivationHandler } from "@/src/components/org-activation-handler";
import { StripeConnectUrlHandler } from "@/src/components/stripe-connect-url-handler";
import { ReconciliationToastProvider } from "@/src/components/reconciliation/ReconciliationToast";
import {
  ToastProvider,
  ToastManagerInitializer,
} from "@/src/components/ui/toast-manager";
import { AccountingViewProvider } from "@/src/contexts/accounting-view-context";
import { FloatingTimer } from "@/src/components/FloatingTimer";
import { OAuthCallbackHandler } from "@/src/components/oauth-callback-handler";
// DÉSACTIVÉ: SuperPDP API pas encore active
// import { EInvoicingPromoModal } from "@/src/components/e-invoicing-promo-modal";
import { TutorialProvider } from "@/src/contexts/tutorial-context";
import { TutorialOverlay } from "@/src/components/tutorial/tutorial-overlay";
import { SignatureSidebarRight } from "@/src/components/signature-sidebar-right";
import { BottomNavBar } from "@/src/components/bottom-nav-bar";
import { PwaInstallBanner } from "@/src/components/pwa-install-banner";

// Composant interne qui utilise le contexte
function DashboardContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isSignaturePage = pathname?.startsWith(
    "/dashboard/outils/signatures-mail/new"
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCommunitySidebarOpen, setIsCommunitySidebarOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("notifications");
  // DÉSACTIVÉ: SuperPDP API pas encore active
  // const [eInvoicingPromoOpen, setEInvoicingPromoOpen] = useState(false);

  // Hook pour gérer l'onboarding et les données du layout
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    isLoading: onboardingLoading,
    isInitialized: layoutInitialized,
  } = useOnboarding();

  // Hook pour vérifier le statut de l'abonnement
  const { isActive, subscription, isLoading: subscriptionLoading } = useDashboardLayoutContext();

  const isDev = process.env.NODE_ENV === "development";

  // ✅ IMPORTANT: Initialiser ActivityTracker EN PREMIER pour que les event listeners
  // d'activité (visibilitychange, focus) soient enregistrés AVANT ceux de useSessionValidator.
  // Cela garantit que lastActivityTimestamp est mis à jour AVANT la validation de session
  // quand l'utilisateur revient sur l'onglet.
  useEffect(() => {
    if (!isDev) {
      initializeActivityTracker();
    }
  }, [isDev]);

  // Hook pour valider la session et détecter les révocations
  // Désactivé en développement pour éviter les redirections lors du hot-reload
  useSessionValidator(!isDev);

  // Hook pour gérer la déconnexion automatique après inactivité
  // Le timeout est maintenant géré par ActivityTracker (60 min = 1 heure)
  // qui prend en compte les appels API + les événements DOM
  // Désactivé en développement
  useInactivityTimer(60, !isDev);

  // Protection contre l'erreur d'hydratation
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // DÉSACTIVÉ: SuperPDP API pas encore active
  // Afficher le modal de facturation électronique automatiquement après connexion
  // si l'utilisateur a un abonnement actif et n'a pas encore vu le modal
  // useEffect(() => {
  //   if (!isHydrated || !layoutInitialized) return;

  //   const E_INVOICING_PROMO_KEY = "e_invoicing_promo_shown";
  //   const hasSeenPromo = localStorage.getItem(E_INVOICING_PROMO_KEY);

  //   if (isActive() && !hasSeenPromo && !isOnboardingOpen) {
  //     // Attendre un peu pour ne pas surcharger l'utilisateur
  //     const timer = setTimeout(() => {
  //       setEInvoicingPromoOpen(true);
  //       localStorage.setItem(E_INVOICING_PROMO_KEY, "true");
  //     }, 2000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [isHydrated, layoutInitialized, isActive, isOnboardingOpen]);

  // Déterminer si on est sur une page d'outil qui nécessite la sidebar fermée
  // Exception : la page de signature doit avoir la sidebar en mode rétréci (icon)
  const isToolPage =
    pathname.includes("/dashboard/outils/") &&
    (pathname.includes("/new") ||
      pathname.includes("/nouveau") ||
      pathname.includes("/edit") ||
      pathname.includes("/editer") ||
      pathname.includes("/view") ||
      pathname.includes("/avoir/")) &&
    !isSignaturePage; // Exception pour la page de signature

  // Clé localStorage pour persister l'état de la sidebar
  const SIDEBAR_STORAGE_KEY = "sidebar_collapsed";

  // Lire l'état initial depuis localStorage (false = rétrécie par défaut)
  const getInitialSidebarState = () => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    // Si pas de valeur stockée, retourner false (rétrécie par défaut)
    if (stored === null) return false;
    return stored === "true";
  };

  // État pour contrôler l'ouverture de la sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Charger l'état depuis localStorage après hydratation
  useEffect(() => {
    if (isHydrated && !isToolPage) {
      const storedState = getInitialSidebarState();
      setSidebarOpen(storedState);
    }
  }, [isHydrated, isToolPage]);

  // Sauvegarder l'état dans localStorage à chaque changement
  const handleSidebarChange = (open) => {
    setSidebarOpen(open);
    if (typeof window !== "undefined" && !isToolPage) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
    }
  };

  // Forcer la sidebar fermée sur les pages d'outils (sauf page de signature)
  useEffect(() => {
    if (isToolPage) {
      setSidebarOpen(false);
    } else if (isSignaturePage) {
      // Pour la page de signature, forcer en mode rétréci (false = collapsed)
      setSidebarOpen(false);
    }
  }, [isToolPage]);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={handleSidebarChange}>
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
        // DÉSACTIVÉ: SuperPDP API pas encore active
        // onOpenEInvoicingPromo={() => setEInvoicingPromoOpen(true)}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="@container/main flex flex-1 flex-col gap-2 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
            {children}
          </div>
        </div>
      </SidebarInset>

      {/* Sidebar droite miroir - Affichée uniquement sur la page de signature */}
      {isSignaturePage && <SignatureSidebarRight />}

      <SearchCommand />

      {/* Modal de pricing pour upgrade - DÉSACTIVÉ car géré dans chaque page */}
      {/* <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      /> */}

      {/* Modal d'onboarding pour les nouveaux utilisateurs */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={completeOnboarding}
        onComplete={completeOnboarding}
      />

      {/* Sidebar communautaire */}
      <CommunitySidebar
        open={isCommunitySidebarOpen}
        onOpenChange={setIsCommunitySidebarOpen}
      />

      {/* Animation de succès d'abonnement Pro */}
      <Suspense fallback={null}>
        <ProSubscriptionOverlayHandler />
      </Suspense>

      {/* Gestionnaire d'activation d'organisation après création */}
      <Suspense fallback={null}>
        <OrgActivationHandler />
      </Suspense>

      {/* Gestionnaire d'URL pour Stripe Connect */}
      <Suspense fallback={null}>
        <StripeConnectUrlHandler />
      </Suspense>

      {/* Gestionnaire de callback OAuth (SuperPDP, etc.) */}
      <Suspense fallback={null}>
        <OAuthCallbackHandler
          onOpenSettings={setSettingsModalOpen}
          onSetSettingsTab={setSettingsInitialTab}
        />
      </Suspense>

      {/* Modal de paramètres avec notifications */}
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab={settingsInitialTab}
      />

      {/* Timer flottant - visible sur toutes les pages quand un timer est actif */}
      <FloatingTimer />

      {/* DÉSACTIVÉ: SuperPDP API pas encore active */}
      {/* Modal de promotion facturation électronique */}
      {/* <EInvoicingPromoModal
        open={eInvoicingPromoOpen}
        onOpenChange={setEInvoicingPromoOpen}
      /> */}

      {/* Tutoriel interactif */}
      <TutorialOverlay />

      {/* PWA install banner — mobile uniquement */}
      <PwaInstallBanner />

      {/* Bottom Navigation Bar — mobile uniquement */}
      {!settingsModalOpen && (
        <BottomNavBar
          onOpenSettings={() => {
            setSettingsInitialTab("preferences");
            setSettingsModalOpen(true);
          }}
          onOpenNotifications={() => {
            setSettingsInitialTab("notifications");
            setSettingsModalOpen(true);
          }}
        />
      )}

      {/* Bouton de test pour le modal (à retirer en production) */}
      {/* {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => {
            window.history.pushState(
              {},
              "",
              "/dashboard?subscription_success=true&payment_success=true"
            );
            window.location.reload();
          }}
          className="fixed bottom-4 right-4 z-50 bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-medium"
        >
          Test Modal Success
        </button>
      )} */}
    </SidebarProvider>
  );
}

export default function DashboardClientLayout({ children }) {
  const pathname = usePathname();
  const isSignaturePage = pathname?.startsWith(
    "/dashboard/outils/signatures-mail/new"
  );

  // Wrapper avec le provider de layout optimisé
  const content = (
    <DashboardLayoutProvider>
      <AccountingViewProvider>
        <TutorialProvider>
          <ToastProvider>
            <ToastManagerInitializer />
            <ReconciliationToastProvider>
              <DashboardContent>{children}</DashboardContent>
            </ReconciliationToastProvider>
          </ToastProvider>
        </TutorialProvider>
      </AccountingViewProvider>
    </DashboardLayoutProvider>
  );

  // Si on est sur la page de signature, ajouter le provider de signature
  if (isSignaturePage) {
    return <SignatureProvider>{content}</SignatureProvider>;
  }

  // Sinon, rendu normal avec le provider de layout
  return content;
}
