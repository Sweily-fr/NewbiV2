"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Check, ChevronsUpDown, UserRound } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Command,
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
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { cn } from "@/src/lib/utils";
import { GET_EMAIL_CAMPAIGN_CONTACTS } from "@/src/graphql/emailCampaignQueries";

const contactName = (contact) =>
  contact?.name ||
  [contact?.firstName, contact?.lastName].filter(Boolean).join(" ") ||
  contact?.email ||
  "Contact";

/**
 * Contact dont les informations remplissent les variables (aperçu, e-mail
 * de test). `value` : le contact choisi, null = valeurs d'exemple.
 */
export function ContactPicker({
  workspaceId,
  value,
  onChange,
  exampleName,
  className,
  align = "end",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search.trim(), 250);
  const { data, loading } = useQuery(GET_EMAIL_CAMPAIGN_CONTACTS, {
    variables: { workspaceId, search: debounced || null, limit: 20 },
    skip: !open || !workspaceId,
    fetchPolicy: "cache-and-network",
    context: { skipErrorToast: true },
  });
  const contacts = (data?.clients?.items || []).filter(
    (contact) => contact.email,
  );

  const pick = (contact) => {
    onChange(contact);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "max-w-full justify-between gap-2 font-normal",
            className,
          )}
          aria-label="Personnaliser pour un contact"
        >
          <UserRound
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="min-w-0 truncate">
            {value
              ? contactName(value)
              : `Exemple${exampleName ? ` (${exampleName})` : ""}`}
          </span>
          <ChevronsUpDown
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un contact"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandGroup>
              <CommandItem value="__exemple" onSelect={() => pick(null)}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">Valeurs d&apos;exemple</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {exampleName || "Camille Martin"}
                  </span>
                </span>
                {!value && <Check className="size-4" />}
              </CommandItem>
            </CommandGroup>
            {contacts.length > 0 && (
              <CommandGroup heading="Vos contacts">
                {contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.id}
                    onSelect={() => pick(contact)}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {contactName(contact)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {contact.email}
                      </span>
                    </span>
                    {value?.id === contact.id && <Check className="size-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!loading && contacts.length === 0 && debounced && (
              <p className="px-3 pt-1 pb-4 text-center text-sm text-muted-foreground">
                Aucun contact trouvé
              </p>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
