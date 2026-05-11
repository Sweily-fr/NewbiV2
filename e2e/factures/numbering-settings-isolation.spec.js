/**
 * Isolation params globaux (Organization) ⇄ params locaux (Invoice) — R4.
 *
 * Architecture (cf rapport étape 1) :
 *   - GLOBAUX : Organization.invoicePrefix + invoiceAutoNumbering +
 *     invoiceStartNumber (additionalFields Better Auth, cf
 *     src/lib/auth-plugins.js:1592-1623). Mutation via Better Auth REST
 *     (`/api/auth/organization/update`) — pas exposé en GraphQL.
 *   - LOCAUX : Invoice.prefix + Invoice.number (modèle Mongoose).
 *
 * R4 — Modifier l'un ne doit pas modifier l'autre.
 *
 * Stratégie : appel REST Better Auth pour lire/écrire les settings org
 * (cf helpers getOrganizationSettings / updateOrganizationSettings).
 * Préfixes uniques par run pour ne pas piéger le DocumentCounter, et
 * restoration des settings à l'état initial en afterAll.
 */
import { test } from "../fixtures/auth.fixture";
import { expect, request as playwrightRequest } from "@playwright/test";
import {
  createInvoiceMutation,
  deleteInvoiceMutation,
  getInvoiceById,
  getOrganizationSettings,
  updateOrganizationSettings,
} from "./helpers/invoice-mutations";
import { buildInvoiceInput, buildItem } from "./helpers/invoice-fixtures";

const createdIds = [];
let initialOrgSettings = null; // snapshot pour restauration en afterAll

function uniquePrefix(label) {
  const stamp = String(Date.now()).slice(-4);
  return `${label}${stamp}-`;
}

test.describe("[Factures] Numérotation — isolation global ⇄ local (§4 R4)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(90000);

  test.beforeAll(async () => {
    const apiContext = await playwrightRequest.newContext({
      storageState: "e2e/.auth/user.json",
    });
    // Capture l'état initial de l'organisation pour pouvoir le restaurer
    // en afterAll. Si le snapshot échoue, on garde null et le restore est
    // best-effort.
    const { status, json } = await getOrganizationSettings(apiContext);
    if (status === 200 && json) {
      initialOrgSettings = {
        invoicePrefix: json.invoicePrefix ?? null,
        invoiceAutoNumbering: json.invoiceAutoNumbering ?? null,
        invoiceStartNumber: json.invoiceStartNumber ?? null,
      };
    }
    await apiContext.dispose();
  });

  test.afterAll(async () => {
    const apiContext = await playwrightRequest.newContext({
      storageState: "e2e/.auth/user.json",
    });
    // Restaurer les settings org tels qu'on les a trouvés (ou null = effacé)
    if (initialOrgSettings) {
      await updateOrganizationSettings(apiContext, initialOrgSettings).catch(
        () => {},
      );
    }
    // Nettoyer les factures créées
    for (const id of createdIds) {
      await deleteInvoiceMutation(apiContext, id).catch(() => {});
    }
    await apiContext.dispose();
  });

  test("Test 1 — Création d'une facture avec prefix custom local : Org.invoicePrefix inchangé (R4)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R4 — local override doesn't bleed into global org settings.
    // 1. Snapshot Org.invoicePrefix avant création
    const { json: before } = await getOrganizationSettings(page.request);
    const orgPrefixBefore = before.invoicePrefix ?? null;

    // 2. Créer une facture avec prefix custom (différent de l'org prefix)
    const localPrefix = uniquePrefix("L4T1");
    expect(localPrefix).not.toBe(orgPrefixBefore);
    const { json: rInv } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R4 T1 local", unitPrice: 100 })],
        status: "PENDING",
        prefix: localPrefix,
      }),
    });
    expect(rInv.errors, JSON.stringify(rInv.errors)).toBeFalsy();
    createdIds.push(rInv.data.createInvoice.id);
    expect(rInv.data.createInvoice.prefix).toBe(localPrefix);

    // 3. Re-snapshot Org.invoicePrefix → doit être identique
    const { json: after } = await getOrganizationSettings(page.request);
    expect(
      after.invoicePrefix ?? null,
      "Org.invoicePrefix ne doit pas être modifié par la création d'une facture (R4)",
    ).toBe(orgPrefixBefore);
  });

  test("Test 2 — Modification de Org.invoicePrefix : facture existante conserve son prefix d'origine (R4 inverse)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R4 (sens inverse) — un changement global ne doit pas réécrire
    // les factures existantes. Audit comptable FR : pas de mutation
    // rétroactive.
    // 1. Créer une facture avec prefix=A
    const oldPrefix = uniquePrefix("L4T2A");
    const { json: rInv } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R4 T2", unitPrice: 100 })],
        status: "PENDING",
        prefix: oldPrefix,
      }),
    });
    expect(rInv.errors, JSON.stringify(rInv.errors)).toBeFalsy();
    const inv = rInv.data.createInvoice;
    createdIds.push(inv.id);
    expect(inv.prefix).toBe(oldPrefix);

    // 2. Changer Org.invoicePrefix vers une nouvelle valeur (10 chars max)
    const newOrgPrefix = uniquePrefix("L4T2B");
    const { status: updStatus } = await updateOrganizationSettings(
      page.request,
      { invoicePrefix: newOrgPrefix },
    );
    expect(updStatus).toBe(200);

    // 3. Re-fetch la facture → prefix d'origine intact
    const { json: getJson } = await getInvoiceById(page.request, inv.id);
    expect(getJson.errors).toBeFalsy();
    expect(
      getJson.data.invoice.prefix,
      "La facture existante doit conserver son prefix d'origine quand Org change (R4)",
    ).toBe(oldPrefix);
  });

  test("Test 3 — Org.invoicePrefix modifié : le backend l'ignore lors d'un createInvoice sans input.prefix (R4)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R4 — l'override global Better Auth (Org.invoicePrefix) ne
    // traverse PAS la couche Invoice côté backend. Le resolver
    // createInvoice (cf invoice.js:1116-1117) lit
    // `userObj?.settings?.invoiceNumberPrefix` (champ qui n'existe PAS
    // sur le User model), PAS Org.invoicePrefix. Quand `input.prefix`
    // est absent, le resolver hérite du préfixe de la dernière facture
    // du workspace (cf invoice.js:1056-1072).
    //
    // Test déterministe : on pose une facture anchor avec un prefix
    // distinct de Org.invoicePrefix. Puis on change Org.invoicePrefix.
    // Puis on crée une 2e facture sans input.prefix. Le backend doit
    // hériter de l'anchor (NON du customOrgPrefix), ce qui prouve que
    // Org est bien ignoré.
    const anchorPrefix = uniquePrefix("L4T3a");
    const { json: rAnchor } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R4 T3 anchor", unitPrice: 100 })],
        status: "PENDING",
        prefix: anchorPrefix,
      }),
    });
    expect(rAnchor.errors, JSON.stringify(rAnchor.errors)).toBeFalsy();
    createdIds.push(rAnchor.data.createInvoice.id);
    expect(rAnchor.data.createInvoice.prefix).toBe(anchorPrefix);

    // Org.invoicePrefix : valeur différente de l'anchor
    const customOrgPrefix = uniquePrefix("L4T3b");
    expect(customOrgPrefix).not.toBe(anchorPrefix);
    await updateOrganizationSettings(page.request, {
      invoicePrefix: customOrgPrefix,
    });

    // Facture sans input.prefix → resolver ignore Org, hérite de l'anchor
    const { json: rInv } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "R4 T3 inherits anchor", unitPrice: 100 }),
        ],
        status: "PENDING",
        // prefix omis volontairement
      }),
    });
    expect(rInv.errors, JSON.stringify(rInv.errors)).toBeFalsy();
    const inv = rInv.data.createInvoice;
    createdIds.push(inv.id);

    // L'invariant clé : prefix !== customOrgPrefix (le backend n'a pas
    // utilisé le setting Org). Bonus : prefix === anchorPrefix (héritage
    // du workspace, cf invoice.js:1063-1064).
    expect(
      inv.prefix,
      "Le backend ne doit PAS utiliser Org.invoicePrefix (le frontend le fait pour pré-remplir l'input, mais ici on bypass le frontend)",
    ).not.toBe(customOrgPrefix);
    expect(
      inv.prefix,
      "Le resolver hérite du préfixe de la dernière facture du workspace (invoice.js:1063-1064)",
    ).toBe(anchorPrefix);
  });

  test("Test 4 — Org.invoiceAutoNumbering modifié : pas d'effet rétroactif sur les factures existantes (R4)", async ({
    authenticatedPage: page,
  }) => {
    // §4 R4 — toggle global "autoNumbering" (compteur global vs per-prefix)
    // ne doit pas changer les numéros déjà attribués. Le champ stocké sur
    // Invoice est juste `number` (sans flag autoNumbering), donc une
    // facture déjà créée a son numéro figé.
    const prefix = uniquePrefix("L4T4");
    const { json: rInv } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "R4 T4", unitPrice: 100 })],
        status: "PENDING",
        prefix,
      }),
    });
    expect(rInv.errors, JSON.stringify(rInv.errors)).toBeFalsy();
    const inv = rInv.data.createInvoice;
    createdIds.push(inv.id);
    const originalNumber = inv.number;

    // Toggle Org.invoiceAutoNumbering
    const { status: updStatus } = await updateOrganizationSettings(
      page.request,
      { invoiceAutoNumbering: true },
    );
    expect(updStatus).toBe(200);

    // Re-fetch facture → numéro et prefix inchangés
    const { json: getJson } = await getInvoiceById(page.request, inv.id);
    expect(getJson.errors).toBeFalsy();
    expect(getJson.data.invoice.number).toBe(originalNumber);
    expect(getJson.data.invoice.prefix).toBe(prefix);
  });

  test("Test 5 — Snapshot/restore Org.invoicePrefix marche (sanity check helper)", async ({
    authenticatedPage: page,
  }) => {
    // Sanity check des helpers updateOrganizationSettings /
    // getOrganizationSettings — utile pour confirmer que la mécanique de
    // restauration en afterAll fonctionne.
    const sentinel = uniquePrefix("L4T5");
    await updateOrganizationSettings(page.request, {
      invoicePrefix: sentinel,
    });
    const { json: midJson } = await getOrganizationSettings(page.request);
    expect(midJson.invoicePrefix).toBe(sentinel);

    // Restaurer manuellement avant la fin du test (afterAll fera aussi
    // une passe globale de sécurité)
    await updateOrganizationSettings(page.request, {
      invoicePrefix: initialOrgSettings?.invoicePrefix ?? null,
    });
  });
});
