"use client";

import * as React from "react";
import { Suspense } from "react";
import { useForm, FieldError, Controller } from "react-hook-form";
import { SubmitButton } from "@/src/components/ui/submit-button";
import { Input, InputPassword, InputEmail } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PasswordStrengthInput } from "@/src/components/ui/password-strength-input";
import { registerUser, verifyEmail } from "../../../src/lib/auth/api";
import { signUp } from "../../../src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useRouter, useSearchParams } from "next/navigation";

const RegisterFormContent = ({ onSuccess: onSuccessProp }) => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Récupérer les paramètres d'invitation
  const invitationId = searchParams.get("invitation");
  const invitationEmail = searchParams.get("email");

  // Récupérer le code partenaire
  const partnerCode = searchParams.get("partner");

  const onSubmit = async (formData) => {
    // Ajouter le code partenaire si présent
    if (partnerCode) {
      formData.referredBy = partnerCode;
    }

    // Selon la doc Better Auth, l'erreur est retournée directement dans { data, error }
    const { data, error } = await signUp.email(
      { ...formData, name: formData.name || "" },
      {
        onSuccess: async (ctx) => {
          // ✅ Si c'est une inscription via invitation, accepter l'invitation immédiatement
          // L'utilisateur invité n'a PAS d'organisation propre, il rejoint celle de l'inviteur
          if (invitationId && invitationEmail) {
            console.log(
              `📨 [SIGNUP] Inscription via invitation détectée: ${invitationId}`,
            );

            try {
              // Accepter l'invitation immédiatement
              const response = await fetch(`/api/invitations/${invitationId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "accept" }),
              });

              if (response.ok) {
                const result = await response.json();
                console.log(`✅ [SIGNUP] Invitation acceptée:`, result);

                // ✅ CRITIQUE: Stocker l'organizationId dans localStorage pour Apollo Client
                // Le backend retourne l'organizationId après acceptation
                if (result.organizationId) {
                  localStorage.setItem(
                    "active_organization_id",
                    result.organizationId,
                  );
                  console.log(
                    `📦 [SIGNUP] Organization ID stocké: ${result.organizationId}`,
                  );
                }

                // ✅ Rafraîchir la session Better Auth pour obtenir le nouveau activeOrganizationId
                const { authClient } = await import("@/src/lib/auth-client");

                // Définir l'organisation active côté client
                if (result.organizationId) {
                  await authClient.organization.setActive({
                    organizationId: result.organizationId,
                  });
                  console.log(
                    `🔄 [SIGNUP] Organisation active définie côté client`,
                  );
                }

                toast.success(
                  "Bienvenue ! Vous avez rejoint l'organisation avec succès.",
                );

                // hasSeenOnboarding + onboardingStep set server-side in /api/invitations/[id] (Sprint 2)

                // Rediriger directement vers le dashboard
                router.push("/dashboard?welcome=invited");
                return;
              } else {
                const errorData = await response.json();
                console.error(
                  `❌ [SIGNUP] Erreur acceptation invitation:`,
                  errorData,
                );

                // Si l'invitation a échoué, rediriger quand même vers l'onboarding
                toast.error(
                  errorData.error ||
                    "Erreur lors de l'acceptation de l'invitation",
                );
              }
            } catch (invError) {
              console.error(
                `❌ [SIGNUP] Exception acceptation invitation:`,
                invError,
              );
              toast.error("Erreur lors de l'acceptation de l'invitation");
            }

            // En cas d'erreur, stocker l'invitation pour réessayer plus tard
            localStorage.setItem(
              "pendingInvitation",
              JSON.stringify({
                invitationId,
                email: invitationEmail,
                timestamp: Date.now(),
              }),
            );
          }

          // Transition vers la création d'espace de travail
          // onboardingStep: "workspace" is already set by user.create hook in auth.js
          if (onSuccessProp) {
            onSuccessProp();
          } else {
            window.location.reload();
          }
        },
        onError: (ctx) => {
          // L'erreur est gérée via le retour { data, error }
        },
      },
    );

    // Vérifier l'erreur retournée directement (selon la doc Better Auth)
    if (error) {
      // Better Auth peut retourner l'erreur dans différents formats
      let errorMessage = "Erreur lors de l'inscription";

      // Essayer différentes sources de message
      if (error.message) {
        errorMessage = error.message;
      } else if (error.statusText) {
        errorMessage = error.statusText;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Gérer les erreurs spécifiques
      if (
        errorMessage.toLowerCase().includes("email") &&
        errorMessage.toLowerCase().includes("exist")
      ) {
        toast.error("Cet email est déjà utilisé");
      } else if (errorMessage.toLowerCase().includes("already")) {
        toast.error("Cet email est déjà utilisé");
      } else if (errorMessage.toLowerCase().includes("utilisé")) {
        toast.error("Cet email est déjà utilisé");
      } else if (errorMessage.toLowerCase().includes("duplicate")) {
        toast.error("Cet email est déjà utilisé");
      } else if (errorMessage.toLowerCase().includes("unique")) {
        toast.error("Cet email est déjà utilisé");
      } else if (error.status === 500) {
        // Erreur serveur - probablement email dupliqué (contrainte unique MongoDB)
        toast.error("Cet email est déjà utilisé");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <form
      action="#"
      method="post"
      className="space-y-3"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <InputEmail
          id="email"
          name="email"
          autoComplete="email"
          placeholder="Saisissez votre email"
          className="h-11 placeholder:font-normal rounded-lg"
          defaultValue={invitationEmail || ""}
          {...register("email", {
            required: "Email est requis",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email invalide",
            },
          })}
        />
      </div>
      <div>
        <Controller
          name="password"
          control={control}
          rules={{
            required: "Mot de passe est requis",
            minLength: {
              value: 8,
              message: "Le mot de passe doit contenir au moins 8 caractères",
            },
            validate: {
              hasNumber: (value) =>
                /[0-9]/.test(value) || "Doit contenir au moins 1 chiffre",
              hasLowercase: (value) =>
                /[a-z]/.test(value) || "Doit contenir au moins 1 minuscule",
              hasUppercase: (value) =>
                /[A-Z]/.test(value) || "Doit contenir au moins 1 majuscule",
            },
          }}
          render={({ field }) => (
            <PasswordStrengthInput
              {...field}
              label=""
              error=""
              className="h-11 placeholder:font-normal rounded-lg"
            />
          )}
        />
      </div>
      {(errors.email || errors.password) && (
        <p className="text-xs" style={{ color: "#e1243a" }}>
          {errors.email
            ? "Veuillez saisir une adresse email valide pour continuer."
            : errors.password?.type === "required"
              ? "Un mot de passe est nécessaire pour sécuriser votre compte."
              : "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre."}
        </p>
      )}
      <SubmitButton
        type="submit"
        variant="outline"
        className="mt-2 w-full h-11 font-medium cursor-pointer bg-white rounded-lg"
        isLoading={isSubmitting}
      >
        S'inscrire
      </SubmitButton>
    </form>
  );
};

const RegisterForm = ({ onSuccess }) => {
  return (
    <Suspense fallback={null}>
      <RegisterFormContent onSuccess={onSuccess} />
    </Suspense>
  );
};

export default RegisterForm;
