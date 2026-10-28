"use client";

import { useState } from "react";
import {
  CalendarClock,
  Clock,
  Copy,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { cn } from "@/src/lib/utils";
import { durationLabel, locationKindLabel } from "@/src/utils/booking";
import { copyText, CopyButton, LocationKindIcon } from "./shared";

function TypeCard({
  type,
  canEdit,
  canDelete,
  readOnly,
  onEdit,
  onToggle,
  onDelete,
}) {
  const [toggling, setToggling] = useState(false);
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-background transition-opacity",
        !type.isActive && "opacity-70",
      )}
    >
      <div
        className="h-1 w-full"
        style={{ backgroundColor: type.color || "#5a50ff" }}
      />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={canEdit ? onEdit : undefined}
              className={cn(
                "block max-w-full truncate text-left text-sm font-medium",
                canEdit && "cursor-pointer hover:underline",
              )}
            >
              {type.name}
            </button>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                {durationLabel(type.durationMinutes)}
              </span>
              <span className="inline-flex items-center gap-1">
                <LocationKindIcon
                  kind={type.location?.kind}
                  className="size-3"
                />
                {locationKindLabel(type.location?.kind)}
              </span>
            </p>
          </div>
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 cursor-pointer"
                  aria-label={`Actions pour ${type.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={onEdit} disabled={readOnly}>
                    <Pencil className="size-3.5" />
                    Modifier
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => copyText(type.publicUrl)}>
                  <Copy className="size-3.5" />
                  Copier le lien
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={type.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    Ouvrir la page
                  </a>
                </DropdownMenuItem>
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onDelete}
                      disabled={readOnly}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                      Supprimer
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {type.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {type.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {type.upcomingCount > 0
              ? `${type.upcomingCount} à venir`
              : "Aucun rendez-vous à venir"}
          </span>
          <div className="flex items-center gap-2">
            <CopyButton text={type.publicUrl} iconOnly variant="ghost" />
            {canEdit && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="sr-only sm:not-sr-only">
                  {type.isActive ? "Actif" : "Désactivé"}
                </span>
                <Switch
                  checked={type.isActive}
                  disabled={readOnly || toggling}
                  aria-label={
                    type.isActive ? "Désactiver ce type" : "Activer ce type"
                  }
                  onCheckedChange={async (checked) => {
                    setToggling(true);
                    try {
                      await onToggle(checked);
                    } finally {
                      setToggling(false);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Onglet Types de rendez-vous : une carte par type (nom, durée, lieu, lien
 * à copier, interrupteur actif) ; création et édition dans un tiroir,
 * suppression confirmée.
 */
export function AppointmentTypesPanel({
  types,
  loading,
  canCreate,
  canEdit,
  canDelete,
  readOnly,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
}) {
  const [toDelete, setToDelete] = useState(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Chaque type a sa durée, son lieu et ses règles, et son propre lien.
        </p>
        {canCreate && (
          <Button
            variant="primary"
            onClick={onCreate}
            disabled={readOnly}
            className="cursor-pointer"
          >
            <Plus className="size-3.5" />
            Nouveau type
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[150px] rounded-xl" />
          ))}
        </div>
      ) : types.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed py-14 text-center">
          <CalendarClock className="mb-3 size-10 text-muted-foreground/70" />
          <p className="font-medium">Aucun type de rendez-vous</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Sans type actif, votre page n&apos;affiche aucun créneau.
          </p>
          {canCreate && (
            <Button
              variant="primary"
              onClick={onCreate}
              disabled={readOnly}
              className="mt-4 cursor-pointer"
            >
              <Plus className="size-3.5" />
              Créer un type
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {types.map((type) => (
            <TypeCard
              key={type.id}
              type={type}
              canEdit={canEdit}
              canDelete={canDelete}
              readOnly={readOnly}
              onEdit={() => onEdit(type)}
              onToggle={(checked) => onToggle(type, checked)}
              onDelete={() => setToDelete(type)}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer « {toDelete?.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Son lien ne permettra plus de réserver.
              {toDelete?.upcomingCount > 0
                ? ` Les ${toDelete.upcomingCount} rendez-vous déjà pris sont conservés et restent dans vos agendas.`
                : ""}{" "}
              Pour le mettre en pause sans le perdre, désactivez-le plutôt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(toDelete);
                setToDelete(null);
              }}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
