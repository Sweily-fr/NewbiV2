/**
 * Automatisations de listes sans effet caché (espace « Contacts
 * Automatisations », donnees/lot-clients-catalogue.mjs) : créée inactive,
 * elle ne touche à aucune liste ; « Déplacer vers » créée active signale
 * dans le journal du contact chaque liste dont il est retiré. Tests en série :
 * le dernier déplace tous les contacts de l'espace.
 */
import { test, expect } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { connecte } from "../config.mjs";
import { base } from "../base.mjs";
import { appelApi, id } from "../securite.mjs";
import { COMPTES_CC, CONTACTS_AUTOMATISATIONS as C, LISTES_CC } from "../donnees/lot-clients-catalogue.mjs";

test.use({ storageState: connecte(COMPTES_CC.automatisations.token) });
test.describe.configure({ mode: "serial" });

const COMPTE = COMPTES_CC.automatisations;
const ORG = id(COMPTE.organisation);
const CREER = `mutation($w: ID!, $input: CreateClientAutomationInput!) { createClientAutomation(workspaceId: $w, input: $input) { id } }`;
const creer = (page, input) => appelApi(page, CREER, { w: ORG, input }, { organisation: ORG });

/** Listes de l'espace telles qu'en base (nom et contacts). */
async function listes() {
  const docs = await (await base()).collection("clientlists").find({ workspaceId: COMPTE.organisation._id }).sort({ _id: 1 }).toArray();
  return docs.map((l) => ({ name: l.name, clients: l.clients.map(String).sort() }));
}

test.beforeEach(async ({ page }) => {
  await ouvrir(page, "/dashboard");
});

test.describe("Automatisations de listes : rien de caché", () => {
  for (const actionType of ["ADD_TO_LIST", "MOVE_TO_LIST"]) {
    test(`« Client créé → ${actionType === "ADD_TO_LIST" ? "Ajouter à" : "Déplacer vers"} VIP » créée inactive : aucune liste modifiée`, async ({ page }) => {
      const avant = await listes();
      const reponse = await creer(page, { name: `Inactive ${actionType}`, triggerType: "CLIENT_CREATED", actionType, targetListId: id(LISTES_CC.vipA), isActive: false });
      expect(reponse.errors).toEqual([]);
      expect(await listes(), "Une automatisation inactive a modifié les listes").toEqual(avant);
    });
  }

  test("« Client créé → Déplacer vers VIP » créée active : chaque retrait d'une liste est écrit dans le journal du contact", async ({ page }) => {
    const reponse = await creer(page, { name: "Déplacer vers VIP", triggerType: "CLIENT_CREATED", actionType: "MOVE_TO_LIST", targetListId: id(LISTES_CC.vipA), isActive: true });
    expect(reponse.errors).toEqual([]);
    const contact = await (await base()).collection("clients").findOne({ _id: C.rangeUn._id });
    const retraits = contact.activity.filter((a) => a.type === "removed_from_list").map((a) => a.metadata?.listName).sort();
    const vip = (await listes()).find((l) => l.name === "VIP");
    if (vip.clients.includes(id(C.rangeUn))) {
      expect(retraits, "Contact retiré de ses listes sans trace dans son journal").toEqual(["Clients", "Prospects"]);
    }
  });
});
