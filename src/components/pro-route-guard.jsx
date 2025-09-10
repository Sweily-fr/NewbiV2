"use client";

import { useSubscription } from "@/src/contexts/subscription-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export function ProRouteGuard({ children, pageName }) {
  const { isActive, loading } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isActive()) {
      router.replace("/dashboard/outils");
    }
  }, [loading, isActive, router]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
        <Skeleton className="h-[40px] w-[100px] rounded-xl" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-[40px] w-[300px] rounded-xl" />
          <Skeleton className="h-[40px] w-[300px] rounded-xl" />
        </div>
        <div className="grid grid-cols-3 gap-6 w-full">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // Si l'utilisateur a un abonnement actif, afficher le contenu
  if (isActive()) {
    return children;
  }

  // Pendant la redirection, afficher le même skeleton
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <Skeleton className="h-[40px] w-[100px] rounded-xl" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-[40px] w-[300px] rounded-xl" />
        <Skeleton className="h-[40px] w-[300px] rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-6 w-full">
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}
