"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Badge } from "@/src/components/ui/badge";
import { Search, Loader2, Users, CircleXIcon } from "lucide-react";
import { useClients } from "@/src/hooks/useClients";
import {
  useClientsInList,
  useAddClientsToList,
} from "@/src/hooks/useClientLists";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";

export default function AddClientsToListDialog({
  open,
  onOpenChange,
  workspaceId,
  list,
  onClientsAdded,
}) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  const { clients: allClients, loading: loadingClients } = useClients(
    1,
    1000,
    search,
  );
  const { clients: clientsInList, loading: loadingInList } = useClientsInList(
    workspaceId,
    list?.id,
    1,
    1000,
  );
  const { addClients } = useAddClientsToList();

  const inListIds = useMemo(
    () => new Set((clientsInList || []).map((c) => c.id)),
    [clientsInList],
  );

  const availableClients = useMemo(
    () => (allClients || []).filter((c) => !inListIds.has(c.id)),
    [allClients, inListIds],
  );

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIds(new Set());
      setSubmitting(false);
    }
  }, [open]);

  const toggleClient = (clientId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const allVisibleSelected =
    availableClients.length > 0 &&
    availableClients.every((c) => selectedIds.has(c.id));
  const someVisibleSelected =
    !allVisibleSelected && availableClients.some((c) => selectedIds.has(c.id));

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        availableClients.forEach((c) => next.delete(c.id));
      } else {
        availableClients.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0 || !list?.id) return;
    setSubmitting(true);
    try {
      const ids = Array.from(selectedIds);
      await addClients(workspaceId, list.id, ids);
      toast.success(
        `${ids.length} contact${ids.length > 1 ? "s" : ""} ajouté${ids.length > 1 ? "s" : ""} à la liste`,
      );
      onClientsAdded?.(ids);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error.message || "Impossible d'ajouter les contacts à la liste",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const loading = loadingClients || loadingInList;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {list?.color && (
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: list.color }}
                aria-hidden="true"
              />
            )}
            Ajouter des contacts à « {list?.name} »
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les contacts à ajouter à cette liste.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Input
              className={cn("w-full ps-9", search && "pe-9")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un contact..."
              type="text"
              aria-label="Rechercher un contact"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3">
              <Search size={16} aria-hidden="true" />
            </div>
            {search && (
              <button
                type="button"
                className="text-muted-foreground/80 hover:text-foreground absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center"
                aria-label="Effacer la recherche"
                onClick={() => setSearch("")}
              >
                <CircleXIcon size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          {availableClients.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <Checkbox
                  checked={
                    allVisibleSelected ||
                    (someVisibleSelected && "indeterminate")
                  }
                  onCheckedChange={toggleAllVisible}
                  aria-label="Sélectionner tout"
                />
                <span className="text-muted-foreground">
                  Tout sélectionner ({availableClients.length})
                </span>
              </label>
              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {selectedIds.size} sélectionné
                  {selectedIds.size > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}

          <ScrollArea className="h-[320px] rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-[320px]">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : availableClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[320px] px-6 text-center">
                <Users className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Aucun contact ne correspond à votre recherche."
                    : (allClients || []).length === 0
                      ? "Vous n'avez encore aucun contact."
                      : "Tous vos contacts sont déjà dans cette liste."}
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {availableClients.map((client) => {
                  const isSelected = selectedIds.has(client.id);
                  const displayName =
                    client.name ||
                    [client.firstName, client.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    client.email ||
                    "Sans nom";
                  return (
                    <li key={client.id}>
                      <label
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors",
                          isSelected && "bg-muted/40",
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleClient(client.id)}
                          aria-label={`Sélectionner ${displayName}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{displayName}</p>
                          {client.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {client.email}
                            </p>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || selectedIds.size === 0}
            className="gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Ajouter
            {selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
