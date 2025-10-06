"use client";

import FileUploadNew from "../components/file-upload-new";
import { ProRouteGuard } from "@/src/components/pro-route-guard";

function NewTransfertsContent() {
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
        <FileUploadNew />
      </div>
    </div>
  );
}

export default function NewTransfertsFichiers() {
  return (
    <ProRouteGuard pageName="Nouveau transfert">
      <NewTransfertsContent />
    </ProRouteGuard>
  );
}
