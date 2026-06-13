"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Search, LoaderCircle } from "lucide-react";
import { useClients } from "@/src/graphql/clientQueries";

export default function AutoReminderClients() {
  const { watch, setValue } = useFormContext();
  const [searchQuery, setSearchQuery] = useState("");

  const { clients, loading } = useClients();

  const excludedClientIds = watch("excludedClientIds") || [];

  const filteredClients = useMemo(() => {
    if (!clients) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return clients;

    return clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query),
    );
  }, [clients, searchQuery]);

  // excludedClientIds peut contenir des IDs de clients supprimés depuis :
  // on compte uniquement sur les clients réellement présents dans la liste
  const totalClientsCount = clients?.length || 0;
  const activeClientsCount =
    clients?.filter((c) => !excludedClientIds.includes(c.id)).length || 0;

  const allClientsSelected =
    totalClientsCount > 0 && activeClientsCount === totalClientsCount;
  const someClientsSelected =
    activeClientsCount > 0 && activeClientsCount < totalClientsCount;

  const toggleAllClients = () => {
    if (allClientsSelected) {
      setValue("excludedClientIds", clients?.map((c) => c.id) || []);
    } else {
      setValue("excludedClientIds", []);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoaderCircle className="h-5 w-5 animate-spin text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Description + compteur */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Sélectionnez les clients qui recevront les relances.
        </p>
        <span className="text-xs text-muted-foreground shrink-0 ml-3">
          <span className="font-medium text-foreground">
            {activeClientsCount}
          </span>{" "}
          / {totalClientsCount}
        </span>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Sélectionner tout */}
      <div className="flex items-center gap-2.5 py-2 border-b border-border/40">
        <Checkbox
          id="select-all"
          checked={
            allClientsSelected
              ? true
              : someClientsSelected
                ? "indeterminate"
                : false
          }
          onCheckedChange={toggleAllClients}
        />
        <label
          htmlFor="select-all"
          className="text-xs text-muted-foreground cursor-pointer select-none"
        >
          {allClientsSelected ? "Désélectionner tout" : "Sélectionner tout"}
        </label>
      </div>

      {/* Liste des clients */}
      <div className="space-y-0.5 max-h-[400px] overflow-y-auto -mx-1">
        {filteredClients.length === 0 ? (
          <p className="text-center py-8 text-xs text-muted-foreground">
            {searchQuery ? "Aucun client trouvé" : "Aucun client disponible"}
          </p>
        ) : (
          filteredClients.map((client) => {
            const isExcluded = excludedClientIds.includes(client.id);
            return (
              <label
                key={client.id}
                htmlFor={`client-${client.id}`}
                className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <Checkbox
                  id={`client-${client.id}`}
                  checked={!isExcluded}
                  onCheckedChange={() => {
                    if (isExcluded) {
                      setValue(
                        "excludedClientIds",
                        excludedClientIds.filter((id) => id !== client.id),
                      );
                    } else {
                      setValue("excludedClientIds", [
                        ...excludedClientIds,
                        client.id,
                      ]);
                    }
                  }}
                />
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="flex items-center justify-center size-7 rounded-full bg-[#5b50ff]/10 shrink-0">
                    <span className="text-[10px] font-medium text-[#5b50ff]">
                      {(client.name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {client.name}
                    </p>
                    {client.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {client.email}
                      </p>
                    )}
                  </div>
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
