import { BookingPageView } from "../_components/booking-page-view";

// Page publique de réservation d'un organisateur (sans compte)
export default async function RdvBookingPage({ params, searchParams }) {
  const { slug } = await params;
  const { embed } = await searchParams;
  return <BookingPageView slug={slug} embed={embed === "1"} />;
}
