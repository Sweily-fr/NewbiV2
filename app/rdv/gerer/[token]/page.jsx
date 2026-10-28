import { ManageBookingView } from "../../_components/manage-booking-view";

// Lien des e-mails de l'invité : annuler ou reprogrammer, sans compte
export default async function RdvManagePage({ params, searchParams }) {
  const { token } = await params;
  const { embed } = await searchParams;
  return <ManageBookingView token={token} embed={embed === "1"} />;
}
