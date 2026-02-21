"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useClient, useClients, useDeleteClient, useBlockClient, useUnblockClient } from "@/src/hooks/useClients";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { useQuotes } from "@/src/graphql/quoteQueries";
import { usePurchaseOrders } from "@/src/graphql/purchaseOrderQueries";
import { useCreateEvent } from "@/src/hooks/useEvents";
import ClientsModal from "@/app/dashboard/clients/components/clients-modal";
import ClientDetailHeader from "./components/client-detail-header";
import ClientDetailSidebar from "./components/client-detail-sidebar";
import ClientDetailTabs from "./components/client-detail-tabs";
import { EventDialog } from "@/app/dashboard/calendar/components/event-dialog";
import AssignMembersDialog from "./components/assign-members-dialog";
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
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "@/src/components/ui/sonner";

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
  const { purchaseOrders } = usePurchaseOrders();
  const { deleteClient } = useDeleteClient();
  const { blockClient } = useBlockClient();
  const { unblockClient } = useUnblockClient();
  const { createEvent } = useCreateEvent();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

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

  const handleBlock = async () => {
    try {
      await blockClient(id, blockReason || undefined);
      setIsBlockDialogOpen(false);
      setBlockReason("");
      router.push("/dashboard/clients/blocked");
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleUnblock = async () => {
    try {
      await unblockClient(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleClientUpdate = () => {};

  const handleSaveReminder = async (eventData) => {
    const result = await createEvent({
      title: eventData.title,
      description: eventData.description,
      start: eventData.start,
      end: eventData.end,
      allDay: eventData.allDay,
      location: eventData.location,
      color: eventData.color,
      type: "reminder",
      clientId: id,
      emailReminder: eventData.emailReminder,
    });
    if (result) {
      toast.success("Rappel créé avec succès");
      setIsReminderDialogOpen(false);
    }
  };

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
        onBlock={() => setIsBlockDialogOpen(true)}
        onUnblock={handleUnblock}
        onAssign={() => setIsAssignDialogOpen(true)}
        onCreateReminder={() => setIsReminderDialogOpen(true)}
      />

      {/* Main content: tabs (left) + sidebar (right) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ClientDetailTabs
            client={client}
            invoices={invoices || []}
            quotes={quotes || []}
            purchaseOrders={purchaseOrders || []}
            workspaceId={workspaceId}
            onClientUpdate={handleClientUpdate}
          />
        </div>

        <ClientDetailSidebar client={client} invoices={invoices || []} workspaceId={workspaceId} onEdit={() => setIsEditModalOpen(true)} />
      </div>

      {/* Edit modal */}
      <ClientsModal
        client={client}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Assign dialog */}
      <AssignMembersDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        client={client}
      />

      {/* Reminder dialog */}
      <EventDialog
        isOpen={isReminderDialogOpen}
        onClose={() => setIsReminderDialogOpen(false)}
        onSave={handleSaveReminder}
        onDelete={() => {}}
      />

      {/* Block dialog */}
      <AlertDialog open={isBlockDialogOpen} onOpenChange={(open) => { setIsBlockDialogOpen(open); if (!open) setBlockReason(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquer ce contact ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le contact &quot;{client.name}&quot; sera bloqué et déplacé dans les contacts bloqués.
              Il ne pourra plus être utilisé dans vos documents et communications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1">
            <Label htmlFor="block-reason" className="text-sm font-medium mb-1.5 block">
              Raison du blocage (optionnel)
            </Label>
            <Textarea
              id="block-reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ex: Impayés récurrents, communication difficile..."
              className="resize-none"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBlock} variant="destructive">
              Bloquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
