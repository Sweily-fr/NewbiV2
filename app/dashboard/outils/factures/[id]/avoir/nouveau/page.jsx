"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ModernCreditNoteEditor from "../../../components/modern-credit-note-editor";
import { InvoiceEditorSkeleton } from "../../../components/invoice-editor-skeleton";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Alert, AlertDescription } from "@/src/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";

function NewCreditNoteContent() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id;
  const { canCreate, isLoading, membersLoadFailed, retryLoadMembers } =
    usePermissions();
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    // Ne trancher qu'une fois les membres chargés : pendant le chargement,
    // canCreate répond false et on afficherait un faux "Permission refusée"
    if (isLoading || membersLoadFailed) {
      setHasPermission(null);
      return;
    }

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
  }, [canCreate, isLoading, membersLoadFailed]);

  // Échec du chargement des membres (réseau) : proposer un retry plutôt
  // qu'un refus à tort
  if (membersLoadFailed) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Vérification impossible
          </h2>
          <p className="text-muted-foreground mb-6">
            Impossible de vérifier vos permissions pour le moment. Vérifiez
            votre connexion puis réessayez.
          </p>
          <Button onClick={retryLoadMembers} variant="default">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Chargement : même skeleton que l'éditeur pour éviter un flash de spinner
  // (l'ancien spinner border-gray-900 était invisible en dark mode)
  if (isLoading || hasPermission === null) {
    return <InvoiceEditorSkeleton />;
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
          <Button
            onClick={() => router.push("/dashboard/outils/factures")}
            variant="default"
          >
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
    <ProRouteGuard pageName="Nouvel avoir" fallback={<InvoiceEditorSkeleton />}>
      <NewCreditNoteContent />
    </ProRouteGuard>
  );
}
