"use client";

import React, { useCallback, useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import {
  DashboardLayoutProvider,
  useOnboarding,
  useDashboardLayoutContext,
} from "@/src/contexts/dashboard-layout-context";
import { OrgActivationHandler } from "@/src/components/org-activation-handler";
import { StripeConnectUrlHandler } from "@/src/components/stripe-connect-url-handler";
import { ReconciliationToastProvider } from "@/src/components/reconciliation/ReconciliationToast";
import { PurchaseInvoiceReconciliationToastProvider } from "@/src/components/reconciliation/PurchaseInvoiceReconciliationToast";
import {
  ToastProvider,
  ToastManagerInitializer,
} from "@/src/components/ui/toast-manager";
import { AccountingViewProvider } from "@/src/contexts/accounting-view-context";
import { FloatingTimer } from "@/src/components/FloatingTimer";
import { SubscriptionReadOnlyBanner } from "@/src/components/subscription-readonly-banner";
import { TrialBanner } from "@/src/components/trial-banner";
// Panneau DEV de test d'abonnement — décommenter aussi son rendu plus bas pour l'activer.
// import { DevSubscriptionSwitcher } from "@/src/components/dev/dev-subscription-switcher";
import { OAuthCallbackHandler } from "@/src/components/oauth-callback-handler";
// DÉSACTIVÉ: SuperPDP API pas encore active
// import { EInvoicingPromoModal } from "@/src/components/e-invoicing-promo-modal";
import { TutorialProvider } from "@/src/contexts/tutorial-context";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { SessionGateProvider } from "@/src/contexts/session-gate-context";
import { InactivityDetector } from "@/src/components/inactivity-detector";
import { SessionValidityDetector } from "@/src/components/session-validity-detector";
import { OrgChangeCrossTabDetector } from "@/src/components/org-change-cross-tab-detector";
import { ModuleRouteGuard } from "@/src/components/rbac/ModuleRouteGuard";

// Composants lourds ou rarement affichés : chargés dans leur propre chunk pour
// alléger le bundle commun du dashboard (payé sur chaque page).
const SettingsModal = dynamic(
  () => import("@/src/components/settings-modal").then((m) => m.SettingsModal),
  { ssr: false },
);
const SearchCommand = dynamic(
  () => import("@/src/components/search-command").then((m) => m.SearchCommand),
  { ssr: false },
);
const CommunitySidebar = dynamic(
  () =>
    import("@/src/components/community-sidebar").then(
      (m) => m.CommunitySidebar,
    ),
  { ssr: false },
);
const ProSubscriptionOverlayHandler = dynamic(
  () =>
    import("@/src/components/pro-subscription-overlay-handler").then(
      (m) => m.ProSubscriptionOverlayHandler,
    ),
  { ssr: false },
);
const TutorialOverlay = dynamic(
  () =>
    import("@/src/components/tutorial/tutorial-overlay").then(
      (m) => m.TutorialOverlay,
    ),
  { ssr: false },
);
// Barre de navigation et bannière d'installation : téléphone et petite
// tablette seulement (la barre est masquée en CSS au-delà de 768 px).
const BottomNavBar = dynamic(
  () => import("@/src/components/bottom-nav-bar").then((m) => m.BottomNavBar),
  { ssr: false },
);
const PwaInstallBanner = dynamic(
  () =>
    import("@/src/components/pwa-install-banner").then(
      (m) => m.PwaInstallBanner,
    ),
  { ssr: false },
);

// Composant interne qui utilise le contexte
function DashboardContent({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const isMobile = useIsMobile();
  const [isCommunitySidebarOpen, setIsCommunitySidebarOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState("notifications");

  // Les chunks de la modale de paramètres (~11 000 lignes de sections) et de
  // la sidebar communautaire ne sont téléchargés qu'à la première ouverture.
  const [settingsEverOpened, setSettingsEverOpened] = useState(false);
  useEffect(() => {
    if (settingsModalOpen) setSettingsEverOpened(true);
  }, [settingsModalOpen]);
  const [communityEverOpened, setCommunityEverOpened] = useState(false);
  useEffect(() => {
    if (isCommunitySidebarOpen) setCommunityEverOpened(true);
  }, [isCommunitySidebarOpen]);
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
  const {
    isActive,
    subscription,
    isLoading: subscriptionLoading,
  } = useDashboardLayoutContext();

  // Welcome animation (zoom-in after onboarding)
  const [welcomeAnim, setWelcomeAnim] = useState(false);
  const [welcomeReady, setWelcomeReady] = useState(false);

  // Protection contre l'erreur d'hydratation
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Detect ?welcome=true and trigger zoom animation
  useEffect(() => {
    if (!isHydrated) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "true") {
      setWelcomeAnim(true);
      // Remove the param from URL without reload
      params.delete("welcome");
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      // Wait for the page to fully paint at the zoomed-in state, then animate out
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => setWelcomeReady(true), 300);
        });
      });
    }
  }, [isHydrated]);

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
      pathname.includes("/avoir/") ||
      // Éditeur de signature de mail : /signatures-mail/<id>
      /\/dashboard\/outils\/signatures-mail\/[^/]+$/.test(pathname));

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

  // Sauvegarder l'état dans localStorage à chaque changement.
  // Mémoïsé : cette fonction est une dépendance du contextValue de
  // SidebarProvider ; une identité instable re-rendait toute la sidebar
  // (~40 composants) à chaque render de DashboardContent.
  const handleSidebarChange = useCallback(
    (open) => {
      setSidebarOpen(open);
      if (typeof window !== "undefined" && !isToolPage) {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
      }
    },
    [isToolPage],
  );

  // Forcer la sidebar fermée sur les pages d'outils
  useEffect(() => {
    if (isToolPage) {
      setSidebarOpen(false);
    }
  }, [isToolPage]);

  return (
    <div
      style={
        welcomeAnim
          ? {
              transform: welcomeReady ? "scale(1)" : "scale(1.15)",
              opacity: welcomeReady ? 1 : 0,
              transition: welcomeReady
                ? "transform 1.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1)"
                : "none",
              transformOrigin: "center center",
            }
          : undefined
      }
    >
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
          <SubscriptionReadOnlyBanner
            onSubscribe={() => {
              setSettingsInitialTab("subscription");
              setSettingsModalOpen(true);
            }}
          />
          <TrialBanner
            onSubscribe={() => {
              setSettingsInitialTab("subscription");
              setSettingsModalOpen(true);
            }}
          />
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex flex-1 flex-col gap-2 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
              <SessionGateProvider>
                <ModuleRouteGuard>{children}</ModuleRouteGuard>
              </SessionGateProvider>
              <InactivityDetector />
              <SessionValidityDetector />
              <OrgChangeCrossTabDetector />
            </div>
          </div>
        </SidebarInset>

        <SearchCommand />

        {/* Modal de pricing pour upgrade - DÉSACTIVÉ car géré dans chaque page */}
        {/* <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      /> */}

        {/* Modal d'onboarding — désactivé, géré par le nouvel onboarding /auth/signup */}
        {/* <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={completeOnboarding}
        onComplete={completeOnboarding}
      /> */}

        {/* Sidebar communautaire */}
        {communityEverOpened && (
          <CommunitySidebar
            open={isCommunitySidebarOpen}
            onOpenChange={setIsCommunitySidebarOpen}
          />
        )}

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
        {settingsEverOpened && (
          <SettingsModal
            open={settingsModalOpen}
            onOpenChange={setSettingsModalOpen}
            initialTab={settingsInitialTab}
          />
        )}

        {/* Panneau DEV pour tester l'abonnement (Supprimer / Synchroniser /
            Remettre). Désactivé — décommenter la ligne ci-dessous ET l'import
            en haut du fichier pour le réafficher quand on en a besoin. */}
        {/* <DevSubscriptionSwitcher /> */}

        {/* Timer flottant - visible sur toutes les pages quand un timer est actif */}
        <FloatingTimer />

        {/* Popup de blocage retirée : en lecture seule, la bannière "Expiré"
            suffit et l'utilisateur peut naviguer librement. */}

        {/* DÉSACTIVÉ: SuperPDP API pas encore active */}
        {/* Modal de promotion facturation électronique */}
        {/* <EInvoicingPromoModal
        open={eInvoicingPromoOpen}
        onOpenChange={setEInvoicingPromoOpen}
      /> */}

        {/* Tutoriel interactif */}
        <TutorialOverlay />

        {/* PWA install banner — mobile uniquement */}
        {isMobile && <PwaInstallBanner />}

        {/* Bottom Navigation Bar — mobile uniquement */}
        {isMobile && !settingsModalOpen && (
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
      </SidebarProvider>
    </div>
  );
}

export default function DashboardClientLayout({ children }) {
  return (
    <DashboardLayoutProvider>
      <AccountingViewProvider>
        <TutorialProvider>
          <ToastProvider>
            <ToastManagerInitializer />
            <ReconciliationToastProvider>
              <PurchaseInvoiceReconciliationToastProvider>
                <DashboardContent>{children}</DashboardContent>
              </PurchaseInvoiceReconciliationToastProvider>
            </ReconciliationToastProvider>
          </ToastProvider>
        </TutorialProvider>
      </AccountingViewProvider>
    </DashboardLayoutProvider>
  );
}
