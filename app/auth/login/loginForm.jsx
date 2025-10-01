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
import { EmailVerificationDialog } from "./components/EmailVerificationDialog";

// Fonction pour s'assurer qu'une organisation active est définie
const ensureActiveOrganization = async () => {
  try {
    // Récupérer les organisations de l'utilisateur
    const { data: organizations, error: orgsError } =
      await authClient.organization.list();

    if (orgsError) {
      console.error(
        "Erreur lors de la récupération des organisations:",
        orgsError
      );
      return;
    }

    // Vérifier s'il y a déjà une organisation active
    const { data: activeOrg } = await authClient.organization.getActive();

    if (activeOrg) {
      return;
    }

    // Si pas d'organisation active et qu'il y a des organisations disponibles
    if (organizations && organizations.length > 0) {
      const { error: setActiveError } = await authClient.organization.setActive(
        {
          organizationId: organizations[0].id,
        }
      );

      if (setActiveError) {
        console.error(
          "Erreur lors de la définition de l'organisation active:",
          setActiveError
        );
      } else {
        console.log("✅ Organisation active définie avec succès");
      }
    } else {
      try {
        // Récupérer l'utilisateur actuel depuis la session
        const { data: session } = await authClient.getSession();
        const user = session?.user;

        if (!user || !user.id) {
          console.error(
            "❌ Utilisateur non disponible dans la session:",
            session
          );
          return;
        }

        // Générer le nom et le slug de l'organisation
        const organizationName =
          user.name || `Espace ${user.email.split("@")[0]}'s`;
        const organizationSlug = `org-${user.id.slice(-8)}`;

        // Créer l'organisation directement avec authClient
        const result = await authClient.organization.create({
          name: organizationName,
          slug: organizationSlug,
          metadata: {
            autoCreated: true,
            createdAt: new Date().toISOString(),
          },
          keepCurrentActiveOrganization: false,
        });

        if (result.error) {
          console.error(
            "❌ Erreur lors de la création de l'organisation:",
            result.error
          );
        } else {
          toast.success("Bienvenue ! Votre espace de travail a été créé.");
        }
      } catch (error) {
        console.error("❌ Erreur lors de la création automatique:", error);
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la vérification de l'organisation active:",
      error
    );
  }
};

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
  const [showEmailVerification, setShowEmailVerification] =
    React.useState(false);
  const [userEmailForVerification, setUserEmailForVerification] =
    React.useState("");

  React.useEffect(() => {
  }, [showEmailVerification, userEmailForVerification]);

  const onSubmit = async (formData) => {
    await authClient.signIn.email(formData, {
      onSuccess: async (ctx) => {
        // Vérifier si l'utilisateur doit passer par la 2FA
        if (ctx.data.twoFactorRedirect) {
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

        // Définir l'organisation active après la connexion
        await ensureActiveOrganization();

        // Vérifier s'il y a des paramètres d'invitation dans l'URL
        const urlParams = new URLSearchParams(window.location.search);
        const invitationId = urlParams.get("invitation");
        const invitationEmail = urlParams.get("email");
        const callbackUrl = urlParams.get("callbackUrl");

        // Si c'est une connexion via invitation, accepter automatiquement l'invitation
        if (invitationId && invitationEmail) {
          try {
            const response = await fetch(`/api/invitations/${invitationId}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ action: "accept" }),
            });

            if (response.ok) {
              const result = await response.json();
              toast.success(
                "Invitation acceptée ! Bienvenue dans l'organisation."
              );
            } else {
              console.error(
                "❌ Erreur lors de l'acceptation automatique de l'invitation"
              );
              toast.error("Erreur lors de l'acceptation de l'invitation");
            }
          } catch (error) {
            console.error(
              "❌ Erreur lors de l'acceptation automatique:",
              error
            );
            toast.error("Erreur lors de l'acceptation de l'invitation");
          }
        }

        if (callbackUrl) {
          router.push(callbackUrl);
        } else {
          // Vérifier si l'utilisateur a un plan Pro
          try {
            const { data: session } = await authClient.getSession();
            const organizationId = session?.session?.activeOrganizationId;
            
            if (organizationId) {
              const { data: subscriptions } = await authClient.subscription.list({
                query: {
                  referenceId: organizationId,
                },
              });
              
              const hasActiveSubscription = subscriptions?.some(
                (sub) => sub.status === "active" || sub.status === "trialing"
              );
              
              // Rediriger vers /dashboard si Pro, sinon vers /dashboard/outils
              router.push(hasActiveSubscription ? "/dashboard" : "/dashboard/outils");
            } else {
              // Pas d'organisation, rediriger vers /dashboard/outils par défaut
              router.push("/dashboard/outils");
            }
          } catch (error) {
            console.error("Erreur lors de la vérification de l'abonnement:", error);
            // En cas d'erreur, rediriger vers /dashboard/outils par défaut
            router.push("/dashboard/outils");
          }
        }
      },
      onError: async (error) => {

        // Essayer différents formats d'erreur
        let errorMessage = null;

        if (error.message) {
          errorMessage = error.message;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        // Vérifier si c'est une erreur de compte désactivé
        if (
          errorMessage &&
          (errorMessage.includes("désactivé") ||
            errorMessage.includes("réactivation"))
        ) {
          toast.error(errorMessage);
          return;
        }

        // Vérifier si c'est une erreur de vérification d'email
        if (
          errorMessage &&
          (errorMessage.includes("vérifier votre adresse email") ||
            errorMessage.includes("email avant de vous connecter") ||
            errorMessage.includes("Veuillez vérifier"))
        ) {
          // L'utilisateur existe mais n'a pas vérifié son email
          setUserEmailForVerification(formData.email);
          setShowEmailVerification(true);
          return;
        }

        // Vérifier si l'utilisateur existe mais n'a pas vérifié son email (fallback)
        if (formData.email) {
          try {
            const response = await fetch("/api/auth/check-user", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email: formData.email }),
            });

            if (response.ok) {
              const userData = await response.json();

              if (userData.exists && !userData.emailVerified) {
                // L'utilisateur existe mais n'a pas vérifié son email
                setUserEmailForVerification(formData.email);
                setShowEmailVerification(true);
                return;
              }
            }
          } catch (checkError) {
            console.log(
              "❌ Erreur lors de la vérification de l'utilisateur:",
              checkError
            );
          }
        }

        // Erreur générique pour les autres cas
        toast.error("Email ou mot de passe incorrect");
      },
    });
  };

  const handleSend2FA = async () => {
    try {
      const { data, error } = await authClient.twoFactor.sendOtp();

      if (error) {
        toast.error("Erreur lors de l'envoi du code de vérification");
        return;
      }

      toast.success("Code de vérification envoyé");
    } catch (error) {
      toast.error("Erreur lors de l'envoi du code de vérification");
    }
  };

  const handleVerify2FA = async (code) => {
    try {
      const { data, error } = await authClient.twoFactor.verifyOtp({
        code: code,
      });

      if (error) {
        toast.error("Code de vérification incorrect");
        return false;
      }

      toast.success("Connexion réussie");

      // Définir l'organisation active après la vérification 2FA
      await ensureActiveOrganization();

      // Redirection après vérification 2FA réussie
      const urlParams = new URLSearchParams(window.location.search);
      const invitationId = urlParams.get("invitation");
      const invitationEmail = urlParams.get("email");
      const callbackUrl = urlParams.get("callbackUrl");

      // Si c'est une connexion via invitation, accepter automatiquement l'invitation
      if (invitationId && invitationEmail) {
        try {
          const response = await fetch(`/api/invitations/${invitationId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action: "accept" }),
          });

          if (response.ok) {
            const result = await response.json();

            toast.success(
              "Invitation acceptée ! Bienvenue dans l'organisation."
            );
          } else {
            toast.error("Erreur lors de l'acceptation de l'invitation");
          }
        } catch (error) {
          toast.error("Erreur lors de l'acceptation de l'invitation");
        }
      }

      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        // Vérifier si l'utilisateur a un plan Pro
        try {
          const { data: session } = await authClient.getSession();
          const organizationId = session?.session?.activeOrganizationId;
          
          if (organizationId) {
            const { data: subscriptions } = await authClient.subscription.list({
              query: {
                referenceId: organizationId,
              },
            });
            
            const hasActiveSubscription = subscriptions?.some(
              (sub) => sub.status === "active" || sub.status === "trialing"
            );
            
            // Rediriger vers /dashboard si Pro, sinon vers /dashboard/outils
            router.push(hasActiveSubscription ? "/dashboard" : "/dashboard/outils");
          } else {
            // Pas d'organisation, rediriger vers /dashboard/outils par défaut
            router.push("/dashboard/outils");
          }
        } catch (error) {
          console.error("Erreur lors de la vérification de l'abonnement:", error);
          // En cas d'erreur, rediriger vers /dashboard/outils par défaut
          router.push("/dashboard/outils");
        }
      }

      return true;
    } catch (error) {
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
          placeholder="Email"
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
        className="mt-4 w-full py-2 font-normal cursor-pointer"
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

      {/* Modal de vérification d'email */}
      <EmailVerificationDialog
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        userEmail={userEmailForVerification}
      />
    </form>
  );
};

export default LoginForm;
