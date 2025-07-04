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
import {
  LayoutDashboard,
  User,
  Settings,
  FileText,
  Receipt,
  FileUp,
} from "lucide-react";

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
    const down = (e) => {
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

  const runCommand = React.useCallback((command) => {
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
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/dashboard/account"))}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Mon compte</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/dashboard/settings"))
            }
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Outils">
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/dashboard/outils/factures"))
            }
          >
            <Receipt className="mr-2 h-4 w-4" />
            <span>Factures</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => router.push("/dashboard/outils/devis"))
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Devis</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() =>
                router.push("/dashboard/outils/transferts-fichiers")
              )
            }
          >
            <FileUp className="mr-2 h-4 w-4" />
            <span>Transfert de fichiers</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
