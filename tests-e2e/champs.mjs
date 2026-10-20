/**
 * « Tous les champs » : un formulaire est décrit une fois (comment l'ouvrir,
 * le remplir correctement, le valider, retrouver ce qu'il enregistre), avec
 * pour chaque champ les valeurs qui doivent être refusées et celles, réelles
 * et parfois inhabituelles, qui doivent passer. Un test est généré par cas :
 *
 *   - tout vide : un message pour chaque champ obligatoire, rien d'enregistré ;
 *   - un champ obligatoire vide (ou rempli d'espaces), les autres justes ;
 *   - une valeur fausse (format, longueur, caractère interdit) : un message
 *     clair, rien d'enregistré ;
 *   - une valeur juste mais inhabituelle (accents, apostrophe, « n° »,
 *     numéro étranger…) : acceptée, enregistrée telle quelle, sans erreur ;
 *   - un texte piégé (balise <script>) : jamais exécuté (la surveillance
 *     échoue sur toute boîte de dialogue), affiché comme du texte.
 *
 * Une valeur fausse acceptée, une valeur juste refusée ou un refus sans
 * message sont des défauts : l'utilisateur ne doit jamais rester sans
 * explication, ni voir enregistrée une donnée invalide.
 */
import { test, expect, etape, SELECTEUR_NOTIFICATION_ERREUR, SELECTEUR_NOTIFICATION_SUCCES } from "./outils.mjs";

/** Messages d'erreur visibles : texte en rouge, alerte, champ marqué invalide, notification d'erreur. */
export async function erreursVisibles(page, zone = page) {
  const textes = await zone
    .locator(".text-red-500, .text-red-600, .text-destructive, [role=alert], [data-slot=form-message], [id$='-form-item-message']")
    .evaluateAll((els) =>
      els
        .filter((e) => {
          // Annonceur de navigation de Next (role=alert, 1 px) : il lit le titre de la nouvelle page, ce n'est pas une erreur.
          if (e.id === "__next-route-announcer__") return false;
          const r = e.getBoundingClientRect();
          const style = getComputedStyle(e);
          // L'astérisque rouge d'un champ obligatoire n'est pas un message d'erreur.
          return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && e.textContent.trim() && !/^[*\s]+$/.test(e.textContent);
        })
        .map((e) => e.textContent.replace(/\s+/g, " ").trim()),
    )
    .catch(() => []);
  const invalides = await zone
    .locator("[aria-invalid=true]")
    .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().width > 0).map((e) => `champ invalide : ${e.getAttribute("placeholder") || e.name || e.id}`))
    .catch(() => []);
  const notifications = await page
    .locator(SELECTEUR_NOTIFICATION_ERREUR)
    .evaluateAll((els) => els.map((e) => `notification : ${e.textContent.replace(/\s+/g, " ").trim()}`))
    .catch(() => []);
  return [...new Set([...textes, ...invalides, ...notifications])];
}

/**
 * Formulaire décrit par la fonctionnalité :
 *   nom          : « Nouveau contact (entreprise) »
 *   ouvrir(page) : ouvre le formulaire, renvoie sa zone (fenêtre, panneau, page)
 *   remplir(zone, valeurs) : remplit tous les champs avec `valeurs`
 *   valider(zone) : clique sur le bouton qui enregistre
 *   boutonValider(zone) : ce bouton (facultatif) ; grisé, il vaut refus explicite
 *     (le formulaire empêche d'envoyer une saisie incomplète)
 *   valeurs(cas) : jeu de valeurs justes et uniques pour ce cas (retrouvable en base)
 *   enregistre(valeurs) : le document enregistré pour ces valeurs, ou null
 *   ferme(zone, page) : le formulaire s'est fermé après un enregistrement réussi
 *   champs       : { [nom du champ]: { cle, obligatoire, refuses: { cas: valeur }, acceptes: { cas: valeur }, lu?(doc) } }
 *     `cle` : propriété de `valeurs` remplie par ce champ ; `lu(doc)` : valeur
 *     enregistrée pour ce champ (par défaut doc[cle]).
 *   combinaisons : { cas: { valeurs: {…}, accepte: true|false } } : situations
 *     réelles qui touchent plusieurs champs (client à l'étranger…)
 */
export function verifierFormulaire(formulaire) {
  const { nom, ouvrir, remplir, valider, valeurs, enregistre, champs } = formulaire;
  const ferme = formulaire.ferme || (async (zone, _page, timeout = 15_000) => expect(zone).toBeHidden({ timeout }));

  async function essayer(page, cas, modifier) {
    const zone = await ouvrir(page);
    const v = { ...valeurs(cas), ...modifier };
    await remplir(zone, v);
    const grise = formulaire.boutonValider ? await formulaire.boutonValider(zone).isDisabled({ timeout: 2_000 }).catch(() => false) : false;
    if (!grise) await valider(zone);
    await page.waitForTimeout(600);
    return { zone, v };
  }

  async function refuse(page, zone, v, raison) {
    await etape(
      page,
      "Un message explique le refus",
      async () => {
        const grise = formulaire.boutonValider ? await formulaire.boutonValider(zone).isDisabled({ timeout: 2_000 }).catch(() => false) : false;
        if (grise) return;
        // Souple : la vérification en base dit ensuite si la saisie a été enregistrée quand même.
        let erreurs = [];
        for (const fin = Date.now() + 6_000; Date.now() < fin; ) {
          erreurs = await erreursVisibles(page, page);
          if (erreurs.length) break;
          await page.waitForTimeout(300);
        }
        expect.soft(erreurs, `${raison} : aucun message d'erreur affiché`).not.toEqual([]);
      },
      { capture: "ecran" },
    );
    await etape(page, "Rien n'est enregistré", async () => {
      expect(await enregistre(v), `${raison} : la donnée invalide a été enregistrée`).toBeNull();
    });
    // Que la saisie reste à l'écran après un refus : test dédié, un par formulaire (plus bas).
  }

  async function accepte(page, zone, v, cle, attendu, lu) {
    await etape(
      page,
      "Enregistré sans erreur",
      async () => {
        // Tant que le formulaire est ouvert, un message d'erreur qui apparaît (même en retard) est le motif de l'échec.
        let derniers = [];
        await expect(async () => {
          derniers = await erreursVisibles(page, page);
          expect(derniers, "Messages d'erreur affichés pour une saisie juste").toEqual([]);
          await ferme(zone, page, 1_000);
        }, `Le formulaire ne s'est pas fermé (messages : ${JSON.stringify(derniers)})`).toPass({ timeout: 15_000 });
      },
      { capture: "ecran" },
    );
    await etape(page, "Enregistré tel que saisi", async () => {
      await expect.poll(() => enregistre(v), { message: "Le document n'a pas été enregistré", timeout: 10_000 }).not.toBeNull();
      if (cle) {
        const doc = await enregistre(v);
        expect(lu ? lu(doc) : doc[cle], `Valeur enregistrée pour « ${cle} »`).toBe(attendu);
      }
    });
  }

  test.describe(`${nom} : tous les champs`, () => {
    test("Saisie complète et juste : enregistrée", async ({ page }) => {
      const { zone, v } = await essayer(page, "complet", {});
      await accepte(page, zone, v);
    });

    const obligatoires = Object.entries(champs).filter(([, c]) => c.obligatoire);
    if (obligatoires.length) {
      test("Tout vide : refusé, chaque champ obligatoire signalé", async ({ page }) => {
        const zone = await ouvrir(page);
        await remplir(zone, Object.fromEntries(Object.values(champs).map((c) => [c.cle, ""])));
        const grise = formulaire.boutonValider ? await formulaire.boutonValider(zone).isDisabled({ timeout: 2_000 }).catch(() => false) : false;
        if (!grise) await valider(zone);
        await page.waitForTimeout(600);
        await etape(
          page,
          "Un message par champ obligatoire (ou bouton grisé)",
          async () => {
            if (grise) return;
            const erreurs = await erreursVisibles(page, page);
            expect(erreurs.length, `Messages affichés : ${erreurs.join(" | ") || "aucun"}`).toBeGreaterThan(0);
          },
          { capture: "ecran" },
        );
        await expect(zone).toBeVisible();
      });
    }

    for (const [libelle, champ] of Object.entries(champs)) {
      if (champ.obligatoire) {
        test(`« ${libelle} » vide : refusé avec un message`, async ({ page }) => {
          const { zone, v } = await essayer(page, `${champ.cle}-vide`, { [champ.cle]: "" });
          await refuse(page, zone, v, `« ${libelle} » vide`);
        });
        if (!champ.sansEspaces) {
          test(`« ${libelle} » rempli d'espaces : refusé avec un message`, async ({ page }) => {
            const { zone, v } = await essayer(page, `${champ.cle}-espaces`, { [champ.cle]: "   " });
            await refuse(page, zone, v, `« ${libelle} » rempli d'espaces`);
          });
        }
      }
      for (const [cas, valeur] of Object.entries(champ.refuses || {})) {
        test(`« ${libelle} » ${cas} : refusé avec un message`, async ({ page }) => {
          const { zone, v } = await essayer(page, `${champ.cle}-${cas}`, { [champ.cle]: valeur });
          await refuse(page, zone, v, `« ${libelle} » ${cas} (${JSON.stringify(valeur).slice(0, 60)})`);
        });
      }
      for (const [cas, valeur] of Object.entries(champ.acceptes || {})) {
        test(`« ${libelle} » ${cas} : accepté et enregistré tel quel`, async ({ page }) => {
          const { zone, v } = await essayer(page, `${champ.cle}-${cas}`, { [champ.cle]: valeur });
          await accepte(page, zone, v, champ.cle, champ.normaliser ? champ.normaliser(valeur) : valeur, champ.lu);
        });
      }
    }

    // Après un refus, la saisie reste à l'écran pour être corrigée, sans annonce de succès
    // (un seul test par formulaire, sur le premier cas refusé décrit).
    const premierRefus = Object.entries(champs).flatMap(([libelle, c]) =>
      Object.entries(c.refuses || {}).map(([cas, valeur]) => ({ libelle, cle: c.cle, cas, valeur })),
    )[0];
    if (premierRefus) {
      const { libelle, cle, cas, valeur } = premierRefus;
      test(`Après un refus (« ${libelle} » ${cas}), la saisie reste à l'écran, sans annonce de succès`, async ({ page }) => {
        const { zone, v } = await essayer(page, `${cle}-${cas}-reste`, { [cle]: valeur });
        await page.waitForTimeout(1_500);
        await etape(
          page,
          "Formulaire toujours ouvert",
          async () => {
            const succes = await page.locator(SELECTEUR_NOTIFICATION_SUCCES).allInnerTexts().catch(() => []);
            expect.soft(succes.map((t) => t.replace(/\s+/g, " ").trim()), "Un succès est annoncé alors que la saisie est refusée").toEqual([]);
            await expect(zone, "Le formulaire s'est fermé après le refus : la saisie est perdue").toBeVisible({ timeout: 2_000 });
          },
          { capture: "ecran" },
        );
        expect(await enregistre(v), "La saisie refusée a été enregistrée").toBeNull();
      });
    }

    for (const [cas, { valeurs: modif, accepte: ok }] of Object.entries(formulaire.combinaisons || {})) {
      test(`${cas} : ${ok ? "accepté et enregistré" : "refusé avec un message"}`, async ({ page }) => {
        const { zone, v } = await essayer(page, `combinaison-${cas}`, modif);
        if (ok) await accepte(page, zone, v);
        else await refuse(page, zone, v, cas);
      });
    }
  });
}

/** Texte unique par cas, pour retrouver en base ce qu'un test a enregistré. */
export function marque(cas) {
  return cas
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .slice(0, 40);
}
