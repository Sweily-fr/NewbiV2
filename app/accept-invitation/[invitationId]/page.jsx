"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { authClient, useSession } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  ChartSpline,
  LoaderCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderCircle,
  Send,
  Mail,
  Shield,
  Calendar,
  FileChartColumn,
  ChartPie,
} from "lucide-react";

export default function AcceptInvitationPage() {
  const { invitationId } = useParams();
  const { data: session } = useSession();
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [userExists, setUserExists] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
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

        setInvitation(data);

        console.log("📋 Invitation data:", data);
        console.log("🏢 Organization ID:", data.organizationId);

        // Récupérer les membres de l'organisation
        if (data.organizationId) {
          try {
            const membersResponse = await fetch("/api/organization/members", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                organizationId: data.organizationId,
              }),
            });
            console.log("📡 Members response status:", membersResponse.status);

            if (membersResponse.ok) {
              const result = await membersResponse.json();
              console.log("👥 Members result:", result);

              // Better Auth retourne les membres dans result.members
              const membersData = result.members || result || [];

              // Filtrer uniquement les membres actifs et formater
              const activeMembers = membersData
                .filter((m) => m.role) // Les membres ont un rôle
                .map((m) => ({
                  id: m.userId || m.id,
                  name: m.user?.name || m.name,
                  email: m.user?.email || m.email,
                  avatar: m.user?.image || m.user?.avatar || m.avatar,
                  role: m.role,
                }))
                .slice(0, 4); // Max 4 avatars

              console.log("✅ Active members:", activeMembers);
              setMembers(activeMembers);
            } else {
              console.error(
                "❌ Members response not OK:",
                await membersResponse.text()
              );
            }
          } catch (membersError) {
            console.error(
              "❌ Erreur lors de la récupération des membres:",
              membersError
            );
          }
        } else {
          console.warn("⚠️ Pas d'organizationId dans l'invitation");
        }

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

      const result = await response.json();

      if (!response.ok) {
        // Afficher un message d'erreur plus détaillé
        const errorMessage =
          result.details ||
          result.error ||
          `Erreur ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      if (result.error) {
        throw new Error(result.details || result.error);
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
      <div className="min-h-screen flex items-center justify-center">
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
      <div className="min-h-screen flex items-center justify-center">
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
      case "owner":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "member":
        return "bg-[#5a50ff]/10 text-[#5a50ff] border-[#5a50ff]/20 dark:bg-[#5a50ff]/10 dark:text-[#8b85ff] dark:border-[#5a50ff]/30";
      case "viewer":
        return "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case "accountant":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
      case "accepted":
        return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      case "canceled":
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
      default:
        return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
    }
  };

  const InvitationCard = ({ children, className, borderClassName }) => {
    return (
      <div
        className={cn(
          "bg-background relative flex size-20 rounded-xl dark:bg-transparent",
          className
        )}
      >
        <div
          role="presentation"
          className={cn(
            "absolute inset-0 rounded-xl border border-black/5 dark:border-white/10",
            borderClassName
          )}
        />
        <div className="relative z-20 m-auto size-fit *:size-6">{children}</div>
      </div>
    );
  };

  return (
    <section>
      <div className="bg-white dark:bg-background py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative mx-auto w-fit">
            <div
              role="presentation"
              className="absolute inset-0 z-10 bg-gradient-radial from-transparent via-transparent to-white dark:to-background"
              style={{
                background:
                  "radial-gradient(circle, transparent 0%, transparent 40%, white 75%, white 100%)",
              }}
            ></div>
            <div className="mx-auto mb-2 flex w-fit justify-center gap-2">
              <InvitationCard>
                <ChartSpline className="text-gray-200 w-6 h-6" />
              </InvitationCard>
              <InvitationCard>
                <Send className="text-gray-200 w-6 h-6" />
              </InvitationCard>
            </div>
            <div className="mx-auto my-2 flex w-fit justify-center gap-2">
              <InvitationCard>
                <Shield className="text-gray-200 w-6 h-6" />
              </InvitationCard>

              <InvitationCard
                borderClassName="shadow-black-950/10 shadow-xl border-black/5 dark:border-white/10"
                className="dark:bg-white/10"
              >
                <img src="/ni2.svg" alt="Newbi" className="w-6 h-6" />
              </InvitationCard>
              <InvitationCard>
                <Calendar className="text-gray-200 w-6 h-6" />
              </InvitationCard>
            </div>

            <div className="mx-auto flex w-fit justify-center gap-2">
              <InvitationCard>
                <FileChartColumn className="text-gray-200 w-6 h-6" />
              </InvitationCard>

              <InvitationCard>
                <ChartPie className="text-gray-200 w-6 h-6" />
              </InvitationCard>
            </div>
          </div>
          <div className="mx-auto mt-6 max-w-lg space-y-6 text-center">
            <div className="space-y-3">
              <h2 className="text-balance text-3xl font-medium md:text-4xl">
                Rejoindre {invitation.organizationName}
              </h2>

              {console.log(
                "🎨 Rendering members:",
                members,
                "Length:",
                members.length
              )}
              {members.length > 0 && (
                <div className="flex justify-center items-center gap-2">
                  <TooltipProvider>
                    <div className="flex -space-x-[0.45rem]">
                      {members.map((member, index) => (
                        <Tooltip key={member.id || index}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 ring-1 ring-background cursor-pointer">
                              {member.avatar && (
                                <AvatarImage
                                  src={member.avatar}
                                  alt={member.name || member.email}
                                />
                              )}
                              <AvatarFallback className="text-[10px] bg-[#5b4fff] text-white">
                                {(
                                  member.name?.[0] ||
                                  member.email?.[0] ||
                                  "U"
                                ).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {member.name || member.email}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                  <span className="text-xs text-muted-foreground">
                    {members.length} membre{members.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            <p className="text-muted-foreground text-sm">
              Vous avez été invité à rejoindre{" "}
              <strong>{invitation.organizationName}</strong> en tant que{" "}
              <strong>
                {invitation.role === "owner" && "Propriétaire"}
                {invitation.role === "admin" && "Administrateur"}
                {invitation.role === "member" && "Membre"}
                {invitation.role === "viewer" && "Invité"}
                {invitation.role === "accountant" && "Comptable"}
              </strong>
              .
            </p>

            {invitation.status === "pending" && (
              <div className="space-y-3 pt-4">
                {session?.user &&
                  session.user.email.toLowerCase() !==
                    invitation.email.toLowerCase() && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                      <p className="font-medium mb-2">⚠️ Attention</p>
                      <p className="mb-2">
                        Cette invitation est destinée à{" "}
                        <strong>{invitation.email}</strong>
                      </p>
                      <p className="mb-3">
                        Vous êtes connecté avec{" "}
                        <strong>{session.user.email}</strong>
                      </p>
                      <Button
                        onClick={async () => {
                          await authClient.signOut();
                          window.location.reload();
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full bg-white cursor-pointer"
                      >
                        Se déconnecter
                      </Button>
                    </div>
                  )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleRejectInvitation}
                    disabled={isAccepting}
                    variant="outline"
                    className="cursor-pointer flex-1"
                  >
                    {isAccepting ? "Traitement..." : "Refuser"}
                  </Button>

                  <Button
                    onClick={handleAcceptInvitation}
                    disabled={
                      isAccepting ||
                      (session?.user &&
                        session.user.email.toLowerCase() !==
                          invitation.email.toLowerCase())
                    }
                    className="bg-[#5b4fff] hover:bg-[#5b4fff]/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-1"
                  >
                    {isAccepting ? (
                      <>
                        <LoaderCircle className="h-3 w-3 animate-spin mr-2" />
                        Traitement...
                      </>
                    ) : !session?.user ? (
                      userExists ? (
                        "Se connecter pour accepter"
                      ) : (
                        "Créer mon compte"
                      )
                    ) : session.user.email.toLowerCase() !==
                      invitation.email.toLowerCase() ? (
                      "Mauvais compte"
                    ) : (
                      "Accepter l'invitation"
                    )}
                  </Button>
                </div>

                {!session?.user && (
                  <p className="text-xs text-muted-foreground pt-2">
                    {userExists
                      ? "Vous serez redirigé vers la connexion."
                      : "Vous serez redirigé vers l'inscription."}
                  </p>
                )}
              </div>
            )}

            {invitation.status !== "pending" && (
              <div className="pt-4">
                <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Cette invitation a déjà été traitée.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
