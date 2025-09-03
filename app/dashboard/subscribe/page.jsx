"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Loader2,
  Check,
  Crown,
  HelpCircle,
  Mail,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { useSubscription } from "@/src/contexts/subscription-context";
import { useSession } from "@/src/lib/auth-client";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

export default function SubscribePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { isActive, loading, subscription } = useSubscription();
  const { data: session } = useSession();

  const handleUpgrade = async (plan) => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await authClient.getSession();

      if (!sessionData?.session?.activeOrganizationId) {
        toast.error("Aucune organisation active trouvée");
        return;
      }

      const activeOrgId = sessionData.session.activeOrganizationId;

      const upgradeParams = {
        plan: plan,
        referenceId: activeOrgId,
        successUrl: `${window.location.origin}/dashboard`,
        cancelUrl: `${window.location.origin}/dashboard/subscribe`,
        disableRedirect: false,
      };

      const { data, error } =
        await authClient.subscription.upgrade(upgradeParams);

      if (error) {
        toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      } else {
        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      toast.error(`Exception: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openCancelModal = () => {
    setShowCancelModal(true);
  };

  const handleCancellation = async () => {
    setIsLoading(true);
    try {
      // Logique de résiliation immédiate
      toast.success("Abonnement résilié avec succès");
      setShowCancelModal(false);
    } catch (error) {
      toast.error("Erreur lors de la résiliation");
    } finally {
      setIsLoading(false);
    }
  };

  const applyPromoCode = () => {
    if (promoCode.trim()) {
      toast.success("Code promo appliqué avec succès");
    } else {
      toast.error("Le code promo est invalide ou expiré");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5b4fff]" />
      </div>
    );
  }

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Fonction pour formater le prix (pas besoin de diviser par 100, les données sont déjà en euros)
  const formatPrice = (amount, currency = "EUR") => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Récupérer le prix depuis Stripe (nécessite un appel à l'API Stripe)
  const getSubscriptionPrice = () => {
    // Pour l'instant, on utilise un prix par défaut
    // TODO: Récupérer le vrai prix depuis l'API Stripe avec le priceId
    return subscription?.plan === "pro" ? 14.99 : 0;
  };

  const plans = [
    {
      name: "Gratuit",
      price: "0 € par mois",
      description:
        "Pour organiser tous les aspects de votre vie personnelle et professionnelle",
      features: [
        "Kanban",
        "Signature d'e‑mail",
        "Newbi Calendar",
        "Accès communauté",
      ],
      current: !isActive(),
    },
    {
      name: "Pro",
      price: "13,99 € par mois facturation annuelle",
      monthlyPrice: "14,99 € facturation mensuelle",
      description: "Toutes les fonctionnalités pour développer votre activité",
      features: [
        "Facturation complète (devis → factures, TVA, relances)",
        "Devis",
        "Connexion comptes bancaires",
        "Gestion de trésorerie",
        "OCR des reçus et factures",
        "Transfert de fichiers sécurisé",
        "Gestion client",
        "Catalogue produits et services",
      ],
      current: isActive(),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-medium">Gestion de l'abonnement</h1>
      </div>

      <div className="space-y-6">
        {/* Section Forfait actif */}
        <div className="border border-gray-200 dark:bg-[#252525] dark:border-[#313131]/90 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">
                  {isActive() ? "Pro" : "Gratuit"}
                </h3>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isActive()
                      ? "border-[#5b50fe] text-[#5b50fe]"
                      : "border-gray-300 text-gray-600"
                  }`}
                >
                  {isActive() ? "Actuel" : "Actuel"}
                </Badge>
              </div>
              <p className="text-sm dark:text-gray-300 mb-3">
                {isActive()
                  ? "Toutes les fonctionnalités pour développer votre activité"
                  : "Pour organiser tous les aspects de votre vie personnelle et professionnelle"}
              </p>
              {isActive() && subscription && (
                <div className="space-y-1 text-xs text-gray-500">
                  <p>
                    {formatPrice(getSubscriptionPrice())} TTC / mois • EUR
                    {subscription.status === "trialing" && " (Période d'essai)"}
                  </p>
                  <p>
                    Période en cours : {formatDate(subscription.periodStart)} →{" "}
                    {formatDate(subscription.periodEnd)}
                  </p>
                  <p>
                    {subscription.status === "trialing"
                      ? `Fin de l'essai : ${formatDate(subscription.periodEnd)}`
                      : `Prochain prélèvement : ${formatDate(subscription.periodEnd)} - ${formatPrice(getSubscriptionPrice())} TTC`}
                  </p>
                  <p className="text-xs">
                    Plan : {subscription.plan}
                    {/* • ID: {subscription.stripeSubscriptionId} */}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {!isActive() ? (
                <>
                  <p className="text-xs text-gray-400 mb-3 max-w-sm">
                    Passez à un forfait supérieur pour débloquer plus de
                    fonctionnalités
                  </p>
                  <Button
                    size="sm"
                    className="bg-[#5b50fe] hover:bg-[#5b50fe] cursor-pointer text-white"
                    onClick={() => handleUpgrade("pro")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      "Passer à Pro"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="destructive"
                  className="cursor-pointer"
                  size="sm"
                  onClick={openCancelModal}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    "Résilier"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Section Tous les forfaits */}
        <div>
          <h2 className="text-lg font-medium mb-4">Tous les forfaits</h2>

          {/* Section Comparaison des forfaits */}
          <div className="flex justify-between gap-4 mb-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex-1 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4 flex flex-col ${
                  index === 1 ? "border-[#5b50fe] relative" : ""
                }`}
              >
                {index === 1 && (
                  <Badge className="absolute -top-3 right-6 bg-[#5b50fe] text-white text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Recommandé
                  </Badge>
                )}

                <div className="mb-3">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#5b50fe] font-medium">
                    {plan.price}
                  </p>
                  {plan.monthlyPrice && (
                    <p className="text-xs text-gray-500">{plan.monthlyPrice}</p>
                  )}
                </div>

                <div className="space-y-2 mb-4 flex-grow">
                  {plan.features.slice(0, 5).map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.features.length > 5 && (
                    <p className="text-xs text-gray-500 ml-5">
                      +{plan.features.length - 5} autres fonctionnalités
                    </p>
                  )}
                </div>

                {index === 1 && !isActive() && (
                  <Button
                    className="w-full bg-[#5b50fe] hover:bg-[#5b50fe] text-white text-sm cursor-pointer mt-auto"
                    onClick={() => handleUpgrade("pro")}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      "Passer à Pro"
                    )}
                  </Button>
                )}

                {index === 0 && !isActive() && (
                  <Button
                    variant="outline"
                    className="w-full text-sm mt-auto"
                    disabled
                  >
                    Forfait actuel
                  </Button>
                )}

                {index === 1 && isActive() && (
                  <Button
                    variant="outline"
                    className="w-full text-sm mt-auto"
                    disabled
                  >
                    Forfait actuel
                  </Button>
                )}

                {index === 0 && isActive() && (
                  <Button
                    className="w-full text-sm mt-auto cursor-pointer"
                    onClick={openCancelModal}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      "Rétrograder vers Gratuit"
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* <div className="flex justify-between gap-4">
          <div className="flex-1 basis-1/2 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Promotions et crédits</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Code promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={applyPromoCode} size="sm">
                  Appliquer
                </Button>
              </div>
              <p className="text-xs">
                Crédits disponibles: 12,00 € TTC — appliqués automatiquement à
                la prochaine facture
              </p>
            </div>
          </div>

          <div className="flex-1 basis-1/2 border border-gray-200 dark:border-[#313131]/90 dark:bg-[#252525] rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Aide & conformité</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Centre d'aide
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contacter le support
                </Button>
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-gray-500">
                <p>RGPD: export/suppression des données sur demande.</p>
                <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Contacter le DPO
                </Button>
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Modal de confirmation de résiliation */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmer la résiliation
            </DialogTitle>
            <DialogDescription className="text-left">
              Êtes-vous sûr de vouloir résilier votre abonnement Pro ? Cette
              action est irréversible et vous perdrez l'accès à toutes les
              fonctionnalités premium.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 my-4">
            <h4 className="font-medium text-sm mb-2">
              Fonctionnalités que vous perdrez :
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Facturation complète (devis → factures, TVA, relances)</li>
              <li>• Connexion comptes bancaires</li>
              <li>• Gestion de trésorerie</li>
              <li>• OCR des reçus et factures</li>
              <li>• Transfert de fichiers sécurisé</li>
              <li>• Gestion client avancée</li>
              <li>• Catalogue produits et services</li>
            </ul>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancellation}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Résiliation...
                </>
              ) : (
                "Confirmer la résiliation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
