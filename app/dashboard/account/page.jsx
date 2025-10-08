"use client";
import FormAccount from "./formAccount";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { useUser } from "../../../src/lib/auth/hooks";
import { DeactivateAccountModal } from "./components/DeactivateAccountModal";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function Account() {
  const { session } = useUser();
  const { isActive: isPremium } = useSubscription();
  const [isDeactivateAccountModalOpen, setIsDeactivateAccountModalOpen] =
    useState(false);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-8">
      <h1 className="text-2xl font-medium mb-6">Compte</h1>
      <FormAccount user={session?.user} />
      {/* Section Désactivation du compte */}
      <div>
        <h3 className="text-lg font-medium mb-6">Désactivation du compte</h3>
        <Separator className="my-4" />

        {/* Avertissement pour les utilisateurs premium */}
        {isPremium() && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <TriangleAlert className="text-red-800" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Abonnement actif détecté
                </h4>
                <p className="text-sm text-red-700 mb-3">
                  Vous avez un abonnement premium actif. Avant de désactiver
                  votre compte, vous devez d'abord annuler votre abonnement pour
                  éviter des frais futurs.
                </p>
                <Link href="/dashboard/subscribe">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-700 border-red-300 cursor-pointer"
                  >
                    Gérer mon abonnement
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Désactiver mon compte */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <h4 className="text-sm font-medium text-destructive">
              Désactiver mon compte
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Vous désactiverez définitivement le compte ainsi que l'accès à
              tous les espaces de travail. Vos données seront conservées.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-normal text-destructive border-destructive hover:text-destructive-foreground"
            onClick={() => setIsDeactivateAccountModalOpen(true)}
            disabled={isPremium()}
          >
            Désactiver
          </Button>
        </div>
      </div>

      {/* Modal de désactivation */}
      <DeactivateAccountModal
        isOpen={isDeactivateAccountModalOpen}
        onClose={() => setIsDeactivateAccountModalOpen(false)}
        userEmail={session?.user?.email}
      />
    </div>
  );
}
