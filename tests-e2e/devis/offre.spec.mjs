/**
 * Plafonds des offres pour les devis (src/lib/plan-limits.js côté site,
 * src/services/esignatureQuota.js côté API) : signatures électroniques par
 * mois (offre d'entrée 10, PME 100, Entreprise illimité), signature qualifiée
 * réservée à l'offre Entreprise, 10 modèles de documents sur l'offre
 * d'entrée. L'interface les applique ; l'API doit les appliquer aussi, sinon
 * un appel direct les contourne (signatures payées par Newbi au prestataire,
 * fonctionnalités payantes obtenues sans payer).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { appelApi } from "../securite.mjs";
import { connecte, SESSION_TOKEN_FREELANCE_VENTES, SESSION_TOKEN_LISTE, SESSION_TOKEN_VENTES, SESSION_TOKEN_VOLUME } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { DEVIS_LISTE } from "../donnees/devis-liste.mjs";
import { DEVIS_FREELANCE as F, DEVIS_VENTES as D, DEVIS_VOLUME_SIGNATURE } from "../donnees/lot-devis-bc-bl.mjs";
import { PDF_BASE64 } from "./droits.mjs";
import { actionDeLigne, epingler, idDe } from "./ventes.mjs";

const QUOTA = `query { esignatureQuota { plan unlimited monthlyQuota used remaining } }`;
const SIGNER = `mutation($input: RequestSignatureInput!) { requestDocumentSignature(input: $input) { success message } }`;
const signataire = { name: "Claire", surname: "Signataire", email: "claire.signataire@e2e.test" };
const MESSAGE_QUOTA = /signatures électroniques de ce mois/;

const demandesDe = async (doc) => (await base()).collection("signaturerequests").countDocuments({ documentId: doc._id });
const w = (compte) => COMPTES[compte].organisation._id.toHexString();

async function demander(page, compte, doc, signatureType) {
  return appelApi(
    page,
    SIGNER,
    { input: { documentType: "quote", documentId: idDe(doc), signers: [signataire], documentBase64: PDF_BASE64, ...(signatureType ? { signatureType } : {}) } },
    { organisation: w(compte), delai: 20_000 },
  );
}
const messages = (r) => r.errors.map((e) => e.message).join(" | ");

test.describe("Offre d'entrée : signatures électroniques (10 par mois)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE_VENTES) });

  test("Le quota du mois est annoncé : 10 sur 10 utilisées", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelApi(page, QUOTA, {}, { organisation: w("freelanceVentes") });
    expect(reponse.errors).toEqual([]);
    expect(reponse.data.esignatureQuota, "Les demandes du mois dernier, en erreur et le cachet ne comptent pas").toMatchObject({
      plan: "freelance",
      unlimited: false,
      monthlyQuota: 10,
      used: 10,
      remaining: 0,
    });
  });

  test("La fenêtre « Faire signer » annonce le quota atteint et grise l'envoi", async ({ page }) => {
    await epingler(page, "devis", F.signature);
    await actionDeLigne(page, "devis", F.signature, "Faire signer");
    const fenetre = page.getByRole("dialog").filter({ hasText: "Faire signer" });
    await etape(page, "Quota atteint", async () => {
      await expect(fenetre.getByText(/Vos 10 signatures du mois sont utilisées/)).toBeVisible();
      await expect(fenetre.getByRole("button", { name: /Envoyer pour signature/ })).toBeDisabled();
    }, { capture: "ecran" });
  });

  test("Une 11e demande envoyée par l'API est refusée, rien n'est créé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const avant = await demandesDe(F.signature);
    const reponse = await demander(page, "freelanceVentes", F.signature);
    expect(reponse.sansReponse, "L'API n'a pas répondu").toBe(false);
    expect(reponse.data?.requestDocumentSignature?.success ?? null, "La 11e signature du mois est partie").toBeNull();
    expect(messages(reponse), "Le refus doit expliquer le quota").toMatch(MESSAGE_QUOTA);
    expect(await demandesDe(F.signature), "Une demande de signature a été créée malgré le quota").toBe(avant);
  });

  test("Le cachet de l'entreprise demandé par l'API ne contourne pas le quota des signatures", async ({ page }) => {
    // requestDocumentSignature accepte signatureType « QES_automatic » (cachet qualifié de
    // l'entreprise, facturé par le prestataire) sans contrôle du quota, alors que le site ne
    // le propose jamais : le cachet a sa propre opération (sealQuoteDocument), réservée à un
    // devis déjà signé par le client.
    await ouvrir(page, "/dashboard");
    const avant = await demandesDe(F.cachet);
    const reponse = await demander(page, "freelanceVentes", F.cachet, "QES_automatic");
    expect(reponse.sansReponse, "L'API n'a pas répondu").toBe(false);
    const creees = (await demandesDe(F.cachet)) - avant;
    expect(
      creees,
      // L'API ne contrôle ni le quota ni la signature préalable du client : elle enregistre la demande, puis
      // ne s'arrête que faute de certificat de l'entreprise (une entreprise qui en a un passerait).
      `Demande de cachet enregistrée au-delà du quota, pour un devis que le client n'a pas signé (réponse : ${messages(reponse) || JSON.stringify(reponse.data)})`,
    ).toBe(0);
    expect(messages(reponse), "Le refus doit être expliqué").toMatch(/\S/);
  });
});

test.describe("Offre PME : signatures électroniques (100 par mois)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VOLUME) });

  test("100 demandes ce mois-ci : le quota est atteint et l'API refuse la suivante", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const quota = await appelApi(page, QUOTA, {}, { organisation: w("volume") });
    expect(quota.data?.esignatureQuota).toMatchObject({ plan: "pme", unlimited: false, monthlyQuota: 100, used: 100, remaining: 0 });
    const avant = await demandesDe(DEVIS_VOLUME_SIGNATURE);
    const reponse = await demander(page, "volume", DEVIS_VOLUME_SIGNATURE);
    expect(reponse.data?.requestDocumentSignature?.success ?? null, "La 101e signature du mois est partie").toBeNull();
    expect(messages(reponse)).toMatch(/Vous avez utilisé vos 100 signatures électroniques de ce mois/);
    expect(await demandesDe(DEVIS_VOLUME_SIGNATURE)).toBe(avant);
  });
});

test.describe("Offre Entreprise : signatures illimitées", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

  test("150 demandes ce mois-ci : aucun plafond, la demande suivante n'est pas refusée pour le quota", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const quota = await appelApi(page, QUOTA, {}, { organisation: w("ventes") });
    expect(quota.data?.esignatureQuota).toMatchObject({ plan: "entreprise", unlimited: true, monthlyQuota: null, remaining: null });
    expect(quota.data.esignatureQuota.used).toBeGreaterThanOrEqual(150);
    const reponse = await demander(page, "ventes", D.aSigner);
    // Le prestataire de signature est injoignable en test : seule l'absence de refus pour le quota compte.
    expect(messages(reponse), "Refus pour le quota sur l'offre illimitée").not.toMatch(MESSAGE_QUOTA);
  });
});

test.describe("Signature qualifiée (QES) : réservée à l'offre Entreprise", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_LISTE) });

  test("Offre PME : une signature qualifiée demandée par l'API est refusée", async ({ page }) => {
    // plan-limits.js : esignature « ses » (signature simple) sur les offres d'entrée et PME,
    // « qes » sur l'offre Entreprise. Le site ne propose que la signature simple ; l'API
    // accepte pourtant « QES_otp » de n'importe quelle offre.
    const doc = DEVIS_LISTE.qualifiee;
    await ouvrir(page, "/dashboard");
    const avant = await demandesDe(doc);
    const reponse = await demander(page, "liste", doc, "QES_otp");
    expect(reponse.sansReponse, "L'API n'a pas répondu").toBe(false);
    expect(
      (await demandesDe(doc)) - avant,
      // Aucun contrôle de l'offre : la demande est enregistrée, l'envoi ne s'arrête que faute de certificat.
      `Demande de signature qualifiée enregistrée sur l'offre PME, sans contrôle de l'offre (réponse : ${messages(reponse)})`,
    ).toBe(0);
  });
});

test.describe("Offre d'entrée : modèles de documents (10)", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE_VENTES) });
  const modeles = async () => (await base()).collection("quotetemplates").countDocuments({ workspaceId: COMPTES.freelanceVentes.organisation._id });

  test("La fenêtre « Sauvegarder comme modèle » annonce la limite et grise l'enregistrement", async ({ page }) => {
    await epingler(page, "devis", F.modele);
    await actionDeLigne(page, "devis", F.modele, "Sauv. modèle");
    const fenetre = page.getByRole("dialog", { name: "Sauvegarder comme modèle" });
    await etape(page, "Limite affichée", async () => {
      await expect(fenetre.getByText(/Limite atteinte \(10\/10 modèles\)/)).toBeVisible();
      await expect(fenetre.getByRole("button", { name: "Sauvegarder" })).toBeDisabled();
    }, { capture: "ecran" });
  });

  test("Un 11e modèle enregistré par l'API est refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const avant = await modeles();
    const reponse = await appelApi(
      page,
      `mutation($w: ID, $input: SaveQuoteAsTemplateInput!) { saveQuoteAsTemplate(workspaceId: $w, input: $input) { id } }`,
      { w: w("freelanceVentes"), input: { quoteId: idDe(F.modele), name: "Onzième modèle hors offre" } },
      { organisation: w("freelanceVentes") },
    );
    expect(reponse.data?.saveQuoteAsTemplate ?? null, "Un 11e modèle a été créé sur l'offre d'entrée").toBeNull();
    expect(await modeles(), "Le nombre de modèles a dépassé la limite de l'offre").toBe(avant);
  });
});

test.describe("Offre d'entrée : exports comptables", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FREELANCE_VENTES) });

  test("Exporter : CSV et Excel proposés, FEC, Sage et Cegid réservés aux offres supérieures", async ({ page }) => {
    await ouvrir(page, "/dashboard/outils/devis", { pret: page.getByRole("heading", { name: "Devis clients", exact: true }) });
    await page.getByRole("button", { name: "Exporter" }).click();
    const menu = page.getByRole("menu");
    await etape(page, "Menu d'export", async () => {
      for (const format of ["CSV", "Excel"]) await expect(menu.getByRole("menuitem", { name: format, exact: true })).toBeEnabled();
      for (const format of ["FEC (Format légal)", "Sage Compta", "Cegid Expert"]) {
        await expect(menu.getByRole("menuitem", { name: format, exact: true }), `${format} doit être indisponible`).toHaveAttribute("aria-disabled", "true");
      }
    }, { capture: "ecran" });
  });
});
