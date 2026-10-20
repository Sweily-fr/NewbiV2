/**
 * Devis : chaque parcours vérifié en base, organisation « Ventes »
 * (propriétaire). Statuts depuis le panneau, conversions (facture, bon de
 * commande, bon de livraison), modèle, envoi par e-mail, PDF, actions
 * groupées et exports (contenu du fichier). Chaque parcours a son devis
 * (donnees/lot-devis-bc-bl.mjs).
 */
import { readFileSync } from "node:fs";
import { test, expect, etape, fenetre, SELECTEUR_NOTIFICATION_ERREUR, SELECTEUR_NOTIFICATION_SUCCES } from "../outils.mjs";
import { attendreCalme, cliquer } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_VENTES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { DEVIS_VENTES as D } from "../donnees/lot-devis-bc-bl.mjs";
import {
  actionDeLigne,
  chercherEnBase,
  enBase,
  epingler,
  ligneDe,
  notification,
  ouvrirPanneau,
  panneau,
  reference,
  relu,
  rechercher,
  telecharger,
  textePdf,
  texteUtile,
  ouvrirListe,
} from "./ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_VENTES) });

const ORG = COMPTES.ventes.organisation._id;
const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n).replace(/\s/g, " ");
const idsDe = (liste) => (liste || []).map((x) => (typeof x?.toHexString === "function" ? x.toHexString() : String(x?._id ?? x)));

test.describe("Devis : changements de statut depuis le panneau", () => {
  test("Accepter le devis : « Accepté » en base, le panneau le montre", async ({ page }) => {
    const p = await ouvrirPanneau(page, "devis", D.aAccepter);
    await etape(page, "Accepter", async () => {
      await cliquer(page, p.getByRole("button", { name: "Accepter le devis" }));
      await expect(notification(page, "Devis accepté")).toBeVisible();
    }, { capture: "ecran" });
    await relu("devis", D.aAccepter, (d) => d?.status, "Statut en base").toBe("COMPLETED");
  });

  test("Annuler le devis depuis le panneau : « Annulé » en base", async ({ page }) => {
    const p = await ouvrirPanneau(page, "devis", D.aRefuser);
    await etape(page, "Annuler le devis", async () => {
      await cliquer(page, p.getByRole("button", { name: "Annuler le devis" }));
      await expect(notification(page, "Devis annulé")).toBeVisible();
    }, { capture: "ecran" });
    await relu("devis", D.aRefuser, (d) => d?.status, "Statut en base").toBe("CANCELED");
  });
});

test.describe("Devis : conversions vérifiées en base", () => {
  test("En facture : la facture créée reprend le client, les articles et les prix, et elle est liée au devis", async ({ page }) => {
    const d = D.aFacturer;
    await epingler(page, "devis", d);
    await etape(page, "Convertir en facture", async () => {
      await actionDeLigne(page, "devis", d, "Convertir en facture");
      await expect(page).toHaveURL(/\/dashboard\/outils\/factures\/new/);
      await expect(page.getByRole("combobox").filter({ hasText: d.client.name })).toBeVisible({ timeout: 20_000 });
    }, { capture: "ecran" });
    await etape(page, "Créer la facture", async () => {
      await page.getByRole("button", { name: /Continuer/ }).click();
      await expect(page.getByText("Articles et produits").first()).toBeVisible();
      await page.getByRole("button", { name: "Créer la facture" }).click();
      await expect(notification(page, "Facture créée avec succès")).toBeVisible({ timeout: 20_000 });
    }, { capture: "ecran" });
    const [facture] = await chercherEnBase("invoices", { workspaceId: ORG, "items.description": d.items[0].description });
    expect(facture, "Facture enregistrée").toBeTruthy();
    expect.soft(facture.client?.name, "Client de la facture").toBe(d.client.name);
    expect.soft(facture.items.map((a) => [a.description, a.quantity, a.unitPrice, a.vatRate]), "Articles repris du devis").toEqual(d.items.map((a) => [a.description, a.quantity, a.unitPrice, a.vatRate]));
    expect.soft(facture.finalTotalTTC, "Total TTC de la facture").toBe(d.finalTotalTTC);
    expect.soft(String(facture.sourceQuote ?? ""), "La facture garde son devis d'origine").toBe(d._id.toHexString());
    await relu("devis", d, (q) => idsDe(q?.linkedInvoices), "Le devis liste sa facture").toContain(facture._id.toHexString());
  });

  test("En bon de commande : le bon créé reprend le devis et sa référence", async ({ page }) => {
    const d = D.aCommander;
    await epingler(page, "devis", d);
    await etape(page, "Convertir en bon de commande", async () => {
      await actionDeLigne(page, "devis", d, "Convertir en bon de commande");
      await expect(page).toHaveURL(/\/dashboard\/outils\/bons-commande\/new/);
      await expect(page.getByRole("combobox").filter({ hasText: d.client.name })).toBeVisible({ timeout: 20_000 });
    }, { capture: "ecran" });
    await etape(page, "Créer le bon de commande", async () => {
      await page.getByRole("button", { name: /Continuer/ }).click();
      await expect(page.getByText("Articles et produits").first()).toBeVisible();
      await page.getByRole("button", { name: "Créer le bon de commande" }).click();
      await expect(notification(page, "Bon de commande créé avec succès")).toBeVisible({ timeout: 20_000 });
    }, { capture: "ecran" });
    const [bon] = await chercherEnBase("purchaseorders", { workspaceId: ORG, "items.description": d.items[0].description });
    expect(bon, "Bon de commande enregistré").toBeTruthy();
    expect.soft(bon.status, "Statut du bon").toBe("CONFIRMED");
    expect.soft(bon.client?.name).toBe(d.client.name);
    expect.soft(bon.items.map((a) => [a.description, a.quantity, a.unitPrice]), "Articles repris").toEqual(d.items.map((a) => [a.description, a.quantity, a.unitPrice]));
    expect.soft(String(bon.sourceQuoteId ?? ""), "Le bon garde son devis d'origine").toBe(d._id.toHexString());
    expect.soft(bon.purchaseOrderNumber, "Référence du devis sur le bon").toBe(reference(d));
  });

  test("En bon de livraison : bon créé avec les articles et quantités du devis, lié au devis", async ({ page }) => {
    const d = D.aLivrer;
    await epingler(page, "devis", d);
    await etape(page, "Créer un bon de livraison", async () => {
      await actionDeLigne(page, "devis", d, "Créer un bon de livraison");
      await expect(notification(page, "Bon de livraison créé à partir du devis")).toBeVisible({ timeout: 20_000 });
      await expect(page).toHaveURL(/\/dashboard\/outils\/bons-de-livraison\/[0-9a-f]{24}\/editer/);
    }, { capture: "ecran" });
    const id = page.url().match(/bons-de-livraison\/([0-9a-f]{24})\//)[1];
    const bl = (await chercherEnBase("deliverynotes", { _id: new (await import("mongodb")).ObjectId(id) }))[0];
    expect(bl, "Bon de livraison enregistré").toBeTruthy();
    expect.soft(bl.status, "Créé en brouillon").toBe("DRAFT");
    expect.soft(bl.client?.name).toBe(d.client.name);
    expect.soft(bl.items.map((a) => [a.description, a.quantity]), "Articles et quantités du devis").toEqual(d.items.map((a) => [a.description, a.quantity]));
    expect.soft(String(bl.sourceQuote ?? ""), "Le bon garde son devis d'origine").toBe(d._id.toHexString());
    await etape(page, "Aucun prix sur l'écran du bon de livraison", async () => {
      await expect(page.getByText(euros(d.items[0].unitPrice)), "Le prix du devis s'affiche sur le bon de livraison").toHaveCount(0);
    });
  });
});

test.describe("Devis : modèle", () => {
  test("Sauvegarder comme modèle : le modèle reprend les articles du devis", async ({ page }) => {
    const d = D.aSauverModele;
    await epingler(page, "devis", d);
    await actionDeLigne(page, "devis", d, "Sauv. modèle");
    const fenetre = page.getByRole("dialog", { name: "Sauvegarder comme modèle" });
    await fenetre.getByLabel("Nom *").fill("Modèle issu du parcours");
    await fenetre.getByLabel("Description").fill("Repris des articles du devis");
    await etape(page, "Sauvegarder", async () => {
      await fenetre.getByRole("button", { name: "Sauvegarder" }).click();
      await expect(notification(page, "Modèle sauvegardé avec succès")).toBeVisible();
      await expect(fenetre).toBeHidden();
    }, { capture: "ecran" });
    const [modele] = await chercherEnBase("quotetemplates", { workspaceId: ORG, name: "Modèle issu du parcours" });
    expect(modele, "Modèle enregistré").toBeTruthy();
    expect.soft(modele.description).toBe("Repris des articles du devis");
    expect.soft(modele.items.map((a) => [a.description, a.unitPrice]), "Articles du modèle").toEqual(d.items.map((a) => [a.description, a.unitPrice]));
  });
});

test.describe("Devis : envoi par e-mail", () => {
  test("Envoi en échec (service d'e-mail injoignable) : le site le dit, sans annoncer de succès", async ({ page }) => {
    // En test, l'API ne peut joindre aucun service d'e-mail : l'envoi échoue côté API.
    // Le site doit le dire ; il ne doit pas annoncer « Devis envoyé avec succès ».
    const d = D.aEnvoyer;
    await epingler(page, "devis", d);
    await cliquer(page, ligneDe(page, "devis", d).locator("button:has(svg.lucide-mail)"));
    const fenetre = page.getByRole("dialog").filter({ hasText: "Envoyer le devis" });
    await expect(fenetre).toBeVisible();
    await etape(page, "Envoyer au client", async () => {
      await fenetre.getByRole("button", { name: /Envoyer au client/ }).click();
      // Première annonce affichée (succès ou erreur), avant qu'elle ne disparaisse.
      await expect(page.locator(SELECTEUR_NOTIFICATION_SUCCES).or(page.locator(SELECTEUR_NOTIFICATION_ERREUR)).first(), "Aucune annonce après l'envoi, ni succès ni erreur").toBeVisible({ timeout: 45_000 });
    }, { capture: "ecran" });
    const succes = await page.locator(SELECTEUR_NOTIFICATION_SUCCES).allInnerTexts().catch(() => []);
    expect(succes.map((t) => t.replace(/\s+/g, " ").trim()), "Un envoi qui a échoué est annoncé réussi").toEqual([]);
  });
});

test.describe("Devis : PDF", () => {
  test("Télécharger le PDF d'un devis en attente : un vrai PDF, au numéro et au montant du devis", async ({ page }) => {
    test.setTimeout(150_000);
    const d = D.pdf;
    const p = await ouvrirPanneau(page, "devis", d);
    const { nom, chemin } = await etape(page, "Télécharger", () =>
      telecharger(page, () => cliquer(page, p.getByRole("button", { name: /Télécharger|PDF/ }).first()), { timeout: 90_000 }),
    );
    expect(nom, "Nom du fichier").toMatch(/\.pdf$/i);
    const pdf = await textePdf(chemin);
    expect(pdf.entete, "Le fichier est un PDF").toBe("%PDF-");
    expect(pdf.pages, "Au moins une page").toBeGreaterThan(0);
    if (!texteUtile(pdf)) {
      // PDF image (génération côté serveur coupée en test) : contenu non lisible, seul le fichier est vérifié.
      test.info().annotations.push({ type: "info", description: "PDF image : texte non vérifiable en test" });
      return;
    }
    expect.soft(pdf.texte, "Numéro du devis dans le PDF").toContain(d.number);
    expect.soft(pdf.texte, "Client dans le PDF").toContain(d.client.name);
    expect.soft(pdf.texte.replace(/\s/g, ""), "Montant TTC dans le PDF").toContain(euros(d.finalTotalTTC).replace(/\s/g, ""));
  });
});

test.describe("Devis : actions groupées", () => {
  test("Supprimer plusieurs brouillons sélectionnés : tous supprimés", async ({ page }) => {
    await ouvrirListe(page, "devis");
    await rechercher(page, "devis", "Fromagerie Durand");
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "50" }).click();
    await attendreCalme(page);
    for (const d of [D.aSupprimerGroupe1, D.aSupprimerGroupe2]) await ligneDe(page, "devis", d).getByRole("checkbox").check();
    await etape(page, "Supprimer la sélection", async () => {
      await page.getByRole("button", { name: "Supprimer (2)" }).click();
      const confirmation = fenetre(page, "Confirmer la suppression");
      await expect(confirmation).toBeVisible();
      await confirmation.getByRole("button", { name: /Supprimer/ }).last().click();
      await attendreCalme(page);
    }, { capture: "ecran" });
    for (const d of [D.aSupprimerGroupe1, D.aSupprimerGroupe2]) {
      await expect.poll(() => enBase("devis", d), { message: `${reference(d)} encore en base` }).toBeNull();
    }
    expect(await enBase("devis", D.brouillon), "Un brouillon non sélectionné a été supprimé").not.toBeNull();
  });
});

test.describe("Devis : export", () => {
  async function exporter(page, format) {
    await page.getByRole("button", { name: "Exporter" }).click();
    await page.getByRole("menuitem", { name: format, exact: true }).click();
    const fenetre = page.getByRole("dialog", { name: new RegExp(`^Exporter en`) });
    await expect(fenetre).toBeVisible();
    return telecharger(page, () => fenetre.getByRole("button", { name: "Exporter", exact: true }).click());
  }
  const lignesCsv = (chemin) =>
    readFileSync(chemin, "utf8")
      .replace(/^﻿/, "")
      .split(/\r?\n/)
      .filter((l) => l.trim());

  test("Export CSV : une ligne par devis de l'organisation, avec numéro, client et montant", async ({ page }) => {
    await ouvrirListe(page, "devis");
    const { nom, chemin } = await exporter(page, "CSV");
    expect(nom).toMatch(/\.csv$/);
    const lignes = lignesCsv(chemin);
    const tous = await chercherEnBase("quotes", { workspaceId: ORG });
    await etape(page, "Contenu du fichier", async () => {
      expect(lignes.length - 1, "Une ligne par devis").toBe(tous.length);
      const l = lignes.find((x) => x.includes(reference(D.aExporter)));
      expect(l, `Ligne de ${reference(D.aExporter)}`).toBeTruthy();
      expect.soft(l).toContain(D.aExporter.client.name);
      expect.soft(l).toContain(D.aExporter.finalTotalTTC.toFixed(2));
      expect(readFileSync(chemin, "utf8"), "Un devis d'une autre organisation est exporté").not.toContain("Grossiste Volume SARL");
    });
  });

  test("Export CSV : le statut est écrit en clair (« En attente », « Accepté »), pas en code", async ({ page }) => {
    await ouvrirListe(page, "devis");
    const { chemin } = await exporter(page, "CSV");
    const lignes = lignesCsv(chemin);
    const ligneDu = (d) => lignes.find((x) => x.includes(reference(d))) || "";
    expect.soft(ligneDu(D.enAttente), "Statut d'un devis en attente").toContain("En attente");
    expect.soft(ligneDu(D.accepte), "Statut d'un devis accepté").toContain("Accepté");
    expect(lignes.join("\n"), "Codes techniques de statut dans le fichier").not.toMatch(/;(PENDING|COMPLETED);/);
  });

  test("Export de la sélection : seulement les devis cochés", async ({ page }) => {
    await epingler(page, "devis", D.aExporter);
    await ligneDe(page, "devis", D.aExporter).getByRole("checkbox").check();
    const { chemin } = await exporter(page, "CSV");
    const lignes = lignesCsv(chemin);
    expect(lignes.length - 1, "Un seul devis coché, mais l'export contient tous les devis (la sélection n'est pas transmise au bouton « Exporter »)").toBe(1);
    expect(lignes[1]).toContain(reference(D.aExporter));
  });

  test("Export Excel : un fichier lisible avec les devis de l'organisation", async ({ page }) => {
    await ouvrirListe(page, "devis");
    const { nom, chemin } = await exporter(page, "Excel");
    expect(nom).toMatch(/\.xls$/);
    const contenu = readFileSync(chemin, "utf8");
    expect(contenu).toContain(reference(D.aExporter));
    expect(contenu).toContain(D.aExporter.client.name);
  });
});

test.describe("Devis : panneau", () => {
  test("Le panneau d'un devis en attente montre client, dates, articles, total et référence", async ({ page }) => {
    const d = D.enAttente;
    const p = await ouvrirPanneau(page, "devis", d);
    const date = (x) => new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Paris" }).format(x);
    for (const texte of [d.client.name, date(d.issueDate), date(d.validUntil), d.items[0].description, euros(d.finalTotalTTC)]) {
      await expect.soft(p.getByText(texte).first(), texte).toBeVisible();
    }
  });

  test("Le panneau se ferme avec la touche Échap, la liste reste affichée", async ({ page }) => {
    const p = await ouvrirPanneau(page, "devis", D.accepte);
    await page.keyboard.press("Escape");
    await expect(p, "Échap ne ferme pas le panneau (clavier, lecteur d'écran)").toBeHidden();
    await expect(ligneDe(page, "devis", D.accepte)).toBeVisible();
    expect((await enBase("devis", D.accepte)).status).toBe("COMPLETED");
  });
});
