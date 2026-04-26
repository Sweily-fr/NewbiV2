"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { SubmitButton } from "@/src/components/ui/submit-button";
import { InputEmail } from "@/src/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { forgetPassword } from "../../../src/lib/auth-client";

const ForgetPasswordForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const router = useRouter();

  const onSubmit = async (formData) => {
    await forgetPassword(
      { email: formData.email, redirectTo: "/auth/reset-password" },
      {
        onSuccess: () => {
          toast.success("Un email vous a été envoyé");
          router.push(`/auth/verify?email=${formData.email}`);
        },
        onError: () => {
          toast.error("Erreur lors de la réinitialisation du mot de passe");
        },
      },
    );
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
          {...register("email", {
            required: "Email est requis",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Email invalide",
            },
          })}
        />
      </div>
      {errors.email && (
        <p className="text-xs" style={{ color: "#e1243a" }}>
          {errors.email.message}
        </p>
      )}
      <SubmitButton
        type="submit"
        variant="outline"
        className="mt-2 w-full h-11 font-medium cursor-pointer bg-white rounded-lg"
        isLoading={isSubmitting}
      >
        Envoyer le lien
      </SubmitButton>
    </form>
  );
};

export default ForgetPasswordForm;
