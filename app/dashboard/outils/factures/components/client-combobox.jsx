"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { useClients } from "@/src/hooks/useClients";

const clientDisplayName = (client) =>
  client.type === "INDIVIDUAL"
    ? `${client.firstName || ""} ${client.lastName || ""}`.trim()
    : client.name || "";

/**
 * Sélecteur d'un client existant du workspace (recherche serveur).
 * value = id du client associé (ou null), onChange reçoit le client
 * sélectionné (objet) ou null pour dissocier.
 */
export function ClientCombobox({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { clients, loading } = useClients(1, 50, search);

  const selected = clients.find((c) => c.id === value) || null;

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selected
                ? clientDisplayName(selected)
                : value
                  ? "Client associé"
                  : placeholder || "Associer un client existant"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher un client..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList
              className="max-h-[250px] overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
            >
              <CommandEmpty>
                {loading ? "Chargement..." : "Aucun client trouvé."}
              </CommandEmpty>
              <CommandGroup>
                {clients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => {
                      onChange(client.id === value ? null : client);
                      setOpen(false);
                    }}
                  >
                    <span className="truncate">
                      {clientDisplayName(client)}
                    </span>
                    {value === client.id && (
                      <CheckIcon size={16} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          title="Dissocier le client"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
