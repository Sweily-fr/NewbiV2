"use client";

import { Crown, Lock, Settings } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useRouter } from "next/navigation";

/**
 * Composant pour afficher un message d'accès refusé avec actions appropriées
 */
export function AccessDeniedCard({
  reason,
  featureName,
  onUpgrade,
  onSettings,
}) {
  const router = useRouter();

  const getContent = () => {
    switch (reason) {
      case "no_pro_subscription":
        return {
          icon: <Crown className="h-12 w-12 text-orange-500" />,
          title: "Fonctionnalité Premium",
          description: `L'accès à ${featureName} nécessite un abonnement Pro. Découvrez toutes les fonctionnalités disponibles et passez à Pro dès maintenant.`,
          action: {
            label: "Découvrir Pro",
            variant: "default",
            onClick: () => {
              if (onUpgrade) {
                onUpgrade();
              } else {
                router.push("/dashboard?pricing=true");
              }
            },
          },
          secondaryAction: {
            label: "Retour aux outils",
            variant: "outline",
            onClick: () => router.push("/dashboard"),
          },
        };

      case "trial_not_allowed":
        return {
          icon: <Crown className="h-12 w-12 text-orange-500" />,
          title: "Abonnement payant requis",
          description: `${featureName} nécessite un abonnement payant actif. La période d'essai ne donne pas accès à cette fonctionnalité.`,
          action: {
            label: "Souscrire maintenant",
            variant: "default",
            onClick: () => {
              if (onUpgrade) {
                onUpgrade();
              } else {
                router.push("/dashboard?pricing=true");
              }
            },
          },
          secondaryAction: {
            label: "Retour aux outils",
            variant: "outline",
            onClick: () => router.push("/dashboard"),
          },
        };

      case "incomplete_company_info":
        return {
          icon: <Lock className="h-12 w-12 text-red-500" />,
          title: "Configuration requise",
          description: `Pour accéder à ${featureName}, vous devez d'abord compléter les informations de votre entreprise dans les paramètres.`,
          action: {
            label: "Compléter mon profil",
            variant: "default",
            onClick: () => {
              if (onSettings) {
                onSettings();
              } else {
                router.push("/dashboard/settings?tab=generale");
              }
            },
          },
          secondaryAction: {
            label: "Retour aux outils",
            variant: "outline",
            onClick: () => router.push("/dashboard"),
          },
        };

      default:
        return {
          icon: <Lock className="h-12 w-12 text-gray-500" />,
          title: "Accès refusé",
          description: `Vous n'avez pas accès à ${featureName} pour le moment.`,
          action: {
            label: "Retour aux outils",
            variant: "default",
            onClick: () => router.push("/dashboard"),
          },
          secondaryAction: null,
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{content.icon}</div>
          <CardTitle className="text-2xl">{content.title}</CardTitle>
          <CardDescription className="text-base mt-2">
            {content.description}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            variant={content.action.variant}
            onClick={content.action.onClick}
          >
            {content.action.label}
          </Button>
          {content.secondaryAction && (
            <Button
              className="w-full"
              variant={content.secondaryAction.variant}
              onClick={content.secondaryAction.onClick}
            >
              {content.secondaryAction.label}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
