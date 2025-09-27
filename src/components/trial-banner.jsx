"use client";

import { useState } from "react";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Clock, Crown, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Composant pour afficher le statut de la période d'essai
 */
export function TrialBanner({ className, onStartTrial, onUpgrade }) {
  const { trial, isActive, loading } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);

  // Ne pas afficher pendant le chargement ou si trial n'est pas défini
  if (loading || !trial) {
    return null;
  }

  // Ne pas afficher si l'utilisateur a un abonnement payant actif
  if (isActive() && !trial.isTrialActive) {
    return null;
  }

  // Ne pas afficher si le banner a été fermé
  if (isDismissed) {
    return null;
  }

  // Ne pas afficher si l'utilisateur a déjà utilisé sa période d'essai et n'est pas en période d'essai
  if (trial.hasUsedTrial && !trial.isTrialActive) {
    return null;
  }

  const handleStartTrial = async () => {
    try {
      await trial.startTrial();
      if (onStartTrial) {
        onStartTrial();
      }
    } catch (error) {
      console.error("Erreur lors du démarrage de la période d'essai:", error);
    }
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };

  const getBannerVariant = () => {
    if (!trial) return "start"; // Fallback sécurisé
    
    if (!trial.isTrialActive && trial.canStartTrial) {
      return "start"; // Peut démarrer l'essai
    }
    
    if (trial.isTrialActive) {
      if (trial.daysRemaining <= 3) {
        return "expiring"; // Expire bientôt
      }
      return "active"; // Essai actif
    }

    return "expired"; // Essai expiré
  };

  const variant = getBannerVariant();

  const bannerConfig = {
    start: {
      bgColor: "bg-blue-50 border-blue-200",
      textColor: "text-blue-900",
      icon: <Crown className="h-5 w-5 text-blue-600" />,
      title: "Démarrez votre essai gratuit",
      message: "Profitez de 14 jours d'accès complet à toutes les fonctionnalités premium de Newbi.",
      actionText: "Démarrer l'essai gratuit",
      action: handleStartTrial,
    },
    active: {
      bgColor: "bg-green-50 border-green-200",
      textColor: "text-green-900",
      icon: <Clock className="h-5 w-5 text-green-600" />,
      title: "Période d'essai active",
      message: trial?.trialMessage || "Votre période d'essai est active",
      actionText: "Passer Pro maintenant",
      action: handleUpgrade,
    },
    expiring: {
      bgColor: "bg-orange-50 border-orange-200",
      textColor: "text-orange-900",
      icon: <Clock className="h-5 w-5 text-orange-600" />,
      title: "Votre essai expire bientôt",
      message: trial?.trialMessage || "Votre période d'essai expire bientôt",
      actionText: "Passer Pro maintenant",
      action: handleUpgrade,
    },
    expired: {
      bgColor: "bg-red-50 border-red-200",
      textColor: "text-red-900",
      icon: <Crown className="h-5 w-5 text-red-600" />,
      title: "Période d'essai expirée",
      message: "Passez Pro pour continuer à utiliser toutes les fonctionnalités de Newbi.",
      actionText: "Passer Pro",
      action: handleUpgrade,
    },
  };

  const config = bannerConfig[variant];

  return (
    <Card className={cn("border-l-4", config.bgColor, className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.icon}
            <div className="flex-1">
              <h3 className={cn("font-semibold text-sm", config.textColor)}>
                {config.title}
              </h3>
              <p className={cn("text-sm mt-1", config.textColor)}>
                {config.message}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={config.action}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {config.actionText}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              className={cn("p-1", config.textColor)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Composant compact pour afficher le statut de la période d'essai dans la sidebar
 */
export function TrialStatusWidget({ className }) {
  const { trial, loading } = useSubscription();

  // Ne pas afficher pendant le chargement ou si trial n'est pas défini
  if (loading || !trial) {
    return null;
  }

  // Ne pas afficher si le trial n'est pas actif ou si il est expiré (0 jours restants)
  if (!trial.isTrialActive || trial.daysRemaining <= 0) {
    return null;
  }

  const getStatusColor = () => {
    if (trial.daysRemaining <= 1) return "text-red-600";
    if (trial.daysRemaining <= 3) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className={cn("flex items-center space-x-2 p-2 bg-gray-50 rounded-lg", className)}>
      <Clock className={cn("h-4 w-4", getStatusColor())} />
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-900">Essai gratuit</p>
        <p className={cn("text-xs", getStatusColor())}>
          {trial.daysRemaining === 0 
            ? "Expire aujourd'hui" 
            : `${trial.daysRemaining} jour${trial.daysRemaining > 1 ? 's' : ''} restant${trial.daysRemaining > 1 ? 's' : ''}`
          }
        </p>
      </div>
    </div>
  );
}
