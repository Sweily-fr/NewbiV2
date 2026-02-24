"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { PLANS } from "@/src/components/create-workspace/plan-form";

const formatPrice = (amount) => amount.toFixed(2).replace(".", ",");

export function ConfirmationForm({
  companyName,
  companyData,
  selectedPlan,
  isAnnual,
  emails,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = authClient.useSession();

  const plan = PLANS.find((p) => p.key === selectedPlan);
  const price = plan ? (isAnnual ? plan.annualPrice : plan.monthlyPrice) : 0;
  const filledEmails = emails.filter((e) => e.trim());

  const handleCreate = async () => {
    if (!session?.user?.id) {
      toast.error("Vous devez être connecté pour créer un espace de travail");
      return;
    }

    setIsCreating(true);

    try {
      const invitedMembers = filledEmails.map((email) => ({
        email: email.trim(),
        role: "member",
      }));

      const orgData = {
        name: companyName,
        type: "new",
        planName: selectedPlan,
        isAnnual,
        invitedMembers,
        userId: session.user.id,
        ...companyData,
      };

      sessionStorage.setItem("pending_org_creation", JSON.stringify(orgData));

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
        window.location.href = url;
      }
    } catch (error) {
      console.error("Erreur création workspace:", error);
      toast.error(error.message || "Erreur lors de la création");
      sessionStorage.removeItem("pending_org_creation");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-20 py-6">
      <div className="flex flex-col pt-14">
        <h1 className="text-xl font-semibold text-[#46464A] mb-2">
          Confirmez votre espace de travail
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          Vérifiez les informations avant de continuer vers le paiement.
        </p>

        {/* Summary cards */}
        <div className="space-y-3">
          {/* Workspace name */}
          <div className="rounded-xl border border-[#EEEFF1] p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
              Espace de travail
            </p>
            <p className="text-sm font-semibold text-[#46464A]">
              {companyName}
            </p>
            {companyData?.siret && (
              <p className="text-xs text-muted-foreground mt-0.5">
                SIRET: {companyData.siret}
                {companyData.legalForm && ` · ${companyData.legalForm}`}
              </p>
            )}
          </div>

          {/* Plan */}
          {plan && (
            <div className="rounded-xl border border-[#EEEFF1] p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                Abonnement
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#46464A]">
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
          )}

          {/* Members */}
          {filledEmails.length > 0 && (
            <div className="rounded-xl border border-[#EEEFF1] p-4">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">
                Membres invités
              </p>
              <div className="space-y-1">
                {filledEmails.map((email, i) => (
                  <p key={i} className="text-sm text-[#46464A]">
                    {email.trim()}
                  </p>
                ))}
              </div>
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
