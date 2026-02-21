"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useClient, useClients, useDeleteClient } from "@/src/hooks/useClients";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { useQuotes } from "@/src/graphql/quoteQueries";
import ClientsModal from "@/app/dashboard/clients/components/clients-modal";
import ClientDetailHeader from "./components/client-detail-header";
import ClientDetailSidebar from "./components/client-detail-sidebar";
import ClientDetailTabs from "./components/client-detail-tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Button } from "@/src/components/ui/button";

const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

function ClientDetailContent() {
  const { id } = useParams();
  const router = useRouter();

  const isValid = isValidObjectId(id);

  const { workspaceId } = useWorkspace();
  const { client, loading: clientLoading, error: clientError } = useClient(isValid ? id : null);
  const { clients: allClients } = useClients(1, 1000);
  const { invoices } = useInvoices();
  const { quotes } = useQuotes();
  const { deleteClient } = useDeleteClient();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (!isValid) {
    router.replace("/dashboard/clients");
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentIndex = allClients?.findIndex((c) => c.id === id) ?? -1;

  const handlePrev = () => {
    if (currentIndex > 0 && allClients) {
      router.push(`/dashboard/clients/${allClients[currentIndex - 1].id}`);
    }
  };

  const handleNext = () => {
    if (allClients && currentIndex < allClients.length - 1) {
      router.push(`/dashboard/clients/${allClients[currentIndex + 1].id}`);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClient(id);
      router.push("/dashboard/clients");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClientUpdate = () => {};

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clientError || !client) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] gap-4">
        <p className="text-muted-foreground">
          {clientError ? "Erreur lors du chargement du client" : "Client introuvable"}
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/clients")}
        >
          Retour aux contacts
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <ClientDetailHeader
        client={client}
        currentIndex={currentIndex}
        totalClients={allClients?.length || 0}
        onPrev={handlePrev}
        onNext={handleNext}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      {/* Main content: tabs (left) + sidebar (right) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ClientDetailTabs
            client={client}
            invoices={invoices || []}
            quotes={quotes || []}
            workspaceId={workspaceId}
            onClientUpdate={handleClientUpdate}
          />
        </div>

        <ClientDetailSidebar client={client} invoices={invoices || []} onEdit={() => setIsEditModalOpen(true)} />
      </div>

      {/* Edit modal */}
      <ClientsModal
        client={client}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Delete dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contact ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Le contact &quot;{client.name}&quot;
              sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ClientDetailPage() {
  return (
    <ProRouteGuard pageName="Clients">
      <ClientDetailContent />
    </ProRouteGuard>
  );
}
