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

export function SiteHeader() {
  const pathname = usePathname();

  // Utilisation de useMemo pour éviter les recalculs inutiles et les boucles infinies
  const breadcrumbs = React.useMemo(() => {
    if (!pathname) return null;
    const pathWithoutFirstSlash = pathname.slice(1);
    const segments = pathWithoutFirstSlash.split("/");

    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const formattedSegment =
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      const isLastSegment = index === segments.length - 1;

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
  }, [pathname]); // Dépendance uniquement sur pathname

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
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
