"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel
} from "@/src/components/ui/alert-dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Copy, Users, Check } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import StripeConnectOnboarding from "@/src/components/stripe/StripeConnectOnboarding";
import { useUser } from "@/src/lib/auth/hooks";
import { useMutation } from "@apollo/client";
import { GENERATE_REFERRAL_LINK, CHECK_STRIPE_CONNECT_FOR_REFERRAL } from "@/src/graphql/mutations/referral";
import { useSubscription } from "@/src/contexts/subscription-context";

export function ReferralButton() {
  const { session: user } = useUser();
  const { isActive } = useSubscription();
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  const [showStripeOnboarding, setShowStripeOnboarding] = useState(false);
  const [showStripeSetupDialog, setShowStripeSetupDialog] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState("");

  // Vérifier si l'utilisateur a un abonnement actif
  const isPro = isActive();

  // Hook Stripe Connect (même logique que transfert de fichiers)
  const {
    isConnected: stripeConnected,
    canReceivePayments,
    isLoading: stripeLoading,
    stripeAccount,
    refetchStatus,
    checkAndUpdateAccountStatus,
  } = useStripeConnect(user?.user?.id);

  // Mutations pour le parrainage
  const [generateReferralLink] = useMutation(GENERATE_REFERRAL_LINK);
  const [checkStripeConnect] = useMutation(CHECK_STRIPE_CONNECT_FOR_REFERRAL);

  // Vérifier le statut Stripe Connect au chargement et après retour d'onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSuccess = urlParams.get('stripe_success');
    
    if (stripeSuccess === 'true' && user?.user?.id) {
      console.log('🔄 Retour d\'onboarding Stripe détecté, rafraîchissement du statut...');
      // Attendre un peu pour que Stripe synchronise les données
      setTimeout(() => {
        checkAndUpdateAccountStatus();
      }, 2000);
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [user?.user?.id, checkAndUpdateAccountStatus]);

  const handleReferralClick = async () => {
    if (!isPro) {
      toast.error("Vous devez avoir un abonnement actif pour parrainer");
      return;
    }

    try {
      // Forcer une vérification du statut Stripe Connect avant de continuer
      console.log("🔄 Vérification du statut Stripe Connect...");
      await checkAndUpdateAccountStatus();
      
      // Attendre un peu pour que les données se mettent à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Si Stripe Connect est déjà configuré, générer directement le lien
      if (stripeConnected && canReceivePayments) {
        console.log("✅ Stripe Connect configuré, génération du lien de parrainage");
        const { data } = await generateReferralLink();
        
        if (data?.generateReferralLink?.success) {
          setReferralCode(data.generateReferralLink.referralCode);
          setShowReferralDialog(true);
        } else {
          toast.error(data?.generateReferralLink?.message || "Erreur lors de la génération du lien de parrainage");
        }
        return;
      }

      // Si Stripe Connect n'est pas configuré, afficher l'AlertDialog d'explication
      console.log("⚠️ Stripe Connect non configuré, affichage de l'explication");
      const { data: stripeData } = await checkStripeConnect();
      
      if (!stripeData?.checkStripeConnectForReferral?.success) {
        toast.error(stripeData?.checkStripeConnectForReferral?.message || "Erreur lors de la vérification Stripe");
        return;
      }

      const stripeStatus = stripeData.checkStripeConnectForReferral;

      // Sauvegarder l'URL d'onboarding et afficher l'AlertDialog d'explication
      if (stripeStatus.onboardingUrl) {
        setOnboardingUrl(stripeStatus.onboardingUrl);
      }
      setShowStripeSetupDialog(true);
    } catch (error) {
      console.error("❌ Erreur génération lien parrainage:", error);
      toast.error("Erreur lors de la génération du lien de parrainage");
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/auth/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Lien de parrainage copié !");
    
    setTimeout(() => setCopied(false), 2000);
  };

  // Ne pas afficher le bouton si l'utilisateur n'est pas pro
  if (!isPro) {
    return null;
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleReferralClick}
        className="flex items-center gap-2 text-sm bg-[#5b50ff] text-white border-[#5b50ff] hover:bg-[#4a42d9] hover:border-[#4a42d9] cursor-pointer"
        disabled={stripeLoading}
      >
        <Users className="h-4 w-4" />
        50€ | Parrainez un amis
      </Button>

      {/* Dialog pour afficher le lien de parrainage */}
      <AlertDialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Votre lien de parrainage</AlertDialogTitle>
            <AlertDialogDescription>
              Partagez ce lien avec vos contacts. Vous recevrez 50€ lorsqu'ils souscriront à un abonnement annuel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="referral-link">Lien de parrainage</Label>
              <div className="flex gap-2">
                <Input
                  id="referral-link"
                  value={`${window.location.origin}/auth/signup?ref=${referralCode}`}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={copyReferralLink}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Comment ça marche ?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Votre filleul s'inscrit via votre lien</li>
                <li>• Il souscrit à un abonnement annuel</li>
                <li>• Vous recevez 50€ par virement</li>
              </ul>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Fermer</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog d'explication pour la configuration Stripe Connect */}
      <AlertDialog open={showStripeSetupDialog} onOpenChange={setShowStripeSetupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configuration requise pour le parrainage</AlertDialogTitle>
            <AlertDialogDescription>
              Pour pouvoir parrainer vos amis et recevoir vos récompenses de 50€, vous devez d'abord configurer votre compte de paiement Stripe Connect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Pourquoi cette étape ?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Stripe Connect nous permet de vous verser vos récompenses de parrainage</li>
                <li>• C'est un processus sécurisé géré directement par Stripe</li>
                <li>• Une fois configuré, vous pourrez générer vos liens de parrainage</li>
                <li>• Vous recevrez 50€ pour chaque filleul qui souscrit un abonnement annuel</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Configuration rapide</h4>
              <p className="text-sm text-green-800">
                La configuration ne prend que quelques minutes. Vous aurez besoin de vos informations bancaires pour recevoir les paiements.
              </p>
            </div>
          </div>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <Button
              onClick={() => {
                setShowStripeSetupDialog(false);
                if (onboardingUrl) {
                  window.location.href = onboardingUrl;
                } else {
                  setShowStripeOnboarding(true);
                }
              }}
              className="bg-[#5b50ff] hover:bg-[#4a42d9]"
            >
              Configurer Stripe Connect
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Stripe Connect Onboarding */}
      <StripeConnectOnboarding
        isOpen={showStripeOnboarding}
        onClose={() => setShowStripeOnboarding(false)}
        userId={user?.user?.id}
        userEmail={user?.user?.email}
        onSuccess={() => {
          setShowStripeOnboarding(false);
          // Après connexion Stripe, relancer la génération du code
          handleReferralClick();
        }}
      />
    </>
  );
}
