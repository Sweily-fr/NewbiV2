"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { authClient, useSession } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  UserRoundPlusIcon,
  CalendarIcon,
  MailIcon,
  ShieldIcon,
  LoaderCircleIcon,
  CircleArrowUp,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";
import { Typewriter } from "@/src/components/ui/typewriter-text";

export default function AcceptInvitationPage() {
  const { invitationId } = useParams();
  const { data: session } = useSession();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [userExists, setUserExists] = useState(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        console.log(
          "🔍 Récupération invitation avec getInvitation:",
          invitationId
        );

        // Récupérer l'invitation via l'API route custom
        const response = await fetch(`/api/invitations/${invitationId}`);

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(
            data.error || "Erreur lors de la récupération de l'invitation"
          );
        }

        console.log("✅ Invitation récupérée:", data);
        setInvitation(data);

        // Vérifier si l'utilisateur existe déjà
        if (data.email) {
          try {
            const userCheckResponse = await fetch("/api/users/check-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email: data.email }),
            });

            if (userCheckResponse.ok) {
              const userCheckData = await userCheckResponse.json();
              setUserExists(userCheckData.exists);
              console.log(
                `✅ Vérification utilisateur: ${data.email} ${userCheckData.exists ? "existe" : "n'existe pas"}`
              );
            }
          } catch (userCheckError) {
            console.error(
              "❌ Erreur lors de la vérification de l'utilisateur:",
              userCheckError
            );
            // En cas d'erreur, on assume que l'utilisateur n'existe pas
            setUserExists(false);
          }
        }
      } catch (err) {
        console.error("❌ Erreur:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (invitationId) {
      fetchInvitation();
    }
  }, [invitationId]);

  // Fonction pour accepter l'invitation
  const handleAcceptInvitation = async () => {
    if (!session?.user) {
      // Vérifier si l'utilisateur existe déjà pour décider de la redirection
      if (userExists) {
        // L'utilisateur existe mais n'est pas connecté -> rediriger vers login
        window.location.href = `/auth/login?invitation=${invitationId}&email=${encodeURIComponent(invitation.email)}`;
      } else {
        // L'utilisateur n'existe pas -> rediriger vers signup
        window.location.href = `/auth/signup?invitation=${invitationId}&email=${encodeURIComponent(invitation.email)}`;
      }
      return;
    }

    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Rediriger vers le dashboard après acceptation réussie
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("❌ Erreur lors de l'acceptation:", err);
      setError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  // Fonction pour rejeter l'invitation
  const handleRejectInvitation = async () => {
    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      // Rediriger ou afficher un message de confirmation
      window.location.href = "/";
    } catch (err) {
      console.error("❌ Erreur lors du rejet:", err);
      setError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Card className="w-full max-w-md border-none shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-6">
            {/* <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div> */}
            <LoaderCircleIcon
              className="-ms-1 animate-spin mb-4"
              size={20}
              aria-hidden="true"
            />
            <p className="text-muted-foreground">
              Chargement de l'invitation...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <XCircleIcon className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
            <p className="text-muted-foreground text-center">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <XCircleIcon className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Invitation non trouvée
            </h2>
            <p className="text-muted-foreground text-center">
              Aucune invitation trouvée avec cet ID.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "member":
        return "bg-blue-100 text-blue-800";
      case "guest":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 flex items-center justify-center p-2">
        <div
          className="flex p-6 items-center justify-center w-full h-full rounded-lg bg-cover bg-center relative"
          style={{ backgroundImage: "url('/BackgroundAuth.svg')" }}
        >
          <div className="bg-white/80 shadow-md rounded-2xl p-6 w-110 mx-auto">
            <div className="text-lg min-h-[27px] flex items-center justify-between">
              <div className="flex-1">
                <Typewriter
                  text={[
                    "Créez votre compte en quelques secondes.",
                    "Rejoignez notre communauté.",
                    "Commencez votre aventure dès maintenant.",
                  ]}
                  speed={30}
                  deleteSpeed={30}
                  delay={2000}
                  loop={true}
                  className="font-medium text-left text-[#1C1C1C] text-[15px]"
                />
              </div>
              <CircleArrowUp className="ml-4 text-[#1C1C1C] flex-shrink-0" />
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
      <div className="w-1/2 flex items-center min-h-screen justify-center">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center pb-6 mb-5">
            <div className="flex justify-center">
              <div className="flex size-12 shrink-0 mb-3 items-center justify-center rounded-full border border-[#5b4fff]/40 bg-[#5b4fff]/10">
                <UserRoundPlusIcon className="h-5 w-5 text-[#5b4fff]" />
              </div>
            </div>
            <h1 className="text-xl font-medium">Invitation</h1>
            <p className="text-sm font-normal text-muted-foreground">
              Rejoindre{" "}
              <strong className="text-[#5b4fff] font-normal">
                {invitation.organizationName}
              </strong>
            </p>
          </div>

          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email</span>
              <span className="font-normal">{invitation.email}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rôle</span>
              <Badge
                variant="secondary"
                className="text-xs border-[#5b4fff]/40 bg-[#5b4fff]/10 text-[#5b4fff]"
              >
                {invitation.role}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Statut</span>
              <Badge
                variant={
                  invitation.status === "pending" ? "default" : "secondary"
                }
                className="text-xs "
              >
                {invitation.status === "pending"
                  ? "En attente"
                  : invitation.status}
              </Badge>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Expire le</span>
              <span className="font-medium text-xs">
                {new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>

          <Separator />

          {/* User Status */}
          <div className="space-y-2">
            {session?.user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CheckCircleIcon className="h-4 w-4 text-[#5b4fff]" />
                  <span className="text-[#5b4fff] font-normal">
                    {session.user.email}
                  </span>
                </div>
                {session.user.email !== invitation.email && (
                  <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-800 border border-yellow-200">
                    Cette invitation est destinée à {invitation.email}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm">
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <span>Non connecté</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {invitation.status === "pending" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Button
                  onClick={handleAcceptInvitation}
                  disabled={isAccepting}
                  className="w-full bg-[#5b4fff] text-white hover:bg-[#5b4fff]/90 cursor-pointer"
                  size="sm"
                >
                  {isAccepting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      Traitement...
                    </>
                  ) : !session?.user ? (
                    userExists ? (
                      "Se connecter"
                    ) : (
                      "Créer mon compte"
                    )
                  ) : (
                    "Accepter l'invitation"
                  )}
                </Button>

                <Button
                  onClick={handleRejectInvitation}
                  disabled={isAccepting}
                  variant="outline"
                  className="w-full cursor-pointer"
                  size="sm"
                >
                  {isAccepting ? "Traitement..." : "Refuser"}
                </Button>

                {!session?.user && (
                  <div className="p-3 bg-[#5b4fff]/10 rounded text-xs text-[#5b4fff]/80 rounded-md border border-[#5b4fff]/40">
                    <strong>Info:</strong>{" "}
                    {userExists
                      ? "Vous serez redirigé vers la connexion pour accéder à votre compte existant."
                      : "Vous serez redirigé vers l'inscription avec vos informations pré-remplies."}
                  </div>
                )}
              </div>
            </>
          )}

          {invitation.status !== "pending" && (
            <>
              <Separator />
              <div className="text-center py-4">
                <CheckCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Cette invitation a déjà été traitée.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
