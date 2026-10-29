"use client";

import { memo } from "react";
import { Check, CircleAlert, UserRound, Users } from "lucide-react";

import { SortIcon as ListFilterIcon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { UserAvatar } from "@/src/components/ui/user-avatar";
import { cn } from "@/src/lib/utils";
import {
  APPOINTMENTS_SOURCE,
  CALENDAR_VIEWS,
  DEFAULT_VIEW,
  EVENTS_SOURCE,
  LINKED_KINDS,
  formatLinkedAmount,
  matchingView,
} from "@/src/utils/calendar-linked-items";
import { LINKED_SOURCE_META } from "./linked-sources";
import { FiscalSetupMenuItem } from "./fiscal-setup-hint";

const MONEY_KINDS = new Set(["INVOICE", "PURCHASE_INVOICE"]);

const plural = (count, one, many) => (count > 1 ? many : one);
const euros = (amount) => formatLinkedAmount(amount, "EUR", { compact: true });

// Lignes de l'infobulle d'une source (période déjà nommée en titre)
function tooltipLines(kind, stats) {
  const { openCount, overdueCount, doneCount } = stats;
  switch (kind) {
    case "INVOICE":
      return [
        `${openCount} ${plural(openCount, "facture à encaisser", "factures à encaisser")} · ${euros(stats.openAmount)}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} en retard · ${euros(stats.overdueAmount)}`,
        },
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "déjà payée", "déjà payées")} · ${euros(stats.doneAmount)}`,
      ];
    case "PURCHASE_INVOICE":
      return [
        `${openCount} ${plural(openCount, "facture à payer", "factures à payer")} · ${euros(stats.openAmount)}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} en retard · ${euros(stats.overdueAmount)}`,
        },
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "déjà payée", "déjà payées")} · ${euros(stats.doneAmount)}`,
        stats.foreignCount > 0 &&
          `${stats.foreignCount} en devise étrangère, hors total`,
      ];
    case "QUOTE":
      return [
        `${openCount} ${plural(openCount, "devis arrive", "devis arrivent")} en fin de validité · ${euros(stats.openAmount)}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} ${plural(overdueCount, "dépassé", "dépassés")} sans réponse`,
        },
      ];
    case "RECURRING_INVOICE":
      return [
        `${openCount} ${plural(openCount, "facture prévue", "factures prévues")} · ${euros(stats.openAmount)}`,
      ];
    case "FORECAST":
      return [
        `${stats.incomeCount} ${plural(stats.incomeCount, "rentrée prévue", "rentrées prévues")} · + ${euros(stats.incomeAmount)}`,
        `${stats.expenseCount} ${plural(stats.expenseCount, "sortie prévue", "sorties prévues")} · - ${euros(stats.expenseAmount)}`,
        "Récurrences détectées et saisies de la page Prévision",
      ];
    case "REMINDER":
      return [
        `${openCount} ${plural(openCount, "relance prévue", "relances prévues")}`,
        stats.noEmailCount > 0 && {
          alert: true,
          text: `dont ${stats.noEmailCount} sans adresse e-mail`,
        },
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "envoyée", "envoyées")}`,
        overdueCount > 0 && {
          alert: true,
          text: `${overdueCount} en échec`,
        },
      ];
    case "DELIVERY":
      return [
        `${openCount} ${plural(openCount, "livraison prévue", "livraisons prévues")}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} en retard`,
        },
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "livrée", "livrées")}`,
      ];
    case "FILE_TRANSFER":
      return [
        `${openCount} ${plural(openCount, "lien expire", "liens expirent")}`,
        doneCount > 0 &&
          `${doneCount} déjà ${plural(doneCount, "expiré", "expirés")}`,
      ];
    case "TASK":
      return [
        `${openCount} ${plural(openCount, "tâche à rendre", "tâches à rendre")}`,
        overdueCount > 0 && {
          alert: true,
          text: `dont ${overdueCount} en retard`,
        },
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "terminée", "terminées")}`,
      ];
    case "FISCAL":
      return [
        `${openCount} ${plural(openCount, "échéance à venir", "échéances à venir")}`,
        doneCount > 0 &&
          `${doneCount} ${plural(doneCount, "date passée", "dates passées")}`,
        "Impôts, TVA et Urssaf, selon vos informations légales",
      ];
    default:
      return [];
  }
}

// Valeur affichée en bout de ligne
function sourceValue(kind, stats) {
  if (MONEY_KINDS.has(kind)) return euros(stats.openAmount);
  if (kind === "FORECAST") {
    const net = stats.incomeAmount - stats.expenseAmount;
    return `${net > 0 ? "+ " : net < 0 ? "- " : ""}${euros(Math.abs(net))}`;
  }
  return String(stats.openCount);
}

// Compteur rouge : retards, envois en échec, relances sans adresse
const sourceAlertCount = (kind, stats) =>
  kind === "REMINDER"
    ? stats.overdueCount + stats.noEmailCount
    : kind === "FORECAST" || kind === "FILE_TRANSFER"
      ? 0
      : stats.overdueCount;

// Ligne cochable qui ne referme pas le menu (même rendu que les filtres
// des factures et des devis : case à gauche)
function FilterRow({ checked, onToggle, title, children }) {
  return (
    <DropdownMenuItem
      title={title}
      onSelect={(event) => {
        event.preventDefault();
        onToggle();
      }}
      className="cursor-pointer gap-2 py-1.5"
    >
      <Checkbox checked={checked} className="pointer-events-none" />
      {children}
    </DropdownMenuItem>
  );
}

function SourceRow({ sourceKey, active, onToggle, value, alertCount, lines }) {
  const meta = LINKED_SOURCE_META[sourceKey];
  const Icon = meta.icon;
  const title = lines
    .filter(Boolean)
    .map((line) => (typeof line === "object" ? line.text : line))
    .join("\n");

  return (
    <FilterRow
      checked={active}
      onToggle={() => onToggle(sourceKey)}
      title={title}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded",
          meta.tint,
        )}
        aria-hidden="true"
      >
        <Icon className={cn("size-3", meta.iconClass)} />
      </span>
      <span className="min-w-0 flex-1 truncate">{meta.label}</span>
      {alertCount > 0 && (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-red-600 tabular-nums dark:text-red-400">
          <CircleAlert className="size-3" aria-hidden="true" />
          {alertCount}
          <span className="sr-only">{meta.alertLabel || "en retard"}</span>
        </span>
      )}
      {value !== null && (
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {value}
        </span>
      )}
    </FilterRow>
  );
}

// Ligne à choix unique (vue, personne) : coche à gauche, comme une case
function ChoiceRow({ selected, onSelect, children }) {
  return (
    <DropdownMenuItem
      onSelect={(event) => {
        event.preventDefault();
        onSelect();
      }}
      className="cursor-pointer gap-2 py-1.5"
      aria-checked={selected}
      role="menuitemradio"
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {selected && <Check className="size-4" aria-hidden="true" />}
      </span>
      {children}
    </DropdownMenuItem>
  );
}

const firstName = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)[0] || "";

/**
 * Bouton « Filtres » de l'en-tête du calendrier, comme sur les autres pages.
 * - Vues toutes prêtes (Essentiel par défaut, Trésorerie, Commercial,
 *   Projets, Tout) ;
 * - une case par source avec son total sur la période et ses retards ;
 * - « Tâches de » : tout le monde, moi ou un membre (espaces à plusieurs).
 * Le bouton reste discret sur la vue Essentiel ; ailleurs il passe en
 * couleur et affiche la vue (ou « Personnalisé ») et la personne choisie.
 */
export const CalendarFiltersButton = memo(function CalendarFiltersButton({
  kinds,
  hiddenSources,
  onToggle,
  onSelectView,
  summary,
  eventsCount,
  appointmentsCount,
  period,
  loading,
  fiscalSetup = null,
  members = [],
  currentUserId = null,
  taskAssignee = "all",
  onTaskAssigneeChange,
}) {
  const allowed = LINKED_KINDS.filter((kind) => kinds.includes(kind));
  // Aucune autre page visible (rôle, ou API sans la requête) : rien à
  // filtrer, pas de bouton
  if (!loading && allowed.length === 0) return null;

  const availableKeys = [EVENTS_SOURCE, APPOINTMENTS_SOURCE, ...allowed];
  const view = matchingView(hiddenSources, availableKeys);
  const viewLabel = view
    ? CALENDAR_VIEWS.find((candidate) => candidate.key === view)?.label
    : "Personnalisé";

  // « Tâches de » seulement à plusieurs : seul, le choix n'a pas de sens
  const canFilterTasks =
    allowed.includes("TASK") && !!onTaskAssigneeChange && members.length > 1;
  const assignee =
    canFilterTasks && taskAssignee !== "all"
      ? members.find((member) => member.id === taskAssignee) || null
      : null;
  const assigneeLabel = assignee
    ? assignee.id === currentUserId
      ? "Mes tâches"
      : `Tâches de ${firstName(assignee.name)}`
    : null;

  const isDefault = view === DEFAULT_VIEW && !assignee;
  const buttonLabel =
    [view === DEFAULT_VIEW ? null : viewLabel, assigneeLabel]
      .filter(Boolean)
      .join(" · ") || "Filtres";
  // Moi d'abord, puis les autres membres par ordre alphabétique
  const otherMembers = members
    .filter((member) => member.id !== currentUserId)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "fr"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isDefault ? "filter" : "primary"}
          className="max-w-[220px] cursor-pointer"
          aria-label={`Filtres : ${buttonLabel}`}
        >
          <ListFilterIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-sm:hidden">{buttonLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[300px] max-h-[min(620px,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto"
      >
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          Vue
        </DropdownMenuLabel>
        {CALENDAR_VIEWS.map((candidate) => (
          <ChoiceRow
            key={candidate.key}
            selected={view === candidate.key}
            onSelect={() => onSelectView(candidate.key)}
          >
            <span className="min-w-0 flex-1">
              <span className="block">{candidate.label}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {candidate.description}
              </span>
            </span>
          </ChoiceRow>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-normal">
          <span>Afficher dans le calendrier</span>
          <span className="truncate">{period.title}</span>
        </DropdownMenuLabel>
        <SourceRow
          sourceKey={EVENTS_SOURCE}
          active={!hiddenSources.has(EVENTS_SOURCE)}
          onToggle={onToggle}
          value={String(eventsCount)}
          alertCount={0}
          lines={[
            `${eventsCount} ${plural(eventsCount, "événement", "événements")} et agendas connectés`,
          ]}
        />
        <SourceRow
          sourceKey={APPOINTMENTS_SOURCE}
          active={!hiddenSources.has(APPOINTMENTS_SOURCE)}
          onToggle={onToggle}
          value={String(appointmentsCount)}
          alertCount={0}
          lines={[
            `${appointmentsCount} ${plural(appointmentsCount, "rendez-vous pris en ligne", "rendez-vous pris en ligne")}`,
          ]}
        />
        {loading && allowed.length === 0 && (
          <div className="text-muted-foreground px-2 py-1.5 text-xs">
            Chargement des échéances…
          </div>
        )}
        {allowed.map((kind) => {
          const stats = summary.byKind[kind];
          return (
            <SourceRow
              key={kind}
              sourceKey={kind}
              active={!hiddenSources.has(kind)}
              onToggle={onToggle}
              value={loading ? null : sourceValue(kind, stats)}
              alertCount={loading ? 0 : sourceAlertCount(kind, stats)}
              lines={tooltipLines(kind, stats)}
            />
          );
        })}
        {/* Sous la source Fiscal : informations légales à compléter */}
        {!loading && allowed.includes("FISCAL") && (
          <FiscalSetupMenuItem setup={fiscalSetup} />
        )}

        {canFilterTasks && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
              Tâches de
            </DropdownMenuLabel>
            <ChoiceRow
              selected={!assignee}
              onSelect={() => onTaskAssigneeChange("all")}
            >
              <Users
                className="text-muted-foreground size-4"
                aria-hidden="true"
              />
              <span className="flex-1">Tout le monde</span>
            </ChoiceRow>
            {currentUserId && (
              <ChoiceRow
                selected={assignee?.id === currentUserId}
                onSelect={() => onTaskAssigneeChange(currentUserId)}
              >
                <UserRound
                  className="text-muted-foreground size-4"
                  aria-hidden="true"
                />
                <span className="flex-1">Moi</span>
              </ChoiceRow>
            )}
            {otherMembers.map((member) => (
              <ChoiceRow
                key={member.id}
                selected={assignee?.id === member.id}
                onSelect={() => onTaskAssigneeChange(member.id)}
              >
                <UserAvatar src={member.image} name={member.name} size="xxs" />
                <span className="min-w-0 flex-1 truncate">{member.name}</span>
              </ChoiceRow>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
