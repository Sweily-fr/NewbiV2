"use client";

import { useState } from "react";
import TableUser from "./components/table";
import InviteMembers from "./components/invite-members";

export default function Collaborateurs() {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fonction pour ouvrir le dialogue depuis le bouton dans TableUser
  const handleOpenInviteDialog = () => {
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <h1 className="text-2xl font-semibold mb-6">Collaborateurs</h1>
      <TableUser handleAddUser={handleOpenInviteDialog} />
      <InviteMembers open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
