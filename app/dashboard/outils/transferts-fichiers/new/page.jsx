"use client";

import FileUploadNew from "../components/file-upload-new";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { TransferUploadSkeleton } from "../components/transfer-upload-skeleton";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";

function NewTransfertsContent() {
  // Droits du rôle (tout autorisé tant que la grille n'est pas chargée)
  const { canWrite, isReady } = useMyPermissions();
  const canEditFileTransfers = !isReady || canWrite("fileTransfers");

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <div className="w-full">
        <h1 className="text-2xl font-medium mb-2">
          Nouveau transfert de fichiers
        </h1>
        <p className="text-muted-foreground text-sm">
          Partagez des fichiers volumineux jusqu'à 5GB avec vos clients ou
          collaborateurs
        </p>
      </div>
      <div className="w-full">
        {canEditFileTransfers ? (
          <FileUploadNew />
        ) : (
          <p className="text-sm text-muted-foreground">
            Votre rôle ne permet pas de créer un transfert de fichiers.
          </p>
        )}
      </div>
    </div>
  );
}

export default function NewTransfertsFichiers() {
  return (
    <ProRouteGuard
      pageName="Nouveau transfert"
      fallback={<TransferUploadSkeleton />}
    >
      <NewTransfertsContent />
    </ProRouteGuard>
  );
}
