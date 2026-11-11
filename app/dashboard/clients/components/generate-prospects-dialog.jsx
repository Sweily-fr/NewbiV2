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
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Loader2, MapPin, Target, X } from "lucide-react";
import { toast } from "@/src/components/ui/sonner";
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

    if (outcome.unlockedCount > 0) {
      toast.success(
        `${plural(outcome.unlockedCount, "prospect")} ajouté${outcome.unlockedCount > 1 ? "s" : ""} à vos contacts`,
      );
    } else {
      toast.info("Aucun nouveau prospect ne correspond à ces critères.");
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

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      {/* Hauteur bornée à l'écran (2rem de marge en haut et en bas) : titre et
          boutons restent visibles, seuls les champs défilent */}
      <DialogContent className="flex max-h-[calc(100dvh-4rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[560px]">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>Générer des prospects</DialogTitle>
          <DialogDescription>{describeProspectQuota(quota)}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pt-1 pb-5">
          <div className="space-y-2">
            <Label>Activité</Label>
            <ProspectActivityPicker
              trades={trades}
              activities={activitiesData?.prospectActivities || []}
              loadingActivities={loadingActivities}
              value={activities}
              onChange={setActivities}
            />
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
            {radiusCenter ? (
              <div className="flex items-center gap-3 pt-1">
                <Label
                  htmlFor="prospect-radius"
                  className="shrink-0 font-normal"
                >
                  Rayon autour de {radiusCenter.label.split(",")[0]}
                </Label>
                <Select value={radiusKm} onValueChange={setRadiusKm}>
                  <SelectTrigger id="prospect-radius" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RADIUS_OPTIONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              places.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Choisissez une ville pour chercher dans un rayon autour.
                </p>
              )
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
              <Label>Date de création</Label>
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

          <div className="grid gap-5 sm:grid-cols-2">
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
            <div className="space-y-2">
              <Label htmlFor="prospect-count">Nombre de prospects</Label>
              <Input
                id="prospect-count"
                type="number"
                inputMode="numeric"
                min={1}
                max={Math.max(1, maxCount)}
                value={Number.isNaN(count) ? "" : count}
                onChange={(e) => setCount(parseInt(e.target.value, 10))}
                disabled={maxCount < 1}
              />
              <p className="text-xs text-muted-foreground">
                {maxCount > 0
                  ? `${maxCount} au maximum`
                  : "Plus de prospects disponibles"}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
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
                  onChange={(e) => {
                    setListNameTouched(true);
                    setNewListName(e.target.value);
                  }}
                  maxLength={100}
                  placeholder="Ex. Menuisiers Vienne"
                />
              </div>
            )}
          </div>

          <div className="space-y-1 rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
            <p>
              Chaque recherche dépense 1 crédit (25 entreprises parcourues),
              puis chaque prospect ajouté dépense 1 crédit.
              {countValid &&
                ` Pour ${plural(count, "prospect")} : ${count + 1} crédits, un de plus par page supplémentaire si besoin.`}
            </p>
            <p>
              Seules les entreprises en activité et joignables comme demandé
              sont ajoutées. Celles qui refusent la prospection commerciale ou
              qui sont déjà dans vos contacts sont écartées.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t px-6 py-4">
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
      </DialogContent>
    </Dialog>
  );
}
