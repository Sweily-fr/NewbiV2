/**
 * Prise de rendez-vous, onglet Réservations : une réservation prise par un
 * invité pendant que la page est ouverte apparaît sans recharger la page.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { COMPTES_RDV, PAGES_RDV, TYPES_RDV } from "../donnees/lot-rendez-vous.mjs";
import { creneaux, invite, reserver } from "./outils-rdv.mjs";

test.describe("Rendez-vous : une nouvelle réservation apparaît sans rechargement", () => {
  test.use({ storageState: connecte(COMPTES_RDV.champs.token) });

  test("Réservée par un invité pendant que la page est ouverte", async ({ page, request }) => {
    test.setTimeout(180_000);
    await ouvrir(page, "/dashboard/outils/rendez-vous");
    await expect(page.getByRole("tab", { name: /Réservations/ })).toBeVisible({ timeout: 60_000 });

    const libres = await creneaux(request, PAGES_RDV.champs.slug, TYPES_RDV.champs.slug);
    const nom = `Rafraîchie${Date.now() % 100000}`;
    const reponse = await reserver(
      request,
      PAGES_RDV.champs.slug,
      TYPES_RDV.champs.slug,
      libres[libres.length - 1].start,
      invite({ lastName: nom }),
    );
    expect(reponse.statut).toBe(201);

    // Relue au plus tard à la relecture périodique (1 min)
    await expect(page.getByText(nom).first()).toBeVisible({ timeout: 90_000 });
  });
});
