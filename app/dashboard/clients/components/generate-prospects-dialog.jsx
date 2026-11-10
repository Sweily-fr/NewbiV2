"use client";

import { useEffect, useMemo, useState } from "react";
import { useApolloClient, useLazyQuery, useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Badge } from "@/src/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { useClientLists } from "@/src/hooks/useClientLists";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { getUserFacingRefusal } from "@/src/utils/errorMessages";
import {
  GET_PROSPECT_PLACES,
  SEARCH_PROSPECTS,
  UNLOCK_PROSPECTS,
} from "@/src/graphql/prospectQueries";

const MAX_PLACES = 5;
const NEW_LIST = "__new__";
const NO_LIST = "__none__";

// Tranches d'effectif proposées (bornes envoyées au fournisseur)
const STAFF_RANGES = [
  { id: "all", label: "Toutes tailles" },
  { id: "small", label: "Moins de 10 salariés", maxStaff: 9 },
  { id: "medium", label: "10 à 49 salariés", minStaff: 10, maxStaff: 49 },
  { id: "large", label: "50 salariés et plus", minStaff: 50 },
];

const CONTACT_MODES = [
  { id: "phone", label: "Téléphone" },
  { id: "email", label: "Email" },
  { id: "both", label: "Les deux" },
];

const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;

const refusal = (errors, fallback) =>
  getUserFacingRefusal({ graphQLErrors: errors }) || fallback;

/** Ce qu'il reste à l'espace, en clair. */
export function describeProspectQuota(quota) {
  if (!quota?.plan) {
    return "Les prospects offerts sont réservés aux abonnements payés.";
  }
  if (quota.remaining === 0) {
    return quota.bucket === "monthly"
      ? "Vous avez utilisé vos prospects offerts ce mois-ci."
      : "Vous avez utilisé vos prospects offerts.";
  }
  const left = plural(quota.remaining, "prospect");
  return quota.bucket === "monthly"
    ? `${left} offert${quota.remaining > 1 ? "s" : ""} restant${quota.remaining > 1 ? "s" : ""} ce mois-ci`
    : `${left} offert${quota.remaining > 1 ? "s" : ""} restant${quota.remaining > 1 ? "s" : ""} (offre de bienvenue)`;
}

/** Motifs de non-ajout regroupés pour le message de fin. */
function describeSkipped(skipped) {
  const count = (reason) => skipped.filter((s) => s.reason === reason).length;
  const parts = [];
  const opposed = count("OPPOSED_TO_PROSPECTING");
  const unverified = count("VERIFICATION_UNAVAILABLE");
  const already = count("ALREADY_IN_CLIENTS");
  if (opposed) {
    parts.push(
      `${plural(opposed, "entreprise")} refuse${opposed > 1 ? "nt" : ""} la prospection commerciale`,
    );
  }
  if (unverified) {
    parts.push(
      `${plural(unverified, "entreprise")} n'a pas pu être vérifiée${unverified > 1 ? "s" : ""}`,
    );
  }
  if (already) {
    parts.push(
      `${plural(already, "entreprise")} déjà dans vos contacts (sans frais)`,
    );
  }
  const other = skipped.length - opposed - unverified - already;
  if (other) parts.push(`${plural(other, "fiche")} n'a pas pu être ajoutée`);
  return parts.join(", ");
}

export default function GenerateProspectsDialog({
  open,
  onOpenChange,
  workspaceId,
  settings,
  canCreateLists,
  canEditLists,
  onQuotaChange,
}) {
  const apolloClient = useApolloClient();
  const trades = settings?.trades || [];
  const maxPerUnlock = settings?.maxPerUnlock || 50;

  // Étape 1 : critères
  const [tradeId, setTradeId] = useState("");
  const [places, setPlaces] = useState([]);
  const [placeQuery, setPlaceQuery] = useState("");
  const [staffRange, setStaffRange] = useState("all");
  const [contact, setContact] = useState("phone");

  // Étape 2 : résultats
  const [result, setResult] = useState(null);
  const [quota, setQuota] = useState(settings?.quota || null);
  const [selected, setSelected] = useState(new Set());
  const [destination, setDestination] = useState(NEW_LIST);
  const [newListName, setNewListName] = useState("");

  const debouncedPlaceQuery = useDebouncedValue(placeQuery.trim(), 300);
  const [loadPlaces, { data: placesData, loading: loadingPlaces }] =
    useLazyQuery(GET_PROSPECT_PLACES, { fetchPolicy: "cache-first" });
  const [searchMutation, { loading: searching }] =
    useMutation(SEARCH_PROSPECTS);
  const [unlockMutation, { loading: unlocking }] =
    useMutation(UNLOCK_PROSPECTS);
  const { lists } = useClientLists(open ? workspaceId : null);

  useEffect(() => {
    if (open) {
      setQuota(settings?.quota || null);
      setDestination(canCreateLists ? NEW_LIST : NO_LIST);
      return;
    }
    setTradeId("");
    setPlaces([]);
    setPlaceQuery("");
    setStaffRange("all");
    setContact("phone");
    setResult(null);
    setSelected(new Set());
    setDestination(NEW_LIST);
    setNewListName("");
  }, [open, settings?.quota, canCreateLists]);

  useEffect(() => {
    if (debouncedPlaceQuery.length >= 2 && workspaceId) {
      loadPlaces({ variables: { workspaceId, query: debouncedPlaceQuery } });
    }
  }, [debouncedPlaceQuery, workspaceId, loadPlaces]);

  const placeSuggestions = useMemo(() => {
    if (debouncedPlaceQuery.length < 2) return [];
    const chosen = new Set(places.map((p) => p.id));
    return (placesData?.prospectPlaces || []).filter((p) => !chosen.has(p.id));
  }, [placesData, places, debouncedPlaceQuery]);

  const tradeLabel = trades.find((t) => t.id === tradeId)?.label || "";
  const selectable = (result?.results || []).filter((r) => !r.alreadyInClients);
  const cap = Math.min(quota?.remaining ?? 0, maxPerUnlock);

  const addPlace = (place) => {
    setPlaces((prev) => (prev.length >= MAX_PLACES ? prev : [...prev, place]));
    setPlaceQuery("");
  };

  const runSearch = async (page = 1, fresh = false) => {
    const range = STAFF_RANGES.find((r) => r.id === staffRange);
    const { data, errors } = await searchMutation({
      variables: {
        workspaceId,
        input: {
          tradeIds: [tradeId],
          placeIds: places.map((p) => p.id),
          contact,
          minStaff: range?.minStaff ?? null,
          maxStaff: range?.maxStaff ?? null,
          page,
        },
      },
    });
    if (!data?.searchProspects) {
      toast.error(refusal(errors, "La recherche n'a pas abouti."));
      return;
    }
    setResult(data.searchProspects);
    setQuota(data.searchProspects.quota);
    // La sélection suit les changements de page, pas une nouvelle recherche
    if (fresh) setSelected(new Set());
    if (fresh && !newListName) {
      const where = places[0]?.label?.split(",")[0];
      setNewListName([tradeLabel, where].filter(Boolean).join(" "));
    }
  };

  const toggle = (siren) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(siren)) next.delete(siren);
      else if (next.size < cap) next.add(siren);
      return next;
    });
  };

  const selectAll = () => {
    setSelected((prev) => {
      if (prev.size > 0) return new Set();
      return new Set(selectable.slice(0, cap).map((r) => r.siren));
    });
  };

  const handleUnlock = async () => {
    if (!selected.size) return;
    const toList =
      destination === NEW_LIST
        ? { newListName: newListName.trim() || null }
        : destination === NO_LIST
          ? {}
          : { listId: destination };
    const { data, errors } = await unlockMutation({
      variables: { workspaceId, sirens: [...selected], ...toList },
    });
    const outcome = data?.unlockProspects;
    if (!outcome) {
      toast.error(refusal(errors, "Les prospects n'ont pas pu être ajoutés."));
      return;
    }

    setQuota(outcome.quota);
    onQuotaChange?.(outcome.quota);
    try {
      await apolloClient.refetchQueries({
        include: ["GetClients", "GetClientLists"],
      });
    } catch {
      // La liste se mettra à jour au prochain affichage
    }

    if (outcome.unlockedCount > 0) {
      toast.success(
        `${plural(outcome.unlockedCount, "prospect")} ajouté${outcome.unlockedCount > 1 ? "s" : ""} à vos contacts`,
      );
    }
    const skippedText = describeSkipped(outcome.skipped || []);
    if (skippedText) toast.info(skippedText);
    if (outcome.providerError) toast.error(outcome.providerError);
    onOpenChange(false);
  };

  const canSearch = Boolean(tradeId) && !searching;
  const listNameMissing = destination === NEW_LIST && !newListName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Générer des prospects</DialogTitle>
          <DialogDescription>{describeProspectQuota(quota)}</DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Métier</Label>
              <Select value={tradeId} onValueChange={setTradeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisissez un métier" />
                </SelectTrigger>
                <SelectContent>
                  {trades.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prospect-place">Zone</Label>
              {places.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {places.map((p) => (
                    <Badge
                      key={p.id}
                      variant="secondary"
                      className="gap-1 font-normal"
                    >
                      {p.label}
                      <button
                        type="button"
                        onClick={() =>
                          setPlaces((prev) => prev.filter((x) => x.id !== p.id))
                        }
                        aria-label={`Retirer ${p.label}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {places.length < MAX_PLACES && (
                <div className="relative">
                  <Input
                    id="prospect-place"
                    className="ps-9"
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    placeholder="Département, ville ou région (toute la France sinon)"
                    autoComplete="off"
                  />
                  <MapPin
                    size={16}
                    className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-3 my-auto"
                    aria-hidden="true"
                  />
                  {(loadingPlaces || placeSuggestions.length > 0) &&
                    placeQuery.trim().length >= 2 && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                        {loadingPlaces && !placeSuggestions.length ? (
                          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Recherche…
                          </div>
                        ) : (
                          placeSuggestions.slice(0, 6).map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => addPlace(p)}
                              className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            >
                              {p.label}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                </div>
              )}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Taille</Label>
                <Select value={staffRange} onValueChange={setStaffRange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_RANGES.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Joignables par</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={contact}
                  onValueChange={(v) => v && setContact(v)}
                  className="w-full"
                >
                  {CONTACT_MODES.map((m) => (
                    <ToggleGroupItem
                      key={m.id}
                      value={m.id}
                      className="flex-1 text-xs"
                    >
                      {m.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Seules les entreprises avec ces coordonnées sont proposées. Les
              entreprises qui refusent la prospection commerciale ne sont jamais
              ajoutées.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={() => runSearch(1, true)}
                disabled={!canSearch}
                className="gap-2"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Rechercher
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Modifier la recherche
              </button>
              <span className="text-sm text-muted-foreground">
                {plural(result.total, "entreprise")} trouvée
                {result.total > 1 ? "s" : ""}
              </span>
            </div>

            {selectable.length > 0 && cap > 0 && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <Checkbox
                    checked={selected.size > 0}
                    onCheckedChange={selectAll}
                    aria-label="Tout sélectionner"
                  />
                  <span className="text-muted-foreground">
                    {selected.size > 0
                      ? "Tout désélectionner"
                      : `Sélectionner ${Math.min(cap, selectable.length)}`}
                  </span>
                </label>
                {selected.size > 0 && (
                  <Badge variant="secondary" className="font-normal">
                    {selected.size} / {cap}
                  </Badge>
                )}
              </div>
            )}

            <ScrollArea className="h-[300px] rounded-md border">
              {result.results.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
                  Aucune entreprise ne correspond. Élargissez la zone ou changez
                  le mode de contact.
                </div>
              ) : (
                <ul className="divide-y">
                  {result.results.map((r) => {
                    const isSelected = selected.has(r.siren);
                    const disabled =
                      r.alreadyInClients ||
                      (!isSelected && selected.size >= cap);
                    return (
                      <li key={r.siren}>
                        <label
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 transition-colors",
                            disabled
                              ? "cursor-default opacity-60"
                              : "cursor-pointer hover:bg-muted/50",
                            isSelected && "bg-muted/40",
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={disabled}
                            onCheckedChange={() => toggle(r.siren)}
                            aria-label={`Sélectionner ${r.name}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{r.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[
                                r.activity,
                                [r.postalCode, r.city]
                                  .filter(Boolean)
                                  .join(" "),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          </div>
                          {r.alreadyInClients && (
                            <Badge
                              variant="outline"
                              className="shrink-0 font-normal"
                            >
                              Déjà dans vos contacts
                            </Badge>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>

            {result.totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={result.page <= 1 || searching}
                  onClick={() => runSearch(result.page - 1)}
                  aria-label="Page précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                Page {result.page} sur {result.totalPages}
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={result.page >= result.totalPages || searching}
                  onClick={() => runSearch(result.page + 1)}
                  aria-label="Page suivante"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Ajouter à</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {canCreateLists && (
                      <SelectItem value={NEW_LIST}>Nouvelle liste</SelectItem>
                    )}
                    <SelectItem value={NO_LIST}>Contacts seulement</SelectItem>
                    {canEditLists &&
                      lists.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {destination === NEW_LIST && (
                <div className="space-y-2">
                  <Label htmlFor="prospect-list-name">Nom de la liste</Label>
                  <Input
                    id="prospect-list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    maxLength={100}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={unlocking}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleUnlock}
                disabled={!selected.size || unlocking || listNameMissing}
                className="gap-2"
              >
                {unlocking && <Loader2 className="h-4 w-4 animate-spin" />}
                {selected.size
                  ? `Ajouter ${plural(selected.size, "prospect")}`
                  : "Ajouter"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
