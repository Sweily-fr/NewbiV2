"use client";

import { useState, useEffect } from "react";
import { addDays, setHours, setMinutes, subDays } from "date-fns";
import Loading from "./loading";

import { EventCalendar } from "./components";
import { useEvents, useEventOperations } from "@/src/hooks/useEvents";
import { toast } from "@/src/components/ui/sonner";

export default function Component() {
  // Récupération des événements depuis la base de données
  const { events: dbEvents, loading, error } = useEvents();

  // Opérations sur les événements
  const { createEvent, updateEvent, deleteEvent } = useEventOperations();

  // État local pour les événements (combine BDD + événements temporaires)
  const [localEvents, setLocalEvents] = useState([]);

  // Synchroniser les événements de la BDD avec l'état local
  useEffect(() => {
    if (dbEvents && dbEvents.length > 0) {
      // Transformer les événements de la BDD au format attendu par le calendrier
      const transformedEvents = dbEvents.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: new Date(event.start),
        end: new Date(event.end),
        allDay: event.allDay,
        color: event.color,
        location: event.location,
        type: event.type,
        invoiceId: event.invoiceId,
        invoice: event.invoice,
      }));
      setLocalEvents(transformedEvents);
    } else if (!loading) {
      // Si pas d'événements en BDD et chargement terminé, initialiser avec un tableau vide
      setLocalEvents([]);
    }
  }, [dbEvents, loading]);

  // Gestionnaire pour ajouter un événement
  const handleEventAdd = async (event) => {
    try {
      const newEvent = await createEvent({
        title: event.title,
        description: event.description,
        start: event.start.toISOString(),
        end: event.end.toISOString(),
        allDay: event.allDay || false,
        color: event.color || "sky",
        location: event.location,
        type: "MANUAL",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'événement:", error);
      toast.error("Erreur lors de l'ajout de l'événement");
    }
  };

  // Gestionnaire pour mettre à jour un événement
  const handleEventUpdate = async (updatedEvent) => {
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

  if (loading) {
    return <Loading />;
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
