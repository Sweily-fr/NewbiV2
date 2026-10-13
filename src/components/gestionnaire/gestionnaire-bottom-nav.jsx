"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, MenuIcon, ClipboardList, Users } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useSidebar } from "@/src/components/ui/sidebar";
import { GESTIONNAIRE_PATH } from "@/src/lib/gestionnaire-paths";

const TABS = [
  {
    label: "Clients",
    href: GESTIONNAIRE_PATH,
    icon: Users,
    match: (p) =>
      p === GESTIONNAIRE_PATH || p.startsWith(`${GESTIONNAIRE_PATH}/clients`),
  },
  {
    label: "Factures",
    href: `${GESTIONNAIRE_PATH}/factures`,
    icon: FileText,
  },
  {
    label: "Devis",
    href: `${GESTIONNAIRE_PATH}/devis`,
    icon: ClipboardList,
  },
];

/**
 * Barre du bas de l'espace gestionnaire sur mobile : ses pages à lui, pas
 * celles d'un espace client (la barre habituelle pointait vers l'accueil,
 * les transactions… de l'espace actif). « Plus » ouvre le menu complet.
 */
export function GestionnaireBottomNav() {
  const pathname = usePathname() || "";
  const { setOpenMobile } = useSidebar();

  const item = (active) =>
    cn(
      "w-6 h-6 transition-all duration-200",
      active ? "text-[#5b4fff]" : "text-[#3D3E42] dark:text-white",
    );
  const label = (active) =>
    cn(
      "text-[10px] font-normal leading-tight",
      active ? "text-[#5b4fff]" : "text-[#3D3E42] dark:text-white",
    );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[80] md:hidden"
      aria-label="Navigation de l'espace gestionnaire"
    >
      <div className="bg-white dark:bg-zinc-900 shadow-[0_-1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 px-1">
          {TABS.map((tab) => {
            const active = tab.match
              ? tab.match(pathname)
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-2 min-w-0 flex-1 pt-1.5 pb-1"
              >
                <tab.icon
                  className={item(active)}
                  strokeWidth={active ? 1.6 : 1.3}
                />
                <span className={label(active)}>{tab.label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpenMobile(true)}
            className="flex flex-col items-center justify-center gap-2 min-w-0 flex-1 pt-1.5 pb-1"
          >
            <MenuIcon className={item(false)} strokeWidth={1.3} />
            <span className={label(false)}>Plus</span>
          </button>
        </div>
        <div
          className="bg-white dark:bg-zinc-900"
          style={{ height: "env(safe-area-inset-bottom, 0px)" }}
        />
      </div>
    </nav>
  );
}
