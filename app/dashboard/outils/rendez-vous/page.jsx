"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleAlert, ExternalLink } from "lucide-react";
import { RoleRouteGuard } from "@/src/components/rbac/RBACRouteGuard";
import { useSubscriptionAccess } from "@/src/hooks/useSubscriptionAccess";
import { useMyPermissions } from "@/src/hooks/useMyPermissions";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useCalendarConnections } from "@/src/hooks/useCalendarConnections";
import { useSession } from "@/src/lib/auth-client";
import { SITE_URL } from "@/src/lib/site";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { toast } from "@/src/components/ui/sonner";
import {
  bookingErrorMessage,
  useAppointmentTypes,
  useBooking,
  useBookingForEvent,
  useBookingMutations,
  useBookings,
  useMyBookingPage,
} from "@/src/hooks/useBooking";
import { suggestBookingSlug } from "@/src/utils/booking";
import { RendezVousPageSkeleton } from "./components/rendez-vous-page-skeleton";
import { BookingOnboarding } from "./components/booking-onboarding";
import { BookingsPanel } from "./components/bookings-panel";
import { BookingSheet } from "./components/booking-sheet";
import { AppointmentTypesPanel } from "./components/appointment-types-panel";
import { AppointmentTypeSheet } from "./components/appointment-type-sheet";
import { AvailabilityPanel } from "./components/availability-panel";
import { MyPagePanel } from "./components/my-page-panel";
import { CopyButton, UNDERLINE_TAB_CLASS } from "./components/shared";

const TABS = [
  { value: "reservations", label: "Réservations" },
  { value: "types", label: "Types de rendez-vous" },
  { value: "disponibilites", label: "Disponibilités" },
  { value: "page", label: "Ma page" },
];

const PAGE_SIZE = 50;

// Préfixe affiché devant l'adresse (« www.newbi.fr/rdv/ »)
const prefixFrom = (url) =>
  `${String(url || `${SITE_URL}/rdv/x`)
    .replace(/^https?:\/\//, "")
    .replace(/\/rdv\/.*$/, "")}/rdv/`;

function RendezVousContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { organization } = useWorkspace();
  const { isReadOnly, isOwner } = useSubscriptionAccess();
  const readOnlyReason = isReadOnly
    ? isOwner
      ? "Mode lecture seule · Renouvelez votre abonnement"
      : "Mode lecture seule · Contactez l'administrateur"
    : null;
  // Droits du rôle, action par action (tout autorisé tant que la grille
  // n'est pas chargée, l'API refuse de toute façon)
  const { canDo, isReady } = useMyPermissions();
  const canCreate = !isReady || canDo("appointments", "create");
  const canEdit = !isReady || canDo("appointments", "edit");
  const canDelete = !isReady || canDo("appointments", "delete");

  const { page, loaded, loading, error, refetch } = useMyBookingPage();
  const { types, loading: typesLoading } = useAppointmentTypes({ skip: !page });
  const { connections } = useCalendarConnections();
  const mutations = useBookingMutations();

  const initialTab = TABS.some((t) => t.value === searchParams.get("onglet"))
    ? searchParams.get("onglet")
    : "reservations";
  const [tab, setTab] = useState(initialTab);
  const [bookingTab, setBookingTab] = useState("upcoming");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const bookingsQuery = useBookings(bookingTab, { limit, skip: !page });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [typeSheet, setTypeSheet] = useState({ open: false, type: null });

  // Lien « Gérer le rendez-vous » du Calendrier : ?reservation=<id>, ou
  // ?evenement=<id de l'événement> si l'événement ne porte pas la réservation
  const reservationId = searchParams.get("reservation");
  const eventId = searchParams.get("evenement");
  const eventEnd = searchParams.get("fin");
  const byId = useBooking(reservationId, { skip: !page || !reservationId });
  const byEvent = useBookingForEvent(
    eventId && !reservationId ? { id: eventId, end: eventEnd } : null,
    { skip: !page || !eventId || Boolean(reservationId) },
  );
  const linked = reservationId ? byId : byEvent;
  const linkRequested = Boolean(reservationId || eventId);
  useEffect(() => {
    if (!linkRequested || !page || linked.loading) return;
    if (linked.booking) {
      setSelectedBooking(linked.booking);
      setTab("reservations");
    } else {
      toast.info("Ce rendez-vous n'a pas été retrouvé dans vos réservations.");
    }
    // Paramètre consommé : un rechargement ne rouvre pas la fiche
    router.replace("/dashboard/outils/rendez-vous");
  }, [linkRequested, page, linked.loading, linked.booking, router]);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [bookingTab]);

  // Fiche ouverte : suit les mises à jour du cache (annulation)
  const shownBooking = useMemo(() => {
    if (!selectedBooking) return null;
    return (
      bookingsQuery.bookings.find((b) => b.id === selectedBooking.id) ||
      selectedBooking
    );
  }, [selectedBooking, bookingsQuery.bookings]);

  const user = session?.user;
  const suggestedSlug = useMemo(
    () =>
      suggestBookingSlug({
        firstName: user?.name,
        lastName: user?.lastName,
        email: user?.email,
        company: organization?.companyName || organization?.name,
      }),
    [user, organization],
  );
  const defaultTitle = [user?.name, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const runMutation = async (action, successText, failureTitle) => {
    try {
      const result = await action();
      if (successText) toast.success(successText);
      return result ?? true;
    } catch (mutationError) {
      toast.error(failureTitle, {
        description: bookingErrorMessage(mutationError),
      });
      return null;
    }
  };

  if (loading && !loaded) return <RendezVousPageSkeleton />;

  if (error && !loaded) {
    return (
      <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col items-center justify-center p-6 text-center">
        <CircleAlert className="mb-4 size-12 text-muted-foreground" />
        <h2 className="text-lg font-medium">
          Impossible d&apos;afficher la prise de rendez-vous
        </h2>
        <p className="mt-2 mb-4 max-w-md text-sm text-muted-foreground">
          Le chargement a échoué. Vérifiez votre connexion, puis réessayez.
        </p>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="cursor-pointer"
        >
          Réessayer
        </Button>
      </div>
    );
  }

  if (!page) {
    return (
      <BookingOnboarding
        suggestedSlug={suggestedSlug}
        defaultTitle={defaultTitle || organization?.companyName || ""}
        publicPrefix={prefixFrom(null)}
        canCreate={canCreate || canEdit}
        readOnlyReason={readOnlyReason}
        onCreate={(input) =>
          runMutation(
            () => mutations.upsertPage(input, { isCreation: true }),
            "Votre page de réservation est prête",
            "Création impossible",
          )
        }
      />
    );
  }

  const savePage = (input, successText = "Modifications enregistrées") =>
    runMutation(
      () => mutations.upsertPage(input),
      successText,
      "Enregistrement impossible",
    );

  const saveType = (input, existing) =>
    existing?.id
      ? runMutation(
          () => mutations.updateType(existing.id, input),
          "Type de rendez-vous enregistré",
          "Enregistrement impossible",
        )
      : runMutation(
          () => mutations.createType(input),
          "Type de rendez-vous créé",
          "Création impossible",
        );

  return (
    <div className="flex h-[calc(100vh-64px-var(--dashboard-banners-h,0px))] flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-medium">Prise de rendez-vous</h1>
          <p className="text-sm text-muted-foreground">
            Vos clients réservent un créneau libre de votre agenda, sans échange
            d&apos;e-mails.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!page.isActive && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Page désactivée
            </span>
          )}
          <div className="hidden h-8 max-w-[300px] items-center gap-1 rounded-[9px] border bg-muted/30 pr-0.5 pl-3 md:flex">
            <span className="truncate text-sm text-muted-foreground">
              {page.publicUrl.replace(/^https?:\/\//, "")}
            </span>
            <CopyButton
              text={page.publicUrl}
              iconOnly
              variant="ghost"
              className="size-7"
            />
          </div>
          <Button asChild variant="outline">
            <a href={page.publicUrl} target="_blank" rel="noopener noreferrer">
              Voir ma page
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-4 shrink-0 border-b border-gray-200 dark:border-gray-800">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none bg-transparent p-0 px-4 pb-2 sm:px-6">
            {TABS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className={UNDERLINE_TAB_CLASS}
              >
                <span>{item.label}</span>
                {item.value === "types" && !typesLoading && (
                  <span className="text-xs text-muted-foreground">
                    {types.length}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {tab === "reservations" && (
          <BookingsPanel
            tab={bookingTab}
            onTabChange={setBookingTab}
            bookings={bookingsQuery.bookings}
            totalCount={bookingsQuery.totalCount}
            loading={bookingsQuery.loading}
            error={bookingsQuery.error}
            onRetry={() => bookingsQuery.refetch()}
            onOpen={setSelectedBooking}
            onLoadMore={() => setLimit((value) => value + PAGE_SIZE)}
            loadingMore={false}
            timeZone={page.timezone}
            publicUrl={page.publicUrl}
          />
        )}
        {tab === "types" && (
          <AppointmentTypesPanel
            types={types}
            loading={typesLoading}
            canCreate={canCreate}
            canEdit={canEdit}
            canDelete={canDelete}
            readOnly={isReadOnly}
            onCreate={() => setTypeSheet({ open: true, type: null })}
            onEdit={(type) => setTypeSheet({ open: true, type })}
            onToggle={(type, isActive) =>
              runMutation(
                () => mutations.updateType(type.id, { isActive }),
                isActive ? "Type activé" : "Type désactivé",
                "Modification impossible",
              )
            }
            onDelete={(type) =>
              runMutation(
                () => mutations.deleteType(type.id),
                "Type de rendez-vous supprimé",
                "Suppression impossible",
              )
            }
          />
        )}
        {tab === "disponibilites" && (
          <AvailabilityPanel
            page={page}
            connections={connections}
            canEdit={canEdit}
            readOnly={isReadOnly}
            onSave={(input) => savePage(input, "Disponibilités enregistrées")}
          />
        )}
        {tab === "page" && (
          <MyPagePanel
            page={page}
            canEdit={canEdit}
            readOnly={isReadOnly}
            publicPrefix={prefixFrom(page.publicUrl)}
            userAvatarUrl={user?.avatar || user?.image || null}
            organizationLogoUrl={organization?.logo || null}
            onSave={(input) => savePage(input)}
          />
        )}
      </div>

      <BookingSheet
        booking={shownBooking}
        timeZone={page.timezone}
        canCancel={canEdit && !isReadOnly}
        onClose={() => setSelectedBooking(null)}
        onCancel={(booking, reason) =>
          runMutation(
            () => mutations.cancelBooking(booking.id, reason),
            "Rendez-vous annulé, l'invité est prévenu",
            "Annulation impossible",
          )
        }
      />

      <AppointmentTypeSheet
        open={typeSheet.open}
        type={typeSheet.type}
        connections={connections}
        takenSlugs={types.map((type) => type.slug)}
        pageSlug={page.slug}
        publicBase={prefixFrom(page.publicUrl).replace(/\/$/, "")}
        onClose={() => setTypeSheet((prev) => ({ ...prev, open: false }))}
        onSave={saveType}
      />
    </div>
  );
}

export default function RendezVousPage() {
  return (
    <RoleRouteGuard
      roles={["owner", "admin", "member", "viewer"]}
      fallbackUrl="/dashboard"
      toastMessage="Vous n'avez pas accès à la prise de rendez-vous."
      loadingComponent={<RendezVousPageSkeleton />}
    >
      <RendezVousContent />
    </RoleRouteGuard>
  );
}
