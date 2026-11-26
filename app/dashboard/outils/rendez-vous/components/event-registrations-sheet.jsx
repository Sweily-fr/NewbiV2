"use client";

import { Fragment, useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Loader2,
  MoreHorizontal,
  ScanLine,
  Search,
  Undo2,
  Users,
  XCircle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "@/src/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { cn } from "@/src/lib/utils";
import {
  bookingErrorMessage,
  useEventMutations,
  useEventRegistrations,
} from "@/src/hooks/useBooking";
import {
  checkInDateLabel,
  checkInOutcome,
  eventScheduleLabel,
  formatCents,
  registrationsCsvFileName,
  registrationStatusLabel,
  seatsLabel,
  shortDateTimeLabel,
} from "@/src/utils/booking-events";

const PAGE_SIZE = 50;

const STATUS_FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "PENDING_PAYMENT", label: "En attente de paiement" },
  { value: "CANCELLED", label: "Annulées" },
  { value: "EXPIRED", label: "Expirées" },
];

const STATUS_CLASSES = {
  CONFIRMED:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  PENDING_PAYMENT:
    "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  CANCELLED: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  EXPIRED: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        STATUS_CLASSES[status] || "bg-muted text-muted-foreground",
      )}
    >
      {registrationStatusLabel(status)}
    </span>
  );
}

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Fichier téléchargé dans le navigateur. */
function downloadText(text, fileName, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Billets d'une inscription, avec la présence marquée à la main. */
function TicketList({
  registration,
  typeId,
  timeZone,
  canCheckIn,
  onCheckIn,
  onUndo,
}) {
  const [busyId, setBusyId] = useState(null);
  const run = async (ticketId, action) => {
    setBusyId(ticketId);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };
  if (registration.tickets.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-muted-foreground">
        {registration.status === "PENDING_PAYMENT"
          ? "Les billets seront émis dès la confirmation du paiement."
          : "Aucun billet."}
      </p>
    );
  }
  return (
    <ul className="divide-y">
      {registration.tickets.map((ticket) => (
        <li
          key={ticket.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
        >
          <div className="min-w-0">
            <p className="text-sm">
              <span className="font-mono text-xs">{ticket.number}</span>
              <span className="ml-2 text-muted-foreground">
                {ticket.attendeeName}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {ticket.checkedInAt
                ? `Présent, arrivé ${checkInDateLabel(ticket.checkedInAt, timeZone)}`
                : "Pas encore arrivé"}
            </p>
          </div>
          {canCheckIn &&
            registration.status === "CONFIRMED" &&
            (ticket.checkedInAt ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId === ticket.id}
                onClick={() =>
                  run(ticket.id, () =>
                    onUndo({
                      ticketId: ticket.id,
                      typeId,
                      registrationId: registration.id,
                    }),
                  )
                }
                className="cursor-pointer"
              >
                {busyId === ticket.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Undo2 className="size-3.5" aria-hidden="true" />
                )}
                Annuler la présence
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === ticket.id}
                onClick={() => run(ticket.id, () => onCheckIn(ticket))}
                className="cursor-pointer"
              >
                {busyId === ticket.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" aria-hidden="true" />
                )}
                Marquer présent
              </Button>
            ))}
        </li>
      ))}
    </ul>
  );
}

/**
 * Inscrits d'un événement : liste (nom, e-mail, quantité, montant, statut,
 * présence), recherche, filtre par statut, export CSV, annulation et
 * présence marquée à la main.
 */
export function EventRegistrationsSheet({
  type,
  timeZone,
  canEdit,
  readOnly,
  onClose,
  onOpenScanner,
}) {
  const open = Boolean(type);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [expanded, setExpanded] = useState(null);
  const [toCancel, setToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [exporting, setExporting] = useState(false);
  const debouncedSearch = useDebounced(search);
  const mutations = useEventMutations();

  // Nouvel événement ouvert : filtres remis à zéro
  const typeId = type?.id || null;
  useEffect(() => {
    setSearch("");
    setStatus("all");
    setLimit(PAGE_SIZE);
    setExpanded(null);
  }, [typeId]);

  const { registrations, totalCount, loading, searching, error, refetch } =
    useEventRegistrations(typeId, {
      search: debouncedSearch,
      status: status === "all" ? null : status,
      limit,
      skip: !open,
    });

  const canAct = canEdit && !readOnly;
  const schedule = type
    ? eventScheduleLabel(type.startAt, type.endAt, timeZone)
    : null;

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await mutations.fetchRegistrationsCsv(type.id);
      downloadText(
        csv,
        registrationsCsvFileName(type.name),
        "text/csv;charset=utf-8",
      );
    } catch (exportError) {
      toast.error("Export impossible", {
        description: bookingErrorMessage(exportError),
      });
    } finally {
      setExporting(false);
    }
  };

  const handleCheckIn = async (ticket) => {
    try {
      const result = await mutations.checkIn(type.id, ticket.number);
      const outcome = checkInOutcome(result, { timeZone });
      if (outcome.tone === "success") {
        toast.success(`${ticket.attendeeName} est marqué présent`);
      } else {
        toast.error(outcome.title, { description: outcome.detail });
      }
    } catch (checkInError) {
      toast.error("Marquage impossible", {
        description: bookingErrorMessage(checkInError),
      });
    }
  };

  const handleUndo = async (args) => {
    try {
      await mutations.undoCheckIn(args);
      toast.success("Présence annulée");
    } catch (undoError) {
      toast.error("Modification impossible", {
        description: bookingErrorMessage(undoError),
      });
    }
  };

  const handleCancel = async () => {
    const registration = toCancel;
    try {
      await mutations.cancelRegistration(registration.id, cancelReason);
      toast.success("Inscription annulée, le participant est prévenu", {
        description:
          registration.amount > 0
            ? "Remboursez-le depuis votre compte de paiement si besoin."
            : undefined,
      });
      setToCancel(null);
    } catch (cancelError) {
      toast.error("Annulation impossible", {
        description: bookingErrorMessage(cancelError),
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="flex w-full flex-col p-0 sm:w-[760px] sm:max-w-[760px]">
        {type && (
          <>
            <SheetHeader className="space-y-1 border-b px-5 pt-6 pb-4 sm:px-6">
              <SheetTitle className="pr-8 text-base">
                Inscrits · {type.name}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {schedule.date} · {schedule.time}
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-sm">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Users
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {seatsLabel(type)}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {type.registrationsCount} inscription
                  {type.registrationsCount > 1 ? "s" : ""}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  Présents : {type.checkedInCount} / {type.ticketsCount}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-3">
                {canAct && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onOpenScanner(type)}
                    className="cursor-pointer"
                  >
                    <ScanLine className="size-3.5" aria-hidden="true" />
                    Contrôle des billets
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting}
                  className="cursor-pointer"
                >
                  {exporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" aria-hidden="true" />
                  )}
                  Exporter (CSV)
                </Button>
              </div>
            </SheetHeader>

            <div className="flex flex-wrap gap-2 border-b px-5 py-3 sm:px-6">
              <div className="relative min-w-[200px] flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nom, e-mail ou numéro de billet"
                  aria-label="Rechercher un inscrit"
                  className="pl-8"
                />
                {searching && (
                  <Loader2 className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger
                  className="w-[200px]"
                  aria-label="Filtrer par statut"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FILTERS.map((filter) => (
                    <SelectItem key={filter.value} value={filter.value}>
                      {filter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-5 sm:p-6">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : error && registrations.length === 0 ? (
                <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {bookingErrorMessage(
                      error,
                      "Les inscrits n'ont pas pu être chargés.",
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    className="cursor-pointer"
                  >
                    Réessayer
                  </Button>
                </div>
              ) : registrations.length === 0 ? (
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <Users className="mb-3 size-9 text-muted-foreground/70" />
                  <p className="font-medium">
                    {debouncedSearch || status !== "all"
                      ? "Aucun inscrit ne correspond"
                      : "Aucun inscrit pour le moment"}
                  </p>
                  {!debouncedSearch && status === "all" && (
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Partagez le lien de l&apos;événement : chaque inscription
                      apparaît ici aussitôt.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="hidden grid-cols-[minmax(0,1.6fr)_56px_88px_150px_76px_36px] gap-3 border-b bg-muted/30 px-6 py-2 text-xs text-muted-foreground md:grid">
                    <span>Participant</span>
                    <span className="text-right">Places</span>
                    <span className="text-right">Montant</span>
                    <span>Statut</span>
                    <span className="text-right">Présence</span>
                    <span />
                  </div>
                  <ul className="divide-y">
                    {registrations.map((registration) => {
                      const isOpen = expanded === registration.id;
                      const name =
                        `${registration.buyer.firstName} ${registration.buyer.lastName}`.trim();
                      return (
                        <Fragment key={registration.id}>
                          <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-5 py-3 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_56px_88px_150px_76px_36px]">
                            <button
                              type="button"
                              onClick={() =>
                                setExpanded(isOpen ? null : registration.id)
                              }
                              aria-expanded={isOpen}
                              className="flex min-w-0 cursor-pointer items-start gap-2 text-left"
                            >
                              <ChevronDown
                                className={cn(
                                  "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
                                  isOpen && "rotate-180",
                                )}
                                aria-hidden="true"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {registration.buyer.email}
                                  {registration.buyer.phone
                                    ? ` · ${registration.buyer.phone}`
                                    : ""}
                                </span>
                                <span className="block text-xs text-muted-foreground md:hidden">
                                  {registration.quantity} place
                                  {registration.quantity > 1 ? "s" : ""} ·{" "}
                                  {registration.amount > 0
                                    ? formatCents(
                                        registration.amount,
                                        registration.currency,
                                      )
                                    : "Gratuit"}{" "}
                                  · Présents {registration.checkedInCount} /{" "}
                                  {registration.tickets.length ||
                                    registration.quantity}
                                </span>
                              </span>
                            </button>
                            <span className="hidden text-right text-sm tabular-nums md:block">
                              {registration.quantity}
                            </span>
                            <span className="hidden text-right text-sm tabular-nums md:block">
                              {registration.amount > 0
                                ? formatCents(
                                    registration.amount,
                                    registration.currency,
                                  )
                                : "Gratuit"}
                            </span>
                            <span className="hidden md:block">
                              <StatusBadge status={registration.status} />
                            </span>
                            <span className="hidden text-right text-sm tabular-nums md:block">
                              {registration.checkedInCount} /{" "}
                              {registration.tickets.length ||
                                registration.quantity}
                            </span>
                            <span className="flex items-center justify-end gap-2">
                              <span className="md:hidden">
                                <StatusBadge status={registration.status} />
                              </span>
                              {canAct &&
                              ["CONFIRMED", "PENDING_PAYMENT"].includes(
                                registration.status,
                              ) ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 cursor-pointer"
                                      aria-label={`Actions pour ${name}`}
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setCancelReason("");
                                        setToCancel(registration);
                                      }}
                                      className="text-red-600 focus:text-red-600"
                                    >
                                      <XCircle className="size-3.5" />
                                      Annuler l&apos;inscription
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <span className="hidden size-7 md:block" />
                              )}
                            </span>
                          </li>
                          {isOpen && (
                            <li className="bg-muted/20">
                              <div className="px-5 pt-2 text-xs text-muted-foreground sm:px-6">
                                Inscrit le{" "}
                                {shortDateTimeLabel(
                                  registration.createdAt,
                                  timeZone,
                                )}
                                {registration.paymentProvider &&
                                  ` · Payé avec ${
                                    {
                                      stripe: "Stripe",
                                      paypal: "PayPal",
                                      sumup: "SumUp",
                                    }[registration.paymentProvider] ||
                                    registration.paymentProvider
                                  }`}
                                {registration.refundedAt &&
                                  " · Remboursé automatiquement"}
                                {registration.cancelReason &&
                                  ` · Motif : ${registration.cancelReason}`}
                              </div>
                              <TicketList
                                registration={registration}
                                typeId={type.id}
                                timeZone={timeZone}
                                canCheckIn={canAct}
                                onCheckIn={handleCheckIn}
                                onUndo={handleUndo}
                              />
                            </li>
                          )}
                        </Fragment>
                      );
                    })}
                  </ul>
                  {registrations.length < totalCount && (
                    <div className="flex justify-center p-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLimit((value) => value + PAGE_SIZE)}
                        disabled={searching}
                        className="cursor-pointer"
                      >
                        Afficher plus ({totalCount - registrations.length})
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <AlertDialog
          open={Boolean(toCancel)}
          onOpenChange={(next) =>
            !next && !mutations.cancellingRegistration && setToCancel(null)
          }
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Annuler l&apos;inscription de {toCancel?.buyer.firstName}{" "}
                {toCancel?.buyer.lastName} ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {toCancel?.quantity > 1
                  ? `Ses ${toCancel.quantity} billets ne seront plus valables`
                  : "Son billet ne sera plus valable"}{" "}
                et les places sont remises en vente. Le participant est prévenu
                par e-mail.
                {toCancel?.amount > 0
                  ? " Le remboursement n'est pas automatique : faites-le depuis votre compte Stripe, PayPal ou SumUp."
                  : ""}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Motif transmis au participant (facultatif)"
              aria-label="Motif de l'annulation"
            />
            <AlertDialogFooter>
              <AlertDialogCancel
                className="cursor-pointer"
                disabled={mutations.cancellingRegistration}
              >
                Retour
              </AlertDialogCancel>
              <Button
                onClick={handleCancel}
                disabled={mutations.cancellingRegistration}
                className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
              >
                {mutations.cancellingRegistration && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                Annuler l&apos;inscription
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
