"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";
import { Button } from "@/src/components/ui/button";

/**
 * Page de transition après le paiement Stripe d'un nouvel espace.
 *
 * Rôle : finaliser la création AVANT d'arriver sur le dashboard, pour que
 * l'utilisateur atterrisse directement sur sa nouvelle organisation, avec le
 * bon statut d'abonnement — sans passer par l'ancien workspace ni voir un
 * badge « expiré » périmé.
 *
 * 1. Vérifie la session Stripe (verify-checkout-session crée l'org si le
 *    webhook n'est pas encore passé, de façon idempotente)
 * 2. Active la nouvelle organisation
 * 3. Préchauffe le cache d'abonnement (localStorage subscription-${orgId})
 *    pour que le dashboard s'affiche instantanément avec le statut actif
 * 4. Redirige vers /dashboard
 */
function WorkspaceSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [failed, setFailed] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      router.replace("/dashboard");
      return;
    }

    const finalize = async () => {
      try {
        // 1. Vérifier le paiement + résoudre/créer l'organisation
        let organizationId = null;
        const maxAttempts = 10;
        for (let i = 0; i < maxAttempts && !organizationId; i++) {
          try {
            const res = await fetch(
              `/api/verify-checkout-session?session_id=${sessionId}`,
            );
            const data = await res.json();
            if (data.success && data.organizationId) {
              organizationId = data.organizationId;
              break;
            }
          } catch (error) {
            console.warn("⚠️ [WORKSPACE SUCCESS] verify:", error);
          }
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        if (!organizationId) {
          setFailed(true);
          return;
        }

        // 2. Rafraîchir la session puis activer la nouvelle organisation
        try {
          await authClient.getSession({ fetchOptions: { cache: "no-store" } });
        } catch {
          // Non-fatal — setActive suffit dans la plupart des cas
        }
        await authClient.organization.setActive({ organizationId });

        // 3. Préchauffer le cache d'abonnement de la nouvelle org pour que le
        // dashboard affiche immédiatement le bon statut (pas de flash "expiré")
        try {
          const subRes = await fetch(
            `/api/organizations/${organizationId}/subscription`,
          );
          if (subRes.ok) {
            const subData = await subRes.json();
            localStorage.setItem(
              `subscription-${organizationId}`,
              JSON.stringify({ data: subData, timestamp: Date.now() }),
            );
          }
        } catch {
          // Non-fatal — le dashboard refetchera sans cache
        }

        // 4. Nettoyer les brouillons du flow de création
        sessionStorage.removeItem("create-workspace-data");
        sessionStorage.removeItem("pending_org_creation");
        sessionStorage.removeItem("org_activation_processed");

        toast.success("Organisation créée avec succès !", {
          description: "Votre abonnement est maintenant actif.",
        });

        router.replace("/dashboard");
      } catch (error) {
        console.error("❌ [WORKSPACE SUCCESS] Erreur:", error);
        setFailed(true);
      }
    };

    finalize();
  }, [searchParams, router]);

  if (failed) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <img
            src="/newbiLetter.png"
            alt="Newbi"
            className="h-6 mb-6 dark:invert"
          />
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center">
            <div className="mx-auto mb-6 flex items-center justify-center size-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-100 dark:border-amber-800">
              <AlertCircle className="size-7 text-amber-500" />
            </div>

            <h1 className="text-xl font-semibold text-foreground mb-2">
              Finalisation en cours
            </h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Votre paiement a bien été pris en compte, mais la création de
              votre espace prend plus de temps que prévu. Il apparaîtra dans
              votre sélecteur d&apos;espaces d&apos;ici quelques instants.
            </p>

            <Button
              variant="primary"
              className="w-full"
              onClick={() => router.replace("/dashboard")}
            >
              Aller au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <img
          src="/newbiLetter.png"
          alt="Newbi"
          className="h-6 mb-6 dark:invert"
        />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Finalisation de votre espace...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WorkspaceSuccessPage() {
  return (
    <Suspense fallback={null}>
      <WorkspaceSuccessContent />
    </Suspense>
  );
}
