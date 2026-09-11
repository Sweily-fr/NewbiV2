"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import {
  ChevronDownIcon,
  CircleHelp,
  Link2,
  LoaderCircle,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { GET_PRODUCTS } from "@/src/graphql/queries/products";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";
import {
  LINKED_ROUNDING,
  LINKED_ROUNDING_OPTIONS,
  linkedRuleExample,
} from "@/src/utils/linked-products";

/**
 * Section « Produits liés » de la fiche produit du catalogue.
 *
 * value : [{ productId, quantity, per, rounding, product: { id, name, reference, unit } }]
 *   « quantity » produits liés pour « per » unités du produit principal,
 *   arrondi selon « rounding » (UP / DOWN / NONE).
 * onChange(nextValue)
 * excludeId : id du produit en cours d'édition (un produit ne peut pas se lier à lui-même)
 * mainUnit / mainName : unité et nom du produit principal (phrase « Pour 20 m² de Peinture »)
 */
/** Petite icône « ? » qui affiche une explication au survol ou au focus. */
function HelpTip({ label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex items-center text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
        >
          <CircleHelp className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export default function ProductLinkedProductsForm({
  value = [],
  onChange,
  excludeId,
  mainUnit,
  mainName,
}) {
  const { workspaceId } = useRequiredWorkspace();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, loading } = useQuery(GET_PRODUCTS, {
    variables: {
      workspaceId,
      search: debouncedSearchTerm.trim() !== "" ? debouncedSearchTerm : undefined,
      limit: 20,
    },
    fetchPolicy: "cache-and-network",
    skip: !open || !workspaceId,
  });

  const linkedIds = new Set(value.map((link) => link.productId));
  const candidates = (data?.products?.products || []).filter(
    (product) => product.id !== excludeId && !linkedIds.has(product.id),
  );

  const handleAdd = (product) => {
    onChange([
      ...value,
      {
        productId: product.id,
        quantity: 1,
        per: 1,
        rounding: LINKED_ROUNDING.UP,
        product: {
          id: product.id,
          name: product.name,
          reference: product.reference,
          unit: product.unit,
        },
      },
    ]);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setOpen(false);
  };

  const handleFieldChange = (productId, field, rawValue) => {
    onChange(
      value.map((link) =>
        link.productId === productId ? { ...link, [field]: rawValue } : link,
      ),
    );
  };

  const handleRemove = (productId) => {
    onChange(value.filter((link) => link.productId !== productId));
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchTerm("");
      setDebouncedSearchTerm("");
    }
  };

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5 font-normal">
        <Link2 className="size-3.5 text-muted-foreground" />
        Produits liés
        <HelpTip label="À quoi servent les produits liés">
          <p>
            Quand vous ajoutez ce produit dans une facture, un devis ou un bon
            de commande, les produits liés s'ajoutent tout seuls. Leur quantité
            se calcule à partir de la quantité saisie et se met à jour si vous
            la changez.
          </p>
          <p className="mt-1.5">
            Exemple : un pot de peinture couvre 20 m². Réglez « pour 20 m²,
            ajouter 1 pot ». Pour 90 m² de peinture, la facture affichera
            5 pots.
          </p>
        </HelpTip>
      </Label>

      {value.length > 0 && (
        <div className="rounded-lg border divide-y">
          {value.map((link) => {
            const unitLabel = link.product?.unit || "unité";
            const mainUnitLabel = mainUnit || "unité";
            const ruleIsValid =
              parseFloat(link.quantity) > 0 && parseFloat(link.per) > 0;
            return (
              <div key={link.productId} className="px-3 py-3 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {link.product?.name || "Produit supprimé"}
                    </div>
                    {link.product?.reference && (
                      <div className="text-xs text-muted-foreground truncate">
                        Réf : {link.product.reference}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(link.productId)}
                    aria-label="Retirer ce produit lié"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* Règle rédigée comme une phrase : « Pour 20 m² de Peinture, ajouter 1 unité de Pot » */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
                  <span>Pour</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    value={link.per ?? 1}
                    onChange={(e) =>
                      handleFieldChange(link.productId, "per", e.target.value)
                    }
                    aria-label={`Quantité de ${mainName || "ce produit"} servant de base`}
                    className="w-20 text-right"
                  />
                  <span className="whitespace-nowrap">
                    {mainUnitLabel} de{" "}
                    <span className="font-medium">
                      {mainName || "ce produit"}
                    </span>
                    , ajouter
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    value={link.quantity}
                    onChange={(e) =>
                      handleFieldChange(link.productId, "quantity", e.target.value)
                    }
                    aria-label={`Quantité de ${link.product?.name || "produit lié"} à ajouter`}
                    className="w-20 text-right"
                  />
                  <span className="whitespace-nowrap">
                    {unitLabel} de{" "}
                    <span className="font-medium">
                      {link.product?.name || "ce produit lié"}
                    </span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm whitespace-nowrap inline-flex items-center gap-1.5">
                    Arrondi
                    <HelpTip label="Comment fonctionne l'arrondi">
                      <p>
                        S'applique quand le calcul ne tombe pas sur un nombre
                        entier.
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {LINKED_ROUNDING_OPTIONS.map((opt) => (
                          <li key={opt.value}>
                            <span className="font-medium">{opt.label}</span> :{" "}
                            {opt.hint}
                          </li>
                        ))}
                      </ul>
                    </HelpTip>
                  </span>
                  <Select
                    value={link.rounding || LINKED_ROUNDING.UP}
                    onValueChange={(v) =>
                      handleFieldChange(link.productId, "rounding", v)
                    }
                  >
                    <SelectTrigger
                      className="w-full sm:w-[210px]"
                      aria-label={`Arrondi pour ${link.product?.name || "produit lié"}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LINKED_ROUNDING_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <HelpTip label="Exemple de calcul">
                    {ruleIsValid
                      ? linkedRuleExample(link, {
                          mainName,
                          mainUnit: mainUnitLabel,
                          unit: unitLabel,
                        })
                      : "Renseignez deux quantités supérieures à 0 pour voir un exemple."}
                  </HelpTip>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* modal : la fiche produit est une Dialog dont le verrou de défilement
          bloque la molette hors de la fenêtre ; en mode modal le popover porte
          son propre verrou et sa liste peut défiler. */}
      <Popover open={open} onOpenChange={handleOpenChange} modal>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate text-muted-foreground">
              Ajouter un produit lié
            </span>
            <ChevronDownIcon className="size-3.5 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        {/* Le sélecteur se retourne vers le haut et se limite à l'espace
            disponible pour ne jamais dépasser le bas de l'écran. */}
        <PopoverContent
          className="p-0 overflow-hidden rounded-xl w-[var(--radix-popover-trigger-width)] flex flex-col max-h-[min(320px,var(--radix-popover-content-available-height))]"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          <div className="flex items-center gap-2.5 px-2.5 h-10 shrink-0 border-b border-[#e6e7ea] dark:border-[#232323]">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <Input
              variant="ghost"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex-1 min-h-0 max-h-[260px] overflow-y-auto overscroll-contain p-1">
            {loading && candidates.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-4">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Recherche...
                </span>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {debouncedSearchTerm
                  ? `Aucun produit trouvé pour "${debouncedSearchTerm}".`
                  : "Aucun autre produit disponible."}
              </div>
            ) : (
              candidates.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleAdd(product)}
                  className="flex w-full flex-col items-start gap-0.5 rounded-md p-2.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {product.unitPrice ? `${product.unitPrice}€` : ""}
                    </span>
                  </div>
                  {product.reference && (
                    <span className="text-xs text-muted-foreground">
                      Réf: {product.reference}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
