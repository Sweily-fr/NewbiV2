/**
 * Avant les tests : ouvre une fois les pages principales. La première
 * requête authentifiée fait générer par le site ses clés de signature (JWKS)
 * que l'API récupère ensuite : autant que ce soit fait avant le premier test.
 */
import { BASE_URL, sessionCookie } from "./config.mjs";

export default async function prechauffer() {
  const { name, value } = sessionCookie();
  const entetes = { cookie: `${name}=${value}` };
  for (const chemin of ["/api/auth/token", "/dashboard", "/dashboard/outils/factures", "/dashboard/outils/factures/new"]) {
    await fetch(`${BASE_URL}${chemin}`, { headers: entetes, redirect: "manual" }).catch(() => {});
  }
}
