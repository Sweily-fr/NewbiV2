"use client";

import React, { useEffect, useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { useForm } from "react-hook-form";
import { toast } from "@/src/components/ui/sonner";
import { updateUser, useSession } from "@/src/lib/auth-client";
import { GraphQLProfileImageUpload } from "@/src/components/profile/GraphQLProfileImageUpload";
import { ChangeEmailModal } from "../../../app/dashboard/account/components/ChangeEmailModal";
import { ChangePasswordModal } from "../../../app/dashboard/account/components/ChangePasswordModal";
import { ChangePhoneModal } from "../../../app/dashboard/account/components/ChangePhoneModal";
import { DeactivateAccountModal } from "../../../app/dashboard/account/components/DeactivateAccountModal";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import Link from "next/link";
import { Callout } from "@/src/components/ui/callout";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import { CreditCard, ExternalLink } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

export default function UserInfoSection({ onTabChange }) {
  const { data: session, isPending, error, refetch } = useSession();
  const { isActive: isPremium } = useSubscription();
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  // États pour les modales
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isChangePhoneModalOpen, setIsChangePhoneModalOpen] = useState(false);
  const [isDeactivateAccountModalOpen, setIsDeactivateAccountModalOpen] =
    useState(false);
  const [isStripeConfigAlertOpen, setIsStripeConfigAlertOpen] = useState(false);

  // Hook Stripe Connect
  const {
    isConnected: stripeConnected,
    canReceivePayments,
    accountStatus,
    isLoading: isStripeLoading,
    error: stripeError,
    stripeAccount,
    connectStripe,
    disconnectStripe,
    openStripeDashboard,
    refetchStatus,
    clearError,
  } = useStripeConnect(session?.user?.id);

  // Gérer les erreurs Stripe
  useEffect(() => {
    if (stripeError) {
      console.error("Erreur Stripe:", stripeError);
    }
  }, [stripeError]);

  // Gérer les paramètres de retour de Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stripeSuccess = urlParams.get("stripe_success");
    const stripeRefresh = urlParams.get("stripe_refresh");

    if (stripeSuccess === "true") {
      refetchStatus();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (stripeRefresh === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchStatus]);

  const handleStripeConnect = async () => {
    if (session?.user?.email) {
      await connectStripe(session.user.email);
    }
  };

  const handleStripeDisconnect = async () => {
    await disconnectStripe();
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      email: "",
      name: "",
      lastName: "",
      phoneNumber: "",
    },
  });

  // Mettre à jour les valeurs du formulaire lorsque les données de session sont disponibles
  useEffect(() => {
    if (session?.user) {
      reset({
        email: session.user.email || "",
        name: session.user.name || "",
        lastName: session.user.lastName || "",
        phoneNumber: session.user.phoneNumber || "",
      });
      // Initialiser l'image de profil
      setProfileImageUrl(session.user.avatar || null);
    }
  }, [session, reset]);

  // Fonction pour mettre à jour automatiquement les champs
  const handleFieldUpdate = async (fieldName, value) => {
    if (!value.trim()) return;

    // Vérifier si la valeur a changé
    const currentValue =
      fieldName === "name" ? session?.user?.name : session?.user?.lastName;
    if (value === currentValue) return;

    const updateData = { [fieldName]: value };

    try {
      await updateUser(updateData, {
        onSuccess: () => {
          toast.success(
            `${fieldName === "name" ? "Prénom" : "Nom"} mis à jour`
          );
          refetch();
        },
        onError: (error) => {
          console.error("Erreur mise à jour:", error);
          toast.error("Erreur lors de la mise à jour");
        },
      });
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleImageChange = (imageUrl, uploadData) => {
    setProfileImageUrl(imageUrl);
    // Recharger la session immédiatement pour refléter le changement
    refetch();
  };

  const handleImageDelete = () => {
    setProfileImageUrl(null);
    // Recharger la session immédiatement pour refléter le changement
    refetch();
  };

  return (
    <div className="space-y-16">
      <div>
        <h2 className="text-lg font-medium mb-1">Mon compte</h2>
        <Separator className="hidden md:block" />

        <div className="space-y-6 mt-8">
          {/* Section Informations personnelles */}
          <div>
            <h3 className="text-base font-medium mb-2">
              Informations personnelles
            </h3>
            <Separator />
          </div>

          <div className="flex items-start gap-6 mb-6">
            <GraphQLProfileImageUpload
              currentImageUrl={profileImageUrl}
              onImageChange={handleImageChange}
              onImageDelete={handleImageDelete}
              showDescription={true}
              size="lg"
            />
            <div className="flex justify-center items-center gap-4 mt-2">
              <div>
                <Label
                  htmlFor="name"
                  className="text-sm text-muted-foreground gap-1"
                >
                  Prénom
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Prénom"
                  defaultValue={session?.user?.name || ""}
                  className="mt-2"
                  {...register("name")}
                  onBlur={(e) => handleFieldUpdate("name", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Sécurité du compte */}
        <div className="space-y-6 mt-8">
          <div>
            <h3 className="text-base font-medium mb-2">Sécurité du compte</h3>
            <Separator />
          </div>

          {/* E-mail */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">E-mail</h4>
              <p className="text-xs text-gray-400">{session?.user?.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-normal ml-4 flex-shrink-0"
              onClick={() => setIsChangeEmailModalOpen(true)}
            >
              Changer d'adresse e-mail
            </Button>
          </div>

          {/* Numéro de téléphone */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Numéro de téléphone</h4>
              <p className="text-xs text-gray-400">
                {session?.user?.phoneNumber || "Non renseigné"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-normal ml-4 flex-shrink-0"
              type="button"
              onClick={() => setIsChangePhoneModalOpen(true)}
            >
              Modifier votre numéro
            </Button>
          </div>

          {/* Mot de passe */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1">Mot de passe</h4>
              <p className="text-xs text-gray-400">
                Modifiez votre mot de passe pour vous connecter à votre compte.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-normal ml-4 flex-shrink-0"
              onClick={() => setIsChangePasswordModalOpen(true)}
            >
              Modifier le mot de passe
            </Button>
          </div>

          {/* Stripe Connect */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="#5A50FF"
                  class="bi bi-stripe"
                  viewBox="0 0 16 16"
                >
                  <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.226 5.385c-.584 0-.937.164-.937.593 0 .468.607.674 1.36.93 1.228.415 2.844.963 2.851 2.993C11.5 11.868 9.924 13 7.63 13a7.7 7.7 0 0 1-3.009-.626V9.758c.926.506 2.095.88 3.01.88.617 0 1.058-.165 1.058-.671 0-.518-.658-.755-1.453-1.041C6.026 8.49 4.5 7.94 4.5 6.11 4.5 4.165 5.988 3 8.226 3a7.3 7.3 0 0 1 2.734.505v2.583c-.838-.45-1.896-.703-2.734-.703" />
                </svg>
                <h4 className="text-sm font-normal">Stripe Connect</h4>
                {stripeConnected && (
                  <Badge
                    variant="default"
                    className="bg-[#5A50FF]/10 text-[#5A50FF]/80 border-[#5A50FF]/30 text-xs font-normal"
                  >
                    Actif
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {stripeConnected
                  ? canReceivePayments
                    ? "Recevez des paiements pour vos transferts de fichiers"
                    : "Finalisation de la configuration requise"
                  : "Connectez votre compte pour recevoir des paiements"}
              </p>
              {stripeAccount && !stripeAccount.isOnboarded && (
                <p className="text-xs text-[#5A50FF] mt-1">
                  *Configuration incomplète - Certaines actions sont requises
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4 flex-shrink-0">
              {stripeConnected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (stripeAccount && !stripeAccount.isOnboarded) {
                        setIsStripeConfigAlertOpen(true);
                      } else {
                        openStripeDashboard();
                      }
                    }}
                    className="font-normal"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Tableau de bord
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStripeDisconnect}
                    disabled={isStripeLoading}
                    className="font-normal"
                  >
                    {isStripeLoading ? "..." : "Déconnecter"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleStripeConnect}
                  disabled={isStripeLoading || !session?.user?.id}
                  size="sm"
                  className="bg-[#635BFF] hover:bg-[#5A54E5] text-white font-normal disabled:opacity-50"
                >
                  {isStripeLoading ? "Connexion..." : "Connecter Stripe"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Section Désactivation du compte */}
        <div className="space-y-6 mt-8">
          <div>
            <h3 className="text-base font-medium mb-2">
              Désactivation du compte
            </h3>
            <Separator />
          </div>

          {/* Avertissement pour les utilisateurs premium */}
          {isPremium() && (
            <Callout type="danger" noMargin>
              <h4 className="text-sm font-medium mb-2">
                Abonnement actif détecté
              </h4>
              <p className="text-xs mb-3">
                Vous avez un abonnement premium actif. Avant de désactiver votre
                compte, vous devez d'abord annuler votre abonnement pour éviter
                des frais futurs.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTabChange && onTabChange("subscription")}
                className="text-red-700 bg-transparent border-red-300 hover:text-red-700 hover:border-red-300 hover:bg-red-100 cursor-pointer"
              >
                Gérer mon abonnement
              </Button>
            </Callout>
          )}

          {/* Désactiver mon compte */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-normal mb-1 text-destructive">
                Désactiver mon compte
              </h4>
              <p className="text-xs text-gray-400">
                Vous désactiverez définitivement le compte ainsi que l'accès à
                tous les espaces de travail. Vos données seront conservées.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-normal text-destructive border-destructive hover:text-destructive-foreground ml-4 flex-shrink-0"
              onClick={() => setIsDeactivateAccountModalOpen(true)}
              disabled={isPremium()}
            >
              Désactiver
            </Button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        onClose={() => setIsChangeEmailModalOpen(false)}
        currentEmail={session?.user?.email}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      <ChangePhoneModal
        isOpen={isChangePhoneModalOpen}
        onClose={() => setIsChangePhoneModalOpen(false)}
        currentPhone={session?.user?.phoneNumber}
      />

      <DeactivateAccountModal
        isOpen={isDeactivateAccountModalOpen}
        onClose={() => setIsDeactivateAccountModalOpen(false)}
        userEmail={session?.user?.email}
      />

      {/* Modal de confirmation Stripe */}
      <AlertDialog open={isStripeConfigAlertOpen} onOpenChange={setIsStripeConfigAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configuration Stripe incomplète</AlertDialogTitle>
            <AlertDialogDescription>
              Votre compte Stripe nécessite une configuration supplémentaire. 
              Continuer vers le tableau de bord Stripe pour compléter la configuration ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                openStripeDashboard();
                setIsStripeConfigAlertOpen(false);
              }}
              className="bg-[#5A50FF] hover:bg-[#5A50FF]/90"
            >
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
