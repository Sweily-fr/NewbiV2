"use client";

import * as React from "react";
import { useForm } from "react-hook-form";

// import { loginUser } from "../../api/userApi";
import { SubmitButton } from "@/src/components/ui/submit-button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { forgetPassword } from "../../../src/lib/auth-client";

const ForgetPasswordForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();

  const router = useRouter();

  const onSubmit = async (formData: any) => {
    await forgetPassword(
      { email: formData.email, redirectTo: "/auth/reset-password" },
      {
        onSuccess: () => {
          toast.success("Un email vous a été envoyé");
          router.push(`/auth/verify?email=${formData.email}`);
        },
        onError: (error) => {
          toast.error("Erreur lors de la reinitialisation du mot de passe");
        },
      }
    );
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
          htmlFor="email"
          className="text-sm font-medium text-foreground dark:text-foreground"
        >
          Email
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          autoComplete="email"
          placeholder="ephraim@blocks.so"
          className="mt-2"
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
      <SubmitButton
        type="submit"
        className="mt-4 w-full py-2 font-medium"
        isLoading={isSubmitting}
      >
        Envoyer le mot de passe
      </SubmitButton>
    </form>
  );
};

export default ForgetPasswordForm;
