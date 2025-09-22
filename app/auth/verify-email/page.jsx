"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");
      
      console.log("🔍 Début de la vérification d'email");
      console.log("🎫 Token:", token);
      console.log("❌ Erreur URL:", error);
      
      if (error === "missing-token") {
        setVerificationStatus("error");
        setMessage("Token de vérification manquant dans le lien");
        return;
      }
      
      if (!token) {
        setVerificationStatus("error");
        setMessage("Token de vérification manquant");
        return;
      }

      try {
        console.log("📤 Envoi de la requête de vérification...");
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        console.log("📥 Réponse reçue:", response.status, response.statusText);
        const data = await response.json();
        console.log("📄 Données de réponse:", data);

        if (response.ok) {
          console.log("✅ Vérification réussie");
          setVerificationStatus("success");
          setMessage("Votre email a été vérifié avec succès !");
          toast.success("Email vérifié avec succès !");
          
          // Rediriger vers la page de connexion après 3 secondes
          setTimeout(() => {
            router.push("/auth/login");
          }, 3000);
        } else {
          console.log("❌ Erreur de vérification:", data);
          console.log("❌ Détails de l'erreur:", JSON.stringify(data, null, 2));
          setVerificationStatus("error");
          setMessage(data.error || "Erreur lors de la vérification");
          if (data.details) {
            console.log("🔍 Détails techniques:", data.details);
          }
          toast.error("Erreur lors de la vérification");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la vérification:", error);
        setVerificationStatus("error");
        setMessage("Erreur lors de la vérification");
        toast.error("Erreur lors de la vérification");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const getIcon = () => {
    switch (verificationStatus) {
      case "loading":
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case "error":
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Mail className="h-12 w-12 text-gray-500" />;
    }
  };

  const getTitle = () => {
    switch (verificationStatus) {
      case "loading":
        return "Vérification en cours...";
      case "success":
        return "Email vérifié !";
      case "error":
        return "Erreur de vérification";
      default:
        return "Vérification d'email";
    }
  };

  const getDescription = () => {
    switch (verificationStatus) {
      case "loading":
        return "Nous vérifions votre adresse email, veuillez patienter...";
      case "success":
        return "Votre compte a été activé avec succès. Vous allez être redirigé vers la page de connexion.";
      case "error":
        return message || "Une erreur s'est produite lors de la vérification de votre email.";
      default:
        return "Vérification de votre adresse email en cours...";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl font-bold">
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-center">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationStatus === "success" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Redirection automatique dans 3 secondes...
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Se connecter maintenant
                </Link>
              </Button>
            </div>
          )}
          
          {verificationStatus === "error" && (
            <div className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/auth/login">
                  Retour à la connexion
                </Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/auth/register">
                  Créer un nouveau compte
                </Link>
              </Button>
            </div>
          )}
          
          {verificationStatus === "loading" && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Cette opération peut prendre quelques secondes...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
