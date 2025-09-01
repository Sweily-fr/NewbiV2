"use client";
import FormAccount from "./formAccount";
import { Separator } from "@/src/components/ui/separator";
import { Button } from "@/src/components/ui/button";
import { useUser } from "../../../src/lib/auth/hooks";
import { DeactivateAccountModal } from "./components/DeactivateAccountModal";
import { useState } from "react";

export default function Account() {
  const { session } = useUser();
  const [isDeactivateAccountModalOpen, setIsDeactivateAccountModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-8">
      <h1 className="text-2xl font-medium mb-6">Compte</h1>
      <FormAccount user={session?.user} />
      {/* Section Désactivation du compte */}
      <div>
        <h3 className="text-lg font-medium mb-6">Désactivation du compte</h3>
        <Separator className="my-4" />

        {/* Supprimer mon compte */}
        <div className="flex items-center justify-between pb-4">
          <div>
            <h4 className="text-sm font-medium text-destructive">
              Désactiver mon compte
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Vous désactiverez définitivement le compte ainsi que l'accès à
              tous les espaces de travail.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-normal text-destructive border-destructive hover:text-destructive-foreground"
            onClick={() => setIsDeactivateAccountModalOpen(true)}
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
