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
import { useSession } from "@/src/lib/auth-client";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function Outils() {
  const searchParams = useSearchParams();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("outline");
  const { isActive, loading } = useSubscription();
  const { data: session } = useSession();

  // Ouvrir le modal de pricing si le paramètre pricing=true est présent ET que l'utilisateur n'a pas d'abonnement actif
  useEffect(() => {
    if (searchParams.get("pricing") === "true" && !isActive()) {
      setIsPricingModalOpen(true);
    }
  }, [searchParams, isActive]);

  // Afficher le skeleton pendant le chargement
  if (loading || !session?.user) {
    return (
      <div className="flex flex-col p-6 md:py-6">
        <Skeleton className="h-8 w-32 mb-2 bg-[#EBEBEB] rounded-sm" />
        <div className="flex flex-col gap-6 pt-8 w-full">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-0 shadow-sm p-2 rounded-lg">
                <div className="flex flex-row h-full">
                  <div className="flex flex-col p-2 flex-1 justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-7 w-7 bg-[#EBEBEB] rounded-md" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-24 bg-[#EBEBEB] rounded-sm" />
                        <Skeleton className="h-4 w-32 bg-[#EBEBEB] rounded-sm" />
                      </div>
                    </div>
                    <div className="pt-6">
                      <Skeleton className="h-4 w-16 bg-[#EBEBEB] rounded-sm" />
                    </div>
                  </div>
                  <div className="w-1/2 rounded-xl m-1 p-2">
                    <Skeleton className="h-full w-full bg-[#EBEBEB] rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 md:py-6">
      {/* <h1 className="text-2xl font-semibold mb-6">Outils</h1> */}
      <h1 className="text-2xl font-medium mb-2">Outils</h1>
      <p className="text-muted-foreground text-sm">
        Accédez à tous nos outils pour optimiser le développement de votre
        activité
      </p>
      <div className="flex flex-col gap-6 pt-8 w-full">
        <div className="flex items-center justify-between gap-4 w-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex-col justify-start gap-6"
          >
            <TabsList>
              <TabsTrigger value="outline" className="font-normal">
                Tout
              </TabsTrigger>
              <TabsTrigger value="past-performance" className="font-normal">
                Financier <Badge variant="secondary">3</Badge>
              </TabsTrigger>
              <TabsTrigger value="key-personnel" className="font-normal">
                Marketing <Badge variant="secondary">2</Badge>
              </TabsTrigger>
              <TabsTrigger value="focus-documents" className="font-normal">
                Automatisation <Badge variant="secondary">1</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <SectionCards activeFilter={activeTab} />
      </div>
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </div>
  );
}
