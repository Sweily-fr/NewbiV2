"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, setHours, setMinutes, subDays } from "date-fns";
import { CalendarPageSkeleton } from "./components/calendar-page-skeleton";

import { EventCalendar } from "./components";
import { useEvents, useEventOperations } from "@/src/hooks/useEvents";
import { toast } from "@/src/components/ui/sonner";
import { APPOINTMENT_COLOR } from "@/src/utils/booking";

export default function Component() {
  // Récupération des événements depuis la base de données
  const { events: dbEvents, loading, error, refetch } = useEvents();

  // Opérations sur les événements
  const { createEvent, updateEvent, deleteEvent } = useEventOperations();

  // Gérer les paramètres URL OAuth
  const searchParams = useSearchParams();

  useEffect(() => {
    const calendarConnected = searchParams.get("calendar_connected");
    const calendarError = searchParams.get("calendar_error");

    if (calendarConnected) {
      const providerNames = {
        google: "Google Calendar",
        microsoft: "Microsoft Outlook",
        apple: "Apple Calendar",
      };
      toast.success(
        `${providerNames[calendarConnected] || calendarConnected} connecté avec succès`,
      );
      refetch();
      // Clean URL params
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (calendarError) {
      // Droit « Modifier » du calendrier manquant dans l'espace (contrôle API)
      toast.error(
        calendarError === "forbidden"
          ? "Votre rôle ne permet pas de connecter un calendrier dans cet espace."
          : `Erreur de connexion calendrier: ${calendarError}`,
      );
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams, refetch]);

  // Transformer les événements avec useMemo pour éviter les re-renders inutiles
  const localEvents = useMemo(() => {
    if (loading || !dbEvents) {
      return [];
    }

    // Transformer les événements de la BDD au format attendu par le calendrier
    const transformed = dbEvents.map((event) => {
      // Rendez-vous pris en ligne : couleur dédiée, géré depuis la prise
      // de rendez-vous (ni déplacé ni modifié ici, l'API refuse aussi)
      const isAppointment = event.type === "APPOINTMENT";
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        start: new Date(event.start),
        end: new Date(event.end),
        allDay: event.allDay,
        color: isAppointment ? APPOINTMENT_COLOR : event.color,
        location: event.location,
        type: event.type,
        bookingId: event.bookingId || null,
        invoiceId: event.invoiceId,
        invoice: event.invoice,
        source: event.source || "newbi",
        visibility: event.visibility || "workspace",
        isReadOnly: isAppointment || event.isReadOnly || false,
        externalEventId: event.externalEventId,
        externalCalendarLinks: event.externalCalendarLinks || [],
        assignedMembers: event.assignedMembers || [],
        assignedMembersInfo: event.assignedMembersInfo || [],
        emailReminder: event.emailReminder || null,
      };
    });

    return transformed;
  }, [dbEvents, loading]);

  // Gestionnaire pour ajouter un événement
  const handleEventAdd = async (event) => {
    try {
      const input = {
        title: event.title,
        description: event.description,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        allDay: event.allDay || false,
        color: event.color || "sky",
        location: event.location,
        type: "MANUAL",
        assignedMembers: event.assignedMembers || [],
        emailReminder: event.emailReminder?.enabled
          ? {
              enabled: true,
              anticipation: event.emailReminder.anticipation || null,
              echeance: event.emailReminder.echeance || null,
            }
          : undefined,
      };
      await createEvent(input);
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'événement:", error);
      toast.error("Erreur lors de l'ajout de l'événement");
    }
  };

  // Gestionnaire pour mettre à jour un événement
  const handleEventUpdate = async (updatedEvent) => {
    // Ne pas permettre la mise à jour des événements en lecture seule
    if (updatedEvent.isReadOnly) {
      toast.error(
        updatedEvent.type === "APPOINTMENT"
          ? "Gérez ce rendez-vous depuis Communication > Prise de rendez-vous."
          : "Les événements externes ne peuvent pas être modifiés",
      );
      return;
    }

    try {
      const result = await updateEvent({
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        start: updatedEvent.start.toISOString(),
        end: updatedEvent.end.toISOString(),
        allDay: updatedEvent.allDay,
        color: updatedEvent.color,
        location: updatedEvent.location,
        type: updatedEvent.type || "MANUAL",
        assignedMembers: Array.isArray(updatedEvent.assignedMembers)
          ? updatedEvent.assignedMembers
          : undefined,
        emailReminder: updatedEvent.emailReminder
          ? {
              enabled: updatedEvent.emailReminder.enabled,
              anticipation: updatedEvent.emailReminder.anticipation || null,
              echeance: updatedEvent.emailReminder.echeance || null,
            }
          : undefined,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'événement:", error);
      toast.error("Erreur lors de la mise à jour de l'événement");
    }
  };

  // Gestionnaire pour supprimer un événement
  const handleEventDelete = async (eventId) => {
    try {
      const success = await deleteEvent(eventId);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      toast.error("Erreur lors de la suppression de l'événement");
    }
  };

  // Skeleton uniquement au premier chargement : useEvents est en cache-first
  // et ne remonte loading=true que si le cache Apollo est vide
  // (queryLoading && !data), donc pas de skeleton lors des visites suivantes.
  if (loading) {
    return <CalendarPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">Erreur lors du chargement des événements</p>
        <p className="text-sm text-gray-500">Veuillez rafraîchir la page</p>
      </div>
    );
  }

  return (
    <EventCalendar
      events={localEvents}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
    />
  );
}
