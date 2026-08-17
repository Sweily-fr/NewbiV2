import { CalendarPageSkeleton } from "./components/calendar-page-skeleton";

// Skeleton affiché pendant le chargement du chunk de la page calendrier.
// Réutilise le même composant que celui rendu par la page pendant le
// chargement des événements, pour que la transition soit invisible.
export default function CalendarLoading() {
  return <CalendarPageSkeleton />;
}
