"use client";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { SubmitButton } from "@/src/components/ui/submit-button";
import { resetPassword } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function ResetPasswordPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
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
      <div className="flex h-screen">
        <div className="w-1/2 p-5 flex items-center min-h-screen justify-center">
          <div
            className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center"
            style={{ backgroundImage: "url('/backgroundLogin.png')" }}
          ></div>
        </div>
        <div className="w-1/2 flex items-center justify-center p-32">
          <div className="sm:mx-auto sm:max-w-3xl w-full px-4">
            <Card>
              <CardHeader className="">
                <CardTitle>Reinitialisation du mot de passe</CardTitle>
                <CardDescription>
                  Veuillez entrer votre nouveau mot de passe
                </CardDescription>
                <Input
                  type="password"
                  id="password"
                  autoComplete="password"
                  placeholder="Mot de passe"
                  className="mt-2"
                  {...register("password", {
                    required: "Mot de passe est requis",
                  })}
                />
                <SubmitButton
                  type="submit"
                  className="mt-4 w-full py-2 font-medium cursor-pointer"
                  onClick={handleSubmit(onSubmit)}
                >
                  Reinitialiser le mot de passe
                </SubmitButton>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
