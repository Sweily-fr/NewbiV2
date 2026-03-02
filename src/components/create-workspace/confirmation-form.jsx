"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { AvatarGroup } from "@/src/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/src/components/ui/tooltip";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { useQuery } from "@apollo/client";
import { LOOKUP_USERS_BY_EMAILS } from "@/src/graphql/queries/user";
import { PLANS } from "@/src/components/create-workspace/plan-form";

const formatPrice = (amount) => amount.toFixed(2).replace(".", ",");

export function ConfirmationForm({
  companyName,
  companyData,
  selectedPlan,
  isAnnual,
  members,
  logoUrl,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = authClient.useSession();

  const plan = PLANS.find((p) => p.key === selectedPlan);
  const price = plan ? (isAnnual ? plan.annualPrice : plan.monthlyPrice) : 0;
  const filledMembers = members.filter((m) => m.email.trim());

  const emails = useMemo(
    () => filledMembers.map((m) => m.email.trim()),
    [filledMembers]
  );

  const { data: lookupData } = useQuery(LOOKUP_USERS_BY_EMAILS, {
    variables: { emails },
    skip: emails.length === 0,
  });

  const avatarMap = useMemo(() => {
    const map = {};
    if (lookupData?.lookupUsersByEmails) {
      for (const user of lookupData.lookupUsersByEmails) {
        map[user.email.toLowerCase()] = user;
      }
    }
    return map;
  }, [lookupData]);

  const ROLE_LABELS = {
    admin: "Administrateur",
    member: "Membre",
    accountant: "Comptable",
  };

  const handleCreate = async () => {
    if (!session?.user?.id) {
      toast.error("Vous devez être connecté pour créer un espace de travail");
      return;
    }

    setIsCreating(true);

    try {
      const invitedMembers = filledMembers.map((m) => ({
        email: m.email.trim(),
        role: m.role,
      }));

      const response = await fetch("/api/create-org-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationData: {
            name: companyName,
            type: "new",
            planName: selectedPlan,
            isAnnual,
            invitedMembers,
            ...(logoUrl && { logo: logoUrl }),
            ...(companyData || {}),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erreur lors de la création de la session"
        );
      }

      const { url } = await response.json();

      if (url) {
        sessionStorage.removeItem("create-workspace-data");
        window.location.href = url;
      }
    } catch (error) {
      console.error("Erreur création workspace:", error);
      toast.error(error.message || "Erreur lors de la création");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-20 py-6">
      <div className="flex flex-col pt-14">
        <h1 className="text-xl font-semibold text-foreground mb-2">
          Confirmez votre espace de travail
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Vérifiez les informations avant de continuer vers le paiement.
        </p>

        {/* Summary sections */}
        <div>
          {/* Workspace name */}
          <div className="py-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              Espace de travail
            </p>
            <p className="text-sm font-semibold text-foreground">
              {companyName}
            </p>
            {companyData?.siret && (
              <p className="text-xs text-muted-foreground mt-0.5">
                SIRET: {companyData.siret}
                {companyData.legalForm && ` · ${companyData.legalForm}`}
              </p>
            )}
          </div>

          <Separator className="bg-border" />

          {/* Plan */}
          {plan && (
            <>
              <div className="py-4">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                  Abonnement
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    {plan.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(price)} €/mois
                    <span className="text-[11px] ml-1">
                      {isAnnual ? "(annuel)" : "(mensuel)"}
                    </span>
                  </p>
                </div>
              </div>

              {filledMembers.length > 0 && <Separator className="bg-border" />}
            </>
          )}

          {/* Members */}
          {filledMembers.length > 0 && (
            <div className="py-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Membres invités
                </p>
                <span className="text-xs text-muted-foreground">
                  {filledMembers.length} membre{filledMembers.length > 1 ? "s" : ""}
                </span>
              </div>
              <AvatarGroup className="mt-3">
                {filledMembers.map((m, i) => {
                  const email = m.email.trim();
                  const lookupUser = avatarMap[email.toLowerCase()];
                  const displayName = lookupUser?.name || email.split("@")[0];

                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <span>
                          <UserAvatar
                            src={lookupUser?.image}
                            name={displayName}
                            colorKey={email}
                            size="sm"
                            className="ring-2 ring-background cursor-pointer"
                          />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {email}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </AvatarGroup>
            </div>
          )}
        </div>

        {/* Trial info */}
        <div className="mt-6 rounded-xl bg-[#5A50FF]/5 border border-[#5A50FF]/10 p-4">
          <p className="text-xs text-[#5A50FF] font-medium">
            30 jours d&apos;essai gratuit — Aucun prélèvement immédiat
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Vous serez redirigé vers Stripe pour enregistrer votre moyen de paiement.
          </p>
        </div>

        {/* Create button */}
        <div className="mt-8">
          <Button
            variant="primary"
            className="w-full"
            disabled={isCreating}
            onClick={handleCreate}
          >
            {isCreating ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Redirection vers le paiement...
              </>
            ) : (
              "Créer mon espace de travail"
            )}
          </Button>
        </div>
      </div>

      {/* Legal text */}
      <div className="mt-auto pt-8 pb-4">
        <p className="text-[11px] text-muted-foreground leading-tight">
          En continuant, vous acceptez nos conditions générales d&apos;utilisation et notre politique de confidentialité. Votre essai gratuit de 30 jours commencera immédiatement.
        </p>
      </div>
    </div>
  );
}
