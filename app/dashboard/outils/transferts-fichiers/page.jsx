"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import TransferTable from "./components/transfer-table";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useFileTransfer } from "./hooks/useFileTransfer";

function TransfertsContent() {
  const { transfers, transfersLoading, refetchTransfers } = useFileTransfer();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-4 sm:space-y-0">
        {/* Title, description and button */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-medium mb-2">
              Gestion des Transferts Fichiers
            </h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos transferts de fichiers et suivez les téléchargements
            </p>
          </div>
          
          {/* Action button */}
          <div className="sm:flex-shrink-0">
            <Link href="/dashboard/outils/transferts-fichiers/new">
              <Button className="font-normal cursor-pointer w-full sm:w-auto">
                {/* <IconPlus size={16} className="mr-2" /> */}
                Transfert un fichier
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <TransferTable
        transfers={transfers}
        onRefresh={refetchTransfers}
        loading={transfersLoading}
      />
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
