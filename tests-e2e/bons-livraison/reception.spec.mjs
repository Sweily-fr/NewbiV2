/**
 * Bons de livraison : réception et transporteur, vérifiés à l'API et à
 * l'écran (organisation « Contrôles Ventes », donnees/lot-devis-bc-bl.mjs).
 *
 *   - la réception d'un bon déjà livré (réceptionnaire, signature manuscrite
 *     du client) ne se réécrit pas, et sa date ne peut être ni dans le futur
 *     ni avant l'émission du bon ;
 *   - la fenêtre de réception s'utilise au clavier et au lecteur d'écran ;
 *   - transporteur et numéro de suivi réels acceptés et retrouvés.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte, SESSION_TOKEN_CONTROLE_VENTES } from "../config.mjs";
import { DOCUMENTS_CONTROLE as C, SIGNATURE_RECEPTION } from "../donnees/lot-devis-bc-bl.mjs";
import { id } from "../securite.mjs";
import { appelControle, messages, ORG_CONTROLE, relire } from "../devis/controle.mjs";
import { actionDeLigne, epingler, ligneDe, notification, ouvrirListe, rechercher } from "../devis/ventes.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES) });

const RECEPTION = `mutation($id: ID!, $w: ID!, $input: DeliveryNoteReceptionInput!) { recordDeliveryNoteReception(id: $id, workspaceId: $w, input: $input) { id status receivedBy } }`;
const noterReception = (page, doc, input) => appelControle(page, RECEPTION, { id: id(doc), w: ORG_CONTROLE, input });
const enBase = (doc) => relire("deliverynotes", doc._id);
const jour = (date) => date.toISOString().slice(0, 10);

test.describe("Bons de livraison : réception", () => {
  test("Bon déjà livré : une nouvelle réception est refusée, réceptionnaire et signature d'origine conservés", async ({ page }) => {
    const doc = C.blLivre;
    await ouvrir(page, "/dashboard");
    const avant = await enBase(doc);
    const reponse = await noterReception(page, doc, {
      receivedBy: "Autre réceptionnaire",
      receivedAt: "2020-01-01",
      signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEUlEQVR42mNk+M9QzwAEjDAGACCDAv8cI7IoAAAAAElFTkSuQmCC",
    });
    expect(reponse.data?.recordDeliveryNoteReception ?? null, "La preuve de livraison a été réécrite").toBeNull();
    expect(messages(reponse), "Le refus doit être expliqué").toMatch(/livr/i);
    const apres = await enBase(doc);
    expect.soft(apres.receivedBy, "Réceptionnaire").toBe("Claire Réception");
    expect.soft(apres.signatureDataUrl, "Signature du client").toBe(SIGNATURE_RECEPTION);
    expect.soft(apres.receivedAt?.getTime(), "Date de réception").toBe(avant.receivedAt?.getTime());
  });

  for (const [titre, doc, date] of [
    ["dans le futur", C.blReceptionFuture, jour(new Date(Date.now() + 30 * 86_400_000))],
    ["avant l'émission du bon", C.blReceptionAvantEmission, "2020-01-01"],
  ]) {
    test(`Date de réception ${titre} : refusée avec un message, bon toujours expédié`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await noterReception(page, doc, { receivedBy: "Jeanne Date", receivedAt: date });
      expect(reponse.data?.recordDeliveryNoteReception ?? null, `Réception datée ${titre} acceptée`).toBeNull();
      expect(messages(reponse), "Le refus doit porter sur la date").toMatch(/date de réception/i);
      expect((await enBase(doc)).status).toBe("SHIPPED");
    });
  }

  test("Fenêtre de réception : zone de signature nommée, réception enregistrée au clavier sans signature", async ({ page }) => {
    const doc = C.blReceptionClavier;
    await epingler(page, "bl", doc);
    await actionDeLigne(page, "bl", doc, "Marquer comme livré");
    const fenetre = page.getByRole("dialog").filter({ hasText: "Confirmer la livraison" });
    await expect(fenetre).toBeVisible();
    await etape(
      page,
      "Zone de signature et bouton « Effacer » nommés",
      async () => {
        const zone = fenetre.locator("canvas").first();
        await expect.soft(zone, "Zone de signature sans nom").toHaveAccessibleName(/signature/i);
        await expect.soft(zone, "Zone de signature sans consigne").toHaveAccessibleDescription(/facultative/i);
        await expect(fenetre.getByRole("button", { name: "Effacer" })).toBeVisible();
      },
      { capture: "ecran" },
    );
    await etape(page, "Saisir le réceptionnaire et confirmer au clavier", async () => {
      await fenetre.getByRole("textbox", { name: "Réceptionné par" }).focus();
      await page.keyboard.type("Léon Clavier");
      await fenetre.getByRole("button", { name: "Marquer comme livré" }).focus();
      await page.keyboard.press("Enter");
      await expect(notification(page, "Bon de livraison marqué comme livré")).toBeVisible();
    });
    await expect.poll(async () => (await enBase(doc))?.status, { message: "Statut en base" }).toBe("DELIVERED");
    expect((await enBase(doc)).receivedBy).toBe("Léon Clavier");
  });
});

test.describe("Bons de livraison : transporteur et numéro de suivi réels", () => {
  test("Transporteur « DHL Express (Fr) » et suivi « 1Z/999.AA-10 » : enregistrés et retrouvés par la recherche", async ({ page }) => {
    const doc = C.blTransporteur;
    const transporteur = "DHL Express (Fr)";
    const suivi = "1Z/999.AA-10";
    await ouvrir(page, "/dashboard");
    await etape(page, "Enregistrer le transporteur et le suivi", async () => {
      const reponse = await appelControle(
        page,
        `mutation($id: ID!, $w: ID!, $input: UpdateDeliveryNoteInput!) { updateDeliveryNote(id: $id, workspaceId: $w, input: $input) { id carrier trackingNumber } }`,
        { id: id(doc), w: ORG_CONTROLE, input: { carrier: transporteur, trackingNumber: suivi } },
      );
      expect(reponse.errors, "Valeurs réelles refusées").toEqual([]);
      const apres = await enBase(doc);
      expect(apres.carrier).toBe(transporteur);
      expect(apres.trackingNumber).toBe(suivi);
    });
    for (const texte of [transporteur, suivi]) {
      await etape(
        page,
        `Rechercher « ${texte} »`,
        async () => {
          await ouvrirListe(page, "bl");
          await rechercher(page, "bl", texte);
          await expect(ligneDe(page, "bl", doc), `Bon introuvable par « ${texte} »`).toHaveCount(1);
        },
        { capture: "ecran" },
      );
    }
  });
});
