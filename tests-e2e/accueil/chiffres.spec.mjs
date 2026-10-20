/**
 * Accueil : chaque chiffre affiché comparé à celui calculé depuis les
 * documents de la base (organisation « Pilotage » : factures, factures
 * importées, factures d'achat, compte bancaire et transactions du mois, des
 * mois précédents et de l'année précédente). Montants en TTC dans le cadre
 * du mois (« Ventes (TTC) »), en HT dans « Factures de vente (HT) ».
 * Un écart est un défaut : l'accueil est la première chose que l'on lit.
 */
import { test, expect, etape, verifierTextesPropres } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_CLIENT_CABINET, SESSION_TOKEN_PILOTAGE, SESSION_TOKEN_PILOTAGE_EDITEUR, SESSION_TOKEN_PILOTAGE_MEMBRE } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { aTraiter, dernieresFactures, euros, facturationDuMois, moisParis, soldeEtFlux, texteSimple } from "./attendus.mjs";
import { cadreDuMois, cadreSolde, carte, compteur, montantApres, montantDans, ouvrirAccueil } from "./outils-accueil.mjs";

const PILOTAGE = COMPTES.pilotage;
const W = PILOTAGE.organisation._id;
const W_BOULANGERIE = COMPTES.clientCabinet.organisation._id;

test.describe("Accueil : cadre du mois (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("Le cadre est titré du mois en cours", async ({ page }) => {
    await ouvrirAccueil(page);
    await expect(cadreDuMois(page).locator("[data-slot=card-title]")).toHaveText(moisParis().libelle);
  });

  test("Ventes (TTC) : factures émises du mois (en attente, payées) et factures importées validées", async ({ page }) => {
    const { ventes } = await facturationDuMois(W);
    await ouvrirAccueil(page);
    await etape(page, `Attendu ${euros(ventes.total)}`, async () => expect(await montantApres(cadreDuMois(page), "Ventes (TTC)")).toBe(euros(ventes.total)), { capture: "ecran" });
  });

  test("Ventes « En cours » : factures du mois pas encore réglées", async ({ page }) => {
    const { ventes } = await facturationDuMois(W);
    await ouvrirAccueil(page);
    expect(await montantDans(cadreDuMois(page).locator('a[href="/dashboard/outils/factures?status=pending"]'))).toBe(euros(ventes.enCours));
  });

  test("Ventes « En retard » : factures du mois dont l'échéance est passée", async ({ page }) => {
    const { ventes } = await facturationDuMois(W);
    await ouvrirAccueil(page);
    expect(await montantDans(cadreDuMois(page).locator('a[href="/dashboard/outils/factures?status=overdue"]'))).toBe(euros(ventes.enRetard));
  });

  test("Achats (TTC) : factures d'achat émises dans le mois", async ({ page }) => {
    const { achats } = await facturationDuMois(W);
    await ouvrirAccueil(page);
    expect(await montantApres(cadreDuMois(page), "Achats (TTC)")).toBe(euros(achats.total));
  });

  test("Achats « À payer » : factures d'achat du mois à payer ou en retard", async ({ page }) => {
    const { achats } = await facturationDuMois(W);
    await ouvrirAccueil(page);
    expect(await montantDans(cadreDuMois(page).locator('a[href="/dashboard/outils/factures-achat"]').filter({ hasText: "À payer" }))).toBe(euros(achats.aPayer));
  });

  test("Achats « En retard » : factures d'achat du mois échues", async ({ page }) => {
    const { achats } = await facturationDuMois(W);
    await ouvrirAccueil(page);
    expect(await montantDans(cadreDuMois(page).locator('a[href="/dashboard/outils/factures-achat"]').filter({ hasText: "En retard" }))).toBe(euros(achats.enRetard));
  });
});

test.describe("Accueil : solde et flux (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("Solde du compte : solde bancaire et espèces", async ({ page }) => {
    const { solde } = await soldeEtFlux(W);
    await ouvrirAccueil(page);
    expect(await montantDans(cadreSolde(page).locator(".text-3xl"))).toBe(euros(solde));
  });

  test("Encaissement : entrées d'argent de l'année", async ({ page }) => {
    const { encaissement } = await soldeEtFlux(W);
    await ouvrirAccueil(page);
    expect(await montantApres(cadreSolde(page), "Encaissement")).toBe(euros(encaissement));
  });

  test("Décaissement : sorties d'argent de l'année (transactions supprimées exclues)", async ({ page }) => {
    const { decaissement } = await soldeEtFlux(W);
    await ouvrirAccueil(page);
    expect(await montantApres(cadreSolde(page), "Décaissement")).toBe(euros(decaissement));
  });
});

test.describe("Accueil : à traiter (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });
  const attendu = () => aTraiter({ workspaceId: W, utilisateurId: PILOTAGE.utilisateur._id });

  test("Rapprochements à faire : entrées d'argent sans facture ni justificatif", async ({ page }) => {
    const { rapprochements } = await attendu();
    await ouvrirAccueil(page);
    expect(await compteur(page, "Rapprochements à faire")).toBe(rapprochements);
  });

  test("Factures en retard : factures en attente dont l'échéance est passée", async ({ page }) => {
    const { facturesEnRetard } = await attendu();
    await ouvrirAccueil(page);
    expect(await compteur(page, "Factures en retard")).toBe(facturesEnRetard);
  });

  test("Factures à envoyer : factures en attente jamais envoyées par e-mail", async ({ page }) => {
    const { facturesAEnvoyer } = await attendu();
    await ouvrirAccueil(page);
    expect(await compteur(page, "Factures à envoyer")).toBe(facturesAEnvoyer);
  });

  test("Devis en attente : les devis expirés n'en font plus partie", async ({ page }) => {
    const { devisEnAttente, devisEnAttenteYComprisExpires } = await attendu();
    await ouvrirAccueil(page);
    const affiche = await compteur(page, "Devis en attente");
    expect(
      affiche,
      `L'accueil compte ${affiche} devis en attente ; ${devisEnAttente} seulement sont encore valables (${devisEnAttenteYComprisExpires - devisEnAttente} expiré(s), affiché(s) « Expiré » dans la liste des devis)`,
    ).toBe(devisEnAttente);
  });

  test("Notifications non lues : nombre de notifications non lues de l'espace", async ({ page }) => {
    const { notificationsNonLues } = await attendu();
    await ouvrirAccueil(page);
    expect(await compteur(page, "Notifications non lues")).toBe(notificationsNonLues);
  });

  test("Achats à payer : factures d'achat à payer ou en retard", async ({ page }) => {
    const { achatsAPayer } = await attendu();
    await ouvrirAccueil(page);
    expect(await compteur(page, "Achats à payer")).toBe(achatsAPayer);
  });

  test("Transactions à catégoriser : compte les transactions sans catégorie", async ({ page }) => {
    const { transactionsSansCategorie } = await attendu();
    expect(transactionsSansCategorie, "Données de départ : des transactions sans catégorie").toBeGreaterThan(0);
    await ouvrirAccueil(page);
    expect(await compteur(page, "Transactions à catégoriser"), `${transactionsSansCategorie} transactions n'ont aucune catégorie ; le compteur de l'accueil est écrit en dur à 0`).toBe(
      transactionsSansCategorie,
    );
  });

  test("Justificatifs manquants : même nombre que l'onglet « Justificatif manquant » des transactions", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/transactions", { pret: page.getByRole("tab", { name: /^Justificatif manquant/ }) });
    const onglet = texteSimple(await page.getByRole("tab", { name: /^Justificatif manquant/ }).innerText());
    const attendu = Number(onglet.match(/(\d+)$/)?.[1]);
    expect(attendu, "L'onglet des transactions compte des transactions sans justificatif").toBeGreaterThan(0);
    await ouvrirAccueil(page);
    expect(await compteur(page, "Justificatifs manquants"), `L'onglet des transactions en compte ${attendu} ; le compteur de l'accueil est écrit en dur à 0`).toBe(attendu);
  });
});

test.describe("Accueil : dernières factures de vente (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  test("Les cinq dernières factures (hors brouillons), leur client et leur montant HT", async ({ page }) => {
    const attendues = await dernieresFactures(W);
    await ouvrirAccueil(page);
    const zone = carte(page, "Factures de vente (HT)");
    const texte = texteSimple(await zone.innerText());
    for (const f of attendues) {
      expect.soft(texte, `Facture ${f.reference} (${f.client})`).toContain(texteSimple(f.client));
      expect.soft(texte, `Montant HT de ${f.reference}`).toContain(euros(f.ht));
    }
  });

  test("Le numéro d'une facture s'écrit comme dans la liste des factures (préfixe, tiret, numéro)", async ({ page }) => {
    const [premiere] = await dernieresFactures(W);
    await ouvrirAccueil(page);
    const texte = texteSimple(await carte(page, "Factures de vente (HT)").innerText());
    expect(texte, `Numéro attendu « ${premiere.reference} » (affiché collé : « ${premiere.reference.replace(/-(?=[^-]*$)/, "")} »)`).toContain(premiere.reference);
  });

  test("Aucune valeur incohérente affichée (undefined, NaN, Invalid Date…)", async ({ page }) => {
    await ouvrirAccueil(page);
    await verifierTextesPropres(page);
  });
});

test.describe("Accueil : filtre par compte bancaire (propriétaire)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_PILOTAGE) });

  async function choisirLeCompte(page) {
    await ouvrirAccueil(page);
    await page.getByRole("button", { name: "Tous les comptes" }).click();
    await page.getByRole("option", { name: /Compte courant Pilotage/ }).click();
    await expect(page.getByRole("button", { name: /Compte courant Pilotage ···0185/ })).toBeVisible();
  }

  test("Choisir le compte : solde de ce compte seul (sans les espèces)", async ({ page }) => {
    await choisirLeCompte(page);
    await expect.poll(() => montantDans(cadreSolde(page).locator(".text-3xl"))).toBe(euros(12500));
  });

  test("Choisir le compte : encaissements et décaissements de ce compte", async ({ page }) => {
    const { base } = await import("../base.mjs");
    const db = await base();
    const annee = new Date().getUTCFullYear();
    const transactions = (await db.collection("transactions").find({ workspaceId: W.toHexString(), deletedAt: null, fromAccount: "e2e-pilotage-compte-1" }).toArray()).filter(
      (t) => t.date.getUTCFullYear() === annee,
    );
    const entrees = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    expect(entrees, "Données de départ : des entrées sur ce compte cette année").toBeGreaterThan(0);
    await choisirLeCompte(page);
    await etape(
      page,
      "Encaissement du compte choisi",
      async () => expect.poll(() => montantApres(cadreSolde(page), "Encaissement"), { message: "Le filtre de compte ne retrouve aucune transaction de ce compte", timeout: 15_000 }).toBe(euros(entrees)),
      { capture: "ecran" },
    );
  });

  test("Choisir le compte : ses dernières transactions restent affichées", async ({ page }) => {
    await choisirLeCompte(page);
    const zone = carte(page, "Transactions récentes");
    await etape(page, "Transactions du compte", async () => {
      await expect(zone.getByText("Aucune transaction récente"), "Le compte choisi a des transactions, la carte n'en montre aucune").toHaveCount(0);
    }, { capture: "ecran" });
  });
});

for (const [role, token] of [
  ["Éditeur", SESSION_TOKEN_PILOTAGE_EDITEUR],
  ["Membre (lecture seule)", SESSION_TOKEN_PILOTAGE_MEMBRE],
]) {
  test.describe(`Accueil : chiffres vus par le rôle « ${role} »`, () => {
    test.use({ storageState: connecte(token) });

    test("Mêmes ventes et achats du mois que le propriétaire", async ({ page }) => {
      const { ventes, achats } = await facturationDuMois(W);
      await ouvrirAccueil(page);
      expect.soft(await montantApres(cadreDuMois(page), "Ventes (TTC)")).toBe(euros(ventes.total));
      expect.soft(await montantApres(cadreDuMois(page), "Achats (TTC)")).toBe(euros(achats.total));
    });

    test("Même solde que le propriétaire", async ({ page }) => {
      const { solde } = await soldeEtFlux(W);
      await ouvrirAccueil(page);
      expect(await montantDans(cadreSolde(page).locator(".text-3xl"))).toBe(euros(solde));
    });
  });
}

test.describe("Accueil d'un espace de plus de 50 factures, sans compte bancaire (Boulangerie Cliente)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_CLIENT_CABINET) });

  test("Factures en retard : toutes les factures échues comptent, pas seulement les 50 dernières", async ({ page }) => {
    const { facturesEnRetard } = await aTraiter({ workspaceId: W_BOULANGERIE, utilisateurId: COMPTES.clientCabinet.utilisateur._id });
    expect(facturesEnRetard, "Données de départ : des factures anciennes en retard").toBeGreaterThan(0);
    await ouvrirAccueil(page);
    const affiche = await compteur(page, "Factures en retard");
    expect(affiche, `${facturesEnRetard} factures sont en retard ; l'accueil n'en voit que ${affiche} (il ne lit que les 50 dernières factures créées)`).toBe(facturesEnRetard);
  });

  test("Sans compte bancaire, le cadre du mois montre quand même les ventes du mois", async ({ page }) => {
    const { ventes } = await facturationDuMois(W_BOULANGERIE);
    await ouvrirAccueil(page);
    await etape(
      page,
      "Cadre du mois",
      async () => {
        await expect(page.getByText("Aucune donnée de facturation"), "Le cadre annonce « Aucune donnée de facturation » alors que l'espace a des factures").toHaveCount(0);
        expect(await montantApres(cadreDuMois(page), "Ventes (TTC)")).toBe(euros(ventes.total));
      },
      { capture: "ecran" },
    );
  });
});
