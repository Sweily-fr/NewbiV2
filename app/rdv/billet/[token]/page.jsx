import { EventTicketView } from "../../_components/event-ticket-view";

// Billet d'un événement, ouvert depuis l'e-mail ou en scannant son QR code
export const metadata = {
  title: "Votre billet",
  robots: { index: false, follow: false },
};

export default async function RdvTicketPage({ params }) {
  const { token } = await params;
  return <EventTicketView token={token} />;
}
