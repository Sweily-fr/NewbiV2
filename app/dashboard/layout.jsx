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

  // Hook pour valider la session et détecter les révocations
  useSessionValidator();

  // 🔒 Protection abonnement : rediriger vers onboarding si pas d'abonnement actif
  useEffect(() => {
    // Attendre l'hydratation et l'initialisation du layout
    if (!isHydrated || !layoutInitialized || subscriptionLoading) return;

    // Ne pas rediriger si on revient de Stripe (vérification du paiement en cours)
    const urlParams = new URLSearchParams(window.location.search);
    const isReturningFromStripe =
      urlParams.get("session_id") ||
      urlParams.get("subscription_success") === "true" ||
      urlParams.get("payment_success") === "true";

    if (isReturningFromStripe) {
      console.log("🔄 [DASHBOARD] Retour de Stripe, attente de la vérification...");
      return;
    }

    // Vérifier si l'utilisateur a un abonnement actif
    const hasActiveSubscription = isActive();

    if (!hasActiveSubscription) {
      console.log("⚠️ [DASHBOARD] Pas d'abonnement actif, redirection vers onboarding");
      router.push("/onboarding");
    }
  }, [isHydrated, layoutInitialized, subscriptionLoading, isActive, router]);

  // Initialiser ActivityTracker au montage (une seule fois)
  useEffect(() => {
    initializeActivityTracker();
  }, []);

  // Hook pour gérer la déconnexion automatique après inactivité
  // Le timeout est maintenant géré par ActivityTracker (60 min = 1 heure)
  // qui prend en compte les appels API + les événements DOM
  useInactivityTimer(60, true);

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
          <div className="@container/main flex flex-1 flex-col gap-2">
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
        onClose={() => setIsOnboardingOpen(false)}
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

export default function DashboardLayout({ children }) {
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
