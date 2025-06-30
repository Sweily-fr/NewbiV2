"use client";
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

export function SiteHeader() {
  const pathname = usePathname();

  const generateBreadcrumbs = () => {
    if (!pathname) return null;
    const pathWithoutFirstSlash = pathname?.slice(1);
    const segments = pathWithoutFirstSlash?.split("/");
    return segments?.map((segment, index) => {
      const href = "/" + segments?.slice(0, index + 1).join("/");
      const formattedSegment =
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      const isLastSegment = index === segments.length - 1;

      return (
        <BreadcrumbItem key={href}>
          {isLastSegment ? (
            <BreadcrumbPage className="text-xs">
              {formattedSegment}
            </BreadcrumbPage>
          ) : (
            <>
              <BreadcrumbLink href={href} className="text-xs">
                {formattedSegment}
              </BreadcrumbLink>
              <BreadcrumbSeparator />
            </>
          )}
        </BreadcrumbItem>
      );
    });
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            ></a>
          </Button>
        </div>
        <Breadcrumb>
          <BreadcrumbList>
            {pathname !== "/" && generateBreadcrumbs()}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
