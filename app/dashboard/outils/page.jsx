"use client";
import { SectionCards } from "@/src/components/section-cards";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";
import { InputLoader } from "@/src/components/ui/input";
import PricingModal from "@/src/components/pricing-modal";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSubscription } from "@/src/contexts/subscription-context";

export default function Outils() {
  const searchParams = useSearchParams();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const { isActive } = useSubscription();

  // Ouvrir le modal de pricing si le paramètre pricing=true est présent ET que l'utilisateur n'a pas d'abonnement actif
  useEffect(() => {
    if (searchParams.get("pricing") === "true" && !isActive()) {
      setIsPricingModalOpen(true);
    }
  }, [searchParams, isActive]);
  return (
    <div className="flex flex-col p-6 md:py-6">
      {/* <h1 className="text-2xl font-semibold mb-6">Outils</h1> */}
      <h1 className="text-2xl font-medium mb-2">Outils</h1>
      {/* <p className="text-muted-foreground text-sm">
        Gérez efficacement vos outils en un seul endroit.
      </p> */}
      <div className="flex flex-col gap-6 pt-8 w-full">
        {/* <div className="flex items-center justify-between gap-4 w-full">
          <Tabs
            defaultValue="outline"
            className="flex-1 flex-col justify-start gap-6"
          >
            <TabsList>
              <TabsTrigger value="outline">Tout</TabsTrigger>
              <TabsTrigger value="past-performance">
                Financier <Badge variant="secondary">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="key-personnel">
                Marketing <Badge variant="secondary">2</Badge>
              </TabsTrigger>
              <TabsTrigger value="focus-documents">
                Automatisation <Badge variant="secondary">2</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div> */}
        <SectionCards />
      </div>
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
}
