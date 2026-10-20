/**
 * Paramètres de l'entreprise : tous les champs des onglets Générale,
 * Coordonnées bancaires et Informations légales, enregistrés par le
 * propriétaire de l'espace « Configuration ». Chaque cas remplit tout le
 * formulaire avec des valeurs propres au cas (retrouvées en base), puis
 * « Sauvegarder ».
 *
 * Valeurs acceptées : de vraies raisons sociales, adresses et coordonnées
 * (« Cœur de Lion », « n° », « Cedex », IBAN belge…). Un refus de l'une
 * d'elles est un défaut : une vraie entreprise ne pourrait pas s'enregistrer.
 */
import { test, expect } from "../outils.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_CONFIGURATION } from "../config.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";
import { ouvrirParametres } from "../authentification/outils-auth.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CONFIGURATION) });

const ORG = COMPTES.configuration.organisation._id;
/** SIRET des espaces de test (donnees/base.mjs). */
const SIRET_ESPACE = COMPTES.configuration.organisation.siret;
const slug = (cas) => marque(cas).toLowerCase().replace(/\s+/g, "-");
const egal = (a, b) => String(a ?? "").trim() === String(b ?? "").trim();
const lireOrg = async () => (await base()).collection("organization").findOne({ _id: ORG });

/** 14 chiffres propres au cas (aucun autre espace ne les porte). */
function siretDe(cas) {
  let h = 7;
  for (const c of marque(cas)) h = (h * 131 + c.charCodeAt(0)) % 1e13;
  return `8${String(h).padStart(13, "0")}`;
}

const boutonValider = (zone) => zone.getByRole("button", { name: "Sauvegarder", exact: true });
const valider = (zone) => boutonValider(zone).click();
/**
 * Les onglets ne se ferment pas : après un enregistrement réussi, le formulaire
 * repart de ses nouvelles valeurs et « Sauvegarder » redevient grisé (la
 * notification de succès, brève, peut avoir disparu). Un refus le laisse actif.
 */
const ferme = async (zone, _page, timeout = 15_000) => expect(boutonValider(zone)).toBeDisabled({ timeout });

async function remplir(zone, champs, v) {
  for (const [cle, nom] of Object.entries(champs)) {
    if (v[cle] === undefined) continue;
    const champ = nom.indication ? zone.getByPlaceholder(nom.indication, { exact: true }) : zone.getByRole(nom.role || "textbox", { name: nom.nom || nom, exact: true });
    await champ.fill(v[cle]);
  }
}

// --- Générale -------------------------------------------------------------------

const CHAMPS_GENERALE = {
  nom: "Dénomination sociale *",
  email: "Email professionnel *",
  enseigne: "Nom commercial",
  telephone: "Téléphone",
  site: "Site web",
  rue: "Adresse *",
  ville: "Ville *",
  codePostal: "Code postal *",
};

async function remplirGenerale(zone, v) {
  if (v.pays) {
    await zone.getByRole("combobox").first().click();
    await zone.page().getByRole("option", { name: v.pays, exact: true }).click();
    await expect(zone.page().getByRole("listbox")).toHaveCount(0);
  }
  await remplir(zone, CHAMPS_GENERALE, v);
}

verifierFormulaire({
  nom: "Paramètres > Générale",
  ouvrir: (page) => ouvrirParametres(page, "generale", { pret: (z) => z.getByRole("textbox", { name: "Dénomination sociale *" }) }),
  remplir: remplirGenerale,
  valider,
  boutonValider,
  ferme,
  valeurs: (cas) => ({
    nom: `Configuration ${marque(cas)} SAS`,
    email: `contact.${slug(cas)}@configuration.test`,
    enseigne: `Enseigne ${marque(cas)}`,
    telephone: "01 23 45 67 89",
    site: `https://${slug(cas)}.configuration.test`,
    rue: "12 rue des Tests",
    ville: "Lyon",
    codePostal: "69003",
  }),
  enregistre: async (v) => {
    const org = await lireOrg();
    const memes =
      egal(org.companyName, v.nom) &&
      egal(org.companyEmail, v.email) &&
      egal(org.commercialName, v.enseigne) &&
      egal(org.website, v.site) &&
      egal(org.addressStreet, v.rue) &&
      egal(org.addressCity, v.ville) &&
      egal(org.addressZipCode, v.codePostal);
    return memes ? org : null;
  },
  champs: {
    "Dénomination sociale": {
      cle: "nom",
      obligatoire: true,
      lu: (doc) => doc.companyName,
      refuses: { "d'une seule lettre": "A", "avec un chevron": "Atelier <b> SAS", "de 201 caractères": "A".repeat(201) },
      acceptes: {
        "avec accents et esperluette": "Société Générale & Fils",
        "avec ligature œ (Cœur de Lion SARL)": "Cœur de Lion SARL",
        "avec une apostrophe typographique (L’Atelier du Bois)": "L’Atelier du Bois",
      },
    },
    "Email professionnel": {
      cle: "email",
      obligatoire: true,
      lu: (doc) => doc.companyEmail,
      refuses: { "sans arobase": "contact.configuration.test", "avec une espace": "con tact@configuration.test", "domaine sans extension": "contact@configuration" },
      acceptes: { "avec un plus": "factures+e2e@configuration.test", "sous-domaine": "contact@mail.configuration.test" },
    },
    Téléphone: {
      cle: "telephone",
      lu: (doc) => doc.companyPhone,
      refuses: { "trop court": "01 23 45", "avec des lettres": "01 23 AB CD EF" },
      acceptes: { "au format international": "+33 6 12 34 56 78", "avec des points": "06.12.34.56.78" },
    },
    "Site web": {
      cle: "site",
      lu: (doc) => doc.website,
      refuses: { "sans http": "www.configuration.test" },
      acceptes: { "avec un chemin": "https://configuration.test/contact" },
    },
    Adresse: {
      cle: "rue",
      obligatoire: true,
      lu: (doc) => doc.addressStreet,
      refuses: { "de deux caractères": "ab", "avec un chevron": "1 rue <b>" },
      acceptes: {
        "avec « bis »": "12 bis avenue Jean-Jaurès",
        "avec « n° » et bâtiment": "5 rue de l'Église, Bât. A n°3",
        "avec une barre oblique": "12/14 rue des Tanneurs",
      },
    },
    Ville: {
      cle: "ville",
      obligatoire: true,
      lu: (doc) => doc.addressCity,
      refuses: { "d'une seule lettre": "A" },
      acceptes: { composée: "Saint-Étienne", "avec Cedex": "Paris Cedex 08", "avec une apostrophe typographique (L’Haÿ-les-Roses)": "L’Haÿ-les-Roses" },
    },
    "Code postal": {
      cle: "codePostal",
      obligatoire: true,
      lu: (doc) => doc.addressZipCode,
      refuses: { "de 4 chiffres": "7500", "avec une lettre": "75A01" },
      acceptes: { "de Corse": "20000", "d'outre-mer (La Réunion)": "97400" },
    },
    "Nom commercial": {
      cle: "enseigne",
      lu: (doc) => doc.commercialName,
      acceptes: { "avec accents": "Café de la Gare" },
    },
  },
  combinaisons: {
    // Le pays « Belgique » est proposé : son code postal doit pouvoir être saisi.
    "Entreprise en Belgique, code postal belge (1000 Bruxelles)": { valeurs: { pays: "Belgique", ville: "Bruxelles", codePostal: "1000" }, accepte: true },
  },
});

// --- Coordonnées bancaires --------------------------------------------------------

// Les libellés prennent un « * » dès qu'un champ bancaire est rempli : repérés par leur indication.
const CHAMPS_BANQUE = {
  iban: { indication: "FR76 1234 5678 9012 3456 7890 123" },
  bic: { indication: "BNPAFRPP" },
  banque: { indication: "BNP Paribas" },
};

verifierFormulaire({
  nom: "Paramètres > Coordonnées bancaires",
  ouvrir: (page) => ouvrirParametres(page, "coordonnees-bancaires", { pret: (z) => z.getByPlaceholder("FR76 1234 5678 9012 3456 7890 123") }),
  remplir: (zone, v) => remplir(zone, CHAMPS_BANQUE, v),
  valider,
  boutonValider,
  ferme,
  valeurs: (cas) => ({ iban: "FR76 3000 6000 0112 3456 7890 189", bic: "AGRIFRPP", banque: `Banque ${marque(cas)}` }),
  enregistre: async (v) => {
    const org = await lireOrg();
    const iban = String(v.iban || "").replace(/\s/g, "").toUpperCase();
    const memes = egal(org.bankIban, iban) && egal(org.bankBic, v.bic) && egal(org.bankName, v.banque);
    if (!memes) console.log(`[banque] en base : ${JSON.stringify({ iban: org.bankIban, bic: org.bankBic, nom: org.bankName })} ; saisi : ${JSON.stringify({ iban, bic: v.bic, nom: v.banque })}`);
    return memes ? org : null;
  },
  champs: {
    IBAN: {
      cle: "iban",
      lu: (doc) => doc.bankIban,
      normaliser: (v) => v.replace(/\s/g, "").toUpperCase(),
      refuses: {
        "trop court": "FR76 3000 6000",
        "avec une clé de contrôle fausse": "FR76 3000 6000 0112 3456 7890 188",
        "avec un caractère interdit": "FR76-3000-6000-0112",
      },
      acceptes: {
        "sans espaces": "FR7630006000011234567890189",
        "avec une lettre dans le compte": "FR14 2004 1010 0505 0001 3M02 606",
        "belge": "BE68 5390 0754 7034",
        "allemand": "DE89 3704 0044 0532 0130 00",
      },
    },
    "BIC/SWIFT": {
      cle: "bic",
      lu: (doc) => doc.bankBic,
      refuses: { "de 7 caractères": "AGRIFRP", "avec des minuscules et chiffres mêlés": "agri-fr" },
      acceptes: { "de 11 caractères": "BNPAFRPPXXX" },
    },
    "Nom de la banque": {
      cle: "banque",
      lu: (doc) => doc.bankName,
      refuses: { "d'une seule lettre": "B" },
      acceptes: { "avec accents": "Crédit Agricole Île-de-France", "avec une apostrophe typographique (Caisse d’Épargne)": "Caisse d’Épargne" },
    },
  },
});

// --- Informations légales ---------------------------------------------------------

const CHAMPS_LEGAUX = { siret: "Numéro SIRET*", rcs: "Numéro RCS*", capital: { role: "spinbutton", nom: "Capital social (€)*" } };

verifierFormulaire({
  nom: "Paramètres > Informations légales",
  ouvrir: (page) => ouvrirParametres(page, "informations-legales", { pret: (z) => z.getByRole("textbox", { name: "Numéro SIRET*", exact: true }) }),
  remplir: async (zone, v) => {
    // Catégorie d'activité obligatoire pour une société, vide dans l'espace de test.
    await zone.getByRole("combobox").nth(1).click();
    await zone.page().getByRole("option", { name: "Activité commerciale", exact: true }).click();
    await expect(zone.page().getByRole("listbox")).toHaveCount(0);
    await remplir(zone, CHAMPS_LEGAUX, v);
  },
  valider,
  boutonValider,
  ferme,
  // Le SIRET reste celui de l'espace : un SIRET modifié est vérifié par le serveur du
  // site auprès du vrai registre (joignable depuis la CI), qui ne connaît pas un
  // numéro inventé. Le RCS porte la marque du cas.
  valeurs: (cas) => {
    const n = siretDe(cas);
    return { siret: SIRET_ESPACE, rcs: `Lyon B ${n.slice(1, 4)} ${n.slice(4, 7)} ${n.slice(7, 10)}`, capital: "5000" };
  },
  enregistre: async (v) => {
    const org = await lireOrg();
    return egal(org.siret, String(v.siret).replace(/\s/g, "")) && egal(org.rcs, v.rcs) && egal(org.capitalSocial, v.capital) ? org : null;
  },
  champs: {
    // Le SIRET n'est pas bloquant dans les paramètres (exigé avant le premier document).
    "Numéro SIRET": {
      cle: "siret",
      lu: (doc) => doc.siret,
      normaliser: (v) => v.replace(/\s/g, ""),
      refuses: { "de 13 chiffres": "9876543210001", "avec une lettre": "98765432100A2" },
      // Copié depuis un Kbis ou une facture, le SIRET a souvent ses espaces (même numéro).
      acceptes: { "avec des espaces (comme sur un Kbis)": "987 654 321 00012" },
    },
    "Numéro RCS": {
      cle: "rcs",
      lu: (doc) => doc.rcs,
      refuses: { "sans ville": "123 456 789" },
      acceptes: { "au format R.C.S.": "981 576 549 R.C.S. Paris", "ville composée": "Aix en Provence B 123 456 789" },
    },
    "Capital social": {
      cle: "capital",
      lu: (doc) => doc.capitalSocial,
      refuses: { négatif: "-100" },
      acceptes: { "avec des centimes": "1500.50", "d'un euro": "1" },
    },
  },
});
