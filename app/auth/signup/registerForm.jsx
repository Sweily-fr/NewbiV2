"use client";

import * as React from "react";
import { Suspense } from "react";
import { useForm, FieldError } from "react-hook-form";
import { SubmitButton } from "@/src/components/ui/submit-button";
import { Input, InputPassword, InputEmail } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { registerUser, verifyEmail } from "../../../src/lib/auth/api";
import { signUp } from "../../../src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAutoOrganization } from "@/src/hooks/useAutoOrganization";

const RegisterFormContent = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();

  const router = useRouter();
  const searchParams = useSearchParams();
  const { createAutoOrganization } = useAutoOrganization();

  // Récupérer les paramètres d'invitation
  const invitationId = searchParams.get("invitation");
  const invitationEmail = searchParams.get("email");

  const onSubmit = async (formData) => {
    await signUp.email(formData, {
      onSuccess: async (context) => {
        toast.success("Vous avez reçu un email de verification");

        // Si c'est une inscription via invitation, stocker l'invitationId pour l'accepter après la connexion
        if (invitationId && invitationEmail) {
          // Stocker dans localStorage pour l'utiliser après la connexion
          localStorage.setItem("pendingInvitation", JSON.stringify({
            invitationId,
            email: invitationEmail,
            timestamp: Date.now()
          }));
          
          console.log(`📋 Invitation ${invitationId} stockée pour acceptation après connexion`);
          
          toast.info("Veuillez vérifier votre email puis vous connecter pour rejoindre l'organisation.");
        }

        // Redirection vers la page de connexion après inscription
        router.push("/auth/login");
      },
      onError: (error) => {
        toast.error("Erreur lors de l'inscription");
      },
    });
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
        <Label
          htmlFor="password"
          className="text-sm font-medium text-foreground dark:text-foreground"
        >
          Mot de passe
        </Label>
        <InputPassword
          id="password"
          name="password"
          autoComplete="password"
          placeholder="Saisissez votre mot de passe"
          className="mt-2"
          {...register("password", {
            required: "Mot de passe est requis",
            minLength: {
              value: 8,
              message: "Le mot de passe doit contenir au moins 8 caractères",
            },
          })}
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      <SubmitButton
        type="submit"
        className="mt-4 w-full py-2 font-medium"
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
