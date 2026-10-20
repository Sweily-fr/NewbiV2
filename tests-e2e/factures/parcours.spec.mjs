/**
 * Factures : chaque action de la liste, du panneau et de l'éditeur, vérifiée
 * en base, avec l'organisation « Factures » (une facture par action, voir
 * donnees/lot-factures.mjs). Une action irréversible (annuler, supprimer)
 * doit être confirmée avant d'agir.
 */
import { readFileSync } from "node:fs";
import { test, expect, etape, notificationsErreur } from "../outils.mjs";
import { attendreCalme, cliquer } from "../navigation.mjs";
import { base } from "../base.mjs";
import { API_URL, connecte, SESSION_TOKEN_FACTURES, SESSION_TOKEN_FACTURES_EDITEUR } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";
import { F, RECURRENCES, reference } from "../donnees/lot-factures.mjs";
import {
  actionDeLigne,
  chercher,
  fenetreTitree,
  id,
  ligne,
  LISTE,
  notifications,
  ouvrirEdition,
  ouvrirListe,
  ouvrirPanneau,
  panneau,
} from "./pages.mjs";

const ORG = COMPTES.factures.organisation._id;
const enBase = async (f) => (await base()).collection("invoices").findOne({ _id: f._id });
const statutEnBase = (f) => expect.poll(async () => (await enBase(f))?.status, { message: "Statut en base", timeout: 15_000 });
const aujourdhui = () => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
const jourParis = (d) => (d ? new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(d)) : null);
const succes = (page, texte) => notifications(page).filter({ hasText: texte }).first();

test.describe("Factures : actions du panneau", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  test("Marquer comme payée depuis le panneau : « Terminée », payée aujourd'hui", async ({ page }) => {
    const f = F.aMarquerPayee;
    await ouvrirPanneau(page, f);
    await etape(page, "Marquer comme payée", async () => {
      await cliquer(page, panneau(page).getByRole("button", { name: "Marquer comme payée" }));
      await expect(succes(page, "Facture marquée comme payée")).toBeVisible();
      await statutEnBase(f).toBe("COMPLETED");
    }, { capture: "ecran" });
    expect(jourParis((await enBase(f)).paymentDate), "Date de paiement").toBe(aujourdhui());
  });

  test("Annuler une facture depuis le panneau : confirmation demandée, puis « Annulée »", async ({ page }) => {
    const f = F.aAnnuler;
    await ouvrirPanneau(page, f);
    await etape(page, "Demande de confirmation", async () => {
      await cliquer(page, panneau(page).getByRole("button", { name: "Annuler la facture" }));
      const confirmation = page.getByRole("alertdialog", { name: "Annuler la facture ?" });
      await expect(confirmation).toBeVisible();
      expect((await enBase(f)).status, "Annulée avant la confirmation").toBe("PENDING");
      await confirmation.getByRole("button", { name: "Retour" }).click();
      await expect(confirmation).toBeHidden();
      expect((await enBase(f)).status, "« Retour » ne doit rien annuler").toBe("PENDING");
    });
    await etape(page, "Confirmer l'annulation", async () => {
      await cliquer(page, panneau(page).getByRole("button", { name: "Annuler la facture" }));
      await page.getByRole("button", { name: "Confirmer l'annulation" }).click();
      await expect(succes(page, "Facture annulée")).toBeVisible();
      await statutEnBase(f).toBe("CANCELED");
    }, { capture: "ecran" });
  });

  test("Valider un brouillon depuis le panneau : numéro définitif à la suite, émise aujourd'hui", async ({ page }) => {
    const f = F.brouillonAValider;
    await ouvrirPanneau(page, f);
    await etape(page, "Créer la facture", async () => {
      await cliquer(page, panneau(page).getByRole("button", { name: "Créer la facture" }));
      await statutEnBase(f).toBe("PENDING");
    }, { capture: "ecran" });
    const validee = await enBase(f);
    expect.soft(validee.number, "Numéro définitif (4 chiffres)").toMatch(/^\d{4}$/);
    expect.soft(jourParis(validee.issueDate), "Date d'émission").toBe(aujourdhui());
    const memes = await (await base()).collection("invoices").countDocuments({ workspaceId: ORG, prefix: validee.prefix, number: validee.number, status: { $ne: "DRAFT" } });
    expect.soft(memes, "Numéro unique dans sa série").toBe(1);
  });

  test("Rattacher un paiement : sans transaction bancaire, le sélecteur le dit", async ({ page }) => {
    await ouvrirPanneau(page, F.attente);
    await cliquer(page, panneau(page).getByRole("button", { name: "Rattacher" }));
    await expect(panneau(page).getByText("Aucune transaction disponible")).toBeVisible();
  });

  test("Télécharger le PDF d'une facture : un PDF au nom de la facture", async ({ page }) => {
    const f = F.complete;
    await ouvrirPanneau(page, f);
    const [fichier] = await Promise.all([page.waitForEvent("download"), panneau(page).getByRole("button", { name: "Télécharger PDF" }).click()]);
    expect(fichier.suggestedFilename()).toBe(`facture_${reference(f)}.pdf`);
    const contenu = readFileSync(await fichier.path());
    expect(contenu.subarray(0, 5).toString(), "Le fichier n'est pas un PDF").toBe("%PDF-");
    expect(contenu.length, "PDF vide").toBeGreaterThan(5_000);
  });

  test("Avoir d'une facture payée depuis le panneau : page de l'avoir de cette facture", async ({ page }) => {
    const f = F.aCrediterPayee;
    await ouvrirPanneau(page, f);
    await cliquer(page, panneau(page).getByRole("button", { name: "Créer", exact: true }));
    await expect(page).toHaveURL(new RegExp(`/factures/${id(f)}/avoir/nouveau$`));
    await expect(page.getByText(new RegExp(`Facture .*${f.number}`)).first()).toBeVisible();
  });
});

test.describe("Factures : actions du menu de la ligne", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  test("Marquer comme payée depuis le menu de la ligne", async ({ page }) => {
    const f = F.aMarquerPayeeMenu;
    await ouvrirListe(page);
    await etape(page, "Menu, puis « Marquer comme payée »", async () => {
      await actionDeLigne(page, f, "Marquer comme payée");
      await expect(succes(page, "Facture marquée comme payée")).toBeVisible();
      await statutEnBase(f).toBe("COMPLETED");
    }, { capture: "ecran" });
  });

  test("Annuler une facture depuis le menu de la ligne demande une confirmation (action irréversible)", async ({ page }) => {
    const f = F.aAnnulerMenu;
    await ouvrirListe(page);
    await actionDeLigne(page, f, "Annuler");
    await etape(page, "Une confirmation avant d'annuler", async () => {
      await page.waitForTimeout(1_500);
      const confirmation = page.getByRole("alertdialog").or(page.getByRole("dialog")).filter({ hasText: /annul/i });
      const statut = (await enBase(f)).status;
      expect(statut, "La facture a été annulée d'un clic, sans confirmation (le panneau, lui, demande « Annuler la facture ? »)").toBe("PENDING");
      await expect(confirmation.first(), "Aucune demande de confirmation").toBeVisible();
    }, { capture: "ecran" });
  });

  test("Supprimer un brouillon depuis le menu de la ligne demande une confirmation", async ({ page }) => {
    const f = F.brouillonASupprimerMenu;
    await ouvrirListe(page);
    await actionDeLigne(page, f, "Supprimer");
    await etape(page, "Une confirmation avant de supprimer", async () => {
      await page.waitForTimeout(1_500);
      expect(await enBase(f), "Le brouillon a été supprimé d'un clic, sans confirmation (la suppression groupée, elle, demande confirmation)").not.toBeNull();
    }, { capture: "ecran" });
  });

  test("Copier le lien de paiement : le presse-papiers contient le lien de la facture", async ({ page }) => {
    const f = F.attente;
    await ouvrirListe(page);
    await actionDeLigne(page, f, "Copier le lien de paiement");
    await expect(succes(page, "Lien de paiement copié")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${API_URL}/pay/invoice/${id(f)}`);
  });

  test("Le menu d'une facture payée propose l'avoir, ni « Marquer comme payée » ni « Annuler »", async ({ page }) => {
    const f = F.payee;
    await ouvrirListe(page);
    await chercher(page, f);
    await cliquer(page, ligne(page, f).getByRole("button", { name: "Ouvrir le menu" }));
    const menu = page.getByRole("menu").last();
    await expect(menu.getByRole("menuitem", { name: "Créer un avoir" })).toBeVisible();
    await expect(menu.getByRole("menuitem", { name: "Marquer comme payée" })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: "Annuler" })).toHaveCount(0);
    await expect(menu.getByRole("menuitem", { name: "Copier le lien de paiement" }), "Lien de paiement d'une facture déjà payée").toHaveCount(0);
  });

  test("Créer un avoir depuis le menu de la ligne : avoir enregistré pour cette facture", async ({ page }) => {
    const f = F.aCrediterMenu;
    await ouvrirListe(page);
    await actionDeLigne(page, f, "Créer un avoir");
    await expect(page).toHaveURL(new RegExp(`/factures/${id(f)}/avoir/nouveau$`));
    await page.getByRole("button", { name: "Suivant" }).click();
    await expect(page.getByText("Articles et produits").first()).toBeVisible();
    await etape(page, "Créer l'avoir", async () => {
      await page.getByRole("button", { name: "Créer l'avoir" }).click();
      await expect(succes(page, "Avoir créé avec succès")).toBeVisible();
    }, { capture: "ecran" });
    const avoirs = await (await base()).collection("creditnotes").find({ originalInvoice: f._id }).toArray();
    expect(avoirs, "Un avoir pour cette facture").toHaveLength(1);
    expect.soft(avoirs[0].finalTotalTTC, "Montant de l'avoir (toute la facture)").toBe(-f.finalTotalTTC);
  });

  test("Avoir sur une facture annulée : créé", async ({ page }) => {
    const f = F.aCrediterAnnulee;
    await ouvrirListe(page);
    await actionDeLigne(page, f, "Créer un avoir");
    await page.getByRole("button", { name: "Suivant" }).click();
    await page.getByRole("button", { name: "Créer l'avoir" }).click();
    await expect(succes(page, "Avoir créé avec succès")).toBeVisible();
    expect(await (await base()).collection("creditnotes").countDocuments({ originalInvoice: f._id })).toBe(1);
  });

  test("Sauvegarder une facture comme modèle : le modèle reprend ses articles", async ({ page }) => {
    const f = F.modeleSource;
    const nom = "Modèle tiré de la prestation type";
    await ouvrirListe(page);
    await actionDeLigne(page, f, "Sauv. modèle");
    const fenetre = fenetreTitree(page, "Sauvegarder comme modèle");
    await expect(fenetre).toBeVisible();
    await fenetre.getByRole("textbox", { name: /^Nom/ }).fill(nom);
    await etape(page, "Sauvegarder", async () => {
      await fenetre.getByRole("button", { name: "Sauvegarder" }).click();
      await expect(succes(page, "Modèle sauvegardé avec succès")).toBeVisible();
    }, { capture: "ecran" });
    const modele = await (await base()).collection("invoicetemplates").findOne({ workspaceId: ORG, name: nom });
    expect(modele, "Modèle enregistré").not.toBeNull();
    expect(modele.items.map((a) => a.description)).toEqual(f.items.map((a) => a.description));
  });

  test("Créer un bon de livraison depuis une facture : bon enregistré avec ses articles", async ({ page }) => {
    const f = F.aLivrer;
    await ouvrirListe(page);
    await actionDeLigne(page, f, "Créer un bon de livraison");
    await expect(succes(page, "Bon de livraison créé à partir de la facture")).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/outils\/bons-de-livraison\/[0-9a-f]{24}\/editer$/);
    const bl = await (await base()).collection("deliverynotes").findOne({ workspaceId: ORG, "items.description": f.items[0].description });
    expect(bl, "Bon de livraison en base").not.toBeNull();
  });

  test("Rendre une facture récurrente : récurrence mensuelle programmée", async ({ page }) => {
    const f = F.aRendreRecurrente;
    await ouvrirListe(page);
    await actionDeLigne(page, f, "Rendre récurrente");
    const fenetre = fenetreTitree(page, "Récurrence de la facture");
    await expect(fenetre).toBeVisible();
    await etape(page, "Programmer", async () => {
      await fenetre.getByRole("button", { name: "Programmer" }).click();
      await expect(succes(page, "Facture rendue récurrente")).toBeVisible();
    }, { capture: "ecran" });
    const r = await (await base()).collection("invoicerecurrences").findOne({ sourceInvoiceId: f._id });
    expect(r, "Récurrence en base").toMatchObject({ status: "ACTIVE", frequency: "MONTHLY", interval: 1 });
  });

  test("Envoyer une facture par e-mail : l'échec de l'envoi est annoncé, pas un succès", async ({ page }) => {
    const f = F.aEnvoyer;
    await ouvrirListe(page);
    await chercher(page, f);
    await cliquer(page, ligne(page, f).locator("button:has(svg.lucide-mail)"));
    const fenetre = fenetreTitree(page, "Envoyer la facture");
    await expect(fenetre).toBeVisible();
    await expect(fenetre.getByText(f.client.email).first(), "Adresse du client proposée").toBeVisible();
    const reponse = page.waitForResponse((r) => r.url().includes("/graphql") && (r.request().postData() || "").includes("sendInvoiceEmail"));
    await fenetre.getByRole("button", { name: /^Envoyer au client/ }).click();
    const corps = await (await reponse).json().catch(() => ({}));
    const echec = Boolean(corps.errors?.length) || corps.data?.sendInvoiceEmail?.success === false;
    await etape(page, "Message affiché", async () => {
      await page.waitForTimeout(1_500);
      if (echec) {
        await expect(notificationsErreur(page).first(), `L'API a refusé l'envoi (${JSON.stringify(corps.errors?.[0]?.message || corps.data)}) mais aucun message d'erreur n'est affiché`).toBeVisible();
        await expect(succes(page, "Facture envoyée avec succès"), "Succès annoncé alors que l'e-mail n'est pas parti").toHaveCount(0);
      }
    }, { capture: "ecran" });
  });
});

test.describe("Factures : actions groupées", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  test("Supprimer la sélection : les brouillons partent, la facture émise reste, l'utilisateur est prévenu", async ({ page }) => {
    const brouillons = [F.brouillonGroupe1, F.brouillonGroupe2];
    const emise = F.attenteGroupe;
    await ouvrirListe(page);
    for (const f of [...brouillons, emise]) {
      await chercher(page, f);
      await ligne(page, f).getByRole("checkbox", { name: "Sélectionner la ligne" }).check();
    }
    await page.getByPlaceholder(/Recherchez par numéro/).fill("");
    await attendreCalme(page);
    await etape(page, "Supprimer (3) puis confirmer", async () => {
      await page.getByRole("button", { name: "Supprimer (3)" }).click();
      const confirmation = page.getByRole("alertdialog", { name: "Confirmer la suppression" });
      await expect(confirmation).toContainText("Seules les factures en brouillon");
      await confirmation.getByRole("button", { name: "Supprimer" }).click();
      await expect(notifications(page).filter({ hasText: "1 facture(s) ignorée(s) (non brouillon)" }).first()).toBeVisible();
    }, { capture: "ecran" });
    for (const f of brouillons) await expect.poll(() => enBase(f), { message: `${reference(f)} supprimé` }).toBeNull();
    expect(await enBase(emise), "La facture émise ne doit pas être supprimée").not.toBeNull();
  });

  test("Supprimer la sélection puis « Annuler » : rien n'est supprimé", async ({ page }) => {
    const f = F.brouillon;
    await ouvrirListe(page);
    await chercher(page, f);
    await ligne(page, f).getByRole("checkbox", { name: "Sélectionner la ligne" }).check();
    await page.getByRole("button", { name: "Supprimer (1)" }).click();
    await page.getByRole("alertdialog", { name: "Confirmer la suppression" }).getByRole("button", { name: "Annuler" }).click();
    await page.waitForTimeout(800);
    expect(await enBase(f)).not.toBeNull();
  });
});

test.describe("Factures : éditeur d'un brouillon", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  test("Modifier un brouillon dans l'éditeur et l'enregistrer : article modifié en base", async ({ page }) => {
    const f = F.brouillonAModifier;
    await ouvrirEdition(f)(page);
    await page.getByRole("button", { name: /Continuer/ }).click();
    await expect(page.getByText("Articles et produits").first()).toBeVisible();
    const champ = page.locator("#item-description-0");
    if (!(await champ.isVisible())) await page.getByRole("button", { name: /Article 1|Brouillon à compléter/ }).first().click();
    await champ.fill("Brouillon complété dans l'éditeur");
    await etape(page, "Enregistrer brouillon", async () => {
      await page.getByRole("button", { name: "Enregistrer brouillon" }).click();
      await expect(succes(page, "Brouillon sauvegardé")).toBeVisible();
    }, { capture: "ecran" });
    await expect.poll(async () => (await enBase(f)).items?.[0]?.description).toBe("Brouillon complété dans l'éditeur");
    expect((await enBase(f)).status).toBe("DRAFT");
  });

  test("Finaliser un brouillon dans l'éditeur : facture créée et numérotée", async ({ page }) => {
    const f = F.brouillonAFinaliser;
    await ouvrirEdition(f)(page);
    await page.getByRole("button", { name: /Continuer/ }).click();
    await etape(page, "Créer la facture", async () => {
      await page.getByRole("button", { name: "Créer la facture" }).click();
      await expect(succes(page, "Facture créée avec succès")).toBeVisible();
    }, { capture: "ecran" });
    await statutEnBase(f).toBe("PENDING");
    expect((await enBase(f)).number).toMatch(/^\d{4}$/);
  });

  test("Brouillon repris dont le numéro provisoire a été pris depuis : il s'enregistre", async ({ page }) => {
    // DRAFT-0005 : le numéro 0005 appartient depuis à une facture émise de la série.
    const f = F.brouillonNumeroPris;
    await ouvrirEdition(f)(page);
    await etape(page, "Enregistrer brouillon sans rien changer", async () => {
      await page.getByRole("button", { name: "Enregistrer brouillon" }).click();
      await page.waitForTimeout(2_000);
      const erreurs = await notificationsErreur(page).allInnerTexts();
      expect(erreurs.map((t) => t.replace(/\s+/g, " ")), "Le brouillon ne peut pas être enregistré").toEqual([]);
      await expect(succes(page, "Brouillon sauvegardé")).toBeVisible();
    }, { capture: "ecran" });
  });
});

test.describe("Factures : actions de l'Éditeur", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES_EDITEUR) });

  test("L'Éditeur marque une facture payée depuis le panneau", async ({ page }) => {
    const f = F.editeurPayee;
    await ouvrirPanneau(page, f);
    await cliquer(page, panneau(page).getByRole("button", { name: "Marquer comme payée" }));
    await expect(succes(page, "Facture marquée comme payée")).toBeVisible();
    await statutEnBase(f).toBe("COMPLETED");
  });

  test("L'Éditeur modifie un brouillon dans l'éditeur", async ({ page }) => {
    const f = F.editeurBrouillon;
    await ouvrirEdition(f)(page);
    await page.getByRole("button", { name: /Continuer/ }).click();
    const champ = page.locator("#item-description-0");
    if (!(await champ.isVisible())) await page.getByRole("button", { name: /Article 1|Brouillon de l/ }).first().click();
    await champ.fill("Brouillon repris par l'Éditeur");
    await page.getByRole("button", { name: "Enregistrer brouillon" }).click();
    await expect(succes(page, "Brouillon sauvegardé")).toBeVisible();
    await expect.poll(async () => (await enBase(f)).items?.[0]?.description).toBe("Brouillon repris par l'Éditeur");
  });

  test("L'Éditeur n'a ni « Annuler la facture » dans le panneau ni « Supprimer » dans le menu", async ({ page }) => {
    await ouvrirPanneau(page, F.attente);
    await expect(panneau(page).getByRole("button", { name: "Annuler la facture" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await ouvrirListe(page);
    await chercher(page, F.brouillon);
    await cliquer(page, ligne(page, F.brouillon).getByRole("button", { name: "Ouvrir le menu" }));
    await expect(page.getByRole("menu").last().getByRole("menuitem", { name: "Supprimer" })).toHaveCount(0);
  });
});

test.describe("Factures récurrentes : suspendre, reprendre, arrêter", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_FACTURES) });

  async function gerer(page, r) {
    await ouvrirListe(page);
    await cliquer(page, page.getByRole("tab", { name: /^Récurrentes/ }));
    const source = Object.values(F).find((f) => f._id.equals(r.sourceInvoiceId));
    const rangee = page.getByRole("row").filter({ hasText: source.client.name }).filter({ hasText: source.number });
    await cliquer(page, rangee.getByRole("button", { name: "Gérer" }));
    const fenetre = fenetreTitree(page, "Récurrence de la facture");
    await expect(fenetre).toBeVisible();
    return fenetre;
  }
  const statutRecurrence = (r) => expect.poll(async () => (await (await base()).collection("invoicerecurrences").findOne({ _id: r._id }))?.status, { message: "Statut de la récurrence" });

  test("Suspendre une récurrence active", async ({ page }) => {
    const fenetre = await gerer(page, RECURRENCES.aPauser);
    await fenetre.getByRole("button", { name: "Suspendre" }).click();
    await expect(succes(page, "Récurrence suspendue")).toBeVisible();
    await statutRecurrence(RECURRENCES.aPauser).toBe("PAUSED");
  });

  test("Reprendre une récurrence suspendue", async ({ page }) => {
    const fenetre = await gerer(page, RECURRENCES.aReprendre);
    await fenetre.getByRole("button", { name: "Reprendre" }).click();
    await expect(succes(page, "Récurrence reprise")).toBeVisible();
    await statutRecurrence(RECURRENCES.aReprendre).toBe("ACTIVE");
  });

  test("Arrêter une récurrence : confirmation, puis « terminée »", async ({ page }) => {
    const fenetre = await gerer(page, RECURRENCES.aArreter);
    await fenetre.getByRole("button", { name: "Arrêter" }).click();
    await expect(page.getByRole("alertdialog", { name: "Arrêter la récurrence ?" })).toBeVisible();
    await page.getByRole("button", { name: "Arrêter la récurrence" }).click();
    await expect(succes(page, "Récurrence arrêtée")).toBeVisible();
    await statutRecurrence(RECURRENCES.aArreter).toBe("ENDED");
  });
});
