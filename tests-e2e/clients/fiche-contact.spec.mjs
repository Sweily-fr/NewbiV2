/**
 * Fiche contact (« Nouveau contact ») : tous les champs, pour un particulier
 * et pour une entreprise, avec le compte « Atelier » (organisation où les
 * tests créent leurs données). Chaque cas est un contact distinct, retrouvé
 * en base par son e-mail ou son nom, propres au cas.
 *
 * Valeurs acceptées : de vraies adresses et de vrais noms (« n° », « Cedex »,
 * « Lecœur », « Łukasiewicz »…). Un refus de l'une d'elles est un défaut : un
 * vrai client ne pourrait pas être enregistré.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";

const ATELIER = COMPTES.atelier.organisation._id;

/** Lettres seules (les noms de personne n'acceptent pas de chiffres), uniques par cas. */
function lettres(cas) {
  const m = marque(cas).toLowerCase();
  let h = 0;
  for (const c of m) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let s = "";
  for (let i = 0; i < 6; i++, h = Math.floor(h / 26)) s += String.fromCharCode(97 + (h % 26));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const slug = (cas) => marque(cas).toLowerCase().replace(/\s+/g, "-");

async function ouvrirFiche(page, type) {
  await ouvrir(page, "/dashboard/clients", { pret: page.getByRole("heading", { name: "Gestion des contacts" }) });
  await page.getByRole("button", { name: "Nouveau contact" }).click();
  const fenetre = page.getByRole("dialog", { name: "Ajouter un client" });
  await expect(fenetre).toBeVisible();
  if (type === "COMPANY") {
    await fenetre.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Entreprise" }).click();
    await expect(fenetre.getByPlaceholder("Nom de l'entreprise")).toBeVisible();
  }
  await attendreCalme(page);
  return fenetre;
}

/** Remplit les champs donnés (placeholder → valeur) ; "" vide le champ. */
async function remplirParIndication(fenetre, champs, valeurs) {
  for (const [cle, indication] of Object.entries(champs)) {
    if (valeurs[cle] === undefined) continue;
    const champ = fenetre.getByPlaceholder(indication, { exact: true });
    await champ.fill(valeurs[cle]);
  }
}

async function contactEnregistre(v) {
  const email = (v.email || "").trim().toLowerCase();
  const ou = [{ email }];
  if (v.nom) ou.push({ lastName: v.nom });
  if (v.raisonSociale) ou.push({ name: v.raisonSociale });
  return (await base()).collection("clients").findOne({ workspaceId: ATELIER, $or: ou });
}

const valider = (fenetre) => fenetre.getByRole("button", { name: "Créer un contact" }).click();
const adresse = (doc, cle) => doc?.address?.[cle];

// --- Particulier --------------------------------------------------------------

const CHAMPS_PARTICULIER = {
  prenom: "Prénom",
  nom: "Nom",
  email: "client@exemple.com",
  rue: "123 Rue de la Paix",
  ville: "Paris",
  codePostal: "75001",
  pays: "France",
};

verifierFormulaire({
  nom: "Nouveau contact (particulier)",
  ouvrir: (page) => ouvrirFiche(page, "INDIVIDUAL"),
  remplir: (fenetre, v) => remplirParIndication(fenetre, CHAMPS_PARTICULIER, v),
  valider,
  valeurs: (cas) => ({
    prenom: "Sophie",
    nom: `Testeur ${lettres(cas)}`,
    email: `particulier-${slug(cas)}@e2e.test`,
    rue: "12 rue des Tests",
    ville: "Lyon",
    codePostal: "69003",
    pays: "France",
  }),
  enregistre: contactEnregistre,
  champs: {
    Prénom: {
      cle: "prenom",
      obligatoire: true,
      lu: (doc) => doc.firstName,
      refuses: { "d'une seule lettre": "A", "avec des chiffres": "Jean2", "avec un chevron": "Jean<b>" },
      acceptes: { "composé avec accents": "Marie-Hélène", "avec apostrophe": "D'Arcy", "avec tréma": "Zoë" },
    },
    Nom: {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.lastName,
      refuses: { "d'une seule lettre": "B", "de 51 lettres": "a".repeat(51) },
      acceptes: {
        "avec ligature œ (Lecœur)": "Lecœur",
        "avec particule": "de La Fontaine",
        "polonais (Łukasiewicz)": "Łukasiewicz",
        "vietnamien (Nguyễn)": "Nguyễn",
      },
    },
    "E-mail": {
      cle: "email",
      obligatoire: true,
      lu: (doc) => doc.email,
      normaliser: (v) => v.toLowerCase(),
      refuses: {
        "sans arobase": "sophie.e2e.test",
        "sans domaine": "sophie@",
        "avec une espace": "sophie martin@e2e.test",
        "domaine sans extension": "sophie@e2e",
      },
      acceptes: { "avec un plus": "sophie+factures@e2e.test", "en majuscules": "Sophie.Majuscules@E2E.test", "sous-domaine": "contact@mail.e2e.test" },
    },
    "Adresse (rue)": {
      cle: "rue",
      obligatoire: true,
      lu: (doc) => adresse(doc, "street"),
      refuses: { "de deux caractères": "ab", "avec un chevron": "1 rue <b>" },
      acceptes: {
        "avec « n° » et bâtiment": "5 rue de l'Église, Bât. A n°3",
        "avec « bis »": "12 bis avenue Jean-Jaurès",
        "avec une barre oblique": "12/14 rue des Tanneurs",
      },
    },
    Ville: {
      cle: "ville",
      obligatoire: true,
      lu: (doc) => adresse(doc, "city"),
      refuses: { "d'une seule lettre": "A" },
      acceptes: { "avec Cedex": "Paris Cedex 08", composée: "Saint-Étienne", "avec apostrophe et tréma": "L'Haÿ-les-Roses" },
    },
    "Code postal": {
      cle: "codePostal",
      obligatoire: true,
      lu: (doc) => adresse(doc, "postalCode"),
      refuses: { "de 4 chiffres": "7500", "avec une lettre": "75A01", "00000": "00000", "de 6 chiffres": "750011" },
      acceptes: { "de Corse": "20000", "de La Réunion": "97400" },
    },
    Pays: {
      cle: "pays",
      obligatoire: true,
      lu: (doc) => adresse(doc, "country"),
      acceptes: { "avec accent": "Bénin" },
    },
  },
  combinaisons: {
    "Particulier en Belgique, code postal belge": { valeurs: { pays: "Belgique", ville: "Bruxelles", codePostal: "1000" }, accepte: true },
    "Particulier au Royaume-Uni, code postal britannique": { valeurs: { pays: "Royaume-Uni", ville: "London", codePostal: "SW1A 1AA" }, accepte: true },
  },
});

// --- Entreprise ---------------------------------------------------------------

const CHAMPS_ENTREPRISE = {
  raisonSociale: "Nom de l'entreprise",
  nomContact: "Nom du contact",
  email: "contact@entreprise.com",
  fonction: "Ex: Directeur commercial",
  service: "Ex: Direction commerciale",
  localisation: "Ex: Paris, Bureau 3A",
  telephone: "01 23 45 67 89",
  rue: "123 Rue de la Paix",
  ville: "Paris",
  codePostal: "75001",
  pays: "France",
  siret: "123456789 ou 12345678901234",
  tva: "FR12345678901",
};

// Hors de France, les indications du code postal, du numéro d'immatriculation et de la TVA changent.
const CHAMPS_ENTREPRISE_HORS_FRANCE = { ...CHAMPS_ENTREPRISE, codePostal: "Ex: SW1A 1AA, 10001...", siret: "123456789", tva: "SE123456789012" };

async function remplirEntreprise(fenetre, v) {
  if (v.horsFrance) {
    await fenetre.getByRole("combobox").nth(1).click();
    await fenetre.page().getByRole("option", { name: "Hors France" }).click();
    await expect(fenetre.getByPlaceholder(CHAMPS_ENTREPRISE_HORS_FRANCE.codePostal)).toBeVisible();
  }
  await remplirParIndication(fenetre, v.horsFrance ? CHAMPS_ENTREPRISE_HORS_FRANCE : CHAMPS_ENTREPRISE, v);
}

verifierFormulaire({
  nom: "Nouveau contact (entreprise)",
  ouvrir: (page) => ouvrirFiche(page, "COMPANY"),
  remplir: remplirEntreprise,
  valider,
  valeurs: (cas) => ({
    raisonSociale: `Entreprise ${lettres(cas)} SAS`,
    nomContact: "Jean Dupont",
    email: `entreprise-${slug(cas)}@e2e.test`,
    fonction: "Gérant",
    service: "Direction",
    localisation: "Siège",
    telephone: "0612345678",
    rue: "8 boulevard des Tests",
    ville: "Nantes",
    codePostal: "44000",
    pays: "France",
    siret: "12345678900011",
    tva: "FR12123456789",
  }),
  enregistre: contactEnregistre,
  champs: {
    "Raison sociale": {
      cle: "raisonSociale",
      obligatoire: true,
      lu: (doc) => doc.name,
      refuses: { "d'une seule lettre": "A", "avec des chevrons": "Société <b>Test</b>", "de 201 caractères": "S".repeat(201) },
      acceptes: { "avec & et apostrophe": "L'Atelier & Fils", "avec accents et chiffres": "Café Lumière 2026", "avec points et tiret": "A.B.C. - Conseil" },
    },
    "Nom du contact": {
      cle: "nomContact",
      lu: (doc) => doc.firstName,
      refuses: { "avec des chiffres": "Jean 2" },
      acceptes: { "avec ligature œ": "Jean Lecœur" },
    },
    "E-mail": {
      cle: "email",
      obligatoire: true,
      lu: (doc) => doc.email,
      normaliser: (v) => v.toLowerCase(),
      refuses: { "sans arobase": "contact.e2e.test", "sans domaine": "contact@" },
      acceptes: { "avec un plus": "compta+factures@e2e.test" },
    },
    Téléphone: {
      cle: "telephone",
      lu: (doc) => doc.phone,
      refuses: { "avec des lettres": "abcdefghij", "trop court": "0612" },
      acceptes: { "format international": "+33 6 12 34 56 78", "avec des points": "06.12.34.56.78" },
    },
    Fonction: {
      cle: "fonction",
      lu: (doc) => doc.contactFunction,
      // Un texte piégé est enregistré tel quel, jamais exécuté (voir aussi la fiche).
      acceptes: { "texte piégé (balise image)": "<img src=x onerror=alert(1)>" },
    },
    SIRET: {
      cle: "siret",
      obligatoire: true,
      sansEspaces: true,
      lu: (doc) => doc.siret,
      refuses: { "de 3 chiffres": "123", "avec une lettre": "1234567890123A", "de 15 chiffres": "123456789012345" },
      acceptes: { "SIREN de 9 chiffres": "123456789" },
    },
    "N° de TVA": {
      cle: "tva",
      lu: (doc) => doc.vatNumber,
      refuses: { "en minuscules": "fr12345678901", "trop court": "FR1" },
      acceptes: { belge: "BE0123456789" },
    },
    "Code postal": {
      cle: "codePostal",
      obligatoire: true,
      lu: (doc) => adresse(doc, "postalCode"),
      refuses: { "de 4 chiffres": "4400" },
    },
  },
  combinaisons: {
    "Entreprise hors France, sans SIRET, code postal britannique": {
      valeurs: { horsFrance: true, pays: "Royaume-Uni", ville: "London", codePostal: "NW1 6XE", telephone: "+44 20 7946 0958", siret: "", tva: "GB123456789" },
      accepte: true,
    },
  },
});

// --- Après l'enregistrement ------------------------------------------------------

test.describe("Nouveau contact : après l'enregistrement", () => {
  test("Un texte piégé saisi dans la fiche reste du texte sur la fiche du contact", async ({ page }) => {
    const fenetre = await ouvrirFiche(page, "COMPANY");
    const piege = "<img src=x onerror=alert(1)>";
    await remplirEntreprise(fenetre, {
      raisonSociale: "Entreprise Piège SAS",
      nomContact: "Jean Dupont",
      email: "piege-affichage@e2e.test",
      fonction: piege,
      service: piege,
      localisation: piege,
      telephone: "0612345678",
      rue: "8 boulevard des Tests",
      ville: "Nantes",
      codePostal: "44000",
      pays: "France",
      siret: "12345678900011",
    });
    await valider(fenetre);
    await expect(fenetre).toBeHidden({ timeout: 15_000 });
    const doc = await contactEnregistre({ email: "piege-affichage@e2e.test" });
    expect(doc, "Contact enregistré").not.toBeNull();
    await etape(
      page,
      "Fiche du contact : le texte s'affiche, rien ne s'exécute",
      async () => {
        await ouvrir(page, `/dashboard/clients/${doc._id.toHexString()}`);
        await expect(page.getByText(piege).first()).toBeVisible();
      },
      { capture: "ecran" },
    );
  });

  test("Même e-mail qu'un contact existant : refusé, le champ le signale", async ({ page }) => {
    const fenetre = await ouvrirFiche(page, "INDIVIDUAL");
    await remplirParIndication(fenetre, CHAMPS_PARTICULIER, {
      prenom: "Paul",
      nom: "Doublon",
      email: "paul.durand@e2e.test",
      rue: "5 allée des Tilleuls",
      ville: "Bordeaux",
      codePostal: "33000",
      pays: "France",
    });
    await valider(fenetre);
    await etape(
      page,
      "Message « déjà utilisé »",
      async () => {
        await expect(fenetre.getByText("Cet email est déjà utilisé par un autre client")).toBeVisible();
      },
      { capture: "ecran" },
    );
    expect(await (await base()).collection("clients").countDocuments({ workspaceId: ATELIER, email: "paul.durand@e2e.test" })).toBe(1);
  });
});
