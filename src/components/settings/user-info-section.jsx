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
import { useSubscription } from "@/src/contexts/subscription-context";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

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
        <Separator />

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
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <TriangleAlert className="text-red-800" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Abonnement actif détecté
                  </h4>
                  <p className="text-xs text-red-700 mb-3">
                    Vous avez un abonnement premium actif. Avant de désactiver
                    votre compte, vous devez d'abord annuler votre abonnement
                    pour éviter des frais futurs.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTabChange && onTabChange("subscription")}
                    className="text-red-700 bg-transparent border-red-300 hover:text-red-700 hover:border-red-300 hover:bg-red-100 cursor-pointer"
                  >
                    Gérer mon abonnement
                  </Button>
                </div>
              </div>
            </div>
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
    </div>
  );
}
