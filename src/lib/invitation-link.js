/**
 * Page d'une invitation, où l'invité l'accepte ou la refuse lui-même.
 * L'adresse (?email=) vient du lien reçu par e-mail ; elle n'est reprise que
 * pour préremplir la page.
 */
export function invitationPagePath(invitationId, email) {
  const id = String(invitationId || "");
  if (!/^[0-9a-f]{24}$/i.test(id)) return null;
  const query =
    typeof email === "string" && email
      ? `?email=${encodeURIComponent(email)}`
      : "";
  return `/accept-invitation/${id}${query}`;
}
