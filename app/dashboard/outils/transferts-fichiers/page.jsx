"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import TransferTable from "./components/transfer-table";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function TransfertsContent() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium mb-2">
            Gestion des Transferts Fichiers
          </h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos transferts de fichiers et suivez les téléchargements
          </p>
        </div>
        <Link href="/dashboard/outils/transferts-fichiers/new">
          <Button className="font-normal cursor-pointer">
            {/* <IconPlus size={16} className="mr-2" /> */}
            Transfert un fichier
          </Button>
        </Link>
      </div>
      <TransferTable />
    </div>
  );
}

export default function TransfertsFichiers() {
  return (
    // <ProRouteGuard pageName="Transferts de fichiers"> {/* Commenté pour le développement */}
    <TransfertsContent />
    // </ProRouteGuard>
  );
}
