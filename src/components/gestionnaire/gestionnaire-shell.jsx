"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Users } from "lucide-react";
import { performLogout } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

const NAV = [
  { href: "/gestionnaire", label: "Clients", icon: Users, exact: true },
];

/**
 * Cadre de l'espace gestionnaire : une application à part dans Newbi, avec
 * son propre menu. Le cabinet y gère ses clients et entre dans leurs
 * dossiers (bouton « Ouvrir » de la liste).
 */
export default function GestionnaireShell({
  managerName,
  userEmail,
  children,
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/gestionnaire" className="flex items-center gap-2">
            <img src="/NewbiLogo.svg" alt="Newbi" className="size-6" />
            <span className="text-sm font-medium">Espace gestionnaire</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              · {managerName}
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact
                ? pathname === href
                : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm",
                    active
                      ? "bg-black/[0.05] font-medium dark:bg-white/[0.08]"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground md:inline">
              {userEmail}
            </span>
            <Button variant="ghost" size="sm" onClick={() => performLogout()}>
              <LogOut className="size-4" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
