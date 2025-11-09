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

const RegisterFormContent = () => {
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

  const onSubmit = async (formData) => {
    // Selon la doc Better Auth, l'erreur est retournée directement dans { data, error }
    const { data, error } = await signUp.email(formData, {
      onSuccess: async (ctx) => {
        toast.success("Vous avez reçu un email de verification");

        // Si c'est une inscription via invitation, stocker l'invitationId pour l'accepter après la connexion
        if (invitationId && invitationEmail) {
          // Stocker dans localStorage pour l'utiliser après la connexion
          localStorage.setItem(
            "pendingInvitation",
            JSON.stringify({
              invitationId,
              email: invitationEmail,
              timestamp: Date.now(),
            })
          );

          console.log(
            `📋 Invitation ${invitationId} stockée pour acceptation après connexion`
          );

          toast.info(
            "Veuillez vérifier votre email puis vous connecter pour rejoindre l'organisation."
          );
        }

        // Redirection vers la page de connexion après inscription
        router.push("/auth/login");
      },
      onError: (ctx) => {
        // L'erreur est gérée via le retour { data, error }
      },
    });

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
      className="mt-6 space-y-4"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div>
        <Label
          htmlFor="email-register-04"
          className="text-sm font-medium text-foreground dark:text-foreground"
        >
          Email
        </Label>
        <InputEmail
          id="email"
          name="email"
          autoComplete="email"
          placeholder="Saisissez votre email"
          className="mt-2"
          defaultValue={invitationEmail || ""}
          {...register("email", {
            required: "Email est requis",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email invalide",
            },
          })}
        />
        {errors.email && (
          <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
        )}
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
              label="Mot de passe"
              error={errors.password?.message}
            />
          )}
        />
      </div>
      <SubmitButton
        type="submit"
        className="mt-4 w-full py-2 font-medium cursor-pointer"
        isLoading={isSubmitting}
      >
        S'inscrire
      </SubmitButton>
    </form>
  );
};

const RegisterForm = () => {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <RegisterFormContent />
    </Suspense>
  );
};

export default RegisterForm;
