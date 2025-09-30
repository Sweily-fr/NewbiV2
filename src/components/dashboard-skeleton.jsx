"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { useState, useEffect } from "react";

export function DashboardSkeleton() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Génération des hauteurs aléatoires pour les graphiques
  const generateChartBars = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      height: Math.random() * 60 + 30
    }));
  };

  const chartBarsCount = isMobile ? 8 : 12;
  const chartBars1 = generateChartBars(chartBarsCount);
  const chartBars2 = generateChartBars(chartBarsCount);

  return (
    <div className="flex flex-col gap-4 py-8 sm:p-6 md:gap-6 md:py-6 p-4 md:p-6">
      {/* Header avec salutation */}
      <div className="flex items-center justify-between w-full mb-4 md:mb-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48 md:w-64" />
          <Skeleton className="h-4 w-32 md:w-40" />
        </div>
        <Skeleton className="h-10 w-24 md:w-32 rounded-md" />
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-col gap-3 w-full">
        <Skeleton className="h-11 w-full rounded-md" />
        
        {/* Boutons d'actions rapides - responsive */}
        <div className="overflow-x-auto md:overflow-x-visible w-full scrollbar-hide">
          <div className="flex gap-2 md:gap-3 md:flex-wrap w-max md:w-full">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className="h-8 w-28 md:w-32 rounded-md flex-shrink-0 md:flex-1" 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cartes de solde et transactions - responsive */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full mt-4">
        <Card className="shadow-xs w-full md:w-1/2 border-border bg-card">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-20 md:w-24" />
            <Skeleton className="h-8 w-24 md:w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs w-full md:w-1/2 border-border bg-card">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-28 md:w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20 md:w-24" />
                      <Skeleton className="h-3 w-12 md:w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-12 md:w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de revenus et dépenses - responsive */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
        <Card className="shadow-xs w-full md:w-1/2 border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-12 md:w-16" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-20 md:w-32" />
          </CardHeader>
          <CardContent>
            {/* Graphique skeleton - adaptatif */}
            <div className="h-[150px] md:h-[200px] flex items-end justify-between gap-1 md:gap-2">
              {chartBars1.map((bar) => (
                <Skeleton 
                  key={bar.id} 
                  className="rounded-t-sm flex-1 animate-pulse"
                  style={{ 
                    height: `${bar.height}%`,
                    minHeight: '20px'
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs w-full md:w-1/2 border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-12 md:w-16" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-20 md:w-32" />
          </CardHeader>
          <CardContent>
            {/* Graphique skeleton - adaptatif */}
            <div className="h-[150px] md:h-[200px] flex items-end justify-between gap-1 md:gap-2">
              {chartBars2.map((bar) => (
                <Skeleton 
                  key={bar.id} 
                  className="rounded-t-sm flex-1 animate-pulse"
                  style={{ 
                    height: `${bar.height}%`,
                    minHeight: '20px'
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
