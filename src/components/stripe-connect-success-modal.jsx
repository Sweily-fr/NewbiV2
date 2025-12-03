"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/src/components/ui/button";
import { CreditCard } from "lucide-react";
import { getAssetUrl } from "@/src/lib/image-utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

function StripeConnectSuccessModalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Vérifier le paramètre URL pour le succès Stripe Connect
    const stripeConnectSuccess =
      searchParams.get("stripe_connect_success") === "true";

    if (stripeConnectSuccess) {
      setIsOpen(true);

      // Déclencher immédiatement un rafraîchissement du statut
      window.dispatchEvent(new CustomEvent("stripeConfigComplete"));
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

    // Déclencher un événement pour rafraîchir le statut Stripe
    window.dispatchEvent(new CustomEvent("stripeConfigComplete"));

    // Nettoyer l'URL après fermeture
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);
  };

  // Avatars de la communauté (exemples avec images)
  const communityMembers = [
    { id: 1, name: "Marie Dubois", image: "https://i.pravatar.cc/150?img=1" },
    { id: 2, name: "Thomas Martin", image: "https://i.pravatar.cc/150?img=3" },
    { id: 3, name: "Sophie Bernard", image: "https://i.pravatar.cc/150?img=5" },
    { id: 4, name: "Lucas Petit", image: "https://i.pravatar.cc/150?img=7" },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] md:max-h-[90vh] p-0 gap-0 overflow-hidden bg-white dark:bg-[#171717] dark:border-gray-800 w-[95vw] sm:w-full"
        style={{ maxWidth: "58rem" }}
      >
        <VisuallyHidden>
          <DialogTitle>Stripe Connect configuré avec succès</DialogTitle>
        </VisuallyHidden>

        {/* Fond avec dégradé de couleur en haut */}
        <div className="absolute inset-0 bg-white dark:bg-[#171717] -z-10" />
        <div
          className="absolute top-0 left-0 right-0 h-[400px] -z-10 dark:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(90, 80, 255, 0.06) 0%, rgba(147, 51, 234, 0.04) 30%, rgba(236, 72, 153, 0.02) 60%, rgba(255, 255, 255, 0) 100%)",
          }}
        />

        {/* Logo en haut à gauche */}
        <div className="absolute top-4 sm:top-5 left-4 z-10">
          <img
            src={getAssetUrl("NewbiLogo.svg")}
            alt="Logo Newbi"
            className="h-4 sm:h-5 w-16 sm:w-20"
          />
        </div>

        {/* Contenu du modal */}
        <div className="min-h-[500px] sm:min-h-[600px] flex flex-col items-center justify-center px-6 sm:px-16 md:px-32 py-12 sm:py-16 w-full max-w-4xl mx-auto">
          <div className="w-full max-w-xl text-center space-y-4 sm:space-y-6">
            {/* Badge Stripe Connect - au-dessus du titre */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20 text-[#5a50ff] dark:text-[#8b7fff] px-3 py-1 rounded-full text-xs font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.226 5.385c-.584 0-.937.164-.937.593 0 .468.607.674 1.36.93 1.228.415 2.844.963 2.851 2.993C11.5 11.868 9.924 13 7.63 13a7.7 7.7 0 0 1-3.009-.626V9.758c.926.506 2.095.88 3.01.88.617 0 1.058-.165 1.058-.671 0-.518-.658-.755-1.453-1.041C6.026 8.49 4.5 7.94 4.5 6.11 4.5 4.165 5.988 3 8.226 3a7.3 7.3 0 0 1 2.734.505v2.583c-.838-.45-1.896-.703-2.734-.703" />
                </svg>
                Stripe Connect
              </div>
            </div>

            {/* Titre et description */}
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white px-4">
                Votre compte Stripe est configuré !
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-4">
                Vous pouvez maintenant recevoir des paiements pour vos
                transferts de fichiers en toute sécurité.
              </p>
            </div>

            {/* Avatars de la communauté */}
            <div className="flex justify-center items-center gap-2 pt-2">
              <TooltipProvider>
                <div className="flex -space-x-[0.45rem]">
                  {communityMembers.map((member) => (
                    <Tooltip key={member.id}>
                      <TooltipTrigger asChild>
                        <Avatar className="h-8 w-8 ring-2 ring-background cursor-pointer">
                          <AvatarImage src={member.image} alt={member.name} />
                          <AvatarFallback className="text-xs bg-[#5b4fff] text-white">
                            {member.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{member.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
              <span className="text-xs text-muted-foreground">
                +1000 professionnels utilisent Stripe Connect
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Composant wrapper avec Suspense
export function StripeConnectSuccessModal() {
  return (
    <Suspense fallback={null}>
      <StripeConnectSuccessModalContent />
    </Suspense>
  );
}
