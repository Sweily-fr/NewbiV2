"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  CircleGauge,
  Landmark,
  BriefcaseBusiness,
  FileText,
  MoreHorizontal,
  Bell,
  Calendar,
  FolderKanban,
  FileUp,
  FolderOpen,
  MessageSquare,
  Settings,
  MessageCircleQuestion,
  LogOut,
  Search,
  ChevronRight,
  Users,
  Receipt,
} from "lucide-react";
import { authClient, useSession } from "@/src/lib/auth-client";
import { useActivityNotifications } from "@/src/hooks/useActivityNotifications";

// ─── Tab definitions ─────────────────────────────────────────────
const tabs = [
  {
    key: "home",
    label: "Dashboard",
    href: "/dashboard",
    icon: CircleGauge,
    exact: true,
  },
  {
    key: "transactions",
    label: "Transactions",
    href: "/dashboard/outils/transactions",
    icon: Landmark,
  },
  {
    key: "billing",
    label: "Ventes",
    icon: BriefcaseBusiness,
    matchPaths: [
      "/dashboard/outils/factures",
      "/dashboard/outils/devis",
      "/dashboard/clients",
      "/dashboard/catalogues",
    ],
  },
  {
    key: "more",
    label: "Plus",
    icon: MoreHorizontal,
  },
];

// ─── Ventes bottom sheet items ───────────────────────────────────
const ventesQuickCreate = [
  { label: "Nouvelle facture", href: "/dashboard/outils/factures/new" },
  { label: "Nouveau devis", href: "/dashboard/outils/devis/new" },
  { label: "Nouveau bon de commande", href: "/dashboard/outils/bons-commande/new" },
];

const ventesNavigation = [
  { label: "Factures clients", href: "/dashboard/outils/factures" },
  { label: "Devis", href: "/dashboard/outils/devis" },
  { label: "Liste clients (CRM)", href: "/dashboard/clients" },
  { label: "Catalogues", href: "/dashboard/catalogues" },
];

// ─── More menu sections ─────────────────────────────────────────
const moreMenuSections = [
  {
    title: "Gestion",
    items: [
      { label: "Notifications", icon: Bell, action: "notifications", badge: true },
      { label: "Factures d'achat", href: "/dashboard/outils/factures-achat", icon: Receipt },
      { label: "Calendrier", href: "/dashboard/calendar", icon: Calendar },
      { label: "Tâches", href: "/dashboard/outils/kanban", icon: FolderKanban },
      { label: "Transfert de fichiers", href: "/dashboard/outils/transferts-fichiers", icon: FileUp },
      { label: "Documents partagés", href: "/dashboard/outils/documents-partages", icon: FolderOpen },
      { label: "Signature de mail", href: "/dashboard/outils/signatures-mail", icon: MessageSquare },
    ],
  },
  {
    title: "Paramètres",
    items: [
      { label: "Paramètres", action: "settings", icon: Settings },
      {
        label: "Aide & support",
        href: "https://chat.whatsapp.com/FGLms8EYhpv1o5rkrnIldL",
        icon: MessageCircleQuestion,
        external: true,
      },
      { label: "Recherche", action: "search", icon: Search },
    ],
  },
];

// Paths covered by the "Plus" menu
const moreMenuPaths = moreMenuSections.flatMap((s) =>
  s.items.filter((i) => i.href && !i.external).map((i) => i.href)
);

// ─── Body scroll lock (iOS Safari compatible) ───────────────────
function useBodyScrollLock(locked) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!locked) return;

    scrollYRef.current = window.scrollY;
    const scrollY = scrollYRef.current;

    const html = document.documentElement;
    const body = document.body;

    // Save original styles
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    const originalBodyPosition = body.style.position;
    const originalBodyTop = body.style.top;
    const originalBodyLeft = body.style.left;
    const originalBodyRight = body.style.right;
    const originalBodyWidth = body.style.width;

    // Lock body — position:fixed trick for iOS Safari
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      body.style.position = originalBodyPosition;
      body.style.top = originalBodyTop;
      body.style.left = originalBodyLeft;
      body.style.right = originalBodyRight;
      body.style.width = originalBodyWidth;

      // Restore scroll position
      window.scrollTo(0, scrollY);
    };
  }, [locked]);
}

// ─── Swipe-down gesture hook ─────────────────────────────────────
function useSwipeDown(sheetRef, scrollRef, onClose, isOpen) {
  const dragState = useRef({ startY: 0, dragging: false });

  useEffect(() => {
    if (!isOpen) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const handleTouchStart = (e) => {
      const scrollEl = scrollRef?.current;
      const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
      const target = e.target;

      // Always allow drag from the handle area
      const handleArea = sheet.querySelector("[data-drag-handle]");
      const isOnHandle = handleArea && handleArea.contains(target);

      if (isOnHandle || scrollTop <= 0) {
        dragState.current = { startY: e.touches[0].clientY, dragging: true };
      } else {
        dragState.current = { startY: 0, dragging: false };
      }
    };

    const handleTouchMove = (e) => {
      if (!dragState.current.dragging) return;

      const deltaY = e.touches[0].clientY - dragState.current.startY;
      if (deltaY > 0) {
        e.preventDefault();
        sheet.style.transform = `translateY(${deltaY}px)`;
        sheet.style.transition = "none";
      }
    };

    const handleTouchEnd = (e) => {
      if (!dragState.current.dragging) return;

      const deltaY = e.changedTouches[0].clientY - dragState.current.startY;
      sheet.style.transition = "";

      if (deltaY > 80) {
        sheet.style.transform = "translateY(100%)";
        sheet.style.transition = "transform 200ms ease-out";
        setTimeout(() => onClose(), 200);
      } else {
        sheet.style.transform = "";
      }

      dragState.current = { startY: 0, dragging: false };
    };

    sheet.addEventListener("touchstart", handleTouchStart, { passive: true });
    sheet.addEventListener("touchmove", handleTouchMove, { passive: false });
    sheet.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      sheet.removeEventListener("touchstart", handleTouchStart);
      sheet.removeEventListener("touchmove", handleTouchMove);
      sheet.removeEventListener("touchend", handleTouchEnd);
    };
  }, [sheetRef, scrollRef, onClose, isOpen]);
}

// ─── Component ───────────────────────────────────────────────────
// Pages where the bottom nav should be hidden
const hiddenPaths = [
  "/dashboard/outils/factures/new",
  "/dashboard/outils/devis/new",
];

export function BottomNavBar({ onOpenSettings, onOpenNotifications }) {
  const pathname = usePathname();
  const [billingOpen, setBillingOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: session } = useSession();
  const { unreadCount } = useActivityNotifications();

  // Refs for swipe gesture
  const ventesSheetRef = useRef(null);
  const moreSheetRef = useRef(null);
  const moreScrollRef = useRef(null);

  // Lock body scroll when any sheet is open
  const anySheetOpen = billingOpen || moreOpen;
  useBodyScrollLock(anySheetOpen);

  // Swipe-down gestures
  const closeBilling = useCallback(() => setBillingOpen(false), []);
  const closeMore = useCallback(() => setMoreOpen(false), []);
  useSwipeDown(ventesSheetRef, { current: null }, closeBilling, billingOpen);
  useSwipeDown(moreSheetRef, moreScrollRef, closeMore, moreOpen);

  // Close menus on route change
  useEffect(() => {
    setBillingOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setBillingOpen(false);
        setMoreOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleOverlayClick = useCallback(() => {
    setBillingOpen(false);
    setMoreOpen(false);
  }, []);

  // Active state detection
  const isTabActive = (tab) => {
    if (tab.key === "billing" || tab.key === "more") return false;
    if (tab.exact) return pathname === tab.href;
    if (tab.matchPaths) {
      return tab.matchPaths.some(
        (p) => pathname === p || pathname?.startsWith(p + "/")
      );
    }
    return pathname === tab.href || pathname?.startsWith(tab.href + "/");
  };

  const isBillingActive =
    billingOpen ||
    [
      "/dashboard/outils/factures",
      "/dashboard/outils/devis",
      "/dashboard/clients",
      "/dashboard/catalogues",
    ].some((p) => pathname === p || pathname?.startsWith(p + "/"));

  const isMoreActive =
    moreOpen ||
    moreMenuPaths.some(
      (p) => pathname === p || pathname?.startsWith(p + "/")
    );

  const handleTabClick = (tab) => {
    if (tab.key === "billing") {
      setMoreOpen(false);
      setBillingOpen((prev) => !prev);
      return;
    }
    if (tab.key === "more") {
      setBillingOpen(false);
      setMoreOpen((prev) => !prev);
      return;
    }
    setBillingOpen(false);
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
    if (item.action === "notifications") {
      if (onOpenNotifications) onOpenNotifications();
      setMoreOpen(false);
      return;
    }
    if (item.action === "logout") {
      authClient.signOut().then(() => {
        window.location.href = "/";
      });
      return;
    }
    setMoreOpen(false);
  };

  const showOverlay = billingOpen || moreOpen;
  const user = session?.user;

  // Hide on creation/edit pages
  const isHidden = hiddenPaths.some(
    (p) => pathname === p || pathname?.startsWith(p + "/")
  ) || pathname?.match(/\/(factures|devis)\/[^/]+\/(edit|duplicate)$/);
  if (isHidden) return null;

  return (
    <>
      {/* Backdrop overlay — blocks all interaction with page behind */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-black/40 z-[90] md:hidden animate-in fade-in duration-200"
          onClick={handleOverlayClick}
          onTouchMove={(e) => e.preventDefault()}
          aria-hidden="true"
          style={{ touchAction: "none" }}
        />
      )}

      {/* ─── Ventes Bottom Sheet ─────────────────────────────── */}
      {billingOpen && (
        <div
          ref={ventesSheetRef}
          className="fixed bottom-0 left-0 right-0 z-[95] md:hidden animate-in slide-in-from-bottom duration-300"
          style={{ touchAction: "none" }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-t-[28px] shadow-2xl">
            {/* Handle bar */}
            <div data-drag-handle className="flex justify-center pt-3 pb-2 cursor-grab">
              <div className="w-10 h-1 rounded-full bg-[#3D3E42]/20" />
            </div>

            {/* Navigation */}
            <div className="px-4 pt-1 pb-1">
              {ventesNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-2 py-3.5 rounded-lg transition-colors",
                      isActive
                        ? "bg-accent"
                        : "hover:bg-accent"
                    )}
                    onClick={() => setBillingOpen(false)}
                  >
                    <span className="text-sm font-medium text-foreground">
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 shrink-0 text-[#3D3E42]/40" />
                  </Link>
                );
              })}
            </div>

            {/* Separator */}
            <div className="mx-6 h-px bg-border/40" />

            {/* Action buttons */}
            <div className="px-4 pt-3 pb-2 flex flex-col gap-2">
              <Button asChild size="lg" className="w-full rounded-xl h-11">
                <Link href="/dashboard/outils/factures/new" onClick={() => setBillingOpen(false)}>
                  Nouvelle facture
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full rounded-xl h-11">
                <Link href="/dashboard/outils/devis/new" onClick={() => setBillingOpen(false)}>
                  Nouveau devis
                </Link>
              </Button>
            </div>

            {/* Safe area padding */}
            <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
          </div>
        </div>
      )}

      {/* ─── More Bottom Sheet ─────────────────────────────────── */}
      {moreOpen && (
        <div
          ref={moreSheetRef}
          className="fixed bottom-0 left-0 right-0 z-[95] md:hidden animate-in slide-in-from-bottom duration-300"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-t-[28px] shadow-2xl">
            {/* Handle bar */}
            <div data-drag-handle className="flex justify-center pt-3 pb-2 cursor-grab">
              <div className="w-10 h-1 rounded-full bg-[#3D3E42]/20" />
            </div>

            {/* Scrollable content */}
            <div
              ref={moreScrollRef}
              className="max-h-[calc(85vh-40px)] overflow-y-auto"
              style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
            >
              {/* User profile card */}
              {user && (
                <div className="mx-4 mb-3 flex items-center gap-3 px-1">
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-lg overflow-hidden">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm">
                          {user.name
                            ? user.name
                                .split(" ")
                                .map((w) => w.charAt(0))
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "U"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                    <span className="truncate font-medium">{user.name || "Utilisateur"}</span>
                    <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                  </div>
                </div>
              )}

              {/* Sections */}
              {moreMenuSections.map((section) => (
                <div key={section.title} className="px-3 pb-2">
                  <p className="px-3 py-2 text-[11px] font-semibold text-[#3D3E42]/60 uppercase tracking-wider">
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
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                            isActive
                              ? "bg-accent"
                              : "hover:bg-accent",
                            item.destructive && "text-destructive hover:bg-destructive/10"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-5 h-5 shrink-0",
                              item.destructive && "text-destructive",
                              !item.destructive && "text-[#3D3E42]"
                            )}
                            strokeWidth={1.8}
                          />
                          <span
                            className={cn(
                              "text-sm font-normal flex-1",
                              item.destructive && "text-destructive"
                            )}
                          >
                            {item.label}
                          </span>
                          {/* Notification badge */}
                          {item.badge && unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full min-w-[18px] text-center">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                          {!item.destructive && !item.badge && (
                            <ChevronRight className="w-4 h-4 text-[#3D3E42]/40 shrink-0" />
                          )}
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

              {/* Logout button */}
              <div className="px-3 pb-3 pt-1">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 transition-colors"
                  onClick={() =>
                    authClient.signOut().then(() => {
                      window.location.href = "/";
                    })
                  }
                >
                  <LogOut className="w-5 h-5 text-destructive shrink-0" strokeWidth={1.8} />
                  <span className="text-sm font-medium text-destructive">Déconnexion</span>
                </button>
              </div>

              {/* Safe area padding */}
              <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
            </div>
          </div>
        </div>
      )}

      {/* ─── Bottom Navigation Bar ─────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[80] md:hidden"
        role="navigation"
        aria-label="Navigation principale mobile"
      >
        <div className="bg-white dark:bg-zinc-900 shadow-[0_-1px_3px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around h-16 px-1">
            {tabs.map((tab) => {
              const active =
                tab.key === "billing"
                  ? isBillingActive
                  : tab.key === "more"
                    ? isMoreActive
                    : isTabActive(tab);

              const TabWrapper = tab.href ? Link : "button";
              const tabProps = tab.href
                ? { href: tab.href, onClick: () => handleTabClick(tab) }
                : { onClick: () => handleTabClick(tab) };

              return (
                <TabWrapper
                  key={tab.key}
                  {...tabProps}
                  className="flex flex-col items-center justify-center gap-2 min-w-0 flex-1 pt-1.5 pb-1 transition-all duration-200 focus:outline-none relative"
                  aria-label={tab.label}
                  aria-current={active && tab.href ? "page" : undefined}
                  aria-expanded={
                    tab.key === "billing"
                      ? billingOpen
                      : tab.key === "more"
                        ? moreOpen
                        : undefined
                  }
                >
                  <tab.icon
                    className={cn(
                      "w-6 h-6 transition-all duration-200",
                      active ? "text-[#5b4fff]" : "text-[#3D3E42] dark:text-white"
                    )}
                    strokeWidth={active ? 1.6 : 1.3}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-normal leading-tight transition-colors duration-200",
                      active ? "text-[#5b4fff]" : "text-[#3D3E42] dark:text-white"
                    )}
                  >
                    {tab.label}
                  </span>
                </TabWrapper>
              );
            })}
          </div>
          {/* Safe area fill */}
          <div
            className="bg-white dark:bg-zinc-900"
            style={{ height: "env(safe-area-inset-bottom, 0px)" }}
          />
        </div>
      </nav>
    </>
  );
}
