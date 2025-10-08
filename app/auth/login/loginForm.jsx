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

        // Calculer les dates de trial (14 jours)
        const now = new Date();
        const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        console.log(`🔄 Création organisation pour ${user.email} avec trial...`);

        // Créer l'organisation directement avec authClient + champs trial
        const result = await authClient.organization.create({
          name: organizationName,
          slug: organizationSlug,
          trialStartDate: now.toISOString(),
          trialEndDate: trialEnd.toISOString(),
          isTrialActive: true,
          hasUsedTrial: true,
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
          console.log(`✅ Organisation créée avec trial:`, result.data);
          toast.success("Bienvenue ! Votre période d'essai de 14 jours a démarré.");
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

  React.useEffect(() => {}, [showEmailVerification, userEmailForVerification]);

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
        let invitationId = urlParams.get("invitation");
        let invitationEmail = urlParams.get("email");
        const callbackUrl = urlParams.get("callbackUrl");

        // Si pas dans l'URL, vérifier dans localStorage (pour les nouveaux utilisateurs)
        if (!invitationId) {
          const pendingInvitation = localStorage.getItem("pendingInvitation");
          if (pendingInvitation) {
            try {
              const invitation = JSON.parse(pendingInvitation);
              // Vérifier que l'invitation n'est pas trop ancienne (7 jours max)
              const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
              if (Date.now() - invitation.timestamp < sevenDaysInMs) {
                invitationId = invitation.invitationId;
                invitationEmail = invitation.email;
                console.log(
                  `📋 Invitation récupérée depuis localStorage: ${invitationId}`
                );
              } else {
                console.log(`⚠️ Invitation expirée, suppression`);
                localStorage.removeItem("pendingInvitation");
              }
            } catch (error) {
              console.error("Erreur parsing invitation:", error);
            }
          }
        }

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

              if (result.data) {
                try {
                  console.log(`🔄 Ajout des champs trial...`);
                  
                  const now = new Date();
                  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
                  
                  const updateResult = await authClient.organization.update({
                    organizationId: result.data.id,
                    data: {
                      trialStartDate: now.toISOString(),
                      trialEndDate: trialEnd.toISOString(),
                      isTrialActive: true,
                      hasUsedTrial: true,
                    },
                  });
                  
                  if (updateResult.error) {
                    console.error(`❌ Erreur mise à jour trial:`, updateResult.error);
                    toast.success("Bienvenue ! Votre espace de travail a été créé.");
                  } else {
                    console.log(`✅ Champs trial ajoutés:`, updateResult.data);
                    toast.success("Bienvenue ! Votre période d'essai de 14 jours a démarré.");
                  }
                } catch (updateError) {
                  console.error(`❌ Erreur mise à jour trial:`, updateError);
                  toast.success("Bienvenue ! Votre espace de travail a été créé.");
                }
              } else {
                toast.success("Bienvenue ! Votre espace de travail a été créé.");
              }
            } else {
              console.error(
                "❌ Erreur lors de l'acceptation automatique de l'invitation"
              );
              console.error("Status:", response.status);
              console.error("Détails:", result);
              toast.error(
                result.error || "Erreur lors de l'acceptation de l'invitation"
              );
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
          // Vérifier si l'utilisateur a un plan Pro et sa page de démarrage préférée
          try {
            const { data: session } = await authClient.getSession();
            const organizationId = session?.session?.activeOrganizationId;
            const userRedirectPage = session?.user?.redirect_after_login;

            if (organizationId) {
              const { data: subscriptions } =
                await authClient.subscription.list({
                  query: {
                    referenceId: organizationId,
                  },
                });

              const hasActiveSubscription = subscriptions?.some(
                (sub) => sub.status === "active" || sub.status === "trialing"
              );

              // Utiliser la page de démarrage préférée de l'utilisateur ou fallback
              let redirectPath = "/dashboard/outils";

              if (userRedirectPage && userRedirectPage !== "last-page") {
                // Mapper les pages vers leurs vraies routes
                const routeMap = {
                  dashboard: "/dashboard",
                  outils: "/dashboard/outils",
                  kanban: "/dashboard/outils/kanban",
                  calendar: "/dashboard/calendar",
                  factures: "/dashboard/outils/factures",
                  devis: "/dashboard/outils/devis",
                  clients: "/dashboard/clients",
                  depenses: "/dashboard/outils/gestion-depenses",
                  signatures: "/dashboard/outils/signatures-mail",
                  transferts: "/dashboard/outils/transferts-fichiers",
                  catalogues: "/dashboard/catalogues",
                  collaborateurs: "/dashboard/collaborateurs",
                  analytics: "/dashboard/analytics",
                  favoris: "/dashboard/favoris",
                };

                redirectPath = routeMap[userRedirectPage] || "/dashboard";
              } else if (hasActiveSubscription) {
                redirectPath = "/dashboard";
              }

              router.push(redirectPath);
            } else {
              // Pas d'organisation, rediriger vers /dashboard/outils par défaut
              router.push("/dashboard/outils");
            }
          } catch (error) {
            console.error(
              "Erreur lors de la vérification de l'abonnement:",
              error
            );
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
        // Vérifier si l'utilisateur a un plan Pro et sa page de démarrage préférée
        try {
          const { data: session } = await authClient.getSession();
          const organizationId = session?.session?.activeOrganizationId;
          const userRedirectPage = session?.user?.redirect_after_login;

          if (organizationId) {
            const { data: subscriptions } = await authClient.subscription.list({
              query: {
                referenceId: organizationId,
              },
            });

            const hasActiveSubscription = subscriptions?.some(
              (sub) => sub.status === "active" || sub.status === "trialing"
            );

            // Utiliser la page de démarrage préférée de l'utilisateur ou fallback
            let redirectPath = "/dashboard/outils";

            if (userRedirectPage && userRedirectPage !== "last-page") {
              // Mapper les pages vers leurs vraies routes
              const routeMap = {
                dashboard: "/dashboard",
                outils: "/dashboard/outils",
                kanban: "/dashboard/outils/kanban",
                calendar: "/dashboard/calendar",
                factures: "/dashboard/outils/factures",
                devis: "/dashboard/outils/devis",
                clients: "/dashboard/clients",
                depenses: "/dashboard/outils/gestion-depenses",
                signatures: "/dashboard/outils/signatures-mail",
                transferts: "/dashboard/outils/transferts-fichiers",
                catalogues: "/dashboard/catalogues",
                collaborateurs: "/dashboard/collaborateurs",
                analytics: "/dashboard/analytics",
                favoris: "/dashboard/favoris",
              };

              redirectPath = routeMap[userRedirectPage] || "/dashboard";
            } else if (hasActiveSubscription) {
              redirectPath = "/dashboard";
            }

            router.push(redirectPath);
          } else {
            // Pas d'organisation, rediriger vers /dashboard/outils par défaut
            router.push("/dashboard/outils");
          }
        } catch (error) {
          console.error(
            "Erreur lors de la vérification de l'abonnement:",
            error
          );
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
