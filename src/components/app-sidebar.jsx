"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconRobot,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
  IconHeart,
  IconCalendar,
  IconCirclePlusFilled,
  GalleryVerticalEnd,
  AudioWaveform,
  Command,
} from "@tabler/icons-react";

import {
  CircleGauge,
  Calendar,
  Users,
  FileMinus,
  Search,
  MessageCircleQuestionMark,
  Bell,
  Landmark,
  FileText,
  ClipboardCheck,
  Receipt,
  ShoppingBasket,
  BarChart3,
  FolderOpen,
} from "lucide-react";

import { NavDocuments } from "@/src/components/nav-documents";
import { NavMain } from "@/src/components/nav-main";
import { NavSecondary } from "@/src/components/nav-secondary";
import { NavUser } from "@/src/components/nav-user";
import { SidebarViewTabs } from "@/src/components/sidebar-view-tabs";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useOrganizationType } from "@/src/hooks/useOrganizationType";
import { useAccountingView } from "@/src/contexts/accounting-view-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar";
import { getCurrentUser } from "../lib/auth/api";
import { useUser } from "../lib/auth/hooks";
import { TeamSwitcher } from "@/src/components/team-switcher";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { authClient } from "@/src/lib/auth-client";
import { useOrganizationInvitations } from "@/src/hooks/useOrganizationInvitations";
import { EmailVerificationBadge } from "@/src/components/email-verification-badge";
import { useActivityNotifications } from "@/src/hooks/useActivityNotifications";

const data = {
  teams: [
    {
      name: "Sweily",
      logo: IconUsers,
      plan: "Enterprise",
    },
    {
      name: "Newbi",
      logo: IconUsers,
      plan: "Startup",
    },
    {
      name: "Cabinet comptable",
      logo: IconUsers,
      plan: "Pro",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: CircleGauge,
    },
  ],
  navFinances: [
    {
      title: "Transactions",
      url: "/dashboard/outils/transactions",
    },
    {
      title: "Prévision",
      url: "/dashboard/outils/prevision",
    },
  ],
  navVentes: [
    {
      title: "Factures clients",
      url: "/dashboard/outils/factures",
    },
    {
      title: "Devis",
      url: "/dashboard/outils/devis",
    },
    {
      title: "Bons de commande",
      url: "/dashboard/outils/bons-commande",
    },
    {
      title: "Liste client (CRM)",
      url: "/dashboard/clients",
    },
    {
      title: "Catalogues",
      url: "/dashboard/catalogues",
    },
  ],
  navAfterVentes: [
    {
      title: "Factures d'achat",
      url: "/dashboard/outils/factures-achat",
      icon: ShoppingBasket,
    },
    {
      title: "Notifications",
      url: "#",
      icon: Bell,
      action: "openNotifications",
    },
    {
      title: "Calendrier",
      url: "/dashboard/calendar",
      icon: Calendar,
    },
  ],
  navProjets: [
    {
      title: "Kanban",
      url: "/dashboard/outils/kanban",
      isPro: false,
      hasKanbanBoards: true,
    },
  ],
  navDocuments: [
    {
      title: "Transfert de fichiers",
      url: "/dashboard/outils/transferts-fichiers",
    },
    {
      title: "Documents partagés",
      url: "/dashboard/outils/documents-partages",
    },
  ],
  navCommunication: [
    {
      title: "Signature de mail",
      url: "/dashboard/outils/signatures-mail",
      isPro: false,
    },
  ],
  navSecondary: [
    {
      title: "Recherche",
      url: "#",
      icon: Search,
    },
  ],
  // Navigation pour la vue Comptabilité (cabinets comptables)
  navAccounting: [
    {
      title: "Saisie",
      url: "/dashboard/comptabilite/saisie",
      icon: FileText,
      items: [
        {
          section: "Factures",
          items: [
            {
              title: "Factures fournisseurs",
              url: "/dashboard/comptabilite/saisie/factures-fournisseurs",
            },
            {
              title: "Factures clients",
              url: "/dashboard/comptabilite/saisie/factures-clients",
            },
          ],
        },
        {
          section: "Banque",
          items: [
            {
              title: "Transactions",
              url: "/dashboard/comptabilite/saisie/transactions",
            },
            {
              title: "Rapprochement bancaire",
              url: "/dashboard/comptabilite/saisie/rapprochement-bancaire",
            },
          ],
        },
        {
          section: "Écritures",
          items: [
            {
              title: "Journaux",
              url: "/dashboard/comptabilite/saisie/journaux",
            },
            {
              title: "Saisie en masse",
              url: "/dashboard/comptabilite/saisie/saisie-masse",
            },
          ],
        },
      ],
    },
    {
      title: "Révision",
      url: "/dashboard/comptabilite/revision",
      icon: ClipboardCheck,
      items: [
        {
          section: "Balances",
          items: [
            {
              title: "Balance générale",
              url: "/dashboard/comptabilite/revision/balance-generale",
            },
            {
              title: "Balance fournisseurs",
              url: "/dashboard/comptabilite/revision/balance-fournisseurs",
            },
            {
              title: "Balance clients",
              url: "/dashboard/comptabilite/revision/balance-clients",
            },
            {
              title: "Balance âgée",
              url: "/dashboard/comptabilite/revision/balance-agee",
            },
          ],
        },
        {
          section: "Grand livre",
          items: [
            {
              title: "Grand livre",
              url: "/dashboard/comptabilite/revision/grand-livre",
            },
          ],
        },
        {
          section: "Outils de révision",
          items: [
            {
              title: "Guide de révision",
              url: "/dashboard/comptabilite/revision/guide-revision",
            },
            {
              title: "Feuilles maîtresses",
              url: "/dashboard/comptabilite/revision/feuilles-maitresses",
            },
          ],
        },
      ],
    },
    {
      title: "Fiscalité",
      url: "/dashboard/comptabilite/fiscalite",
      icon: Receipt,
      items: [
        {
          section: "Mes déclarations",
          items: [
            {
              title: "Statut des télédéclarations",
              url: "/dashboard/comptabilite/fiscalite/teledeclarations",
            },
          ],
        },
        {
          section: "TVA - Déclarations",
          items: [
            {
              title: "TVA - Déclarations",
              url: "/dashboard/comptabilite/fiscalite/tva-declarations",
            },
            {
              title: "TVA - Demande de remboursement",
              url: "/dashboard/comptabilite/fiscalite/tva-remboursement",
            },
            {
              title: "TVA - Acompte (CA12)",
              url: "/dashboard/comptabilite/fiscalite/tva-acompte",
            },
          ],
        },
        {
          section: "Liasse fiscale",
          items: [
            {
              title: "IS - Acompte (2571)",
              url: "/dashboard/comptabilite/fiscalite/is-acompte",
            },
            {
              title: "IS - Solde (2572)",
              url: "/dashboard/comptabilite/fiscalite/is-solde",
            },
            {
              title: "CVAE - Acompte (1329 AC)",
              url: "/dashboard/comptabilite/fiscalite/cvae-acompte",
            },
            {
              title: "CVAE - Solde (1329 DEF)",
              url: "/dashboard/comptabilite/fiscalite/cvae-solde",
            },
            {
              title: "DAS2 - Honoraires",
              url: "/dashboard/comptabilite/fiscalite/das2",
            },
          ],
        },
      ],
    },
    {
      title: "États Financiers",
      url: "/dashboard/comptabilite/etats-financiers",
      icon: BarChart3,
      items: [
        {
          section: "Bilan",
          items: [
            {
              title: "Compte de résultat",
              url: "/dashboard/comptabilite/etats-financiers/compte-resultat",
            },
            {
              title: "Soldes Intermédiaires de Gestion",
              url: "/dashboard/comptabilite/etats-financiers/sig",
            },
          ],
        },
        {
          section: "Plaquettes",
          items: [
            {
              title: "Plaquettes",
              url: "/dashboard/comptabilite/etats-financiers/plaquettes",
            },
          ],
        },
      ],
    },
    {
      title: "Dossier du client",
      url: "/dashboard/comptabilite/dossier-client",
      icon: FolderOpen,
      items: [
        {
          section: "Documents partagés",
          items: [
            {
              title: "Documents partagés",
              url: "/dashboard/comptabilite/dossier-client/documents",
            },
            {
              title: "Plan comptable",
              url: "/dashboard/comptabilite/dossier-client/plan-comptable",
            },
          ],
        },
        {
          section: "Liste des tiers",
          items: [
            {
              title: "Fournisseurs",
              url: "/dashboard/comptabilite/dossier-client/fournisseurs",
            },
            {
              title: "Clients",
              url: "/dashboard/comptabilite/dossier-client/clients",
            },
          ],
        },
      ],
    },
  ],
};

export function AppSidebar({
  onCommunityClick,
  onOpenNotifications,
  onOpenEInvoicingPromo,
  ...props
}) {
  const pathname = usePathname();
  const { session } = useUser();
  const {
    isLoading: subscriptionLoading,
    isActive,
    subscription,
  } = useSubscription();
  const [theme, setTheme] = React.useState("light");
  const [notificationCount, setNotificationCount] = React.useState(0);
  const { listInvitations } = useOrganizationInvitations();
  
  // Hook pour les notifications d'activité (assignations de tâches)
  const { unreadCount: activityUnreadCount } = useActivityNotifications();

  // Vérifier si l'organisation est un cabinet comptable
  const { isAccountingFirm, loading: orgTypeLoading } = useOrganizationType();

  // Récupérer la vue active (Entreprise ou Comptabilité)
  const { activeView } = useAccountingView();

  // Récupérer l'état de la sidebar pour adapter les skeletons
  const { state: sidebarState } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  // Déterminer si on est sur une page d'outil qui nécessite la sidebar masquée
  // Exception : la page de signature doit avoir la sidebar en mode rétréci (icon)
  const isSignaturePage = pathname?.startsWith(
    "/dashboard/outils/signatures-mail/new",
  );
  const isToolPage =
    pathname?.includes("/dashboard/outils/") &&
    (pathname?.includes("/new") ||
      pathname?.includes("/nouveau") ||
      pathname?.includes("/edit") ||
      pathname?.includes("/editer") ||
      pathname?.includes("/view") ||
      pathname?.includes("/avoir/")) &&
    !isSignaturePage; // Exception pour la page de signature

  // Utiliser offcanvas pour les pages d'outils (sauf signature), icon pour les autres
  const collapsibleMode = isToolPage ? "offcanvas" : "icon";

  // Récupérer le nombre de notifications
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Récupérer les IDs déjà lus depuis le localStorage
        const readNotifications = typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("readNotifications") || "[]")
          : [];

        // Récupérer les invitations reçues
        const { data: receivedInvitations } =
          await authClient.organization.listUserInvitations();
        const pendingReceived =
          receivedInvitations?.filter(
            (inv) => inv.status === "pending" && !readNotifications.includes(inv.id)
          ) || [];

        // Récupérer les invitations envoyées
        const sentResult = await listInvitations();
        const pendingSent = sentResult.success
          ? sentResult.data?.filter(
              (inv) => inv.status === "pending" && !readNotifications.includes(inv.id)
            ) || []
          : [];

        // Total des notifications (invitations non lues + activité non lue)
        const total = pendingReceived.length + pendingSent.length + (activityUnreadCount || 0);
        setNotificationCount(total);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des notifications:",
          error,
        );
      }
    };

    if (session?.user) {
      fetchNotifications();

      // Rafraîchir toutes les 30 secondes
      const interval = setInterval(fetchNotifications, 30000);

      // Écouter les marquages "lu" depuis le panneau de notifications
      const handleNotificationsRead = () => fetchNotifications();
      window.addEventListener("notificationsRead", handleNotificationsRead);

      return () => {
        clearInterval(interval);
        window.removeEventListener("notificationsRead", handleNotificationsRead);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, activityUnreadCount]); // Dépendre de l'ID utilisateur et des notifications d'activité

  // Effet pour détecter le thème depuis localStorage au chargement du composant
  React.useEffect(() => {
    // Vérifier si on est côté client (browser)
    if (typeof window !== "undefined") {
      // Récupérer le thème depuis localStorage ou utiliser "light" par défaut
      const storedTheme = localStorage.getItem("vite-ui-theme") || "light";
      setTheme(storedTheme);

      // Écouter les changements de thème
      const handleStorageChange = () => {
        const updatedTheme = localStorage.getItem("vite-ui-theme") || "light";
        setTheme(updatedTheme);
      };

      // Ajouter un écouteur pour les changements de localStorage
      window.addEventListener("storage", handleStorageChange);

      // Écouter également les changements de classe sur l'élément html pour détecter les changements de thème
      const observer = new MutationObserver(() => {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
        localStorage.setItem("vite-ui-theme", isDark ? "dark" : "light");
      });

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      // Nettoyage
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        observer.disconnect();
      };
    }
  }, []);

  let isLoading = false;

  return (
    <Sidebar collapsible={collapsibleMode} {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent className="mt-1">
        {session?.user && !subscriptionLoading ? (
          <>
            {/* Tabs pour les cabinets comptables */}
            {isAccountingFirm && !orgTypeLoading && <SidebarViewTabs />}

            {/* Navigation conditionnelle selon la vue active */}
            {activeView === "accounting" && isAccountingFirm ? (
              // Vue Comptabilité : afficher uniquement les liens comptables
              <NavMain
                items={data.navAccounting}
                onOpenNotifications={onOpenNotifications}
                notificationCount={notificationCount}
              />
            ) : (
              // Vue Entreprise : afficher la navigation standard
              <NavMain
                items={data.navMain}
                navFinances={data.navFinances}
                navVentes={data.navVentes}
                navAfterVentes={data.navAfterVentes}
                navProjets={data.navProjets}
                navDocuments={data.navDocuments}
                navCommunication={data.navCommunication}
                onOpenNotifications={onOpenNotifications}
                notificationCount={notificationCount}
              />
            )}
            <NavSecondary
              items={data.navSecondary}
              onCommunityClick={onCommunityClick}
              onOpenEInvoicingPromo={onOpenEInvoicingPromo}
              className="mt-auto"
            />
          </>
        ) : (
          <>
            {/* NavMain Skeleton */}
            <div className={isCollapsed ? "px-1 py-2" : "px-2 py-2"}>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={
                      isCollapsed
                        ? "flex justify-center py-1.5"
                        : "flex w-full items-center gap-2 px-2 py-1.5"
                    }
                  >
                    <Skeleton
                      className={
                        isCollapsed
                          ? "h-8 w-8 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
                          : "h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* NavDocuments Skeleton - Masqué en mode rétréci */}
            {!isCollapsed && (
              <div className="px-4 py-6">
                <Skeleton className="h-5 w-16 mb-2 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 py-1.5">
                    <Skeleton className="h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                  </div>
                  <div className="flex items-center gap-2 py-1.5">
                    <Skeleton className="h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* NavSecondary Skeleton */}
            <div
              className={
                isCollapsed ? "px-1 py-2 mt-auto" : "px-2 py-2 mt-auto"
              }
            >
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={
                      isCollapsed
                        ? "flex justify-center py-1.5"
                        : "flex items-center gap-2 px-2 py-1.5"
                    }
                  >
                    <Skeleton
                      className={
                        isCollapsed
                          ? "h-8 w-8 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
                          : "h-8 w-full bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {session?.user && !subscriptionLoading ? (
          <NavUser user={session.user} />
        ) : (
          <div
            className={
              isCollapsed
                ? "flex justify-center py-1.5"
                : "flex items-center gap-2 px-2 py-1.5"
            }
          >
            <Skeleton className="h-8 w-8 rounded-full bg-[#EBEBEB] dark:bg-[#292929]" />
            {!isCollapsed && (
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
                <Skeleton className="h-3 w-32 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
              </div>
            )}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
