"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "@/src/components/ui/sonner";
import { CheckCircle, XCircle, Loader2, UserPlus } from "lucide-react";
import { AuroraBackground } from "@/src/components/ui/aurora-background";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState(null);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Formulaire d'inscription
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const invitationId = params.invitationId;

  // Récupérer les paramètres d'URL comme fallback
  const [urlParams, setUrlParams] = useState(null);

  useEffect(() => {
    console.log("AuthClient methods:", Object.keys(authClient));
    console.log(
      "Organization methods:",
      Object.keys(authClient.organization || {})
    );
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlParams({
        org: searchParams.get("org"),
        email: searchParams.get("email"),
        role: searchParams.get("role"),
      });
    }
  }, []);

  // Récupérer les détails de l'invitation
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!invitationId) return;

      // Attendre que le statut de session soit résolu
      if (isPending) return;

      try {
        setLoading(true);
        console.log("🔍 Recherche de l'invitation avec ID:", invitationId);
        console.log("👤 Session utilisateur:", session);
        console.log("🔗 Paramètres URL:", urlParams);

        // PRIORITÉ 1: Utiliser les paramètres URL si disponibles (plus fiable)
        if (urlParams && urlParams.org && urlParams.email) {
          console.log(
            "✅ Utilisation des paramètres d'URL comme source principale:",
            urlParams
          );
          setInvitation({
            id: invitationId,
            email: urlParams.email,
            role: urlParams.role || "member",
            organization: { name: urlParams.org },
            status: "pending",
          });
          return;
        }

        // PRIORITÉ 2: Si pas de paramètres URL et utilisateur connecté, essayer notre API
        if (session?.user) {
          console.log("🔍 Pas de paramètres URL, tentative via notre API...");

          try {
            const response = await fetch(`/api/invitations/${invitationId}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const data = await response.json();
              console.log("✅ Invitation trouvée via notre API:", data);
              setInvitation(data);
              return;
            } else {
              const errorData = await response.json();
              console.log("⚠️ Erreur API:", errorData);
            }
          } catch (apiError) {
            console.log("⚠️ Erreur lors de l'appel API:", apiError);
          }
        }

        // PRIORITÉ 3: Aucune source disponible
        console.error("❌ Invitation non trouvée - ni paramètres URL ni API");
        setError(
          "Invitation non trouvée ou expirée. Veuillez vérifier le lien d'invitation."
        );
      } catch (err) {
        console.error("Erreur générale:", err);
        setError("Erreur lors de la récupération de l'invitation");
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [invitationId, session, isPending, urlParams]);

  // Gérer l'inscription avec rôle
  const handleSignup = async (e) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (signupData.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setSignupLoading(true);
    try {
      console.log("Inscription avec rôle:", {
        email: signupData.email,
        name: signupData.name,
        role: invitation?.role,
      });

      // Créer le compte avec Better Auth
      // Note: L'utilisateur ne créera pas d'organisation automatique car il va rejoindre une organisation existante
      const { data: signupResult, error: signupError } =
        await authClient.signUp.email({
          email: signupData.email,
          password: signupData.password,
          name: signupData.name,
        });

      if (signupError) {
        console.error("Erreur lors de l'inscription:", signupError);
        toast.error(signupError.message || "Erreur lors de l'inscription");
        return;
      }

      console.log("Inscription réussie:", signupResult);
      toast.success("Compte créé avec succès!");

      // Informer l'utilisateur qu'il doit maintenant se connecter pour accepter l'invitation
      toast.info(
        "Veuillez maintenant vous connecter pour accepter l'invitation"
      );

      // Rediriger vers la page de connexion avec callback vers cette page d'invitation
      // Préserver les paramètres URL d'origine
      const currentUrl = window.location.href;
      const callbackUrl = currentUrl.includes("?")
        ? currentUrl
        : `/accept-invitation/${invitationId}`;
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setSignupLoading(false);
    }
  };

  // Accepter l'invitation (pour utilisateur déjà connecté)
  const handleAccept = async () => {
    setAccepting(true);
    try {
      console.log("Acceptation de l'invitation:", invitation);

      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur lors de l'acceptation:", errorData);
        toast.error("Erreur lors de l'acceptation de l'invitation");
        return;
      }

      const data = await response.json();
      console.log("Invitation acceptée avec succès:", data);
      toast.success("Invitation acceptée avec succès!");

      // Rediriger vers le dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
      toast.error("Erreur lors de l'acceptation de l'invitation");
    } finally {
      setAccepting(false);
    }
  };

  // Rejeter l'invitation
  const handleReject = async () => {
    setRejecting(true);
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur lors du rejet:", errorData);
        toast.error("Erreur lors du rejet de l'invitation");
        return;
      }

      toast.success("Invitation rejetée");
      router.push("/");
    } catch (err) {
      console.error("Erreur:", err);
      toast.error("Erreur lors du rejet de l'invitation");
    } finally {
      setRejecting(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes("connecté");

    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle>
              {isAuthError ? "Connexion requise" : "Invitation invalide"}
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isAuthError ? (
              <>
                <p className="text-sm text-gray-600 text-center">
                  Vous devez avoir un compte pour accepter cette invitation
                </p>
                <Button
                  onClick={() => {
                    setShowSignupForm(true);
                    setSignupData((prev) => ({
                      ...prev,
                      email: invitation?.email || "",
                    }));
                    setError(null);
                  }}
                  className="w-full"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Créer un compte avec cette invitation
                </Button>
              </>
            ) : (
              <Button onClick={() => router.push("/")} className="w-full">
                Retour à l'accueil
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle>Invitation non trouvée</CardTitle>
            <CardDescription>
              Cette invitation n'existe pas ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Invitation à rejoindre une organisation</CardTitle>
          <CardDescription>
            Vous avez été invité(e) à rejoindre{" "}
            <strong>{invitation.organization?.name}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                <strong>Organisation:</strong> {invitation.organization?.name}
              </p>
              <p>
                <strong>Rôle:</strong> {invitation.role}
              </p>
              <p>
                <strong>Invité par:</strong>{" "}
                {invitation.inviter?.user?.name ||
                  invitation.inviter?.user?.email}
              </p>
            </div>
          </div>

          {!session?.user ? (
            <div className="space-y-3">
              {!showSignupForm ? (
                <>
                  <p className="text-sm text-gray-600 text-center">
                    Vous devez avoir un compte pour accepter cette invitation
                  </p>
                  <Button
                    onClick={() => {
                      // Préserver les paramètres URL d'origine
                      const currentUrl = window.location.href;
                      const callbackUrl = currentUrl.includes("?")
                        ? currentUrl
                        : `/accept-invitation/${invitationId}`;
                      router.push(
                        `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
                      );
                    }}
                    className="w-full"
                  >
                    Se connecter
                  </Button>
                  <Button
                    onClick={() => {
                      setShowSignupForm(true);
                      setSignupData((prev) => ({
                        ...prev,
                        email: invitation.email || "",
                      }));
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Créer un compte
                  </Button>
                </>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="font-medium text-lg">Créer votre compte</h3>
                    <p className="text-sm text-gray-600">
                      Vous rejoindrez automatiquement l'organisation avec le
                      rôle : <strong>{invitation.role}</strong>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Votre nom complet"
                      value={signupData.name}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={signupData.email}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 8 caractères"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirmer le mot de passe
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirmer votre mot de passe"
                      value={signupData.confirmPassword}
                      onChange={(e) =>
                        setSignupData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full"
                    >
                      {signupLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création du compte...
                        </>
                      ) : (
                        "Créer le compte et rejoindre"
                      )}
                    </Button>

                    <Button
                      type="button"
                      onClick={() => setShowSignupForm(false)}
                      variant="outline"
                      className="w-full"
                      disabled={signupLoading}
                    >
                      Retour
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full"
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Acceptation en cours...
                  </>
                ) : (
                  "Accepter l'invitation"
                )}
              </Button>

              <Button
                onClick={handleReject}
                disabled={rejecting}
                variant="outline"
                className="w-full"
              >
                {rejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejet en cours...
                  </>
                ) : (
                  "Rejeter l'invitation"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
