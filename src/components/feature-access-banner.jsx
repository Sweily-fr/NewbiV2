"use client";

import { Crown, AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { Button } from "@/src/components/ui/button";
import { useRouter } from "next/navigation";

/**
 * Composant pour afficher une bannière d'information sur l'accès aux fonctionnalités
 */
export function FeatureAccessBanner({ subscriptionInfo, onUpgrade }) {
  const router = useRouter();

  // Ne rien afficher si l'utilisateur a un abonnement payant
  if (subscriptionInfo.isPaid) {
    return null;
  }

  // Bannière pour la période d'essai
  if (subscriptionInfo.isTrial) {
    const daysRemaining = subscriptionInfo.daysRemaining;
    const isExpiringSoon = daysRemaining <= 3;

    return (
      <Alert
        className={`mb-6 ${isExpiringSoon ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : "border-blue-500 bg-blue-50 dark:bg-blue-950"}`}
      >
        <Clock
          className={`h-4 w-4 ${isExpiringSoon ? "text-orange-600" : "text-blue-600"}`}
        />
        <AlertTitle
          className={
            isExpiringSoon
              ? "text-orange-900 dark:text-orange-100"
              : "text-blue-900 dark:text-blue-100"
          }
        >
          {isExpiringSoon
            ? `Votre période d'essai expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`
            : `Période d'essai : ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""}`}
        </AlertTitle>
        <AlertDescription
          className={`flex items-center justify-between ${isExpiringSoon ? "text-orange-800 dark:text-orange-200" : "text-blue-800 dark:text-blue-200"}`}
        >
          <span>
            Profitez de toutes les fonctionnalités Pro gratuitement pendant
            votre essai.
          </span>
          <Button
            size="sm"
            variant={isExpiringSoon ? "default" : "outline"}
            className={
              isExpiringSoon ? "bg-orange-600 hover:bg-orange-700" : ""
            }
            onClick={() => {
              if (onUpgrade) {
                onUpgrade();
              } else {
                router.push("/dashboard?pricing=true");
              }
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            Passer à Pro
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Bannière pour les utilisateurs gratuits
  return (
    <Alert className="mb-6 border-gray-300 bg-gray-50 dark:bg-gray-900">
      <AlertCircle className="h-4 w-4 text-gray-600" />
      <AlertTitle className="text-gray-900 dark:text-gray-100">
        Vous utilisez la version gratuite
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between text-gray-800 dark:text-gray-200">
        <span>
          Passez à Pro pour accéder à toutes les fonctionnalités avancées.
        </span>
        <Button
          size="sm"
          variant="default"
          onClick={() => {
            if (onUpgrade) {
              onUpgrade();
            } else {
              router.push("/dashboard?pricing=true");
            }
          }}
        >
          <Crown className="mr-2 h-4 w-4" />
          Découvrir Pro
        </Button>
      </AlertDescription>
    </Alert>
  );
}
