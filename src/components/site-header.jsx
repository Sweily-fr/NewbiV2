"use client";
import React from "react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/src/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/src/components/ui/mode-toggle";
import { Save } from "lucide-react";
import { useQuery } from "@apollo/client";
import { GET_BOARD } from "@/src/graphql/kanbanQueries";
import { useWorkspace } from "@/src/hooks/useWorkspace";

// Composant bouton de sauvegarde pour les signatures
const SignatureSaveButton = () => {
  const pathname = usePathname();
  const isSignaturePage = pathname?.includes('/signatures-mail');
  
  if (!isSignaturePage) return null;
  
  const handleSave = () => {
    // Déclencher l'événement de sauvegarde global
    window.dispatchEvent(new CustomEvent('signature-save'));
  };
  
  return (
    <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleSave}>
      <Save className="h-[1rem] w-[1rem]" />
      <span className="sr-only">Sauvegarder la signature</span>
    </Button>
  );
};

export function SiteHeader() {
  const pathname = usePathname();
  const { workspaceId } = useWorkspace();

  // Détecter si on est sur une page Kanban avec ID
  const isKanbanPage = pathname?.includes('/kanban/') && pathname?.split('/').length >= 4;
  const kanbanId = isKanbanPage ? pathname.split('/').pop() : null;

  // Récupérer les données du tableau Kanban si nécessaire
  const { data: kanbanData } = useQuery(GET_BOARD, {
    variables: { 
      id: kanbanId,
      workspaceId 
    },
    skip: !kanbanId || kanbanId === 'new' || !workspaceId,
    errorPolicy: 'ignore'
  });

  // Utilisation de useMemo pour éviter les recalculs inutiles et les boucles infinies
  const breadcrumbs = React.useMemo(() => {
    if (!pathname) return null;
    const pathWithoutFirstSlash = pathname.slice(1);
    const segments = pathWithoutFirstSlash.split("/");

    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      let formattedSegment = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      
      // Si c'est le dernier segment et qu'on est sur une page Kanban, utiliser le nom du tableau
      const isLastSegment = index === segments.length - 1;
      if (isLastSegment && isKanbanPage && kanbanData?.board?.title) {
        formattedSegment = kanbanData.board.title;
      }

      // Pour le dernier segment, on retourne juste un BreadcrumbItem avec BreadcrumbPage
      if (isLastSegment) {
        return (
          <BreadcrumbItem key={href}>
            <BreadcrumbPage className="text-xs">
              {formattedSegment}
            </BreadcrumbPage>
          </BreadcrumbItem>
        );
      }

      // Pour les segments intermédiaires, on retourne deux éléments distincts
      return (
        <React.Fragment key={href}>
          <BreadcrumbItem>
            <BreadcrumbLink href={href} className="text-xs">
              {formattedSegment}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {/* Le séparateur est maintenant en dehors du BreadcrumbItem */}
          <BreadcrumbSeparator />
        </React.Fragment>
      );
    });
  }, [pathname, kanbanData]); // Dépendance sur pathname et kanbanData

  return (
    <header className="flex h-10 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>{pathname !== "/" && breadcrumbs}</BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <SignatureSaveButton />
          <ModeToggle />
          {/* <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            ></a>
          </Button> */}
        </div>
      </div>
    </header>
  );
}
