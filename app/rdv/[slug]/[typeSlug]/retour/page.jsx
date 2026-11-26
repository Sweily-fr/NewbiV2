import { EventReturnView } from "../../../_components/event-return-view";

// Retour du paiement d'une inscription à un événement : le paiement est
// vérifié par l'API avant toute confirmation
export default async function RdvEventReturnPage({ params, searchParams }) {
  const { slug, typeSlug } = await params;
  const query = await searchParams;
  return <EventReturnView slug={slug} typeSlug={typeSlug} params={query} />;
}
