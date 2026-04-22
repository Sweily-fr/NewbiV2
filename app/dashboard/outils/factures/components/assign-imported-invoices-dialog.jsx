"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Search, UserRoundX } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { cn } from "@/src/lib/utils";
import { useClients } from "@/src/hooks/useClients";
import { useAssignImportedInvoicesToClient } from "@/src/graphql/importedInvoiceQueries";
import { toast } from "@/src/components/ui/sonner";

export default function AssignImportedInvoicesDialog({
  open,
  onOpenChange,
  invoiceIds = [],
  onAssigned,
}) {
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);

  const { clients, loading: clientsLoading } = useClients(1, 1000);
  const { assignImportedInvoicesToClient, loading: assigning } =
    useAssignImportedInvoicesToClient();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;
    return clients.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const siret = (c.siret || "").toLowerCase();
      return (
        name.includes(term) || email.includes(term) || siret.includes(term)
      );
    });
  }, [clients, search]);

  const count = invoiceIds.length;

  const reset = () => {
    setSearch("");
    setSelectedClientId(null);
  };

  const handleOpenChange = (value) => {
    if (!value) reset();
    onOpenChange?.(value);
  };

  const handleAssign = async (clientId) => {
    if (!invoiceIds.length) return;
    try {
      const { data } = await assignImportedInvoicesToClient({
        variables: { ids: invoiceIds, clientId: clientId || null },
      });
      const modified = data?.assignImportedInvoicesToClient ?? 0;
      if (clientId) {
        toast.success(
          modified > 1
            ? `${modified} factures assignées au client`
            : "Facture assignée au client",
        );
      } else {
        toast.success(
          modified > 1
            ? `${modified} factures désassignées`
            : "Facture désassignée",
        );
      }
      onAssigned?.(clientId);
      handleOpenChange(false);
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'assignation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner à un client</DialogTitle>
          <DialogDescription>
            {count > 1
              ? `${count} factures importées à assigner à un client du CRM.`
              : "Choisissez un client existant pour lier cette facture importée."}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou SIRET"
            className="pl-9"
            autoFocus
          />
        </div>

        <ScrollArea className="h-72 rounded-md border">
          {clientsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              Aucun client trouvé
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((client) => {
                const isSelected = selectedClientId === client.id;
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted/60 cursor-pointer",
                        isSelected && "bg-muted",
                      )}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium">
                          {client.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {client.email}
                          {client.siret ? ` · SIRET ${client.siret}` : ""}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-foreground shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => handleAssign(null)}
            disabled={assigning}
            className="sm:mr-auto text-muted-foreground"
          >
            <UserRoundX className="mr-2 h-4 w-4" />
            Désassigner
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={assigning}
            >
              Annuler
            </Button>
            <Button
              onClick={() => handleAssign(selectedClientId)}
              disabled={!selectedClientId || assigning}
            >
              {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assigner
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
