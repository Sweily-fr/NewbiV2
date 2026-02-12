"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import {
  Home,
  Landmark,
  Plus,
  ShoppingCart,
  MoreHorizontal,
  X,
  FileText,
  FilePlus,
  ArrowLeftRight,
  Inbox,
  Calendar,
  FolderKanban,
  FileUp,
  FolderOpen,
  MessageSquare,
  Settings,
  MessageCircleQuestion,
  LogOut,
  Search,
  Tag,
} from "lucide-react";
import { authClient } from "@/src/lib/auth-client";

// ─── Navigation items ────────────────────────────────────────────
const mainTabs = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    exact: true,
  },
  {
    key: "transactions",
    label: "Transactions",
    href: "/dashboard/outils/transactions",
    icon: Landmark,
  },
  { key: "fab", label: "Créer", icon: Plus },
  {
    key: "ventes",
    label: "Ventes",
    href: "/dashboard/outils/factures",
    icon: ShoppingCart,
    matchPaths: [
      "/dashboard/outils/factures",
      "/dashboard/outils/devis",
      "/dashboard/clients",
      "/dashboard/catalogues",
    ],
  },
  { key: "more", label: "Plus", icon: MoreHorizontal },
];

const fabActions = [
  {
    label: "Nouvelle facture",
    href: "/dashboard/outils/factures/new",
    icon: FileText,
  },
  {
    label: "Nouveau devis",
    href: "/dashboard/outils/devis/new",
    icon: FilePlus,
  },
  {
    label: "Nouvelle transaction",
    href: "/dashboard/outils/transactions?new=true",
    icon: ArrowLeftRight,
  },
];

const moreMenuSections = [
  {
    title: "Gestion",
    items: [
      {
        label: "Recherche",
        icon: Search,
        action: "search",
      },
      {
        label: "Calendrier",
        href: "/dashboard/calendar",
        icon: Calendar,
      },
      {
        label: "Tâches",
        href: "/dashboard/outils/kanban",
        icon: FolderKanban,
      },
      {
        label: "Transfert de fichiers",
        href: "/dashboard/outils/transferts-fichiers",
        icon: FileUp,
      },
      {
        label: "Documents partagés",
        href: "/dashboard/outils/documents-partages",
        icon: FolderOpen,
      },
      {
        label: "Signature de mail",
        href: "/dashboard/outils/signatures-mail",
        icon: MessageSquare,
      },
      {
        label: "Catalogues",
        href: "/dashboard/catalogues",
        icon: Tag,
      },
    ],
  },
  {
    title: "Paramètres",
    items: [
      {
        label: "Paramètres",
        action: "settings",
        icon: Settings,
      },
      {
        label: "Aide & support",
        href: "https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL",
        icon: MessageCircleQuestion,
        external: true,
      },
      {
        label: "Déconnexion",
        action: "logout",
        icon: LogOut,
        destructive: true,
      },
    ],
  },
];

// All "more" paths for detecting active state on the "Plus" tab
const moreMenuPaths = moreMenuSections.flatMap((s) =>
  s.items.filter((i) => i.href && !i.external).map((i) => i.href)
);

// ─── Component ───────────────────────────────────────────────────
export function BottomNavBar({ onOpenSettings, onOpenNotifications }) {
  const pathname = usePathname();
  const [fabOpen, setFabOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const overlayRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setFabOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close on outside click
  const handleOverlayClick = useCallback(() => {
    setFabOpen(false);
    setMoreOpen(false);
  }, []);

  // Check if a tab is active
  const isTabActive = (tab) => {
    if (tab.key === "fab" || tab.key === "more") return false;
    if (tab.exact) return pathname === tab.href;
    if (tab.matchPaths) {
      return tab.matchPaths.some(
        (p) => pathname === p || pathname?.startsWith(p + "/")
      );
    }
    return pathname === tab.href || pathname?.startsWith(tab.href + "/");
  };

  const isMoreActive = moreMenuPaths.some(
    (p) => pathname === p || pathname?.startsWith(p + "/")
  );

  const handleTabClick = (tab) => {
    if (tab.key === "fab") {
      setMoreOpen(false);
      setFabOpen((prev) => !prev);
      return;
    }
    if (tab.key === "more") {
      setFabOpen(false);
      setMoreOpen((prev) => !prev);
      return;
    }
    setFabOpen(false);
    setMoreOpen(false);
  };

  const handleMoreItemClick = (item) => {
    if (item.action === "search") {
      window.dispatchEvent(new Event("open-search-command"));
      setMoreOpen(false);
      return;
    }
    if (item.action === "settings") {
      if (onOpenSettings) onOpenSettings();
      setMoreOpen(false);
      return;
    }
    if (item.action === "logout") {
      authClient.signOut().then(() => {
        window.location.href = "/auth/login";
      });
      return;
    }
    setMoreOpen(false);
  };

  const showOverlay = fabOpen || moreOpen;

  return (
    <>
      {/* Backdrop overlay */}
      {showOverlay && (
        <div
          ref={overlayRef}
          className="fixed inset-0 bg-black/30 z-[90] md:hidden animate-in fade-in duration-200"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* FAB Action Menu */}
      {fabOpen && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[95] md:hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-border/50 p-2 min-w-[220px]">
            {fabActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-accent transition-colors"
                onClick={() => setFabOpen(false)}
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#5b4fff]/10">
                  <action.icon className="w-4.5 h-4.5 text-[#5b4fff]" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* More Menu (Bottom Sheet) */}
      {moreOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[95] md:hidden animate-in slide-in-from-bottom duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl border-t border-border/50 max-h-[70vh] overflow-y-auto">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Close button */}
            <div className="flex items-center justify-between px-5 pb-2">
              <h3 className="text-base font-semibold text-foreground">Menu</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full hover:bg-accent transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Sections */}
            {moreMenuSections.map((section) => (
              <div key={section.title} className="px-3 pb-3">
                <p className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      item.href &&
                      !item.external &&
                      (pathname === item.href ||
                        pathname?.startsWith(item.href + "/"));

                    const content = (
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                          isActive
                            ? "bg-[#5b4fff]/10 text-[#5b4fff]"
                            : "hover:bg-accent",
                          item.destructive && "text-destructive hover:bg-destructive/10"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "w-5 h-5",
                            isActive && "text-[#5b4fff]",
                            item.destructive && "text-destructive",
                            !isActive && !item.destructive && "text-muted-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isActive && "text-[#5b4fff]",
                            item.destructive && "text-destructive"
                          )}
                        >
                          {item.label}
                        </span>
                      </div>
                    );

                    if (item.external) {
                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMoreOpen(false)}
                        >
                          {content}
                        </a>
                      );
                    }

                    if (item.action) {
                      return (
                        <button
                          key={item.label}
                          className="w-full text-left"
                          onClick={() => handleMoreItemClick(item)}
                        >
                          {content}
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                      >
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Safe area padding */}
            <div className="pb-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[80] md:hidden"
        role="navigation"
        aria-label="Navigation principale mobile"
      >
        {/* FAB button - rendered behind the bar so its bottom shadow is hidden */}
        <button
          onClick={() => handleTabClick(mainTabs.find((t) => t.key === "fab"))}
          className="absolute left-1/2 -translate-x-1/2 -top-[22px] z-[3] focus:outline-none"
          aria-label="Actions rapides"
          aria-expanded={fabOpen}
        >
          <div
            className={cn(
              "flex items-center justify-center w-[58px] h-[58px] rounded-full shadow-[0_-4px_12px_rgba(0,0,0,0.1)] transition-all duration-200",
              "ring-[5px] ring-white dark:ring-zinc-950",
              fabOpen
                ? "bg-[#5b4fff]/90 rotate-45 scale-95"
                : "bg-[#5b4fff] hover:bg-[#4a3fee] scale-100 hover:scale-105"
            )}
          >
            <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
        </button>

        <div
          className="relative z-[2] bg-white dark:bg-zinc-950 border-t border-border/50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-center justify-around h-14 px-2">
            {mainTabs.map((tab) => {
              const active =
                tab.key === "more" ? isMoreActive : isTabActive(tab);
              const isFab = tab.key === "fab";
              const isMoreBtn = tab.key === "more";
              const isMoreBtnOpen = isMoreBtn && moreOpen;

              // FAB spacer to keep layout balanced
              if (isFab) {
                return <div key={tab.key} className="min-w-[64px]" />;
              }

              // Regular tab or More tab
              const TabWrapper = tab.href ? Link : "button";
              const tabProps = tab.href
                ? { href: tab.href, onClick: () => handleTabClick(tab) }
                : { onClick: () => handleTabClick(tab) };

              return (
                <TabWrapper
                  key={tab.key}
                  {...tabProps}
                  className={cn(
                    "flex items-center justify-center min-w-[64px] py-2 transition-all duration-200 focus:outline-none"
                  )}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                >
                  <tab.icon
                    className={cn(
                      "w-[22px] h-[22px] transition-all duration-200",
                      active || isMoreBtnOpen
                        ? "text-[#5b4fff]"
                        : "text-muted-foreground"
                    )}
                    strokeWidth={active || isMoreBtnOpen ? 2.2 : 1.8}
                  />
                </TabWrapper>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
