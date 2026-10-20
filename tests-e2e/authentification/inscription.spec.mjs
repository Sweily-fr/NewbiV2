/**
 * Inscription : le formulaire e-mail (tous les champs) puis l'étape « Votre
 * entreprise » (avec le SIRET trouvé dans l'annuaire, sans SIRET, formes
 * juridiques). Le paiement (offre puis Stripe) n'est pas joignable dans les
 * tests : chaque parcours s'arrête au choix de l'offre, données vérifiées en
 * base (user.onboardingStep, user.onboardingData).
 *
 * Comptes : un nouvel e-mail par cas pour le formulaire ; pour l'étape
 * entreprise, des comptes déjà inscrits (étape « workspace »), remis à cette
 * étape avant chaque test.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte } from "../config.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";
import { COMPTES_AUTH } from "../donnees/lot-parametres-auth.mjs";
import { attendreQuota, SANS_SESSION } from "./outils-auth.mjs";

const slug = (cas) => marque(cas).toLowerCase().replace(/\s+/g, "-");
const utilisateur = async (filtre) => (await base()).collection("user").findOne(filtre);
const donneesInscription = (u) => {
  try {
    return JSON.parse(u?.onboardingData || "null");
  } catch {
    return null;
  }
};

// --- Formulaire e-mail ----------------------------------------------------------

test.describe(() => {
  test.use({ storageState: SANS_SESSION, erreursConsoleAutorisees: /status of 4\d\d.*\/api\/auth\// });

  verifierFormulaire({
    nom: "Inscription par e-mail",
    ouvrir: async (page) => {
      await ouvrir(page, "/auth/signup", { pret: page.getByRole("button", { name: "Continuer avec l'email" }) });
      await page.getByRole("button", { name: "Continuer avec l'email" }).click();
      const formulaire = page.locator("form").filter({ has: page.getByPlaceholder("Saisissez votre email") });
      await expect(formulaire).toBeVisible();
      return formulaire;
    },
    remplir: async (zone, v) => {
      if (v.email !== undefined) await zone.getByPlaceholder("Saisissez votre email").fill(v.email);
      if (v.mdp !== undefined) await zone.getByPlaceholder("Saisissez votre mot de passe").fill(v.mdp);
    },
    valider: async (zone) => {
      await attendreQuota("/sign-up/email");
      await zone.getByRole("button", { name: "S'inscrire" }).click();
    },
    boutonValider: (zone) => zone.getByRole("button", { name: "S'inscrire" }),
    valeurs: (cas) => ({ email: `inscription.${slug(cas)}@e2e.test`, mdp: "Inscription-2026!" }),
    enregistre: (v) => utilisateur({ email: String(v.email || "").trim().toLowerCase() }),
    champs: {
      "E-mail": {
        cle: "email",
        obligatoire: true,
        lu: (doc) => doc.email,
        normaliser: (v) => v.toLowerCase(),
        refuses: { "sans arobase": "inscription.e2e.test", "avec une espace": "ins cription@e2e.test", "sans domaine": "inscription@" },
        acceptes: { "avec un plus": "inscription+factures@e2e.test", "en majuscules": "Inscription.Majuscules@E2E.test" },
      },
      "Mot de passe": {
        cle: "mdp",
        obligatoire: true,
        // Un mot de passe ne se relit pas : le compte créé suffit.
        lu: (doc) => Boolean(doc),
        normaliser: () => true,
        refuses: { "de 7 caractères": "Abcde1!", "sans chiffre": "Abcdefgh!", "sans majuscule": "abcdefg1!", "sans minuscule": "ABCDEFG1!" },
        acceptes: { "avec des accents": "Été-Sécurisé-2026", "de 64 caractères": `Aa1${"x".repeat(61)}` },
      },
    },
  });

  test("Inscription réussie : compte créé à l'étape « Votre entreprise », e-mail à vérifier", async ({ page }) => {
    await ouvrir(page, "/auth/signup", { pret: page.getByRole("button", { name: "Continuer avec l'email" }) });
    await page.getByRole("button", { name: "Continuer avec l'email" }).click();
    await page.getByPlaceholder("Saisissez votre email").fill("nouvelle-inscription@e2e.test");
    await page.getByPlaceholder("Saisissez votre mot de passe").fill("Nouvelle-Inscription-2026!");
    await attendreQuota("/sign-up/email");
    await page.getByRole("button", { name: "S'inscrire" }).click();
    await expect(page.getByPlaceholder("Nom de l'entreprise, SIRET ou SIREN...")).toBeVisible({ timeout: 30_000 });
    const u = await utilisateur({ email: "nouvelle-inscription@e2e.test" });
    expect(u?.onboardingStep).toBe("workspace");
    expect(u?.emailVerified).toBe(false);
    const compte = await (await base()).collection("account").findOne({ userId: u._id, providerId: "credential" });
    expect(compte?.password, "Mot de passe non haché ou absent").toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
  });

  test("Adresse déjà inscrite : refusée avec un message, aucun second compte", async ({ page }) => {
    await ouvrir(page, "/auth/signup", { pret: page.getByRole("button", { name: "Continuer avec l'email" }) });
    await page.getByRole("button", { name: "Continuer avec l'email" }).click();
    await page.getByPlaceholder("Saisissez votre email").fill(COMPTES_AUTH.connexion.utilisateur.email);
    await page.getByPlaceholder("Saisissez votre mot de passe").fill("Doublon-Inscription-2026!");
    await attendreQuota("/sign-up/email");
    await page.getByRole("button", { name: "S'inscrire" }).click();
    await expect(page.locator("[data-sonner-toast]").first(), "Aucun message pour une adresse déjà inscrite").toBeVisible();
    expect(await (await base()).collection("user").countDocuments({ email: COMPTES_AUTH.connexion.utilisateur.email })).toBe(1);
  });
});

// --- Étape « Votre entreprise » -------------------------------------------------

/** Remet un compte à l'étape « workspace », sans données d'inscription. */
async function aLEtapeEntreprise(compte) {
  await (await base()).collection("user").updateOne({ _id: compte.utilisateur._id }, { $set: { onboardingStep: "workspace" }, $unset: { onboardingData: "" } });
}

async function etapeEntreprise(page) {
  await ouvrir(page, "/auth/signup", { pret: page.getByPlaceholder(/Nom de l'entreprise, SIRET ou SIREN/) });
}

test.describe("Inscription : étape « Votre entreprise » sans SIRET", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.inscriptionSansSiret.token) });
  test.beforeEach(() => aLEtapeEntreprise(COMPTES_AUTH.inscriptionSansSiret));

  test("Entreprise en cours d'immatriculation : nom libre, inscription poursuivie", async ({ page }) => {
    await etapeEntreprise(page);
    await page.getByRole("button", { name: "Continuer sans SIRET" }).first().click();
    const nom = page.getByPlaceholder("Ex. : Studio Dupont ou Jean Dupont");
    await nom.fill("Atelier Lecœur en création");
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect.poll(async () => (await utilisateur({ _id: COMPTES_AUTH.inscriptionSansSiret.utilisateur._id }))?.onboardingStep).toBe("plan");
    const donnees = donneesInscription(await utilisateur({ _id: COMPTES_AUTH.inscriptionSansSiret.utilisateur._id }));
    expect(donnees?.companyName).toBe("Atelier Lecœur en création");
    expect(donnees?.siret ?? "").toBe("");
  });

  test("Sans SIRET et sans nom : « Continuer » reste impossible", async ({ page }) => {
    await etapeEntreprise(page);
    await page.getByRole("button", { name: "Continuer sans SIRET" }).first().click();
    await page.getByPlaceholder("Ex. : Studio Dupont ou Jean Dupont").fill("   ");
    await expect(page.getByRole("button", { name: "Continuer", exact: true })).toBeDisabled();
  });
});

test.describe("Inscription : étape « Votre entreprise » avec le SIRET", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.inscriptionAvecSiret.token) });
  test.beforeEach(() => aLEtapeEntreprise(COMPTES_AUTH.inscriptionAvecSiret));

  test("Entreprise trouvée dans l'annuaire : SIRET, adresse et nom repris", async ({ page }) => {
    await etapeEntreprise(page);
    await page.getByPlaceholder(/Nom de l'entreprise, SIRET ou SIREN/).fill("Studio graphique");
    await page.getByRole("button", { name: /STUDIO GRAPHIQUE ORION/ }).first().click();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
    await expect.poll(async () => (await utilisateur({ _id: COMPTES_AUTH.inscriptionAvecSiret.utilisateur._id }))?.onboardingStep).toBe("plan");
    const donnees = donneesInscription(await utilisateur({ _id: COMPTES_AUTH.inscriptionAvecSiret.utilisateur._id }));
    expect(donnees).toMatchObject({ siret: "82345678900021", siren: "823456789", addressZipCode: "75011", addressCity: "PARIS" });
  });

  test("Entreprise déjà inscrite (même SIRET qu'un autre espace) : refusée avec un message", async ({ page }) => {
    // Annuaire de ce test : une entreprise au SIRET déjà porté par les espaces de test.
    await page.route("**/api/search-companies?**", (route) =>
      route.fulfill({
        status: 200,
        json: {
          results: [
            {
              siren: "987654321",
              nom_complet: "SOCIETE DEJA INSCRITE",
              nom_raison_sociale: "SOCIETE DEJA INSCRITE",
              nature_juridique: "5710",
              etat_administratif: "A",
              siege: { siret: "98765432100012", adresse: "1 RUE DE LA PAIX 75001 PARIS", code_postal: "75001", libelle_commune: "PARIS" },
            },
          ],
          total_results: 1,
        },
      }),
    );
    await etapeEntreprise(page);
    await page.getByPlaceholder(/Nom de l'entreprise, SIRET ou SIREN/).fill("Société déjà");
    await page.getByRole("button", { name: /SOCIETE DEJA INSCRITE/ }).first().click();
    await expect(page.getByText(/Demandez une invitation à l'administrateur/).first(), "Aucun message pour un SIRET déjà inscrit").toBeVisible();
  });
});

test.describe("Inscription : forme juridique reprise de l'annuaire", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.inscriptionFormes.token) });

  for (const [code, forme, nom] of [
    ["1000", "EI", "JEAN DUPONT"],
    ["5499", "SARL", "MENUISERIE DU LAC"],
    ["5498", "EURL", "PLOMBERIE SEULE"],
    ["5710", "SAS", "CONSEIL ASSOCIES"],
    ["5720", "SASU", "STUDIO UNIQUE"],
    ["9220", "Association", "CLUB DE LECTURE"],
  ]) {
    test(`Nature juridique ${code} : forme « ${forme} » enregistrée`, async ({ page }) => {
      await aLEtapeEntreprise(COMPTES_AUTH.inscriptionFormes);
      const siret = `9${code}${"0".repeat(9)}`.slice(0, 14);
      await page.route("**/api/search-companies?**", (route) =>
        route.fulfill({
          status: 200,
          json: {
            results: [
              {
                siren: siret.slice(0, 9),
                nom_complet: nom,
                nom_raison_sociale: nom,
                nature_juridique: code,
                etat_administratif: "A",
                siege: { siret, adresse: "3 RUE DES FORMES 69002 LYON", code_postal: "69002", libelle_commune: "LYON" },
              },
            ],
            total_results: 1,
          },
        }),
      );
      await etapeEntreprise(page);
      await page.getByPlaceholder(/Nom de l'entreprise, SIRET ou SIREN/).fill(nom.slice(0, 8));
      await page.getByRole("button", { name: new RegExp(nom) }).first().click();
      await page.getByRole("button", { name: "Continuer", exact: true }).click();
      await etape(page, "Forme juridique enregistrée", async () => {
        await expect.poll(async () => donneesInscription(await utilisateur({ _id: COMPTES_AUTH.inscriptionFormes.utilisateur._id }))?.legalForm).toBe(forme);
      });
    });
  }
});
