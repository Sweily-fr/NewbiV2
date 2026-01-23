"use client";

import { useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Search, Users, LoaderCircle } from "lucide-react";
import { useClients } from "@/src/graphql/clientQueries";

export default function AutoReminderClients() {
  const { watch, setValue } = useFormContext();
  const [searchQuery, setSearchQuery] = useState("");

  // Récupérer la liste des clients
  const { clients, loading } = useClients();

  console.log(
    "👥 [AutoReminderClients] Clients chargés:",
    clients?.map((c) => ({ id: c.id, name: c.name }))
  );

  // Récupérer les clients exclus du formulaire
  const excludedClientIds = watch("excludedClientIds") || [];

  // Filtrer les clients par recherche
  const filteredClients = useMemo(() => {
    if (!clients) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return clients;

    return clients.filter(
      (client) =>
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Sélectionner/Désélectionner tous les clients
  const allClientsSelected = excludedClientIds.length === 0;
  const someClientsSelected =
    excludedClientIds.length > 0 &&
    excludedClientIds.length < (clients?.length || 0);

  const toggleAllClients = () => {
    if (allClientsSelected) {
      // Exclure tous les clients
      setValue("excludedClientIds", clients?.map((c) => c.id) || []);
    } else {
      // Inclure tous les clients
      setValue("excludedClientIds", []);
    }
  };

  // Compter les clients actifs
  const activeClientsCount = (clients?.length || 0) - excludedClientIds.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Chargement des clients...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-medium mb-2">Clients concernés</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Sélectionnez les clients qui recevront les relances automatiques. Les
          clients non cochés ne recevront pas de relance.
        </p>
      </div>

      {/* Statistiques */}
      <div className="flex items-center gap-2 p-3 bg-[#5b50ff]/10 border border-[#5b50ff]/20 rounded-lg">
        <Users className="h-4 w-4 text-[#5b50ff]" />
        <p className="text-sm text-[#5b50ff]">
          <span className="font-medium">{activeClientsCount}</span> client(s)
          sur <span className="font-medium">{clients?.length || 0}</span>{" "}
          recevront les relances
        </p>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Sélectionner tout */}
      <div className="flex items-center space-x-2 py-2 border-b border-gray-200 dark:border-gray-700">
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
        <Label
          htmlFor="select-all"
          className="text-sm font-medium cursor-pointer"
        >
          {allClientsSelected ? "Désélectionner tout" : "Sélectionner tout"}
        </Label>
      </div>

      {/* Liste des clients */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto">
        {filteredClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? "Aucun client trouvé" : "Aucun client disponible"}
          </div>
        ) : (
          filteredClients.map((client) => {
            const isExcluded = excludedClientIds.includes(client.id);
            return (
              <label
                key={client.id}
                htmlFor={`client-${client.id}`}
                className="flex items-center space-x-3 py-2 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#252525] cursor-pointer"
              >
                <Checkbox
                  id={`client-${client.id}`}
                  checked={!isExcluded}
                  onCheckedChange={() => {
                    if (isExcluded) {
                      setValue(
                        "excludedClientIds",
                        excludedClientIds.filter((id) => id !== client.id)
                      );
                    } else {
                      setValue("excludedClientIds", [
                        ...excludedClientIds,
                        client.id,
                      ]);
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{client.name}</p>
                  {client.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {client.email}
                    </p>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
