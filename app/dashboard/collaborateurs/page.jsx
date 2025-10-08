"use client";

import { useState, useCallback } from "react";
import TableUser from "./components/table";
import InviteMembers from "./components/invite-members";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useSubscription } from "@/src/contexts/dashboard-layout-context";

function CollaborateursContent() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fonction pour ouvrir le dialogue depuis le bouton dans TableUser
  const handleOpenInviteDialog = () => {
    setDialogOpen(true);
  };

  // Fonction pour rafraîchir la liste après une invitation
  const handleInvitationSent = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Fonction pour rafraîchir la liste (peut être appelée depuis TableUser)
  const handleRefreshList = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <h1 className="text-2xl font-medium mb-6">Collaborateurs</h1>
      <div className="flex gap-8 items-start">
        <TableUser
          className="w-2/3"
          handleAddUser={handleOpenInviteDialog}
          refreshTrigger={refreshTrigger}
          onRefresh={handleRefreshList}
        />
        {/* <Card className="w-1/3 h-auto sticky top-6">
          <CardHeader>
            <CardTitle className="font-normal">Ajouter un comptable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-muted/50 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm">
                Invitez votre comptable à accéder à vos données financières en
                toute sécurité.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="default"
                className="w-full font-normal"
                onClick={handleOpenInviteDialog}
              >
                Inviter un comptable
              </Button>
            </div>
          </CardContent>
        </Card> */}
      </div>
      <InviteMembers
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onInvitationSent={handleInvitationSent}
      />
    </div>
  );
}

export default function Collaborateurs() {
  return (
    <ProRouteGuard pageName="Collaborateurs">
      <CollaborateursContent />
    </ProRouteGuard>
  );
}
