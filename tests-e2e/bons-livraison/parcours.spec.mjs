/**
 * Bons de livraison : chaque parcours vérifié en base, organisation
 * « Ventes » (propriétaire). Expédier depuis le panneau, réception signée,
 * repasser en brouillon, annuler un bon expédié, facturer (quantités et prix
 * cachés repris), page d'un bon, PDF sans prix, suppression groupée, envoi
 * par e-mail. Chaque parcours a son bon (donnees/lot-devis-bc-bl.mjs).
 */
import { test, expect, etape, fenetre, SELECTEUR_NOTIFICATION_ERREUR, SELECTEUR_NOTIFICATION_SUCCES } from "../outils.mjs";
import { attendreCalme, cliquer, ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { BL_VENTES as B } from "../donnees/lot-devis-bc-bl.mjs";
import { actionDeLigne, chercherEnBase, enBase, epingler, idDe, ligneDe, notification, ouvrirListe, ouvrirPanneau, panneau, reference, relu, rechercher, telecharger, textePdf } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

const idsDe = (liste) => (liste || []).map((x) => (typeof x?.toHexString === "function" ? x.toHexString() : String(x?._id ?? x)));

test.describe("Bons de livraison : statuts", () => {
  test("Marquer expédié depuis le panneau : « Expédié » en base", async ({ page }) => {
    const p = await ouvrirPanneau(page, "bl", B.aExpedierPanneau);
    await etape(page, "Marquer expédié", async () => {
      await cliquer(page, p.getByRole("button", { name: "Marquer expédié" }));
      await expect(notification(page, /expédié/)).toBeVisible();
    }, { capture: "ecran" });
    await relu("bl", B.aExpedierPanneau, (b) => b?.status, "Statut en base").toBe("SHIPPED");
  });

  test("Réception avec signature : livré, réceptionnaire et signature enregistrés", async ({ page }) => {
    const b = B.aReceptionner;
    await epingler(page, "bl", b);
    await actionDeLigne(page, "bl", b, "Marquer comme livré");
    const f = page.getByRole("dialog").filter({ hasText: "Confirmer la livraison" });
    await expect(f).toBeVisible();
    await f.locator("#reception-received-by").fill("Jeanne Réception");
    await etape(page, "Signer et confirmer", async () => {
      const toile = f.locator("canvas").first();
      await expect(toile, "Zone de signature").toBeVisible();
      const cadre = await toile.boundingBox();
      await page.mouse.move(cadre.x + 20, cadre.y + 20);
      await page.mouse.down();
      for (let i = 1; i <= 10; i++) await page.mouse.move(cadre.x + 20 + i * 15, cadre.y + 20 + (i % 2) * 25, { steps: 3 });
      await page.mouse.up();
      await f.getByRole("button", { name: "Marquer comme livré" }).click();
      await expect(notification(page, "Bon de livraison marqué comme livré")).toBeVisible();
    }, { capture: "ecran" });
    await relu("bl", b, (x) => x?.status, "Statut en base").toBe("DELIVERED");
    const apres = await enBase("bl", b);
    expect.soft(apres.receivedBy, "Réceptionnaire").toBe("Jeanne Réception");
    expect.soft(apres.signatureDataUrl ?? "", "Signature manuscrite enregistrée").toMatch(/^data:image\/png;base64,/);
  });

  test("Repasser en brouillon un bon à expédier : « Brouillon » en base", async ({ page }) => {
    const b = B.aRepasserBrouillon;
    await epingler(page, "bl", b);
    await actionDeLigne(page, "bl", b, "Repasser en brouillon");
    await expect(notification(page, /brouillon/i)).toBeVisible();
    await relu("bl", b, (x) => x?.status, "Statut en base").toBe("DRAFT");
  });

  test("Annuler un bon expédié : « Annulé » en base", async ({ page }) => {
    const b = B.aAnnulerExpedie;
    await epingler(page, "bl", b);
    await actionDeLigne(page, "bl", b, "Annuler");
    await expect(notification(page, "Bon de livraison annulé")).toBeVisible();
    await relu("bl", b, (x) => x?.status, "Statut en base").toBe("CANCELED");
  });
});

test.describe("Bons de livraison : facturer", () => {
  test("Facturer un bon livré : facture brouillon avec les quantités et les prix gardés du bon, liée au bon", async ({ page }) => {
    const b = B.aFacturer;
    await epingler(page, "bl", b);
    await etape(page, "Facturer", async () => {
      await actionDeLigne(page, "bl", b, "Facturer");
      await expect(notification(page, "Facture brouillon créée à partir du bon de livraison")).toBeVisible();
      await expect(page).toHaveURL(/\/dashboard\/outils\/factures\/[0-9a-f]{24}\/editer/);
    }, { capture: "ecran" });
    const id = page.url().match(/factures\/([0-9a-f]{24})\//)[1];
    const [facture] = await chercherEnBase("invoices", { _id: new (await import("mongodb")).ObjectId(id) });
    expect.soft(facture.status, "Facture en brouillon").toBe("DRAFT");
    expect.soft(facture.items.map((a) => [a.description, a.quantity, a.unitPrice]), "Lignes de la facture").toEqual(b.items.map((a) => [a.description, a.quantity, a.unitPrice]));
    await relu("bl", b, (x) => idsDe(x?.linkedInvoices), "Le bon liste sa facture").toContain(id);
  });
});

test.describe("Bons de livraison : page d'un bon et PDF", () => {
  test("Adresse d'un bon (/bons-de-livraison/<id>) : la liste s'ouvre sur son panneau", async ({ page }) => {
    const b = B.consultation;
    await ouvrir(page, `/dashboard/outils/bons-de-livraison/${idDe(b)}`);
    await expect(panneau(page).getByRole("heading", { name: `Bon de livraison ${reference(b)}` })).toBeVisible({ timeout: 20_000 });
    for (const texte of [b.client.name, b.carrier, b.items[0].description]) await expect.soft(panneau(page).getByText(texte).first(), texte).toBeVisible();
  });

  test("Télécharger le PDF : un vrai PDF au numéro du bon, avec articles et quantités, sans aucun prix", async ({ page }) => {
    test.setTimeout(150_000);
    const b = B.pdf;
    const p = await ouvrirPanneau(page, "bl", b);
    const { nom, chemin } = await telecharger(page, () => cliquer(page, p.getByRole("button", { name: "PDF", exact: true })), { timeout: 90_000 });
    expect(nom, "Nom du fichier").toMatch(/\.pdf$/i);
    const pdf = await textePdf(chemin);
    expect(pdf.entete, "Le fichier est un PDF").toBe("%PDF-");
    expect.soft(pdf.texte, "Numéro du bon").toContain(b.number);
    expect.soft(pdf.texte, "Article").toContain(b.items[0].description);
    // Prix caché du bon (12 € l'unité, 84 € pour 7) : jamais imprimé.
    expect.soft(pdf.texte, "Un prix apparaît sur le bon de livraison").not.toMatch(/12,00|84,00/);
  });
});

test.describe("Bons de livraison : actions groupées et envoi", () => {
  test("Supprimer deux brouillons sélectionnés : tous deux supprimés", async ({ page }) => {
    await ouvrirListe(page, "bl");
    await rechercher(page, "bl", "Lot à supprimer");
    for (const b of [B.aSupprimerGroupe1, B.aSupprimerGroupe2]) await ligneDe(page, "bl", b).getByRole("checkbox").check();
    await etape(page, "Supprimer la sélection", async () => {
      await page.getByRole("button", { name: "Supprimer (2)" }).click();
      const confirmation = fenetre(page, "Confirmer la suppression");
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole("button", { name: /Supprimer/ }).last().click();
      await attendreCalme(page);
    }, { capture: "ecran" });
    for (const b of [B.aSupprimerGroupe1, B.aSupprimerGroupe2]) await expect.poll(() => enBase("bl", b), { message: `${b.carrier} encore en base` }).toBeNull();
    expect(await enBase("bl", B.brouillon), "Un brouillon non sélectionné a été supprimé").not.toBeNull();
  });

  test("Envoi en échec (service d'e-mail injoignable) : le site le dit, sans annoncer de succès", async ({ page }) => {
    const b = B.aEnvoyer;
    await epingler(page, "bl", b);
    await cliquer(page, ligneDe(page, "bl", b).locator("button:has(svg.lucide-mail)"));
    const f = page.getByRole("dialog").filter({ hasText: "Envoyer le bon de livraison" });
    await expect(f).toBeVisible();
    await f.getByRole("button", { name: /Envoyer au client/ }).click();
    await expect(page.locator(SELECTEUR_NOTIFICATION_SUCCES).or(page.locator(SELECTEUR_NOTIFICATION_ERREUR)).first(), "Aucune annonce après l'envoi, ni succès ni erreur").toBeVisible({ timeout: 45_000 });
    const succes = await page.locator(SELECTEUR_NOTIFICATION_SUCCES).allInnerTexts().catch(() => []);
    expect(succes.map((t) => t.replace(/\s+/g, " ").trim()), "Un envoi qui a échoué est annoncé réussi").toEqual([]);
  });
});
