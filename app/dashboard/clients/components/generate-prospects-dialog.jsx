"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useApolloClient,
  useLazyQuery,
  useMutation,
  useQuery,
} from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Loader2, MapPin, Minus, Plus, Target, X } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
import { cn } from "@/src/lib/utils";
import { useClientLists } from "@/src/hooks/useClientLists";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { getUserFacingRefusal } from "@/src/utils/errorMessages";
import {
  GET_PROSPECT_ACTIVITIES,
  GET_PROSPECT_PLACES,
  GENERATE_PROSPECTS,
} from "@/src/graphql/prospectQueries";
import ProspectActivityPicker from "./prospect-activity-picker";

const MAX_PLACES = 5;
const DEFAULT_COUNT = 10;
const NEW_LIST = "__new__";
const NO_LIST = "__none__";
// Repli si l'API ne renvoie pas encore les bornes
const DEFAULT_MAX_SEARCH_PAGES = 6;
const DEFAULT_MAX_NAF_CODES = 50;

// Rayon possible autour d'une ville ou d'un code postal (pas d'un
// département ni d'une région, déjà larges)
const RADIUS_PLACE_TYPES = ["locality", "postal_code"];
const RADIUS_OPTIONS = [
  { id: "0", label: "Ville seule" },
  ...[5, 10, 20, 30, 50].map((km) => ({ id: String(km), label: `${km} km` })),
];

// Tranches d'effectif proposées (bornes envoyées au fournisseur)
const STAFF_RANGES = [
  { id: "all", label: "Toutes tailles" },
  { id: "small", label: "Moins de 10 salariés", maxStaff: 9 },
  { id: "medium", label: "10 à 49 salariés", minStaff: 10, maxStaff: 49 },
  { id: "large", label: "50 salariés et plus", minStaff: 50 },
];

// Ancienneté de l'entreprise, en années révolues (bornes de date de création)
const AGE_RANGES = [
  { id: "all", label: "Toutes dates" },
  { id: "lt1", label: "Moins d'un an", maxYears: 1 },
  { id: "1to3", label: "1 à 3 ans", minYears: 1, maxYears: 3 },
  { id: "3to10", label: "3 à 10 ans", minYears: 3, maxYears: 10 },
  { id: "gt10", label: "Plus de 10 ans", minYears: 10 },
];

/** Date du jour il y a `years` ans, au format AAAA-MM-JJ. */
function yearsAgo(years) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

const CONTACT_MODES = [
  { id: "phone", label: "Téléphone" },
  { id: "email", label: "Email" },
  { id: "both", label: "Les deux" },
];

const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;

const refusal = (errors, fallback) =>
  getUserFacingRefusal({ graphQLErrors: errors }) || fallback;

/** Ce qu'il reste réellement à l'espace, en clair. */
export function describeProspectQuota(quota) {
  if (!quota?.plan) {
    return "Les prospects offerts sont réservés aux abonnements payés.";
  }
  const available = quota.available ?? quota.remaining ?? 0;
  if (available === 0) {
    return quota.remaining === 0 && quota.bucket === "monthly"
      ? "Vous avez utilisé vos prospects offerts ce mois-ci."
      : "Aucun prospect disponible pour le moment.";
  }
  const left = `${plural(available, "prospect")} disponible${available > 1 ? "s" : ""}`;
  return quota.bucket === "monthly" ? `${left} ce mois-ci` : left;
}

/**
 * Crédits d'une génération : 1 par prospect ajouté et 1 par page de 25
 * entreprises lues. Le nombre de pages n'est connu qu'en les lisant (une
 * page de plus seulement si la précédente ne suffit pas) : on annonce le cas
 * normal, les pages strictement nécessaires, et le maximum.
 */
export function estimateCredits(count, maxPages) {
  const pages = Math.min(maxPages, Math.ceil(count / 25));
  return { pages, expected: count + pages, max: count + maxPages };
}

/** Bilan d'une génération, en une phrase. */
function describeOutcome(outcome, requestedRadiusKm) {
  const parts = [];
  if (outcome.radiusKm && outcome.radiusKm < requestedRadiusKm) {
    parts.push(
      `Grande ville : la recherche a couvert ${outcome.radiusKm} km autour du centre au lieu de ${requestedRadiusKm} km`,
    );
  }
  if (outcome.opposedCount) {
    parts.push(
      `${plural(outcome.opposedCount, "entreprise")} écartée${outcome.opposedCount > 1 ? "s" : ""} car opposée${outcome.opposedCount > 1 ? "s" : ""} à la prospection`,
    );
  }
  if (outcome.closedCount) {
    parts.push(
      `${plural(outcome.closedCount, "entreprise")} écartée${outcome.closedCount > 1 ? "s" : ""} car fermée${outcome.closedCount > 1 ? "s" : ""}`,
    );
  }
  const notCreated = (outcome.skipped || []).filter(
    (s) => s.reason !== "ALREADY_IN_CLIENTS",
  ).length;
  if (notCreated) {
    parts.push(
      `${plural(notCreated, "fiche")} n'a pas pu être ajoutée${notCreated > 1 ? "s" : ""}`,
    );
  }
  if (outcome.unlockedCount < outcome.requested) {
    parts.push(
      "Moins d'entreprises que demandé correspondent à ces critères : élargissez l'activité, la zone, le rayon ou le mode de contact",
    );
  }
  return parts.join(". ");
}

/** Titre de section du formulaire. */
function Section({ title, hint, children }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

const FIELD_LABEL = "text-xs font-medium text-muted-foreground";
const CHIP =
  "inline-flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-xs font-medium";
const TOGGLE_ON =
  "data-[state=on]:bg-[#5a50ff]/10 data-[state=on]:text-[#5a50ff] dark:data-[state=on]:text-[#8b85ff]";
// Rayon : six choix, en grille de boutons séparés sur téléphone, en barre
// segmentée au-delà
const RADIUS_GROUP =
  "grid w-full grid-cols-3 gap-1.5 data-[variant=outline]:shadow-none sm:flex sm:gap-0 sm:data-[variant=outline]:shadow-xs";
const RADIUS_ITEM =
  "rounded-md text-xs data-[variant=outline]:border-l sm:rounded-none sm:first:rounded-l-md sm:last:rounded-r-md sm:data-[variant=outline]:border-l-0 sm:data-[variant=outline]:first:border-l";

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
  const quota = settings?.quota || null;
  const maxPages = settings?.maxSearchPages || DEFAULT_MAX_SEARCH_PAGES;
  const maxCodes = settings?.maxNafCodes || DEFAULT_MAX_NAF_CODES;
  const maxCount = Math.min(
    quota?.available ?? 0,
    settings?.maxPerUnlock || 50,
  );

  const [activities, setActivities] = useState([]);
  const [places, setPlaces] = useState([]);
  const [radiusKm, setRadiusKm] = useState("0");
  const [placeQuery, setPlaceQuery] = useState("");
  const [staffRange, setStaffRange] = useState("all");
  const [ageRange, setAgeRange] = useState("all");
  const [contact, setContact] = useState("phone");
  const [count, setCount] = useState(DEFAULT_COUNT);
  const [destination, setDestination] = useState(NEW_LIST);
  const [newListName, setNewListName] = useState("");
  const [listNameTouched, setListNameTouched] = useState(false);

  const debouncedPlaceQuery = useDebouncedValue(placeQuery.trim(), 300);
  const [loadPlaces, { data: placesData, loading: loadingPlaces }] =
    useLazyQuery(GET_PROSPECT_PLACES, { fetchPolicy: "cache-first" });
  const [generate, { loading: generating }] = useMutation(GENERATE_PROSPECTS);
  const { lists } = useClientLists(open ? workspaceId : null);
  const { data: activitiesData, loading: loadingActivities } = useQuery(
    GET_PROSPECT_ACTIVITIES,
    {
      variables: { workspaceId },
      skip: !open || !workspaceId,
      fetchPolicy: "cache-first",
    },
  );

  useEffect(() => {
    if (open) {
      setDestination(canCreateLists ? NEW_LIST : NO_LIST);
      setCount(Math.max(1, Math.min(DEFAULT_COUNT, maxCount)));
      return;
    }
    setActivities([]);
    setPlaces([]);
    setRadiusKm("0");
    setPlaceQuery("");
    setStaffRange("all");
    setAgeRange("all");
    setContact("phone");
    setNewListName("");
    setListNameTouched(false);
    // maxCount lu à l'ouverture seulement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canCreateLists]);

  useEffect(() => {
    if (debouncedPlaceQuery.length >= 2 && workspaceId) {
      loadPlaces({ variables: { workspaceId, query: debouncedPlaceQuery } });
    }
  }, [debouncedPlaceQuery, workspaceId, loadPlaces]);

  // Centre possible d'un rayon : une seule zone, ville ou code postal
  const radiusCenter =
    places.length === 1 && RADIUS_PLACE_TYPES.includes(places[0].type)
      ? places[0]
      : null;
  useEffect(() => {
    if (!radiusCenter) setRadiusKm("0");
  }, [radiusCenter]);

  // Libellé court de la première activité : « Menuisier », ou le début du
  // libellé NAF (« Commerce de détail de fleurs »)
  const activityLabel = (() => {
    const first = activities[0];
    if (!first) return "";
    if (first.type === "trade") return first.label;
    const short = first.label.split(/[,(]/)[0].trim();
    return short.length > 40 ? `${short.slice(0, 40).trim()}…` : short;
  })();

  // Nom de liste proposé à partir de l'activité, de la première zone et du
  // rayon, tant que l'utilisateur ne l'a pas écrit lui-même
  useEffect(() => {
    if (listNameTouched) return;
    const where = places[0]?.label?.split(",")[0];
    const around = radiusKm !== "0" ? `${radiusKm} km` : "";
    setNewListName([activityLabel, where, around].filter(Boolean).join(" "));
  }, [activityLabel, places, radiusKm, listNameTouched]);

  const placeSuggestions = useMemo(() => {
    if (debouncedPlaceQuery.length < 2) return [];
    const chosen = new Set(places.map((p) => p.id));
    return (placesData?.prospectPlaces || []).filter((p) => !chosen.has(p.id));
  }, [placesData, places, debouncedPlaceQuery]);

  const addPlace = (place) => {
    setPlaces((prev) => (prev.length >= MAX_PLACES ? prev : [...prev, place]));
    setPlaceQuery("");
  };

  const clampCount = (n) => Math.max(1, Math.min(n, Math.max(1, maxCount)));

  const handleGenerate = async () => {
    const range = STAFF_RANGES.find((r) => r.id === staffRange);
    const age = AGE_RANGES.find((r) => r.id === ageRange);
    const toList =
      destination === NEW_LIST
        ? { newListName: newListName.trim() || null }
        : destination === NO_LIST
          ? {}
          : { listId: destination };
    const { data, errors } = await generate({
      variables: {
        workspaceId,
        count,
        input: {
          tradeIds: activities
            .filter((a) => a.type === "trade")
            .map((a) => a.id),
          nafCodes: activities.filter((a) => a.type === "naf").map((a) => a.id),
          placeIds: places.map((p) => p.id),
          radiusKm: radiusCenter ? Number(radiusKm) : 0,
          aroundPlace:
            radiusCenter && radiusKm !== "0"
              ? {
                  id: radiusCenter.id,
                  label: radiusCenter.label,
                  type: radiusCenter.type,
                }
              : null,
          contact,
          minStaff: range?.minStaff ?? null,
          maxStaff: range?.maxStaff ?? null,
          // Créée il y a moins de N ans : après la date d'il y a N ans
          createdAfter: age?.maxYears ? yearsAgo(age.maxYears) : null,
          createdBefore: age?.minYears ? yearsAgo(age.minYears) : null,
        },
        ...toList,
      },
    });
    const outcome = data?.generateProspects;
    if (!outcome) {
      toast.error(refusal(errors, "Les prospects n'ont pas pu être générés."));
      return;
    }

    onQuotaChange?.(outcome.quota);
    try {
      await apolloClient.refetchQueries({
        include: ["GetClients", "GetClientLists"],
      });
    } catch {
      // La liste se mettra à jour au prochain affichage
    }

    const spent =
      outcome.creditsUsed != null
        ? `${plural(outcome.creditsUsed, "crédit")} utilisé${outcome.creditsUsed > 1 ? "s" : ""}`
        : undefined;
    if (outcome.unlockedCount > 0) {
      toast.success(
        `${plural(outcome.unlockedCount, "prospect")} ajouté${outcome.unlockedCount > 1 ? "s" : ""} à vos contacts`,
        { description: spent },
      );
    } else {
      toast.info("Aucun nouveau prospect ne correspond à ces critères.", {
        description: spent,
      });
    }
    const details = describeOutcome(outcome, Number(radiusKm));
    if (details && outcome.unlockedCount > 0) toast.info(details);
    if (outcome.providerError) toast.error(outcome.providerError);
    onOpenChange(false);
  };

  const countValid = Number.isInteger(count) && count >= 1 && count <= maxCount;
  const listNameMissing = destination === NEW_LIST && !newListName.trim();
  const canGenerate =
    activities.length > 0 && countValid && !listNameMissing && !generating;
  const cost = countValid ? estimateCredits(count, maxPages) : null;

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      {/* Cadre Newbi (gris, carte blanche dedans). Hauteur bornée à l'écran
          avec 2rem de marge en haut et en bas : en-tête et boutons restent
          visibles, seul le formulaire défile */}
      <DialogContent
        showCloseButton={false}
        // Pas de focus automatique sur la croix (cadre visible à l'ouverture)
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex max-h-[calc(100dvh-4rem)] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-[#efefef] p-1 sm:max-w-[960px] dark:bg-[#1a1a1a]"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-background ring-1 ring-black/[0.07] dark:ring-white/[0.1]">
          {/* En-tête */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border/40 px-5 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#5a50ff]/10 text-[#5a50ff]">
                <Target className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-sm font-medium">
                  Générer des prospects
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {describeProspectQuota(quota)}
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={generating}
              aria-label="Fermer"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Formulaire à gauche, récapitulatif et coût à droite */}
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-8 px-5 py-6">
              <Section
                title="Qui cherchez-vous ?"
                hint="Un métier courant ou n'importe quelle activité de la nomenclature NAF."
              >
                <ProspectActivityPicker
                  trades={trades}
                  activities={activitiesData?.prospectActivities || []}
                  loadingActivities={loadingActivities}
                  value={activities}
                  onChange={setActivities}
                  maxCodes={maxCodes}
                />
              </Section>

              <Section
                title="Où ?"
                hint="Toute la France si vous ne choisissez aucune zone."
              >
                {places.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {places.map((p) => (
                      <span
                        key={p.id}
                        className={cn(CHIP, "bg-muted text-foreground")}
                      >
                        <MapPin className="size-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{p.label}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPlaces((prev) =>
                              prev.filter((x) => x.id !== p.id),
                            )
                          }
                          aria-label={`Retirer ${p.label}`}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
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
                      placeholder="Ville, code postal, département ou région"
                      autoComplete="off"
                      aria-label="Zone"
                    />
                    <MapPin
                      size={16}
                      className="pointer-events-none absolute inset-y-0 start-3 my-auto text-muted-foreground/80"
                      aria-hidden="true"
                    />
                    {(loadingPlaces || placeSuggestions.length > 0) &&
                      placeQuery.trim().length >= 2 && (
                        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
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
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                              >
                                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{p.label}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                  </div>
                )}
                {radiusCenter ? (
                  <div className="flex flex-col gap-2">
                    <Label className={FIELD_LABEL}>
                      Rayon autour de {radiusCenter.label.split(",")[0]}
                    </Label>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={radiusKm}
                      onValueChange={(v) => v && setRadiusKm(v)}
                      className={RADIUS_GROUP}
                    >
                      {RADIUS_OPTIONS.map((r) => (
                        <ToggleGroupItem
                          key={r.id}
                          value={r.id}
                          className={cn(RADIUS_ITEM, TOGGLE_ON)}
                        >
                          {r.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                ) : (
                  places.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Choisissez une ville ou un code postal pour chercher dans
                      un rayon autour.
                    </p>
                  )
                )}
              </Section>

              <Section title="Quelles entreprises ?">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label className={FIELD_LABEL}>Taille</Label>
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
                  <div className="flex flex-col gap-2">
                    <Label className={FIELD_LABEL}>Date de création</Label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AGE_RANGES.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className={FIELD_LABEL}>Joignables par</Label>
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
                        className={cn("flex-1 text-xs", TOGGLE_ON)}
                      >
                        {m.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              </Section>
            </div>

            {/* Récapitulatif */}
            <aside className="flex min-w-0 flex-col gap-6 border-t border-border/40 bg-[#fafafa] px-5 py-6 md:border-t-0 md:border-l dark:bg-[#141414]">
              <div className="flex flex-col gap-2">
                <Label htmlFor="prospect-count" className={FIELD_LABEL}>
                  Nombre de prospects
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Un de moins"
                    disabled={maxCount < 1 || count <= 1}
                    onClick={() => setCount((c) => clampCount((c || 1) - 1))}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <Input
                    id="prospect-count"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={Math.max(1, maxCount)}
                    value={Number.isNaN(count) ? "" : count}
                    onChange={(e) => setCount(parseInt(e.target.value, 10))}
                    disabled={maxCount < 1}
                    className="h-8 bg-background text-center tabular-nums"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Un de plus"
                    disabled={maxCount < 1 || count >= maxCount}
                    onClick={() => setCount((c) => clampCount((c || 0) + 1))}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {maxCount > 0
                    ? `${maxCount} au maximum`
                    : "Plus de prospects disponibles"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label className={FIELD_LABEL}>Ajouter à</Label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger className="w-full bg-background">
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
                {destination === NEW_LIST && (
                  <Input
                    id="prospect-list-name"
                    aria-label="Nom de la liste"
                    value={newListName}
                    onChange={(e) => {
                      setListNameTouched(true);
                      setNewListName(e.target.value);
                    }}
                    maxLength={100}
                    placeholder="Nom de la liste, ex. Menuisiers Poitiers"
                    className="bg-background"
                  />
                )}
              </div>

              {/* Coût prévu, en crédits */}
              <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background p-4">
                <div className="flex flex-col gap-1">
                  <p className={FIELD_LABEL}>Coût prévu</p>
                  {cost ? (
                    <>
                      <p className="text-2xl font-semibold tracking-tight tabular-nums">
                        {cost.expected}{" "}
                        <span className="text-sm font-medium text-muted-foreground">
                          crédits
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cost.max} au maximum
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Indiquez un nombre de prospects
                    </p>
                  )}
                </div>
                {cost && (
                  <dl className="flex flex-col gap-3 border-t border-border/40 pt-4 text-xs">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="flex flex-col gap-0.5">
                        <span className="font-medium">Prospects ajoutés</span>
                        <span className="text-muted-foreground">
                          1 crédit par fiche
                        </span>
                      </dt>
                      <dd className="shrink-0 font-medium tabular-nums">
                        {count}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          Lecture des résultats
                        </span>
                        <span className="text-muted-foreground">
                          1 crédit par page de 25 entreprises
                        </span>
                      </dt>
                      <dd className="shrink-0 font-medium tabular-nums">
                        {cost.pages}
                      </dd>
                    </div>
                  </dl>
                )}
                <p className="border-t border-border/40 pt-4 text-xs leading-relaxed text-muted-foreground">
                  Une page de plus n&apos;est lue que si la première ne contient
                  pas assez d&apos;entreprises utilisables.
                </p>
              </div>
            </aside>
          </div>

          {/* Pied */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={generating}
              >
                Annuler
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="gap-2"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Target className="h-4 w-4" />
                )}
                {generating
                  ? "Recherche en cours…"
                  : countValid
                    ? `Générer ${plural(count, "prospect")}`
                    : "Générer"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
