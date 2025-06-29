"use client";

import * as React from "react";
import { useForm, FieldError } from "react-hook-form";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { registerUser } from "../../../src/lib/auth/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();

  const router = useRouter();

  const onSubmit = async (formData: any) => {
    console.log(formData, "formData");
    try {
      await registerUser(formData);
      toast("Connexion reussie");
      router.push("/login");
    } catch (err: any) {
      setFormError("root", {
        type: "manual",
        message: err.message || "Erreur lors de l'inscription",
      });
      console.error(err);
      toast(err.message || "Erreur lors de l'inscription");
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
          <p className="mt-2 text-sm text-red-500">
            {errors.email.message as React.ReactNode}
          </p>
        )}
      </div>
      <div>
        <Label
          htmlFor="password"
          className="text-sm font-medium text-foreground dark:text-foreground"
        >
          Mot de passe
        </Label>
        <Input
          type="password"
          id="password"
          name="password"
          autoComplete="password"
          placeholder="********"
          className="mt-2"
          {...register("password", {
            required: "Mot de passe est requis",
            minLength: {
              value: 6,
              message: "Le mot de passe doit contenir au moins 8 caractères",
            },
          })}
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-500">
            {errors.password.message as React.ReactNode}
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="mt-4 w-full py-2 font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
      </Button>
    </form>
  );
};

export default RegisterForm;
