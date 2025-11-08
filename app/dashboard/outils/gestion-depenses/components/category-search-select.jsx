"use client"

import { useId, useState } from "react"
import { CheckIcon, ChevronDownIcon } from "lucide-react"

import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command"
import { Label } from "@/src/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover"

// Liste étendue de catégories de dépenses professionnelles
const categories = [
  // Fournitures et équipement
  { value: "bureau", label: "Fournitures de bureau" },
  { value: "materiel", label: "Matériel informatique" },
  { value: "mobilier", label: "Mobilier" },
  { value: "equipement", label: "Équipement professionnel" },
  
  // Transport et déplacements
  { value: "transport", label: "Transport" },
  { value: "carburant", label: "Carburant" },
  { value: "parking", label: "Parking" },
  { value: "peage", label: "Péage" },
  { value: "taxi", label: "Taxi / VTC" },
  { value: "train", label: "Train" },
  { value: "avion", label: "Avion" },
  { value: "location_vehicule", label: "Location de véhicule" },
  
  // Repas et hébergement
  { value: "repas", label: "Repas d'affaires" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hébergement / Hôtel" },
  
  // Communication et marketing
  { value: "marketing", label: "Marketing" },
  { value: "publicite", label: "Publicité" },
  { value: "communication", label: "Communication" },
  { value: "telephone", label: "Téléphone" },
  { value: "internet", label: "Internet" },
  { value: "site_web", label: "Site web" },
  { value: "reseaux_sociaux", label: "Réseaux sociaux" },
  
  // Formation et développement
  { value: "formation", label: "Formation" },
  { value: "conference", label: "Conférence / Séminaire" },
  { value: "livres", label: "Livres et documentation" },
  { value: "abonnement", label: "Abonnements professionnels" },
  
  // Services professionnels
  { value: "comptabilite", label: "Comptabilité" },
  { value: "juridique", label: "Services juridiques" },
  { value: "assurance", label: "Assurance" },
  { value: "banque", label: "Frais bancaires" },
  { value: "conseil", label: "Conseil" },
  { value: "sous_traitance", label: "Sous-traitance" },
  
  // Locaux et charges
  { value: "loyer", label: "Loyer" },
  { value: "electricite", label: "Électricité" },
  { value: "eau", label: "Eau" },
  { value: "chauffage", label: "Chauffage" },
  { value: "entretien", label: "Entretien et réparations" },
  
  // Logiciels et outils
  { value: "logiciel", label: "Logiciels" },
  { value: "saas", label: "SaaS / Abonnements cloud" },
  { value: "licence", label: "Licences" },
  
  // Ressources humaines
  { value: "salaire", label: "Salaires" },
  { value: "charges_sociales", label: "Charges sociales" },
  { value: "recrutement", label: "Recrutement" },
  
  // Fiscalité
  { value: "impots_taxes", label: "Impôts et taxes" },
  { value: "tva", label: "TVA" },
  { value: "avoirs_remboursement", label: "Avoirs / Remboursement" },
  
  // Autres
  { value: "cadeaux", label: "Cadeaux clients" },
  { value: "representation", label: "Frais de représentation" },
  { value: "poste", label: "Frais postaux" },
  { value: "impression", label: "Impression" },
  { value: "autre", label: "Autre" },
]

export default function CategorySearchSelect({ value, onValueChange, label, className }) {
  const id = useId()
  const [open, setOpen] = useState(false)

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-56 justify-between border-input bg-background px-3 font-normal outline-offset-0 outline-none hover:bg-background focus-visible:outline-[3px]"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value
                ? categories.find((category) => category.value === value)
                    ?.label
                : "Sélectionner une catégorie"}
            </span>
            <ChevronDownIcon
              size={16}
              className="shrink-0 text-muted-foreground/80"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Rechercher une catégorie..." />
            <CommandList>
              <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category.value}
                    value={category.value}
                    keywords={[category.label]}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    {category.label}
                    {value === category.value && (
                      <CheckIcon size={16} className="ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
