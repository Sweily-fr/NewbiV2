/**
 * Saisie manuelle d'une facture d'achat : tous les champs (fournisseur,
 * numéro, montants et TVA, catégorie du référentiel, statut, moyen de
 * paiement, référence, notes), avec le compte « Saisie Achats ». Chaque cas
 * est une facture distincte, retrouvée en base par son numéro ou sa
 * référence interne, propres au cas. Plus : plusieurs taux de TVA, doublon
 * signalé avant la création, « Créer quand même » et « Utiliser cette facture ».
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { FACTURES_ACHAT_SAISIE } from "../donnees/lot-achats-banque.mjs";
import { SESSION_TOKEN_SAISIE_ACHATS } from "../config.mjs";
import { connecteAchats } from "../achats-banque.mjs";
import { verifierFormulaire, marque } from "../champs.mjs";

test.use({ storageState: connecteAchats(SESSION_TOKEN_SAISIE_ACHATS) });

const ORG = COMPTES.saisieAchats.organisation._id;
const slug = (cas) => marque(cas).toUpperCase().replace(/\s+/g, "-");
function lettres(cas) {
  let h = 7;
  for (const c of marque(cas)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let s = "";
  for (let i = 0; i < 7; i++, h = Math.floor(h / 26)) s += String.fromCharCode(97 + (h % 26));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
/** Montant propre au cas (deux cas n'ont jamais le même : pas de doublon « même fournisseur, même montant »). */
function montant(cas) {
  let h = 3;
  for (const c of marque(cas)) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  return `${100 + (h % 800)}.${String(h % 100).padStart(2, "0")}`;
}

async function ouvrirFacturesAchat(page) {
  await ouvrir(page, "/dashboard/outils/factures-achat", { pret: page.getByRole("button", { name: "Nouvelle facture" }) });
}

async function ouvrirSaisie(page) {
  await ouvrirFacturesAchat(page);
  await page.getByRole("button", { name: "Nouvelle facture" }).click();
  await page.getByRole("menuitem", { name: "Saisie manuelle" }).click();
  const tiroir = page.getByRole("dialog").filter({ has: page.getByPlaceholder("Nom du fournisseur") });
  await expect(tiroir).toBeVisible();
  await attendreCalme(page);
  return tiroir;
}

/** Liste de choix Radix du formulaire (0 : taux de TVA, 1 : catégorie, 2 : statut, 3 : moyen de paiement). */
async function choisir(tiroir, rang, option) {
  const page = tiroir.page();
  await tiroir.getByRole("combobox").nth(rang).click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
}

async function choisirCategorie(tiroir, recherche, libelle) {
  const page = tiroir.page();
  await tiroir.getByRole("combobox").nth(1).click();
  await page.getByPlaceholder("Rechercher une catégorie...").fill(recherche);
  await page.getByRole("option", { name: libelle, exact: true }).click();
}

/** Montant au clavier, comme une personne. */
async function saisirMontant(champ, valeur) {
  await champ.fill("");
  if (valeur) await champ.pressSequentially(valeur);
}

async function remplir(tiroir, v) {
  const texte = { fournisseur: "Nom du fournisseur", numero: "F-20260001", reference: "Optionnel", notes: "Commentaires internes..." };
  for (const [cle, indication] of Object.entries(texte)) {
    if (v[cle] !== undefined) await tiroir.getByPlaceholder(indication, { exact: true }).fill(v[cle]);
  }
  if (v.tva) await choisir(tiroir, 0, v.tva);
  if (v.ht !== undefined) await saisirMontant(tiroir.getByPlaceholder("0.00", { exact: true }).nth(1), v.ht);
  if (v.ttc !== undefined) await saisirMontant(tiroir.getByPlaceholder("0.00", { exact: true }).first(), v.ttc);
  if (v.categorie) await choisirCategorie(tiroir, v.categorie[0], v.categorie[1]);
  if (v.statut) await choisir(tiroir, 2, v.statut);
  if (v.moyen) await choisir(tiroir, 3, v.moyen);
}

const boutonValider = (tiroir) => tiroir.getByRole("button", { name: "Nouvelle facture d'achat" });

async function factureEnregistree(v) {
  const ou = [];
  if (v.numero) ou.push({ invoiceNumber: v.numero.trim() });
  if (v.reference) ou.push({ internalReference: v.reference.trim() });
  if (!ou.length) return null;
  return (await base()).collection("purchaseinvoices").findOne({ workspaceId: ORG, $or: ou });
}

verifierFormulaire({
  nom: "Nouvelle facture d'achat (saisie manuelle)",
  ouvrir: ouvrirSaisie,
  remplir,
  valider: (tiroir) => boutonValider(tiroir).click(),
  boutonValider,
  valeurs: (cas) => ({
    fournisseur: `Fournisseur ${lettres(cas)}`,
    numero: `FA-${slug(cas)}`.slice(0, 40),
    reference: `REF-${slug(cas)}`.slice(0, 40),
    ttc: montant(cas),
  }),
  enregistre: factureEnregistree,
  champs: {
    Fournisseur: {
      cle: "fournisseur",
      obligatoire: true,
      lu: (doc) => doc.supplierName,
      acceptes: {
        "avec ligature œ (Œnologie Martin & Fils)": "Œnologie Martin & Fils",
        "avec apostrophe typographique (L’Atelier du Bois)": "L’Atelier du Bois Massif",
        "avec accents (Électricité Générale du Sud)": "Électricité Générale du Sud",
        "raison sociale complète de 120 caractères": "Société Nationale de Distribution et de Maintenance des Équipements Électriques et Climatiques du Grand Sud-Ouest SAS",
        "texte piégé (balise image)": "<img src=x onerror=alert(1)> Fournisseur",
      },
    },
    "N° de facture": {
      cle: "numero",
      lu: (doc) => doc.invoiceNumber,
      acceptes: { "avec barres obliques (2026/10/001)": "2026/10/001-FA", "avec « N° »": "N° 4512-FA" },
    },
    "Montant TTC": {
      cle: "ttc",
      obligatoire: true,
      sansEspaces: true,
      lu: (doc) => doc.amountTTC,
      normaliser: (v) => Number(v.replace(",", ".")),
      refuses: { négatif: "-50" },
      // Saisie au point décimal : le navigateur des tests (format anglais) ignore la virgule dans un champ numérique.
      acceptes: { "avec centimes (1234.56)": "1234.56", "de 98 765,43 €": "98765.43" },
    },
    "Référence interne": {
      cle: "reference",
      lu: (doc) => doc.internalReference,
      acceptes: { "avec tirets et chiffres": "REF-INT-2026-10" },
    },
    Notes: {
      cle: "notes",
      lu: (doc) => doc.notes,
      acceptes: { "sur deux lignes": "Première ligne\nSeconde ligne", "texte piégé (balise image)": "<img src=x onerror=alert(1)> note" },
    },
  },
  combinaisons: {
    "HT 100 € à 20 % (TTC calculé 120 €)": { valeurs: { ttc: undefined, ht: "100", numero: "FA-COMBI-HT-100", reference: "REF-COMBI-HT-100" }, accepte: true },
  },
});

// --- Montants, catégorie, statut : ce qui est enregistré ------------------------------

test.describe("Saisie manuelle : ce qui est enregistré", () => {
  async function creer(page, v) {
    const tiroir = await ouvrirSaisie(page);
    await remplir(tiroir, v);
    await boutonValider(tiroir).click();
    await expect(tiroir, "Le tiroir de saisie ne se ferme pas après l'enregistrement").toBeHidden({ timeout: 15_000 });
    return factureEnregistree(v);
  }

  test("HT 100 € à 20 % : TVA 20 € et TTC 120 € enregistrés", async ({ page }) => {
    const doc = await creer(page, { fournisseur: "Fournisseur Calcul Vingt", numero: "CALC-20", ht: "100" });
    expect({ ht: doc.amountHT, tva: doc.amountTVA, taux: doc.vatRate, ttc: doc.amountTTC }).toEqual({ ht: 100, tva: 20, taux: 20, ttc: 120 });
  });

  test("TTC 105,50 € à 5,5 % : HT 100 € et TVA 5,50 € enregistrés", async ({ page }) => {
    const doc = await creer(page, { fournisseur: "Fournisseur Taux Réduit", numero: "CALC-55", tva: "5,5% - Taux réduit", ttc: "105.50" });
    expect({ ht: doc.amountHT, tva: doc.amountTVA, taux: doc.vatRate, ttc: doc.amountTTC }).toEqual({ ht: 100, tva: 5.5, taux: 5.5, ttc: 105.5 });
  });

  test("TVA à 0 % (exonération) : taux 0 et TVA 0 enregistrés", async ({ page }) => {
    const doc = await creer(page, { fournisseur: "Organisme Formation Exonéré", numero: "CALC-0", tva: "0% - Exonéré", ttc: "350" });
    expect({ ht: doc.amountHT, tva: doc.amountTVA, taux: doc.vatRate, ttc: doc.amountTTC }).toEqual({ ht: 350, tva: 0, taux: 0, ttc: 350 });
  });

  test("Catégorie trouvée sans accent (« electricite ») : sous-catégorie et catégorie large enregistrées", async ({ page }) => {
    const doc = await creer(page, { fournisseur: "Fournisseur Énergie Pro", numero: "CAT-ELEC", ttc: "78.40", categorie: ["electricite", "Électricité"] });
    expect({ sous: doc.subcategory, large: doc.category }).toEqual({ sous: "electricite", large: "UTILITIES" });
  });

  test("Statut « Payée » et carte bancaire : date de paiement posée", async ({ page }) => {
    const doc = await creer(page, { fournisseur: "Fournisseur Payé Comptant", numero: "PAYE-CB", ttc: "45", statut: "Payée", moyen: "Carte bancaire" });
    expect(doc.status).toBe("PAID");
    expect(doc.paymentMethod).toBe("CREDIT_CARD");
    expect(doc.paymentDate, "Facture payée sans date de paiement").toBeTruthy();
  });

  test("Deux taux de TVA (300 € à 20 % et 100 € à 5,5 %) : détail par taux et totaux enregistrés", async ({ page }) => {
    const tiroir = await ouvrirSaisie(page);
    await remplir(tiroir, { fournisseur: "Imprimerie Deux Taux", numero: "MULTI-TAUX" });
    await saisirMontant(tiroir.getByPlaceholder("0.00", { exact: true }).nth(1), "300");
    await tiroir.getByRole("button", { name: "Ajouter un taux de TVA" }).click();
    await tiroir.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: "5,5% - Taux réduit", exact: true }).click();
    await saisirMontant(tiroir.getByRole("spinbutton", { name: "Base HT à 5,5 %" }), "100");
    await saisirMontant(tiroir.getByRole("spinbutton", { name: "TVA à 5,5 %" }), "5.50");
    await boutonValider(tiroir).click();
    await expect(tiroir).toBeHidden({ timeout: 15_000 });
    const doc = await factureEnregistree({ numero: "MULTI-TAUX" });
    expect(doc.vatBreakdown.map((l) => [l.rate, l.baseHT, l.amountTVA])).toEqual([
      [20, 300, 60],
      [5.5, 100, 5.5],
    ]);
    expect({ ht: doc.amountHT, tva: doc.amountTVA, ttc: doc.amountTTC }).toEqual({ ht: 400, tva: 65.5, ttc: 465.5 });
  });
});

// --- Doublons ---------------------------------------------------------------------------

test.describe("Saisie manuelle : doublon signalé avant la création", () => {
  const source = FACTURES_ACHAT_SAISIE.doublonSource;
  const compter = async () => (await base()).collection("purchaseinvoices").countDocuments({ workspaceId: ORG, invoiceNumber: source.invoiceNumber });

  async function saisirDoublon(page) {
    const tiroir = await ouvrirSaisie(page);
    await remplir(tiroir, { fournisseur: source.supplierName, numero: source.invoiceNumber, ttc: String(source.amountTTC) });
    await boutonValider(tiroir).click();
    return tiroir;
  }

  test("Même numéro et même fournisseur : avertissement, rien de créé tant qu'on ne confirme pas", async ({ page }) => {
    await saisirDoublon(page);
    const avertissement = page.getByRole("alertdialog", { name: "Une facture similaire existe déjà" });
    await etape(page, "Avertissement affiché", async () => {
      await expect(avertissement).toBeVisible();
      await expect(avertissement).toContainText(source.invoiceNumber);
    }, { capture: "ecran" });
    expect(await compter()).toBe(1);
  });

  test("« Créer quand même » : la seconde facture est créée", async ({ page }) => {
    await saisirDoublon(page);
    await page.getByRole("button", { name: /Créer quand même/ }).click();
    await expect.poll(compter, { message: "La facture confirmée malgré l'avertissement n'est pas créée" }).toBe(2);
  });

  test("« Utiliser cette facture » : la facture existante s'ouvre, rien de créé", async ({ page }) => {
    await saisirDoublon(page);
    await page.getByRole("button", { name: /Utiliser cette facture/ }).first().click();
    await expect(page.getByRole("dialog").filter({ hasText: source.supplierName }).filter({ hasText: /Modifier|Payée/ }).first()).toBeVisible();
    expect(await compter()).toBeLessThanOrEqual(2);
  });

  test("Doublon envoyé directement à l'API (sans l'avertissement) : refusé", async ({ page }) => {
    await ouvrirFacturesAchat(page);
    const { appelApi } = await import("../securite.mjs");
    const avant = await compter();
    const reponse = await appelApi(
      page,
      `mutation($input: CreatePurchaseInvoiceInput!) { createPurchaseInvoice(input: $input) { id } }`,
      { input: { workspaceId: ORG.toHexString(), supplierName: source.supplierName, invoiceNumber: source.invoiceNumber, issueDate: new Date().toISOString().slice(0, 10), amountTTC: source.amountTTC } },
      { organisation: ORG.toHexString() },
    );
    expect(reponse.data?.createPurchaseInvoice ?? null).toBeNull();
    expect(reponse.errors.map((e) => e.message).join(" | ")).toMatch(/similaire existe déjà/);
    expect(await compter()).toBe(avant);
  });
});

test.describe("Saisie manuelle : montants nuls", () => {
  test("HT et TVA vides envoyés à l'API (null) : enregistrés à 0, la liste reste lisible", async ({ page }) => {
    await ouvrirFacturesAchat(page);
    const { appelApi } = await import("../securite.mjs");
    const reponse = await appelApi(
      page,
      `mutation($input: CreatePurchaseInvoiceInput!) { createPurchaseInvoice(input: $input) { id amountHT amountTVA vatRate amountTTC } }`,
      { input: { workspaceId: ORG.toHexString(), supplierName: "Fournisseur Montants Nuls", invoiceNumber: "NUL-001", issueDate: new Date().toISOString().slice(0, 10), amountTTC: 33, amountHT: null, amountTVA: null, vatRate: null, forceCreate: true } },
      { organisation: ORG.toHexString() },
    );
    expect(reponse.errors).toEqual([]);
    const doc = await factureEnregistree({ numero: "NUL-001" });
    expect({ ht: doc.amountHT, tva: doc.amountTVA }).toEqual({ ht: 0, tva: 0 });
    await ouvrirFacturesAchat(page);
    await expect(page.getByText("Fournisseur Montants Nuls").first(), "La liste ne s'affiche plus après une facture aux montants nuls").toBeVisible();
  });
});

