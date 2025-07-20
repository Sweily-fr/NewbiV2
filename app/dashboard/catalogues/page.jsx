"use client";

import { useState } from "react";
import TableUser from "./components/table";
import ClientsModal from "./components/clients-modal";

export default function Catalogues() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fonction pour ouvrir le dialogue depuis le bouton dans TableUser
  const handleOpenInviteDialog = () => {
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium mb-2">Gestion des Catalogues</h1>
          <p className="text-muted-foreground text-sm">
            Gérez efficacement vos catalogues en un seul endroit.
          </p>
        </div>
      </div>
      <TableUser handleAddUser={handleOpenInviteDialog} />
      <ClientsModal open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
