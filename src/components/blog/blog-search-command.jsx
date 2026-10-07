"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  ArrowUpDown,
  Briefcase,
  CornerDownLeft,
  FileText,
  Hash,
  Newspaper,
} from "lucide-react";

/* Palette de recherche du blog : même habillage que celle du tableau de bord
   (src/components/search-command.jsx), mais alimentée par les articles du
   blog au lieu des données du compte — la page est publique, sans Apollo ni
   contexte d'espace de travail. */

const IconWrapper = ({ children }) => (
  <div className="relative mr-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/50">
    {children}
    <span className="pointer-events-none absolute inset-0 rounded-[inherit] border border-black/5" />
  </div>
);

const Kbd = ({ children }) => (
  <kbd className="rounded border border-border/60 bg-muted/60 px-1 font-sans text-[10px]">
    {children}
  </kbd>
);

export function BlogSearchCommand({
  open,
  onOpenChange,
  amorce = "",
  index = [],
  categories = [],
  sectors = [],
}) {
  const router = useRouter();
  // La palette a sa propre saisie : ce qu'on tape ici ne retourne pas dans le
  // champ de la page. `amorce` est figée avant l'ouverture, elle ne change
  // donc pas pendant la frappe.
  const [saisie, setSaisie] = React.useState(amorce);

  React.useEffect(() => {
    if (open) setSaisie(amorce);
  }, [open, amorce]);

  // À l'ouverture, le champ reçoit le focus avec son contenu sélectionné :
  // la frappe suivante l'écraserait. On repousse le curseur à la fin.
  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const el = document.querySelector("[cmdk-input]");
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    }, 60);
    return () => clearTimeout(t);
  }, [open]);

  const aller = (href) => {
    onOpenChange(false);
    router.push(href);
  };

  const recherche = saisie.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[40%] gap-0 overflow-hidden rounded-2xl border-0 bg-[#efefef] p-1 sm:max-w-[640px]">
        <DialogTitle className="sr-only">Rechercher un article</DialogTitle>
        <DialogDescription className="sr-only">
          Cherchez un article du blog ou rejoignez un thème ou un métier.
        </DialogDescription>

        <div className="flex flex-col overflow-hidden rounded-xl bg-background ring-1 ring-black/[0.07]">
          <Command className="**:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
            <CommandInput
              placeholder="Rechercher ou aller à..."
              value={saisie}
              onValueChange={setSaisie}
            />
            <CommandList className="min-h-[360px] max-h-[360px] [&_[cmdk-empty]]:flex [&_[cmdk-empty]]:h-full [&_[cmdk-empty]]:min-h-[360px] [&_[cmdk-empty]]:items-center [&_[cmdk-empty]]:justify-center">
              <CommandEmpty>Aucun article ne correspond.</CommandEmpty>

              <CommandGroup heading="Aller à">
                <CommandItem
                  value="tous les articles blog"
                  onSelect={() => aller("/blog")}
                >
                  <IconWrapper>
                    <Newspaper className="size-3.5" />
                  </IconWrapper>
                  <span>Tous les articles</span>
                </CommandItem>
                {recherche && (
                  <CommandItem
                    value={`voir tous les resultats ${recherche}`}
                    onSelect={() =>
                      aller(
                        `/blog/recherche?q=${encodeURIComponent(recherche)}`,
                      )
                    }
                  >
                    <IconWrapper>
                      <FileText className="size-3.5" />
                    </IconWrapper>
                    <span>
                      Voir tous les résultats pour «&nbsp;{recherche}&nbsp;»
                    </span>
                  </CommandItem>
                )}
              </CommandGroup>

              {index.length > 0 && (
                <CommandGroup heading="Articles">
                  {index.map((a) => (
                    <CommandItem
                      key={a.url}
                      value={`${a.titre} ${a.theme}`}
                      onSelect={() => aller(a.url)}
                    >
                      <IconWrapper>
                        <FileText className="size-3.5" />
                      </IconWrapper>
                      <span className="truncate">{a.titre}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                        {a.theme}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {categories.length > 0 && (
                <CommandGroup heading="Thèmes">
                  {categories.map((c) => (
                    <CommandItem
                      key={c.slug}
                      value={`theme ${c.label}`}
                      onSelect={() => aller(`/blog/categorie/${c.slug}`)}
                    >
                      <IconWrapper>
                        <Hash className="size-3.5" />
                      </IconWrapper>
                      <span>{c.label}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                        {c.count}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {sectors.length > 0 && (
                <CommandGroup heading="Métiers">
                  {sectors.map((s) => (
                    <CommandItem
                      key={s.slug}
                      value={`metier ${s.label}`}
                      onSelect={() => aller(`/blog/secteur/${s.slug}`)}
                    >
                      <IconWrapper>
                        <Briefcase className="size-3.5" />
                      </IconWrapper>
                      <span>{s.label}</span>
                      <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                        {s.count}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>

          <div className="flex items-center gap-3 border-t border-border/40 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ArrowUpDown className="size-3" />
              Naviguer
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="size-3" />
              Ouvrir
            </span>
            <span className="flex items-center gap-1">
              <Kbd>Esc</Kbd>
              Fermer
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
