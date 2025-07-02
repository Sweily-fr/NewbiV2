"use client";

import * as React from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "../../../src/lib/auth-client";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();

  const router = useRouter();

  const onSubmit = async (formData) => {
    await signIn.email(formData, {
      onSuccess: () => {
        toast.success("Connexion reussie");
        router.push("/dashboard");
      },
      onError: (error) => {
        toast.error("Erreur lors de la connexion");
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
          })}
        />
        {errors.password && (
          <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="mt-4 w-full py-2 font-medium cursor-pointer"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Connexion en cours..." : "Se connecter"}
      </Button>
    </form>
  );
};

export default LoginForm;
