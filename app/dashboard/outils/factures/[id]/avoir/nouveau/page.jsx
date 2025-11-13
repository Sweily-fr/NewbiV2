"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ModernCreditNoteEditor from "../../../components/modern-credit-note-editor";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";

function NewCreditNoteContent() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id;
  const { canCreate } = usePermissions();
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const checkPermission = async () => {
      const allowed = await canCreate("creditNotes");
      if (isMounted) {
        setHasPermission(allowed);
      }
    };

    checkPermission();

    return () => {
      isMounted = false;
    };
  }, [canCreate]);

  // Chargement
  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Pas de permission - Afficher un message sans redirection automatique
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Permission refusée</h2>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas la permission de créer des avoirs.
          </p>
          <Button onClick={() => router.push("/dashboard/outils/factures")} variant="default">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux factures
          </Button>
        </div>
      </div>
    );
  }

  return <ModernCreditNoteEditor mode="create" invoiceId={invoiceId} />;
}

export default function NewCreditNotePage() {
  return (
    <ProRouteGuard pageName="Nouvel avoir">
      <NewCreditNoteContent />
    </ProRouteGuard>
  );
}
