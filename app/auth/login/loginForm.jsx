"use client";

import * as React from "react";
import { useForm } from "react-hook-form";

import { SubmitButton } from "@/src/components/ui/submit-button";
import { Input, InputPassword, InputEmail } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { authClient } from "../../../src/lib/auth-client";
import { TwoFactorModal } from "./components/TwoFactorModal";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();

  const router = useRouter();
  const [show2FA, setShow2FA] = React.useState(false);
  const [twoFactorData, setTwoFactorData] = React.useState(null);

  const onSubmit = async (formData) => {
    await authClient.signIn.email(formData, {
      onSuccess: (ctx) => {
        // Vérifier si l'utilisateur doit passer par la 2FA
        if (ctx.data.twoFactorRedirect) {
          console.log("🔐 2FA requise pour cet utilisateur");
          setTwoFactorData(ctx.data);
          setShow2FA(true);

          // Envoyer automatiquement l'OTP
          handleSend2FA();
          return;
        }

        // Connexion normale sans 2FA
        const authToken = ctx.response.headers.get("set-auth-token");
        localStorage.setItem("bearer_token", authToken);
        toast.success("Connexion réussie");

        // Vérifier s'il y a un callbackUrl dans les paramètres URL
        const urlParams = new URLSearchParams(window.location.search);
        const callbackUrl = urlParams.get("callbackUrl");

        if (callbackUrl) {
          console.log("🔄 Redirection vers callbackUrl:", callbackUrl);
          router.push(callbackUrl);
        } else {
          console.log("🔄 Redirection vers dashboard par défaut");
          router.push("/dashboard");
        }
      },
      onError: (error) => {
        toast.error("Erreur lors de la connexion");
      },
    });
  };

  const handleSend2FA = async () => {
    try {
      const { data, error } = await authClient.twoFactor.sendOtp();

      if (error) {
        console.error("Erreur envoi OTP:", error);
        toast.error("Erreur lors de l'envoi du code de vérification");
        return;
      }

      console.log("OTP envoyé:", data);
      toast.success("Code de vérification envoyé");
    } catch (error) {
      console.error("Erreur envoi OTP:", error);
      toast.error("Erreur lors de l'envoi du code de vérification");
    }
  };

  const handleVerify2FA = async (code) => {
    try {
      const { data, error } = await authClient.twoFactor.verifyOtp({
        code: code,
      });

      if (error) {
        console.error("Erreur vérification 2FA:", error);
        toast.error("Code de vérification incorrect");
        return false;
      }

      console.log("2FA vérifiée avec succès:", data);
      toast.success("Connexion réussie");

      // Redirection après vérification 2FA réussie
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get("callbackUrl");

      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push("/dashboard");
      }

      return true;
    } catch (error) {
      console.error("Erreur vérification 2FA:", error);
      toast.error("Code de vérification incorrect");
      return false;
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
          htmlFor="email"
          className="text-sm font-medium text-foreground dark:text-foreground"
        >
          Email
        </Label>
        <InputEmail
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
        <InputPassword
          id="password"
          name="password"
          autoComplete="password"
          placeholder="Saisissez votre mot de passe"
          className="mt-2"
          {...register("password", {
            required: "Mot de passe est requis",
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
        Se connecter
      </SubmitButton>

      {/* Modal de vérification 2FA */}
      <TwoFactorModal
        isOpen={show2FA}
        onClose={() => setShow2FA(false)}
        onVerify={handleVerify2FA}
      />
    </form>
  );
};

export default LoginForm;
