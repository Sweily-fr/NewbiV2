"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/src/components/ui/button";
import { X, Crown } from "lucide-react";
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

export function SubscriptionSuccessModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState(null); // 'new_org' ou 'upgrade'

  useEffect(() => {
    // Vérifier les paramètres URL pour déterminer le type de succès
    const orgCreated = searchParams.get("org_created") === "true";
    const paymentSuccess = searchParams.get("payment_success") === "true";
    const subscriptionSuccess =
      searchParams.get("subscription_success") === "true";

    if (orgCreated && paymentSuccess) {
      setModalType("new_org");
      setIsOpen(true);
    } else if (subscriptionSuccess || paymentSuccess) {
      setModalType("upgrade");
      setIsOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    setIsOpen(false);

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

  const getContent = () => {
    if (modalType === "new_org") {
      return {
        title: "Votre organisation est prête !",
        description:
          "Vous rejoignez une communauté de professionnels qui utilisent Newbi pour développer leur activité.",
      };
    } else {
      return {
        title: "Bienvenue dans Newbi Pro !",
        description:
          "Vous rejoignez une communauté de professionnels qui utilisent Newbi pour développer leur activité.",
      };
    }
  };

  if (!isOpen) return null;

  const content = getContent();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90vh] md:max-h-[90vh] p-0 gap-0 overflow-hidden bg-white dark:bg-[#171717] dark:border-gray-800 w-[95vw] sm:w-full"
        style={{ maxWidth: "58rem" }}
      >
        <VisuallyHidden>
          <DialogTitle>{content.title}</DialogTitle>
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

        {/* Bouton fermer en haut à droite */}
        {/* <button
          onClick={handleClose}
          className="absolute top-4 sm:top-5 right-4 z-10 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button> */}

        {/* Contenu du modal */}
        <div className="min-h-[500px] sm:min-h-[600px] flex flex-col items-center justify-center px-6 sm:px-16 md:px-32 py-12 sm:py-16 w-full max-w-4xl mx-auto">
          <div className="w-full max-w-xl text-center space-y-4 sm:space-y-6">
            {/* Badge Pro avec couronne - au-dessus du titre */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 bg-[#5a50ff]/10 dark:bg-[#5a50ff]/20 text-[#5a50ff] dark:text-[#8b7fff] px-3 py-1 rounded-full text-xs font-medium">
                <Crown className="w-3 h-3" />
                Pro
              </div>
            </div>

            {/* Titre et description */}
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white px-4">
                {content.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed px-4">
                {content.description}
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
                          <AvatarImage
                            src={member.image}
                            alt={member.name}
                          />
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
                +1000 professionnels
              </span>
            </div>

            {/* Bouton de fermeture */}
            {/* <Button
              onClick={handleClose}
              className="gap-2 px-6 py-2.5 text-sm font-normal cursor-pointer bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 w-full sm:w-auto"
            >
              Fermer
            </Button> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
