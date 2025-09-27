"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SettingsModal } from "@/src/components/settings-modal";
import {
  SearchIcon,
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

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/src/components/ui/command";

export default function Component({
  className = "",
  placeholder = "Search",
  commandPlaceholder = "Type a command or search...",
}) {
  const [open, setOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = React.useState("preferences");
  const router = useRouter();

  const openSettings = React.useCallback((tab = "preferences") => {
    console.log("Opening settings with tab:", tab); // Debug
    setSettingsInitialTab(tab);
    setSettingsModalOpen(true);
  }, []);

  // S'assurer que l'onglet initial est bien défini quand le modal s'ouvre
  React.useEffect(() => {
    if (settingsModalOpen) {
      console.log("Settings modal opened with initial tab:", settingsInitialTab); // Debug
    }
  }, [settingsModalOpen, settingsInitialTab]);

  const runCommand = React.useCallback((command) => {
    setOpen(false);
    command();
  }, []);

  React.useEffect(() => {
    // Raccourci clavier (Ctrl+K ou Cmd+K) pour la recherche du dashboard
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        className={`border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-ring/50 inline-flex h-9 w-fit rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] ${className}`}
        onClick={() => setOpen(true)}
      >
        <span className="flex grow items-center">
          <SearchIcon
            className="text-muted-foreground/80 -ms-1 me-3 text-[#5b4eff]"
            size={16}
            aria-hidden="true"
          />
          <span className="text-muted-foreground/70 font-normal text-xs md:text-sm">
            {placeholder}
          </span>
        </span>
        <div className="hidden md:flex items-center gap-1">
          <kbd className="bg-background flex justify-center items-center text-muted-foreground/70 inline-flex h-6 w-6 max-h-full items-center rounded border px-1 font-[inherit] text-[0.825rem] font-medium">
            ⌘
          </kbd>
          <kbd className="bg-background flex justify-center items-center text-muted-foreground/70 inline-flex h-6 w-6 max-h-full items-center rounded border px-1 font-[inherit] text-[0.825rem] font-medium">
            K
          </kbd>
        </div>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={commandPlaceholder} />
        <CommandList>
          <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Tableau de bord</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/clients"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Clients</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/account"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Mon compte</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Outils">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/factures"))}>
              <Receipt className="mr-2 h-4 w-4" />
              <span>Factures</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/devis"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Devis</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/gestion-depenses"))}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Gestion des dépenses</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/kanban"))}>
              <Kanban className="mr-2 h-4 w-4" />
              <span>Kanban</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/outils/signatures-mail"))}>
              <Mail className="mr-2 h-4 w-4" />
              <span>Signatures de mail</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Paramètres">
            <CommandItem onSelect={() => runCommand(() => openSettings("preferences"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Paramètres généraux</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => openSettings("generale"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Informations entreprise</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => openSettings("coordonnees-bancaires"))}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Coordonnées bancaires</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => openSettings("informations-legales"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Informations légales</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => openSettings("subscription"))}>
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
