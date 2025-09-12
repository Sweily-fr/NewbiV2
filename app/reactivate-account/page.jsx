"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { toast } from "@/src/components/ui/sonner";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function ReactivateAccountPage() {
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      setMessage("Lien de réactivation invalide");
      return;
    }

    reactivateAccount();
  }, [email, token]);

  const reactivateAccount = async () => {
    try {
      const response = await fetch("/api/account/reactivate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Votre compte a été réactivé avec succès !");
        toast.success("Compte réactivé avec succès");
      } else {
        setStatus("error");
        setMessage(data.error || "Erreur lors de la réactivation");
        toast.error(data.error || "Erreur lors de la réactivation");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setStatus("error");
      setMessage("Erreur de connexion");
      toast.error("Erreur de connexion");
    }
  };

  const handleSignIn = () => {
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img
            className="mx-auto h-30 w-auto"
            src="https://pub-4febea4e469a42638fac4d12ea86064f.r2.dev/newbiLogo.png"
            alt="Newbi"
          />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-medium">
              Réactivation de compte
            </CardTitle>
            <CardDescription className="text-normal">
              Traitement de votre demande de réactivation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "loading" && (
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#5b4fff]" />
                <p className="mt-4 text-gray-600">
                  Réactivation de votre compte en cours...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Compte réactivé !
                </h3>
                <p className="mt-2 text-gray-600">{message}</p>
                <div className="mt-6">
                  <Button onClick={handleSignIn} className="w-full">
                    Se connecter
                  </Button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Erreur de réactivation
                </h3>
                <p className="mt-2 text-gray-600">{message}</p>
                <div className="mt-6 space-y-3">
                  <Button
                    onClick={handleSignIn}
                    variant="outline"
                    className="w-full"
                  >
                    Retour à la connexion
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Besoin d'aide ?{" "}
            <a
              href="mailto:support@newbi.sweily.fr"
              className="text-[#5b4fff] hover:text-[#5b4fff]"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
