"use client";

import * as React from "react";
import { useForm } from "react-hook-form";

import { SubmitButton } from "@/src/components/ui/submit-button";
import { InputPassword, InputEmail } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "@/src/components/ui/sonner";
import { authClient, clearSessionStorage } from "../../../src/lib/auth-client";
import {
  apolloClient,
  resetOrganizationIdForApollo,
} from "../../../src/lib/apolloClient";
import { EmailVerificationDialog } from "./components/EmailVerificationDialog";

// S'assure qu'une organisation active est définie après le login
const ensureActiveOrganization = async () => {
  try {
    const { data: activeOrg } = await authClient.organization.getActive();
    if (activeOrg) return;

    const { data: organizations, error: orgsError } =
      await authClient.organization.list();
    if (orgsError || !organizations) return;

    if (organizations.length > 0) {
      let selectedOrg = null;

      if (organizations.length === 1) {
        selectedOrg = organizations[0];
      } else {
        // Multiple orgs : sélection par priorité owner > admin > first
        const [{ data: session }, ...fullOrgResults] = await Promise.all([
          authClient.getSession(),
          ...organizations.map((org) =>
            authClient.organization
              .getFullOrganization({ organizationId: org.id })
              .catch(() => ({ data: null })),
          ),
        ]);
        const currentUserId = session?.user?.id;

        for (let i = 0; i < organizations.length; i++) {
          const fullOrg = fullOrgResults[i]?.data;
          if (fullOrg) {
            const member = fullOrg.members?.find(
              (m) => m.userId === currentUserId,
            );
            if (member?.role === "owner") {
              selectedOrg = organizations[i];
              break;
            } else if (member?.role === "admin" && !selectedOrg) {
              selectedOrg = organizations[i];
            }
          }
        }
        if (!selectedOrg) selectedOrg = organizations[0];
      }

      await authClient.organization.setActive({
        organizationId: selectedOrg.id,
      });
    } else {
      // Aucune org : en créer une automatiquement
      const { data: session } = await authClient.getSession();
      const user = session?.user;
      if (!user?.id) return;

      const organizationName =
        user.name || `Espace ${user.email.split("@")[0]}'s`;

      await authClient.organization.create({
        name: organizationName,
        slug: `org-${user.id.slice(-8)}`,
        metadata: {
          autoCreated: true,
          createdAt: new Date().toISOString(),
        },
        keepCurrentActiveOrganization: false,
      });
    }
  } catch (error) {
    console.error("Erreur ensureActiveOrganization:", error);
  }
};

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const router = useRouter();
  const [showEmailVerification, setShowEmailVerification] =
    React.useState(false);
  const [userEmailForVerification, setUserEmailForVerification] =
    React.useState("");

  const hasRetriedRef = React.useRef(false);

  const onSubmit = async (formData) => {
    hasRetriedRef.current = false;

    try {
      await authClient.signIn.email(formData, {
        onSuccess: async (ctx) => {
          // 2FA requis → Better Auth gère la redirection via onTwoFactorRedirect
          if (ctx.data.twoFactorRedirect) {
            return;
          }

          // Vider les caches APRÈS le signIn réussi pour éviter de causer un remount du form
          resetOrganizationIdForApollo();
          clearSessionStorage();
          await apolloClient.clearStore();

          // getSession + check-session-limit en parallèle
          const [{ data: session }, sessionLimitResult] = await Promise.all([
            authClient.getSession(),
            fetch("/api/check-session-limit", {
              method: "GET",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
            })
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null),
          ]);

          // Vérifier la limite de sessions
          if (sessionLimitResult?.hasReachedLimit) {
            toast.info("Vous êtes déjà connecté sur un autre appareil");
            router.push("/auth/manage-devices");
            return;
          }

          // Étape 2 : Toujours synchroniser l'organisation active côté client
          // Le hook session.create.before set l'org côté serveur, mais le SDK client
          // peut garder l'ancienne org en cache (problème lors du switch de compte)
          if (session?.session?.activeOrganizationId) {
            await authClient.organization.setActive({
              organizationId: session.session.activeOrganizationId,
            });
          } else {
            await ensureActiveOrganization();
          }

          // Étape 3 : Gérer les invitations (cas peu fréquent)
          const urlParams = new URLSearchParams(window.location.search);
          let invitationId = urlParams.get("invitation");
          let invitationEmail = urlParams.get("email");
          const callbackUrl = urlParams.get("callbackUrl");

          if (!invitationId) {
            const pendingInvitation = localStorage.getItem("pendingInvitation");
            if (pendingInvitation) {
              try {
                const invitation = JSON.parse(pendingInvitation);
                const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
                if (Date.now() - invitation.timestamp < sevenDaysInMs) {
                  invitationId = invitation.invitationId;
                  invitationEmail = invitation.email;
                } else {
                  localStorage.removeItem("pendingInvitation");
                }
              } catch (error) {
                console.error("Erreur parsing invitation:", error);
              }
            }
          }

          if (invitationId && invitationEmail) {
            try {
              const response = await fetch(`/api/invitations/${invitationId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "accept" }),
              });

              const result = await response.json();

              if (response.ok) {
                if (result.organizationId) {
                  localStorage.setItem(
                    "active_organization_id",
                    result.organizationId,
                  );
                  await authClient.organization.setActive({
                    organizationId: result.organizationId,
                  });
                }
                toast.success(
                  "Invitation acceptée ! Bienvenue dans l'organisation.",
                );
                localStorage.removeItem("pendingInvitation");

                if (session?.user?.isInvitedUser) {
                  await authClient.updateUser({ hasSeenOnboarding: true });
                  router.push("/dashboard?welcome=invited");
                  return;
                }
              } else {
                if (response.status === 410 || response.status === 400) {
                  localStorage.removeItem("pendingInvitation");
                }
                toast.error(
                  result.error ||
                    "Erreur lors de l'acceptation de l'invitation",
                );
              }
            } catch (error) {
              toast.error("Erreur lors de l'acceptation de l'invitation");
            }
          }

          // Étape 4 : Redirection rapide
          // La vérification d'abonnement est faite côté serveur par dashboard/layout.jsx
          // → pas besoin de subscription.list() ici, ça économise ~150-300ms
          if (callbackUrl) {
            router.push(callbackUrl);
          } else {
            const isInvitedUser = session?.user?.isInvitedUser;
            const userRedirectPage = session?.user?.redirect_after_login;

            if (isInvitedUser) {
              if (!session?.user?.hasSeenOnboarding) {
                await authClient.updateUser({ hasSeenOnboarding: true });
              }
              router.push("/dashboard?welcome=invited");
              return;
            }

            // Rediriger vers la page préférée de l'utilisateur
            // dashboard/layout.jsx redirigera vers /onboarding si pas d'abonnement
            const routeMap = {
              dashboard: "/dashboard",
              outils: "/dashboard",
              kanban: "/dashboard/outils/kanban",
              calendar: "/dashboard/calendar",
              factures: "/dashboard/outils/factures",
              devis: "/dashboard/outils/devis",
              clients: "/dashboard/clients",
              transactions: "/dashboard/outils/transactions",
              depenses: "/dashboard/outils/transactions",
              signatures: "/dashboard/outils/signatures-mail",
              transferts: "/dashboard/outils/transferts-fichiers",
              "documents-partages": "/dashboard/outils/documents-partages",
              catalogues: "/dashboard/catalogues",
              collaborateurs: "/dashboard/collaborateurs",
            };

            const redirectPath =
              userRedirectPage && userRedirectPage !== "last-page"
                ? routeMap[userRedirectPage] || "/dashboard"
                : "/dashboard";

            router.push(redirectPath);
          }
        },
        onError: async (error) => {
          // Extraire le message d'erreur (Better Auth peut retourner différents formats)
          const errorMessage =
            error?.message ||
            error?.error?.message ||
            (typeof error === "string" ? error : null);
          const errorStatus = error?.status || error?.error?.status;

          // Token CSRF expiré (page restée ouverte longtemps) → retry automatique une fois
          // Better Auth retourne 403 ou un message contenant "csrf"/"token"
          const isCsrfError =
            errorStatus === 403 ||
            (errorMessage &&
              (errorMessage.toLowerCase().includes("csrf") ||
                errorMessage.toLowerCase().includes("invalid token") ||
                errorMessage.toLowerCase().includes("forbidden")));

          if (isCsrfError && !hasRetriedRef.current) {
            hasRetriedRef.current = true;
            // Le retry va automatiquement obtenir un nouveau token CSRF
            await onSubmit(formData);
            return;
          }

          // Limite de sessions atteinte
          if (
            errorMessage &&
            (errorMessage.toLowerCase().includes("maximum") ||
              errorMessage.toLowerCase().includes("session") ||
              errorMessage.toLowerCase().includes("limit") ||
              errorMessage.toLowerCase().includes("too many"))
          ) {
            toast.error("Vous êtes déjà connecté sur un autre appareil");
            router.push("/auth/manage-devices");
            return;
          }

          // Compte désactivé
          if (
            errorMessage &&
            (errorMessage.includes("désactivé") ||
              errorMessage.includes("réactivation"))
          ) {
            toast.error(errorMessage);
            return;
          }

          // Email non vérifié (détection par message d'erreur)
          if (
            errorMessage &&
            (errorMessage.includes("vérifier votre adresse email") ||
              errorMessage.includes("email avant de vous connecter") ||
              errorMessage.includes("Veuillez vérifier"))
          ) {
            setUserEmailForVerification(formData.email);
            setShowEmailVerification(true);
            return;
          }

          // Fallback : vérifier côté serveur si l'email n'est pas vérifié
          if (formData.email) {
            try {
              const response = await fetch("/api/auth/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email }),
              });
              if (response.ok) {
                const userData = await response.json();
                if (userData.exists && !userData.emailVerified) {
                  setUserEmailForVerification(formData.email);
                  setShowEmailVerification(true);
                  return;
                }
              }
            } catch {}
          }

          toast.error("Email ou mot de passe incorrect");
        },
      });
    } catch (err) {
      // Erreur réseau ou serveur (ex: MongoDB cold start timeout sur Vercel)
      toast.error("Le serveur met du temps à répondre. Veuillez réessayer.");
    }
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
        size="lg"
        className="mt-4 w-full cursor-pointer"
        isLoading={isSubmitting}
      >
        Se connecter
      </SubmitButton>

      <EmailVerificationDialog
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        userEmail={userEmailForVerification}
      />
    </form>
  );
};

export default LoginForm;
