import React, { useEffect, useState } from "react";
import { Label } from "@/src/components/ui/label";
import { Input, InputEmail, InputPhone } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { useForm } from "react-hook-form";
import { toast } from "@/src/components/ui/sonner";
import { updateUser, useSession } from "../../../src/lib/auth-client";
import { GraphQLProfileImageUpload } from "@/src/components/profile/GraphQLProfileImageUpload";
import {
  ChangeEmailModal,
  ChangePasswordModal,
  Setup2FAModal,
  AddPasskeyModal,
  ChangePhoneModal,
} from "./components";
import { DeactivateAccountModal } from "./components/DeactivateAccountModal";

export default function ProfileForm({ user }) {
  const { data: session, isPending, error, refetch } = useSession();
  const [profileImageUrl, setProfileImageUrl] = useState(null);

  // États pour les modales
  const [isChangeEmailModalOpen, setIsChangeEmailModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isSetup2FAModalOpen, setIsSetup2FAModalOpen] = useState(false);
  const [isAddPasskeyModalOpen, setIsAddPasskeyModalOpen] = useState(false);
  const [isChangePhoneModalOpen, setIsChangePhoneModalOpen] = useState(false);
  const [isDeactivateAccountModalOpen, setIsDeactivateAccountModalOpen] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, dirtyFields },
    setError: setFormError,
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

  const onSubmit = async (formData) => {
    const updateData = {
      name: formData.name,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
    };

    // Avec GraphQL, l'avatar est automatiquement mis à jour côté serveur
    // Pas besoin de l'inclure dans updateData car l'upload GraphQL
    // gère déjà la mise à jour de l'avatar utilisateur

    await updateUser(updateData, {
      onSuccess: () => {
        toast.success("Profil mis à jour avec succès");
        // Recharger la session pour obtenir les nouvelles données
        refetch();
      },
      onError: (error) => {
        console.error("Erreur mise à jour profil:", error);
        toast.error("Erreur lors de la mise à jour du profil");
      },
    });
  };

  // Fonction pour mettre à jour automatiquement les champs
  const handleFieldUpdate = async (fieldName, value) => {
    if (!value.trim()) return;

    // Vérifier si la valeur a changé
    const currentValue = fieldName === "name" ? user?.name : user?.lastName;
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

    // Optionnel: recharger la session immédiatement pour refléter le changement
    refetch();
  };

  const handleImageDelete = async () => {
    // Supprimer immédiatement l'image de l'état local (temps réel)
    setProfileImageUrl(null);

    // Recharger la session en arrière-plan
    try {
      await refetch();
    } catch (error) {
      console.error("Erreur lors du rechargement de session:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
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
                defaultValue={user?.name || ""}
                className="mt-2"
                {...register("name")}
                onBlur={(e) => handleFieldUpdate("name", e.target.value)}
              />
            </div>
            {/* <div>
              <Label
                htmlFor="lastName"
                className="text-sm text-muted-foreground"
              >
                Nom
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Nom"
                defaultValue={user?.lastName || ""}
                className="mt-2"
                {...register("lastName")}
                onBlur={(e) => handleFieldUpdate("lastName", e.target.value)}
              />
            </div> */}
          </div>
        </div>

        {/* <div>
          <Label
            htmlFor="newEmail"
            className="text-sm font-medium text-foreground dark:text-foreground"
          >
            Nouvelle adresse email
          </Label>
          <Input
            type="email"
            id="newEmail"
            placeholder="Nouvelle adresse email"
            className="mt-2"
            {...register("newEmail", {
              required: "La nouvelle adresse email est requise",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Adresse email invalide",
              },
            })}
          />
          {errors.newEmail && (
            <p className="mt-2 text-sm text-red-500">
              {errors.newEmail.message}
            </p>
          )}
        </div> */}
      </div>

      {/* Section Sécurité du compte */}
      {/* <Separator className="my-6" /> */}
      <div className="py-6">
        <h3 className="text-lg font-medium mb-6">Sécurité du compte</h3>
        <Separator className="my-4" />

        {/* E-mail */}
        <div className="flex items-center justify-between py-4 border-b border-border/40">
          <div>
            <h4 className="text-sm font-medium text-foreground">E-mail</h4>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-normal"
            onClick={() => setIsChangeEmailModalOpen(true)}
          >
            Changer d'adresse e-mail
          </Button>
        </div>

        {/* Numéro de téléphone */}
        <div className="flex items-center justify-between py-4 border-b border-border/40">
          <div>
            <h4 className="text-sm font-medium text-foreground">
              Numéro de téléphone
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.phoneNumber || "Non renseigné"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-normal"
            type="button"
            onClick={() => setIsChangePhoneModalOpen(true)}
          >
            Modifier votre numéro
          </Button>
        </div>

        {/* Mot de passe */}
        <div className="flex items-center justify-between py-4 border-b border-border/40">
          <div>
            <h4 className="text-sm font-medium text-foreground">
              Mot de passe
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Modifiez votre mot de passe pour vous connecter à votre compte.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-normal"
            onClick={() => setIsChangePasswordModalOpen(true)}
          >
            Modifier le mot de passe
          </Button>
        </div>

        {/* Vérification en 2 étapes */}
        {/* <div className="flex items-center justify-between py-4 border-b border-border/40">
          <div>
            <h4 className="text-sm font-medium text-foreground">
              Vérification en 2 étapes
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez une couche de sécurité supplémentaire lors de la connexion
              à votre compte.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-normal"
            onClick={() => setIsSetup2FAModalOpen(true)}
          >
            Ajouter une méthode de vérification
          </Button>
        </div> */}

        {/* Clés d'accès */}
        {/* <div className="flex items-center justify-between py-4">
          <div>
            <h4 className="text-sm font-medium text-foreground">
              Clés d'accès
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Connectez-vous en toute sécurité avec une authentification
              biométrique sur l'appareil.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-normal"
          >
            Ajouter une clé d'accès
          </Button>
        </div> */}
      </div>

      {/* Modales */}
      <ChangeEmailModal
        isOpen={isChangeEmailModalOpen}
        onClose={() => setIsChangeEmailModalOpen(false)}
        currentEmail={user?.email}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      <Setup2FAModal
        isOpen={isSetup2FAModalOpen}
        onClose={() => setIsSetup2FAModalOpen(false)}
      />

      <AddPasskeyModal
        isOpen={isAddPasskeyModalOpen}
        onClose={() => setIsAddPasskeyModalOpen(false)}
      />

      <ChangePhoneModal
        isOpen={isChangePhoneModalOpen}
        onClose={() => setIsChangePhoneModalOpen(false)}
        currentPhone={user?.phoneNumber}
      />

      <DeactivateAccountModal
        isOpen={isDeactivateAccountModalOpen}
        onClose={() => setIsDeactivateAccountModalOpen(false)}
        userEmail={user?.email}
      />
    </form>
  );
}
