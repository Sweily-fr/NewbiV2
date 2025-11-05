"use client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input, InputPassword } from "@/src/components/ui/input";
import { SubmitButton } from "@/src/components/ui/submit-button";
import { resetPassword } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm();

  const onSubmit = async (formData) => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      toast.error("Token invalide");
      return;
    }
    await resetPassword(
      {
        newPassword: formData.password,
        token,
      },
      {
        onSuccess: () => {
          router.push("/auth/login");
          toast.success(
            "Mot de passe reinitialise ! vous pouvez vous connecter"
          );
        },
        onError: (error) => {
          toast.error("Erreur lors de la reinitialisation du mot de passe");
        },
      }
    );
  };
  return (
    <main>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        <div className="w-1/2 flex items-center justify-center p-8">
          <div className="mx-auto sm:max-w-md w-full">
            <h3 className="text-3xl font-semibold text-foreground dark:text-foreground">
              Réinitialisation du mot de passe
            </h3>
            <p className="mt-2 text-sm text-muted-foreground dark:text-muted-foreground">
              Entrez votre nouveau mot de passe pour sécuriser votre compte.
            </p>

            <div className="mt-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Controller
                    name="password"
                    control={control}
                    rules={{
                      required: "Le mot de passe est requis",
                      minLength: {
                        value: 8,
                        message: "Le mot de passe doit contenir au moins 8 caractères",
                      },
                    }}
                    render={({ field }) => (
                      <InputPassword
                        {...field}
                        id="password"
                        autoComplete="new-password"
                        placeholder="Nouveau mot de passe"
                      />
                    )}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <SubmitButton
                  type="submit"
                  className="w-full py-2 font-normal cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Réinitialisation..."
                    : "Réinitialiser le mot de passe"}
                </SubmitButton>
              </form>
            </div>

            <p className="mt-6 text-sm text-muted-foreground dark:text-muted-foreground text-center">
              Vous vous souvenez de votre mot de passe ?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-primary hover:text-primary/90 dark:text-primary hover:dark:text-primary/90"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
        <div className="w-1/2 p-5 flex items-center min-h-screen justify-center">
          <div
            className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center relative"
            style={{ backgroundImage: "url('/BackgroundAuth.svg')" }}
          >
            <div className="bg-white/80 shadow-md rounded-2xl p-6 w-110 mx-auto">
              <div className="text-lg min-h-[27px] flex items-center justify-center">
                <div className="text-center">
                  <p className="font-medium text-[#1C1C1C] text-[15px]">
                    Sécurisez votre compte avec un nouveau mot de passe.
                  </p>
                </div>
              </div>
            </div>
            <img
              src="/ni.svg"
              alt="Newbi Logo"
              className="absolute bottom-2 right-3 w-5 h-auto filter brightness-0 invert"
              style={{ opacity: 0.9 }}
            />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen bg-background flex items-center justify-center pb-8">
        <div className="w-full max-w-sm px-6">
          <img
            src="/ni2.png"
            alt="Newbi Logo"
            className="absolute top-16 left-8"
            width={30}
          />
          <h3 className="text-xl font-medium text-foreground mb-2">
            Réinitialisation du mot de passe
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Entrez votre nouveau mot de passe pour sécuriser votre compte.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Le mot de passe est requis",
                  minLength: {
                    value: 8,
                    message: "Le mot de passe doit contenir au moins 8 caractères",
                  },
                }}
                render={({ field }) => (
                  <InputPassword
                    {...field}
                    id="password"
                    autoComplete="new-password"
                    placeholder="Nouveau mot de passe"
                  />
                )}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <SubmitButton
              type="submit"
              className="w-full py-2 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Réinitialisation..."
                : "Réinitialiser le mot de passe"}
            </SubmitButton>
          </form>
        </div>
      </div>
    </main>
  );
}
