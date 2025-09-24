"use client";

import { useState } from "react";
import TableUser from "./components/table";
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
      {/* Desktop Layout */}
      <div className="hidden md:block space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium mb-2">Gestion des Clients</h1>
            <p className="text-muted-foreground text-sm">
              Gérez efficacement vos clients en un seul endroit.
            </p>
          </div>
        </div>
        <TableUser handleAddUser={handleOpenInviteDialog} />
        <ClientsModal open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>

      {/* Mobile Layout - Style Notion */}
      <div className="md:hidden">
        {/* Header - Style Notion sur mobile */}
        <div className="px-4 py-6">
          <div>
            <h1 className="text-2xl font-medium mb-2">Clients</h1>
            <p className="text-muted-foreground text-sm">
              Gérez efficacement vos clients en un seul endroit.
            </p>
          </div>
        </div>

        {/* Table */}
        <TableUser handleAddUser={handleOpenInviteDialog} />
        <ClientsModal open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
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
