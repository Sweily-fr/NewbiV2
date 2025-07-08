"use client";

import { Suspense } from "react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function DebugInvoicesPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Debug - Page Factures</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test de base</h2>
        <Button 
          onClick={() => console.log('Bouton cliqué')}
          className="bg-primary text-primary-foreground"
        >
          Tester le clic (vérifiez la console)
        </Button>
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">Test de chargement</h2>
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <div className="p-4 border rounded-md">
            <p>Contenu chargé avec succès</p>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
