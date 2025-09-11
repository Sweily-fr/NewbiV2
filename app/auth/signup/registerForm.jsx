"use client";

import * as React from "react";
import { useForm, FieldError } from "react-hook-form";
import { SubmitButton } from "@/src/components/ui/submit-button";
import { Input, InputPassword, InputEmail } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { registerUser, verifyEmail } from "../../../src/lib/auth/api";
import { signUp } from "../../../src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { useAutoOrganization } from "@/src/hooks/useAutoOrganization";

const RegisterForm = () => {
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
  const invitationId = searchParams.get('invitation');
  const invitationEmail = searchParams.get('email');

  const onSubmit = async (formData) => {
    console.log(formData, "formData");
    await signUp.email(formData, {
      onSuccess: async (context) => {
        toast.success("Vous avez reçu un email de verification");

        console.log("Callback onSuccess - Context:", context);

        // Si c'est une inscription via invitation, accepter l'invitation automatiquement
        if (invitationId) {
          console.log("Inscription via invitation, tentative d'acceptation automatique...");
          
          setTimeout(async () => {
            try {
              const response = await fetch(`/api/invitations/${invitationId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'accept' }),
              });

              if (response.ok) {
                console.log("Invitation acceptée automatiquement après inscription");
                toast.success("Invitation acceptée ! Redirection vers le dashboard...");
                router.push("/dashboard");
                return;
              } else {
                console.error("Erreur lors de l'acceptation automatique de l'invitation");
              }
            } catch (error) {
              console.error("Erreur lors de l'acceptation de l'invitation:", error);
            }
            
            // Fallback: redirection normale
            router.push("/auth/login");
          }, 2000);
        } else {
          // Créer automatiquement une organisation après l'inscription normale
          console.log("Tentative de création automatique d'organisation...");

          setTimeout(async () => {
            // Passer l'utilisateur depuis le contexte si disponible
            const user = context?.user || context?.data?.user;
            console.log("Utilisateur depuis le contexte:", user);

            const result = await createAutoOrganization(user);
            if (result.success) {
              console.log("Organisation créée automatiquement après inscription");
              toast.success("Organisation créée automatiquement");
            } else {
              console.error(
                "Échec de la création automatique d'organisation:",
                result.error
              );
              // Ne pas afficher d'erreur à l'utilisateur car l'inscription a réussi
            }
          }, 3000);

          // Redirection vers la page de connexion après inscription
          router.push("/auth/login");
        }
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

export default RegisterForm;
