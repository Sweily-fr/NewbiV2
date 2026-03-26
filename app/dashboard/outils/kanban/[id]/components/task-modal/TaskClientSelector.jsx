import React, { useState } from "react";
import { Building2, X, Search, LoaderCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { useClients } from "@/src/hooks/useClients";

export function TaskClientSelector({ clientId, clientName, onChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { clients, loading } = useClients(1, 50, searchTerm);

  const getClientDisplayName = (client) => {
    if (client.type === "INDIVIDUAL") {
      return `${client.firstName || ""} ${client.lastName || client.name || ""}`.trim();
    }
    return client.name || "";
  };

  if (clientId && clientName) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium rounded-md"
        >
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{clientName}</span>
        </Badge>
        <button
          type="button"
          onClick={() => onChange(null, null)}
          className="w-5 h-5 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          title="Retirer le client"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          className="text-sm px-3 py-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
          style={{ color: '#8D8D8D' }}
        >
          Vide
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="max-h-[250px] overflow-y-auto space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">Aucun client trouvé</div>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => onChange(client.id, client)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-accent text-left transition-colors cursor-pointer bg-transparent border-0"
              >
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{getClientDisplayName(client)}</div>
                  {client.email && (
                    <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
