"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SettingsModal } from "@/src/components/settings-modal";
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
  Receipt,
  FileText,
  Users,
  Settings,
  CreditCard,
  Mail,
  Kanban,
  BarChart3,
  User,
} from "lucide-react";

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [settingsInitialTab, setSettingsInitialTab] =
    React.useState("preferences");
  const router = useRouter();

  const openSettings = React.useCallback((tab = "preferences") => {
    setSettingsInitialTab(tab);
    setSettingsModalOpen(true);
  }, []);

  // Créer un événement global pour ouvrir la recherche
  React.useEffect(() => {
    // Définir un événement personnalisé pour ouvrir la recherche
    const handleOpenSearch = () => {
      setOpen(true);
    };

    // Écouter l'événement personnalisé
    window.addEventListener("open-search-command", handleOpenSearch);

    // Raccourci clavier (Ctrl+K ou Cmd+K) désactivé
    // const down = (e) => {
    //   if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
    //     e.preventDefault();
    //     setOpen((open) => !open);
    //   }
    // };

    // document.addEventListener("keydown", down);

    return () => {
      // document.removeEventListener("keydown", down);
      window.removeEventListener("open-search-command", handleOpenSearch);
    };
  }, []);

  const runCommand = React.useCallback((command) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Tapez une commande ou recherchez..." />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Tableau de bord</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/clients"))
              }
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Clients</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/account"))
              }
            >
              <User className="mr-2 h-4 w-4" />
              <span>Mon compte</span>
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
                runCommand(() => router.push("/dashboard/outils/transactions"))
              }
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Transactions</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => router.push("/dashboard/outils/kanban"))
              }
            >
              <Kanban className="mr-2 h-4 w-4" />
              <span>Kanban</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() =>
                  router.push("/dashboard/outils/signatures-mail")
                )
              }
            >
              <Mail className="mr-2 h-4 w-4" />
              <span>Signatures de mail</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Paramètres">
            <CommandItem
              onSelect={() => runCommand(() => openSettings("preferences"))}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres généraux</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => openSettings("generale"))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Informations entreprise</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => openSettings("coordonnees-bancaires"))
              }
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Coordonnées bancaires</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => openSettings("informations-legales"))
              }
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Informations légales</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => openSettings("subscription"))}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Gérer mon abonnement</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Modal de paramètres */}
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        initialTab={settingsInitialTab}
      />
    </>
  );
}
