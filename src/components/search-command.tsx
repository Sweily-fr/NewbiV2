"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/src/components/ui/command";

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  // Créer un événement global pour ouvrir la recherche
  React.useEffect(() => {
    // Définir un événement personnalisé pour ouvrir la recherche
    const handleOpenSearch = () => {
      setOpen(true);
    };

    // Écouter l'événement personnalisé
    window.addEventListener("open-search-command", handleOpenSearch);

    // Écouter le raccourci clavier (Ctrl+K ou Cmd+K)
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("open-search-command", handleOpenSearch);
    };
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Tapez une commande ou recherchez..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard"))}
          >
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/account"))}
          >
            <span>Mon compte</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/settings"))}
          >
            <span>Paramètres</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Outils">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/outils/factures"))}
          >
            <span>Factures</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/outils/devis"))}
          >
            <span>Devis</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/outils/transferts-fichiers"))}
          >
            <span>Transfert de fichiers</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
