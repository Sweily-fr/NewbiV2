import { Skeleton } from "@/src/components/ui/skeleton";
import { SidebarTrigger } from "@/src/components/ui/sidebar";
import { Separator } from "@/src/components/ui/separator";

export function SiteHeaderSkeleton() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20 bg-gray-200" />
          <span className="text-gray-400">/</span>
          <Skeleton className="h-4 w-16 bg-gray-200" />
        </div>
      </div>
      
      {/* Actions à droite */}
      <div className="ml-auto flex items-center gap-2 px-4">
        {/* Trial counter skeleton */}
        <Skeleton className="h-6 w-32 bg-gray-200 rounded-full" />
        
        {/* Theme toggle skeleton */}
        <Skeleton className="h-9 w-9 bg-gray-200 rounded-md" />
        
        {/* Referral button skeleton */}
        <Skeleton className="h-9 w-24 bg-gray-200 rounded-md" />
        
        {/* User menu skeleton */}
        <Skeleton className="h-8 w-8 bg-gray-200 rounded-full" />
      </div>
    </header>
  );
}
