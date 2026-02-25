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
    console.log("🔍 [ENSURE ORG] Vérification de l'organisation active...");

    // Vérifier s'il y a déjà une organisation active
    const { data: activeOrg } = await authClient.organization.getActive();

    if (activeOrg) {
      console.log(
        `✅ [ENSURE ORG] Organisation active déjà définie: ${activeOrg.id}`
      );
      return;
    }

    console.log(
      "⚠️ [ENSURE ORG] Aucune organisation active, tentative de définition..."
    );

    // Récupérer les organisations de l'utilisateur
    const { data: organizations, error: orgsError } =
      await authClient.organization.list();

    if (orgsError) {
      console.error(
        "❌ [ENSURE ORG] Erreur lors de la récupération des organisations:",
        orgsError
      );
      return;
    }

    console.log(
      `📊 [ENSURE ORG] ${organizations?.length || 0} organisation(s) trouvée(s)`
    );

    // Si pas d'organisation active et qu'il y a des organisations disponibles
    if (organizations && organizations.length > 0) {
      let selectedOrg = null;

      // Fast path : une seule org → pas besoin de vérifier les rôles
      if (organizations.length === 1) {
        selectedOrg = organizations[0];
        console.log(
          `✅ [ENSURE ORG] Organisation unique sélectionnée: ${selectedOrg.id}`
        );
      } else {
        // Multiple orgs : sélection par priorité de rôle
        // Récupérer la session UNE SEULE FOIS avant la boucle
        const { data: session } = await authClient.getSession();
        const currentUserId = session?.user?.id;

        for (const org of organizations) {
          try {
            const { data: fullOrg } =
              await authClient.organization.getFullOrganization({
                organizationId: org.id,
              });

            if (fullOrg) {
              const currentUserMember = fullOrg.members?.find(
                (m) => m.userId === currentUserId
              );

              if (currentUserMember?.role === "owner") {
                selectedOrg = org;
                console.log(
                  `✅ [ENSURE ORG] Organisation owner trouvée: ${org.id}`
                );
                break; // Priorité maximale, on arrête la recherche
              } else if (currentUserMember?.role === "admin" && !selectedOrg) {
                selectedOrg = org;
                console.log(
                  `✅ [ENSURE ORG] Organisation admin trouvée: ${org.id}`
                );
              }
            }
          } catch (error) {
            console.warn(
              `⚠️ [ENSURE ORG] Erreur récupération org ${org.id}:`,
              error
            );
          }
        }

        // Si aucune organisation owner/admin trouvée, prendre la première
        if (!selectedOrg) {
          selectedOrg = organizations[0];
          console.log(
            `✅ [ENSURE ORG] Première organisation sélectionnée: ${selectedOrg.id}`
          );
        }
      }

      const { error: setActiveError } = await authClient.organization.setActive(
        {
          organizationId: selectedOrg.id,
        }
      );

      if (setActiveError) {
        console.error(
          "❌ [ENSURE ORG] Erreur lors de la définition de l'organisation active:",
          setActiveError
        );
      } else {
        console.log(
          `✅ [ENSURE ORG] Organisation active définie avec succès: ${selectedOrg.id}`
        );
      }
    } else {
      console.log(
        "⚠️ [ENSURE ORG] Aucune organisation trouvée, création d'une nouvelle..."
      );
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

        console.log(
          `🔄 Création organisation pour ${user.email}...`
        );

        // ⚠️ IMPORTANT: Ne plus créer de trial organisation
        // L'utilisateur devra souscrire via Stripe (avec 30 jours d'essai Stripe)
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
          console.log(`✅ Organisation créée:`, result.data);
          // Pas de toast ici, l'utilisateur sera redirigé vers l'onboarding pour s'abonner
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
    console.log("🔐 [LOGIN] Tentative de connexion...");

    await authClient.signIn.email(formData, {
      onSuccess: async (ctx) => {
        console.log("✅ [LOGIN] Connexion réussie, ctx:", ctx);

        // Vérifier si l'utilisateur doit passer par la 2FA
        if (ctx.data.twoFactorRedirect) {
          console.log("🔒 [LOGIN] Redirection 2FA détectée");
          console.log(
            "🔒 [LOGIN] Better Auth va rediriger vers /auth/verify-2fa"
          );
          // ✅ Better Auth gère automatiquement la redirection via onTwoFactorRedirect
          // Pas besoin d'envoyer d'OTP ici car :
          // - Pour TOTP (authenticator app) : pas besoin d'OTP, l'utilisateur utilise son app
          // - Pour OTP (email/SMS) : Better Auth envoie automatiquement l'OTP lors de la connexion
          setTwoFactorData(ctx.data);
          setShow2FA(true);
          return;
        }

        // Connexion normale sans 2FA
        // Le plugin JWT de Better Auth n'envoie le header set-auth-jwt que sur /get-session,
        // pas sur /sign-in/email. On récupère donc le JWT via l'endpoint dédié /api/auth/token.
        let authToken = ctx.response.headers.get("set-auth-jwt") ||
                       ctx.response.headers.get("set-auth-token");

        if (!authToken) {
          // Récupérer le JWT via l'endpoint dédié du plugin JWT
          try {
            const tokenResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || ""}/api/auth/token`,
              { credentials: "include" }
            );
            if (tokenResponse.ok) {
              const tokenData = await tokenResponse.json();
              if (tokenData.token) {
                authToken = tokenData.token;
              }
            }
          } catch (err) {
            console.warn("⚠️ [LOGIN] Erreur récupération JWT via /api/auth/token:", err.message);
          }
        }

        if (authToken) {
          localStorage.setItem("bearer_token", authToken);
          console.log("💾 [LOGIN] Token JWT sauvegardé");
        } else {
          console.warn("⚠️ [LOGIN] Aucun token JWT récupéré après login");
        }

        // Vérifier la limite de sessions ET définir l'organisation active en parallèle
        // Ces deux opérations sont indépendantes l'une de l'autre
        console.log("🔍 [LOGIN] Vérification sessions + organisation en parallèle...");

        const [sessionLimitResult] = await Promise.all([
          // 1. Vérifier la limite de sessions
          fetch("/api/check-session-limit", {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          })
            .then(async (res) => {
              if (res.ok) {
                const data = await res.json();
                console.log("📊 [LOGIN] Résultat vérification sessions:", data);
                return data;
              }
              console.warn("⚠️ [LOGIN] Impossible de vérifier la limite de sessions");
              return null;
            })
            .catch((err) => {
              console.error("❌ [LOGIN] Erreur vérification sessions:", err);
              return null; // Continuer la connexion même en cas d'erreur
            }),
          // 2. Définir l'organisation active
          ensureActiveOrganization(),
        ]);

        // Vérifier le résultat de la limite de sessions
        if (sessionLimitResult?.hasReachedLimit) {
          console.log("⚠️ [LOGIN] Limite de sessions atteinte, redirection vers /auth/manage-devices");
          toast.info("Vous êtes déjà connecté sur un autre appareil");
          router.push("/auth/manage-devices");
          return;
        }

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

            const result = await response.json();

            if (response.ok) {
              console.log(`✅ Invitation acceptée:`, result);

              // ✅ CRITIQUE: Stocker l'organizationId dans localStorage pour Apollo Client
              if (result.organizationId) {
                localStorage.setItem("active_organization_id", result.organizationId);
                console.log(`📦 [LOGIN] Organization ID stocké: ${result.organizationId}`);

                // ✅ Définir l'organisation active côté client Better Auth
                await authClient.organization.setActive({
                  organizationId: result.organizationId,
                });
                console.log(`🔄 [LOGIN] Organisation active définie côté client`);
              }

              toast.success(
                "Invitation acceptée ! Bienvenue dans l'organisation."
              );

              // ✅ Nettoyer le localStorage après succès
              localStorage.removeItem("pendingInvitation");

              // ✅ Vérifier si l'utilisateur est un invité (pas d'org propre)
              // Dans ce cas, marquer l'onboarding comme vu et rediriger vers le dashboard
              const { data: session } = await authClient.getSession();
              const isInvitedUser = session?.user?.isInvitedUser;

              if (isInvitedUser) {
                console.log(`📨 [LOGIN] Utilisateur invité détecté, skip onboarding`);
                await authClient.updateUser({
                  hasSeenOnboarding: true,
                });
                router.push("/dashboard?welcome=invited");
                return;
              }
            } else {
              console.error(
                "❌ Erreur lors de l'acceptation automatique de l'invitation"
              );
              console.error("Status:", response.status);
              console.error("Détails:", result);

              // ✅ Nettoyer le localStorage en cas d'erreur définitive
              // (invitation expirée, déjà acceptée, etc.)
              if (response.status === 410 || response.status === 400) {
                localStorage.removeItem("pendingInvitation");
                console.log(`🗑️ [LOGIN] Invitation invalide, localStorage nettoyé`);
              }

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
          // Vérifier l'abonnement Stripe AVANT de rediriger
          try {
            const { data: session } = await authClient.getSession();
            const organizationId = session?.session?.activeOrganizationId;
            const hasSeenOnboarding = session?.user?.hasSeenOnboarding;
            const userRedirectPage = session?.user?.redirect_after_login;
            const isInvitedUser = session?.user?.isInvitedUser;

            // ✅ Les utilisateurs invités n'ont pas besoin d'abonnement (ils utilisent celui de l'owner)
            if (isInvitedUser) {
              console.log("🎯 [LOGIN] Utilisateur invité, redirection vers dashboard");
              if (!hasSeenOnboarding) {
                await authClient.updateUser({
                  hasSeenOnboarding: true,
                });
              }
              router.push("/dashboard?welcome=invited");
              return;
            }

            // ⚠️ IMPORTANT: Vérifier l'abonnement Stripe en priorité
            let hasActiveSubscription = false;

            if (organizationId) {
              const { data: subscriptions } =
                await authClient.subscription.list({
                  query: {
                    referenceId: organizationId,
                  },
                });

              hasActiveSubscription = subscriptions?.some(
                (sub) => sub.status === "active" || sub.status === "trialing"
              );
            }

            // Si pas d'abonnement Stripe actif, TOUJOURS rediriger vers onboarding
            if (!hasActiveSubscription) {
              console.log(
                "🎯 [LOGIN] Pas d'abonnement Stripe actif, redirection vers onboarding"
              );
              router.push("/onboarding");
              return;
            }

            // Si l'utilisateur n'a pas vu l'onboarding mais a un abonnement, le rediriger quand même
            if (!hasSeenOnboarding) {
              console.log(
                "🎯 [LOGIN] Première connexion avec abonnement, redirection vers onboarding"
              );
              router.push("/onboarding");
              return;
            }

            // L'utilisateur a un abonnement actif, rediriger vers sa page préférée
            let redirectPath = "/dashboard";

            if (userRedirectPage && userRedirectPage !== "last-page") {
              // Mapper les pages vers leurs vraies routes
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

              redirectPath = routeMap[userRedirectPage] || "/dashboard";
            }

            router.push(redirectPath);
          } catch (error) {
            console.error(
              "Erreur lors de la vérification de l'abonnement:",
              error
            );
            // En cas d'erreur, rediriger vers /onboarding par sécurité
            router.push("/onboarding");
          }
        }
      },
      onError: async (error) => {
        console.log("❌ [LOGIN] Erreur de connexion:", error);
        console.log("❌ [LOGIN] Type d'erreur:", typeof error);
        console.log(
          "❌ [LOGIN] Erreur complète:",
          JSON.stringify(error, null, 2)
        );

        // Essayer différents formats d'erreur
        let errorMessage = null;

        if (error.message) {
          errorMessage = error.message;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        console.log("📝 [LOGIN] Message d'erreur extrait:", errorMessage);

        // Vérifier si c'est une erreur de limite de sessions
        if (
          errorMessage &&
          (errorMessage.toLowerCase().includes("maximum") ||
            errorMessage.toLowerCase().includes("session") ||
            errorMessage.toLowerCase().includes("limit") ||
            errorMessage.toLowerCase().includes("too many"))
        ) {
          console.log(
            "⚠️ [LOGIN] Erreur de limite de sessions détectée, redirection..."
          );
          toast.error("Vous êtes déjà connecté sur un autre appareil");
          router.push("/auth/manage-devices");
          return;
        }

        // Vérifier si c'est une erreur de compte désactivé
        if (
          errorMessage &&
          (errorMessage.includes("désactivé") ||
            errorMessage.includes("réactivation"))
        ) {
          console.log("🚫 [LOGIN] Compte désactivé");
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
          console.log("📧 [LOGIN] Email non vérifié");
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

          const result = await response.json();

          if (response.ok) {
            // ✅ CRITIQUE: Stocker l'organizationId dans localStorage pour Apollo Client
            if (result.organizationId) {
              localStorage.setItem("active_organization_id", result.organizationId);
              console.log(`📦 [2FA] Organization ID stocké: ${result.organizationId}`);

              // ✅ Définir l'organisation active côté client Better Auth
              await authClient.organization.setActive({
                organizationId: result.organizationId,
              });
              console.log(`🔄 [2FA] Organisation active définie côté client`);
            }

            toast.success(
              "Invitation acceptée ! Bienvenue dans l'organisation."
            );

            // ✅ Nettoyer le localStorage après succès
            localStorage.removeItem("pendingInvitation");

            // ✅ Vérifier si l'utilisateur est un invité (pas d'org propre)
            const { data: session } = await authClient.getSession();
            const isInvitedUser = session?.user?.isInvitedUser;

            if (isInvitedUser) {
              console.log(`📨 [2FA] Utilisateur invité détecté, skip onboarding`);
              await authClient.updateUser({
                hasSeenOnboarding: true,
              });
              router.push("/dashboard?welcome=invited");
              return true;
            }
          } else {
            // ✅ Nettoyer le localStorage en cas d'erreur définitive
            if (response.status === 410 || response.status === 400) {
              localStorage.removeItem("pendingInvitation");
            }
            toast.error(result.error || "Erreur lors de l'acceptation de l'invitation");
          }
        } catch (error) {
          toast.error("Erreur lors de l'acceptation de l'invitation");
        }
      }

      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        // Vérifier l'abonnement Stripe AVANT de rediriger
        try {
          const { data: session } = await authClient.getSession();
          const organizationId = session?.session?.activeOrganizationId;
          const hasSeenOnboarding = session?.user?.hasSeenOnboarding;
          const userRedirectPage = session?.user?.redirect_after_login;
          const isInvitedUser = session?.user?.isInvitedUser;

          // ✅ Les utilisateurs invités n'ont pas besoin d'abonnement (ils utilisent celui de l'owner)
          if (isInvitedUser) {
            console.log("🎯 [2FA] Utilisateur invité, redirection vers dashboard");
            if (!hasSeenOnboarding) {
              await authClient.updateUser({
                hasSeenOnboarding: true,
              });
            }
            router.push("/dashboard?welcome=invited");
            return true;
          }

          // ⚠️ IMPORTANT: Vérifier l'abonnement Stripe en priorité
          let hasActiveSubscription = false;

          if (organizationId) {
            const { data: subscriptions } = await authClient.subscription.list({
              query: {
                referenceId: organizationId,
              },
            });

            hasActiveSubscription = subscriptions?.some(
              (sub) => sub.status === "active" || sub.status === "trialing"
            );
          }

          // Si pas d'abonnement Stripe actif, TOUJOURS rediriger vers onboarding
          if (!hasActiveSubscription) {
            console.log(
              "🎯 [2FA] Pas d'abonnement Stripe actif, redirection vers onboarding"
            );
            router.push("/onboarding");
            return true;
          }

          // Si l'utilisateur n'a pas vu l'onboarding mais a un abonnement, le rediriger quand même
          if (!hasSeenOnboarding) {
            console.log(
              "🎯 [2FA] Première connexion avec abonnement, redirection vers onboarding"
            );
            router.push("/onboarding");
            return true;
          }

          // L'utilisateur a un abonnement actif, rediriger vers sa page préférée
          let redirectPath = "/dashboard";

          if (userRedirectPage && userRedirectPage !== "last-page") {
            // Mapper les pages vers leurs vraies routes
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
              analytics: "/dashboard/analytics",
              favoris: "/dashboard/favoris",
            };

            redirectPath = routeMap[userRedirectPage] || "/dashboard";
          }

          router.push(redirectPath);
        } catch (error) {
          console.error(
            "Erreur lors de la vérification de l'abonnement:",
            error
          );
          // En cas d'erreur, rediriger vers /onboarding par sécurité
          router.push("/onboarding");
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
        size="lg"
        className="mt-4 w-full cursor-pointer"
        isLoading={isSubmitting}
      >
        Se connecter
      </SubmitButton>

      {/* Modal de vérification 2FA - DÉSACTIVÉ : La vérification se fait sur /auth/verify-2fa */}
      {/* <TwoFactorModal
        isOpen={show2FA}
        onClose={() => setShow2FA(false)}
        onVerify={handleVerify2FA}
      /> */}

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
