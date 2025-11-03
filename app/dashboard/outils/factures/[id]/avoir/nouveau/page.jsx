"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ModernCreditNoteEditor from "../../../components/modern-credit-note-editor";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { AlertCircle } from "lucide-react";

function NewCreditNoteContent() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id;
  const { canCreate } = usePermissions();
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    const checkPermission = async () => {
      const allowed = await canCreate("creditNotes");
      setHasPermission(allowed);

      if (!allowed) {
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push("/dashboard/outils/factures");
        }, 2000);
      }
    };

    checkPermission();
  }, [canCreate, router]);

  // Chargement
  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Pas de permission
  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas la permission de créer des avoirs. Redirection...
          </AlertDescription>
        </Alert>
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
