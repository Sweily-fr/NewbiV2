import { TypeBookingView } from "../../_components/type-booking-view";

// Réservation d'un type de rendez-vous : créneau, coordonnées, confirmation
export default async function RdvTypePage({ params, searchParams }) {
  const { slug, typeSlug } = await params;
  const { embed } = await searchParams;
  return (
    <TypeBookingView slug={slug} typeSlug={typeSlug} embed={embed === "1"} />
  );
}
