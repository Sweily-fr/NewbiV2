"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/src/components/app-sidebar";
import { SignatureSidebar } from "@/src/components/signature-sidebar";
import { SiteHeader } from "@/src/components/site-header";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { SearchCommand } from "@/src/components/search-command";
import { SignatureProvider, useSignatureData } from "@/src/hooks/use-signature-data";

// Composant interne qui utilise le contexte
function DashboardContent({ children }) {
  const pathname = usePathname();
  const isSignaturePage = pathname === "/dashboard/outils/signatures-mail/new";
  
  // Déterminer si on est sur une page d'outil qui nécessite la sidebar fermée
  const isToolPage = pathname.includes("/dashboard/outils/") && 
    (pathname.includes("/new") || pathname.includes("/edit") || pathname.includes("/view"));
  
  // Utiliser les données de signature si on est sur la page de signature
  let signatureContextData = null;
  try {
    signatureContextData = useSignatureData();
  } catch {
    // Pas de contexte disponible, c'est normal si on n'est pas sur la page de signature
  }

  return (
    <SidebarProvider defaultOpen={!isToolPage}>
      <AppSidebar variant="inset" />
      <SidebarInset className="font-polysans font-light">
        <SiteHeader />
        <div className="flex flex-1 flex-col">
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
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const isSignaturePage = pathname === "/dashboard/outils/signatures-mail/new";

  // Si on est sur la page de signature, wrapper avec le provider
  if (isSignaturePage) {
    return (
      <SignatureProvider>
        <DashboardContent>{children}</DashboardContent>
      </SignatureProvider>
    );
  }

  // Sinon, rendu normal sans le provider
  return <DashboardContent>{children}</DashboardContent>;
}
