/**
 * Page publique Contact (visiteur sans session) : chaque champ du formulaire
 * (vide, espaces, format faux, longueur, texte piégé, valeurs réelles), le
 * piège à robots et la limite d'envois, vérifiés à l'écran et à la route
 * /api/contact. Les e-mails sont coupés en CI : quand le serveur a accepté la
 * saisie, seul l'envoi échoue (502) ; la réponse est alors rendue au
 * navigateur comme un envoi réussi, pour vérifier la suite du parcours.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, cliquer } from "../navigation.mjs";
import { visiteur } from "./consentement.mjs";

test.use({ storageState: visiteur() });

const JUSTE = { nom: "Zoë L’Hôte-Cœur", email: "zoe.lhote@exemple.fr", sujet: "Question sur la facture n° 12", message: "Bonjour,\nj’ai une question à propos de l’export (montant : 1 234,56 €)." };
let compteurIp = 0;

/**
 * Ouvre la page et branche la route d'envoi. Chaque test a sa propre adresse
 * (en-tête x-forwarded-for) : la limite de 5 messages par adresse et par
 * 10 minutes ne doit pas mêler les tests. Renvoie la liste des réponses du serveur.
 */
async function ouvrirContact(page) {
  const ip = `198.51.100.${(compteurIp++ % 200) + 1}-${test.info().testId}`;
  const reponses = [];
  await page.route("**/api/contact", async (route) => {
    const reelle = await route.fetch({ headers: { ...route.request().headers(), "x-forwarded-for": ip } });
    const corps = await reelle.json().catch(() => ({}));
    reponses.push({ statut: reelle.status(), corps, envoye: route.request().postDataJSON() });
    // Saisie acceptée, envoi d'e-mail impossible en CI : rendu comme un envoi réussi
    if (reelle.status() === 502) return route.fulfill({ status: 200, json: { success: true } });
    return route.fulfill({ response: reelle, json: corps });
  });
  await ouvrir(page, "/contact", { pret: page.getByRole("button", { name: "Envoyer le message" }) });
  return reponses;
}

async function remplir(page, valeurs) {
  const v = { ...JUSTE };
  for (const [cle, valeur] of Object.entries(valeurs)) if (valeur !== undefined) v[cle] = valeur;
  await page.getByLabel("Nom", { exact: true }).fill(v.nom);
  await page.getByLabel("Email", { exact: true }).fill(v.email);
  await page.getByLabel("Sujet", { exact: true }).fill(v.sujet);
  await page.getByLabel("Message", { exact: true }).fill(v.message);
  return v;
}

const envoyer = (page) => cliquer(page, page.getByRole("button", { name: "Envoyer le message" }));
const confirmation = (page) => page.getByText("Message envoyé", { exact: true });
const erreur = (page, texte) => page.locator("[data-sonner-toast]").filter({ hasText: texte });

test.describe("Contact : saisie juste", () => {
  test("Message complet : accepté par le serveur, confirmation affichée", async ({ page }) => {
    const reponses = await ouvrirContact(page);
    const v = await remplir(page, {});
    await envoyer(page);
    await etape(page, "Confirmation", () => expect(confirmation(page)).toBeVisible(), { capture: "ecran" });
    expect(reponses.at(-1).statut, "La saisie juste n'a pas passé les contrôles du serveur").toBe(502);
    expect(reponses.at(-1).envoye.message).toBe(v.message);
  });

  test("« Envoyer un autre message » rouvre un formulaire vide", async ({ page }) => {
    await ouvrirContact(page);
    await remplir(page, {});
    await envoyer(page);
    await expect(confirmation(page)).toBeVisible();
    await page.getByRole("button", { name: "Envoyer un autre message" }).click();
    for (const champ of ["Nom", "Email", "Sujet", "Message"]) await expect(page.getByLabel(champ, { exact: true })).toHaveValue("");
  });

  test("Texte piégé dans le nom et le message : envoyé comme du texte, rien ne s'exécute", async ({ page }) => {
    const reponses = await ouvrirContact(page);
    const piege = `<img src="x-piege" onerror="window.__piege='execute';alert('code exécuté')">`;
    await remplir(page, { nom: `Robert ${piege}`, message: `Bonjour ${piege}` });
    await envoyer(page);
    await expect(confirmation(page)).toBeVisible();
    expect(await page.evaluate(() => window.__piege ?? null)).toBeNull();
    expect(reponses.at(-1).envoye.nom ?? reponses.at(-1).envoye.name).toContain("<img");
  });
});

test.describe("Contact : champs refusés", () => {
  for (const champ of ["Nom", "Email", "Sujet", "Message"]) {
    test(`« ${champ} » vide : le navigateur l'empêche avec un message, rien n'est envoyé`, async ({ page }) => {
      const reponses = await ouvrirContact(page);
      await remplir(page, { nom: champ === "Nom" ? "" : undefined, email: champ === "Email" ? "" : undefined, sujet: champ === "Sujet" ? "" : undefined, message: champ === "Message" ? "" : undefined });
      await page.getByRole("button", { name: "Envoyer le message" }).click();
      await page.waitForTimeout(500);
      expect(await page.getByLabel(champ, { exact: true }).evaluate((e) => e.validationMessage), "Aucun message").not.toBe("");
      expect(reponses, "Un message vide a été envoyé au serveur").toEqual([]);
    });
  }

  for (const champ of ["Nom", "Sujet", "Message"]) {
    test(`« ${champ} » rempli d'espaces : refusé avec un message`, async ({ page }) => {
      const reponses = await ouvrirContact(page);
      await remplir(page, { nom: champ === "Nom" ? "   " : undefined, sujet: champ === "Sujet" ? "   " : undefined, message: champ === "Message" ? "   " : undefined });
      await envoyer(page);
      await etape(page, "Message d'erreur", () => expect(erreur(page, "Tous les champs sont requis")).toBeVisible(), { capture: "ecran" });
      await expect(confirmation(page)).toHaveCount(0);
      expect(reponses.at(-1).statut).toBe(400);
    });
  }

  test("« Email » sans arobase : le navigateur l'empêche avec un message", async ({ page }) => {
    const reponses = await ouvrirContact(page);
    await remplir(page, { email: "zoe.exemple.fr" });
    await page.getByRole("button", { name: "Envoyer le message" }).click();
    expect(await page.getByLabel("Email", { exact: true }).evaluate((e) => e.validationMessage)).not.toBe("");
    expect(reponses).toEqual([]);
  });

  test("« Email » sans extension (zoe@exemple) : refusé avec un message", async ({ page }) => {
    const reponses = await ouvrirContact(page);
    await remplir(page, { email: "zoe@exemple" });
    await envoyer(page);
    await expect(erreur(page, "Email invalide")).toBeVisible();
    expect(reponses.at(-1).statut).toBe(400);
  });
});

test.describe("Contact : route d'envoi appelée directement", () => {
  const poster = (page, corps, ip) =>
    page.request.post("/api/contact", { data: corps, headers: { "x-forwarded-for": ip } }).then(async (r) => ({ statut: r.status(), corps: await r.json().catch(() => ({})) }));
  const message = { name: "Zoë", email: "zoe@exemple.fr", subject: "Bonjour", message: "Message de test" };

  test("Message trop long (5 001 caractères) : refusé", async ({ page }) => {
    const r = await poster(page, { ...message, message: "a".repeat(5001) }, "192.0.2.10");
    expect(r.statut).toBe(400);
    expect(r.corps.error).toMatch(/trop long/);
  });

  test("Nom de 201 caractères : refusé", async ({ page }) => {
    const r = await poster(page, { ...message, name: "N".repeat(201) }, "192.0.2.11");
    expect(r.statut).toBe(400);
  });

  test("Piège à robots rempli : réponse « envoyé » sans rien envoyer", async ({ page }) => {
    const r = await poster(page, { ...message, website: "http://spam.example" }, "192.0.2.12");
    // 200 directement : l'envoi d'e-mail n'est même pas tenté (sinon 502 en CI)
    expect(r.statut).toBe(200);
    expect(r.corps.success).toBe(true);
  });

  test("Plus de 5 messages en 10 minutes depuis la même adresse : refusés", async ({ page }) => {
    const ip = "192.0.2.13";
    const statuts = [];
    for (let i = 0; i < 6; i++) statuts.push((await poster(page, message, ip)).statut);
    expect(statuts.slice(0, 5), "Les 5 premiers messages passent les contrôles").not.toContain(429);
    expect(statuts[5], "Le 6e message doit être refusé").toBe(429);
  });
});
