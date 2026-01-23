"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
} from "@/src/components/ui/button-group";
import { PermissionButton } from "@/src/components/rbac";
import { Plus } from "lucide-react";
import ClientsTabs from "./components/clients-tabs";
import ClientsModal from "./components/clients-modal";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function ClientsContent() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fonction pour ouvrir le dialogue depuis le bouton dans TableUser
  const handleOpenInviteDialog = () => {
    setDialogOpen(true);
  };

  return (
    <>
      {/* Desktop Layout - Full height avec scroll uniquement sur le tableau */}
      <div className="hidden md:flex md:flex-col md:h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-4 sm:px-6 pt-4 sm:pt-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Gestion des contacts</h1>
          </div>
          <div className="flex gap-2">
            <ButtonGroup>
              <Button
                onClick={handleOpenInviteDialog}
                className="cursor-pointer font-normal bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                Nouveau contact
              </Button>
              <ButtonGroupSeparator />
              <Button
                onClick={handleOpenInviteDialog}
                size="icon"
                className="cursor-pointer bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Plus size={16} aria-hidden="true" />
              </Button>
            </ButtonGroup>
          </div>
        </div>

        {/* Tabs */}
        <ClientsTabs />
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Contacts</h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos contacts et suivez vos interactions
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <ClientsTabs />
        </div>

        {/* Bouton flottant mobile avec protection RBAC */}
        <PermissionButton
          resource="clients"
          action="create"
          onClick={handleOpenInviteDialog}
          className="fixed bottom-6 bg-[#5a50ff] right-6 h-14 w-14 rounded-full shadow-lg z-50 md:hidden"
          size="icon"
          hideIfNoAccess={true}
          tooltipNoAccess="Vous n'avez pas la permission de créer des contacts"
        >
          <Plus className="h-6 w-6" />
        </PermissionButton>
      </div>

      {/* Modal unique pour desktop et mobile */}
      <ClientsModal open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

export default function Clients() {
  return (
    <ProRouteGuard pageName="Clients">
      <ClientsContent />
    </ProRouteGuard>
  );
}
