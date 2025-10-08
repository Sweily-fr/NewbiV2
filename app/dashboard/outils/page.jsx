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
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSubscription } from "@/src/contexts/subscription-context";
import { useSession } from "@/src/lib/auth-client";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function Outils() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("outline");
  const { isActive, loading } = useSubscription();
  const { data: session } = useSession();

  // Ouvrir le modal de pricing si le paramètre pricing=true ou access=restricted est présent
  useEffect(() => {
    // Ne pas ouvrir le modal si on est en train de charger
    if (loading) return;
    
    // Vérifier si l'utilisateur a un abonnement actif
    const hasActiveSubscription = isActive();
    
    console.log('[Outils Page] Vérification modal pricing:', {
      loading,
      hasActiveSubscription,
      pricingParam: searchParams.get("pricing"),
      accessParam: searchParams.get("access"),
    });
    
    // Ne pas ouvrir le modal si l'utilisateur a déjà un abonnement actif
    if (hasActiveSubscription) {
      console.log('[Outils Page] Abonnement actif détecté - Nettoyage des paramètres URL');
      // Nettoyer l'URL si elle contient des paramètres de pricing
      if (searchParams.get("pricing") || searchParams.get("access")) {
        router.replace("/dashboard/outils");
      }
      return;
    }
    
    const shouldOpenPricing = 
      searchParams.get("pricing") === "true" ||
      searchParams.get("access") === "restricted";
    
    if (shouldOpenPricing) {
      console.log('[Outils Page] Ouverture du modal pricing');
      setIsPricingModalOpen(true);
    }
  }, [searchParams, isActive, loading, router]);

  // Fonction pour fermer le modal et nettoyer l'URL
  const handleCloseModal = () => {
    setIsPricingModalOpen(false);
    // Nettoyer les paramètres de l'URL
    if (searchParams.get("pricing") || searchParams.get("access")) {
      router.replace("/dashboard/outils");
    }
  };

  // Afficher le skeleton pendant le chargement
  // if (loading || !session?.user) {
  //   return (
  //     <div className="flex flex-col p-4 md:p-6 md:py-6">
  //       {/* Skeleton du titre */}
  //       <Skeleton className="h-6 md:h-8 w-24 md:w-32 mb-2 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
  //       <Skeleton className="h-3 md:h-4 w-48 md:w-64 mb-6 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />

  //       {/* Skeleton des tabs */}
  //       <div className="flex items-center gap-2 mb-6">
  //         <div className="flex gap-4 border-b pb-2">
  //           {[1, 2, 3, 4].map((i) => (
  //             <Skeleton
  //               key={i}
  //               className="h-6 w-16 md:w-20 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm"
  //             />
  //           ))}
  //         </div>
  //       </div>

  //       {/* Skeleton des cards */}
  //       <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 w-full">
  //         {[1, 2, 3, 4, 5, 6].map((i) => (
  //           <div
  //             key={i}
  //             className="bg-card text-card-foreground border shadow-sm relative overflow-hidden rounded-xl"
  //           >
  //             {/* GridBackground skeleton */}
  //             <div className="absolute inset-0 opacity-20">
  //               <div
  //                 className="absolute inset-0"
  //                 style={{
  //                   backgroundImage: `
  //                   linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
  //                   linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px)
  //                 `,
  //                   backgroundSize: "20px 20px",
  //                 }}
  //               />
  //             </div>

  //             <div className="p-4 relative z-10">
  //               <div className="flex items-start justify-between h-full min-h-[140px]">
  //                 {/* Partie gauche avec contenu */}
  //                 <div className="flex flex-col justify-end h-full pr-4 flex-1">
  //                   {/* Header avec titre et description */}
  //                   <div className="space-y-3">
  //                     <div className="space-y-2">
  //                       <Skeleton className="h-6 w-32 md:w-40 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
  //                       <Skeleton className="h-4 w-48 md:w-56 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
  //                       <Skeleton className="h-4 w-40 md:w-48 bg-[#EBEBEB] dark:bg-[#292929] rounded-sm" />
  //                     </div>
  //                   </div>

  //                   {/* Actions en bas */}
  //                   <div className="flex items-center gap-3 pt-4">
  //                     <Skeleton className="h-8 w-16 bg-[#EBEBEB] dark:bg-[#292929] rounded-md" />
  //                     <Skeleton className="h-8 w-20 bg-[#EBEBEB] dark:bg-[#292929] rounded-md" />
  //                   </div>
  //                 </div>

  //                 {/* Partie droite avec illustration */}
  //                 <div className="flex-shrink-0 w-36 h-36 flex items-center justify-center relative">
  //                   <Skeleton className="w-full h-full bg-[#EBEBEB] dark:bg-[#292929] rounded-xl" />
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col p-4 md:p-6 md:py-6">
      {/* <h1 className="text-2xl font-semibold mb-6">Outils</h1> */}
      <h1 className="text-xl md:text-2xl font-medium mb-2">Outils</h1>
      <p className="text-muted-foreground text-xs md:text-sm">
        Accédez à tous nos outils pour optimiser le développement de votre
        activité
      </p>
      <div className="flex flex-col gap-4 md:gap-6 pt-6 md:pt-8 w-full">
        <div className="flex items-center justify-start gap-2 md:gap-4 w-full">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto items-center"
          >
            <TabsList className="h-auto rounded-none bg-transparent p-0">
              <TabsTrigger
                value="outline"
                className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm"
              >
                Tout
              </TabsTrigger>
              <TabsTrigger
                value="past-performance"
                className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm"
              >
                <span className="hidden md:inline">Financier</span>
                <span className="md:hidden">Fin.</span>
                <Badge variant="secondary" className="ml-1 text-xs font-normal">
                  3
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="key-personnel"
                className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm"
              >
                <span className="hidden md:inline">Marketing</span>
                <span className="md:hidden">Mark.</span>
                <Badge variant="secondary" className="ml-1 text-xs font-normal">
                  2
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="focus-documents"
                className="data-[state=active]:after:bg-primary cursor-pointer relative rounded-none py-2 px-3 md:px-4 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none font-normal text-xs md:text-sm"
              >
                <span className="hidden md:inline">Automatisation</span>
                <span className="md:hidden">Auto.</span>
                <Badge variant="secondary" className="ml-1 text-xs font-normal">
                  1
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <SectionCards activeFilter={activeTab} />
      </div>
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
