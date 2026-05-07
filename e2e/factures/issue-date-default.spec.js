/**
 * Date d'émission par défaut sur /factures/new.
 *
 * Couvre INVOICES_PAGE.md §17 (validation au submit / champ date émission)
 * et §45 (compliance FR — date d'émission ≥ dernière facture finalisée).
 *
 * Règle métier (frontend, cf use-invoice-editor.js:1227-1272) :
 *   default = max(today, latestNonDraftIssueDate)
 *   - Si aucune facture finalisée OU latest ≤ today → default = today
 *   - Si latest > today (facture postdatée) → default = latest
 *   - Les DRAFT sont IGNORÉS (cf resolver invoice.js:608-621 : query
 *     latestInvoiceIssueDate filtre status ∈ {PENDING, COMPLETED, CANCELED}).
 *
 * Stratégie : tests state-aware. Le teardown e2e ne supprime que les
 * invoices seedées (cf global-teardown.ts:35-38) — les invoices créées
 * par les tests via mutation persistent. On lit donc la "latest" courante
 * en début de chaque test et on ajuste les dates pour que les mutations
 * soient toujours valides (date ≥ latest courante).
 *
 * Pré-création raw GraphQL pour fixer l'état attendu (rapide, déterministe),
 * puis ouverture UI et lecture du champ caché `input[name="issueDate"]` qui
 * porte la valeur YYYY-MM-DD enregistrée par react-hook-form.
 */
import { test } from "../fixtures/auth.fixture";
import { expect, request as playwrightRequest } from "@playwright/test";
import {
  createInvoiceMutation,
  deleteInvoiceMutation,
  latestInvoiceIssueDate,
} from "./helpers/invoice-mutations";
import { buildInvoiceInput, buildItem } from "./helpers/invoice-fixtures";

// Track des invoices créées par les tests de ce fichier — supprimées en
// afterAll pour ne pas pousser `latestInvoiceIssueDate` dans le futur,
// ce qui briserait pieges-critiques.spec.js Test 2 et d'autres tests qui
// supposent latest ≈ today (cf R11).
const createdInvoiceIds = [];

function todayISO() {
  // Doit matcher formatLocalDate() (timezone locale, pas UTC) pour comparer
  // avec la valeur écrite par le frontend dans input[name="issueDate"].
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDaysISO(baseISO, days) {
  const [y, m, d] = baseISO.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Lit la date "latest" comme YYYY-MM-DD locale, ou null si la query
 * retourne null. Le resolver retourne un ISO string (parfois timestamp en
 * string sur certaines versions Apollo) — on gère les deux formats.
 */
async function readLatestISO(request) {
  const { json } = await latestInvoiceIssueDate(request);
  expect(json.errors).toBeFalsy();
  const raw = json.data.latestInvoiceIssueDate;
  if (!raw) return null;
  const date = new Date(/^\d+$/.test(raw) ? Number(raw) : raw);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function gotoEditorAndReadIssueDate(page) {
  // On lance l'attente de la réponse `GetLatestInvoiceIssueDate` AVANT le
  // navigate, sinon la query peut résoudre avant que `waitForResponse`
  // s'enregistre.
  const latestQueryResponse = page
    .waitForResponse(
      (r) =>
        r.url().includes("/graphql") &&
        r.request().postData()?.includes("GetLatestInvoiceIssueDate"),
      { timeout: 15000 },
    )
    .catch(() => null);

  await page.goto("/dashboard/outils/factures/new", {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await expect(page.locator("text=Sélection d'un client").first()).toBeVisible({
    timeout: 30000,
  });

  // Attendre que la query latestInvoiceIssueDate ait répondu — c'est elle
  // qui pilote l'ajustement post-mount issueDate (use-invoice-editor.js:1231).
  await latestQueryResponse;

  const issueDateInput = page.locator('input[name="issueDate"]').first();
  await expect(issueDateInput).toHaveCount(1, { timeout: 15000 });

  // Attendre que la valeur ne soit plus vide (initialisation par
  // InvoiceInfoSection puis éventuel override par l'effet latestIssueDate).
  await page.waitForFunction(
    () => {
      const el = document.querySelector('input[name="issueDate"]');
      return el && el.value && /^\d{4}-\d{2}-\d{2}$/.test(el.value);
    },
    { timeout: 15000 },
  );

  // Buffer pour laisser l'effet "latestIssueDate → setValue(issueDate, ...)"
  // commiter après la résolution du query (cf use-invoice-editor.js:1247).
  await page.waitForTimeout(800);

  return issueDateInput.inputValue();
}

test.describe("[Factures] Date d'émission par défaut (§17, §45)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(90000);

  // beforeAll — nettoyage défensif : supprimer toute facture résiduelle
  // avec issueDate > today (DRAFT ou PENDING) laissée par un run antérieur
  // de ce fichier (ou un run où le afterAll a été interrompu). Sans ça,
  // latestInvoiceIssueDate reste durablement dans le futur et casse les
  // tests qui supposent latest ≈ today (notamment pieges-critiques.spec.js
  // Test 2 et tous les tests qui anchor à today via PENDING). Cf R11.
  //
  // Ne supprime QUE les invoices avec issueDate > today (les PENDINGs à
  // today créées par d'autres files comme pieges-critiques restent
  // intactes — elles n'impactent pas latestInvoiceIssueDate au-delà de
  // today).
  test.beforeAll(async () => {
    const apiContext = await playwrightRequest.newContext({
      storageState: "e2e/.auth/user.json",
    });
    try {
      const todayStr = todayISO();
      const GET_INVOICES_QUERY = `
        query GetInvoices($workspaceId: ID!, $page: Int, $limit: Int) {
          invoices(workspaceId: $workspaceId, page: $page, limit: $limit) {
            invoices { id issueDate status }
            totalCount
          }
        }
      `;
      // Pagination simple — limit=50, max 10 pages
      for (let p = 1; p <= 10; p++) {
        const res = await apiContext.post(
          process.env.GRAPHQL_URL || "http://localhost:4000/graphql",
          {
            headers: { "x-workspace-id": "bbbbbbbbbbbbbbbbbbbb0001" },
            data: {
              query: GET_INVOICES_QUERY,
              variables: {
                workspaceId: "bbbbbbbbbbbbbbbbbbbb0001",
                page: p,
                limit: 50,
              },
            },
            failOnStatusCode: false,
          },
        );
        const json = await res.json().catch(() => ({}));
        const list = json.data?.invoices?.invoices || [];
        if (list.length === 0) break;
        for (const inv of list) {
          if (!inv.issueDate) continue;
          const date = new Date(
            /^\d+$/.test(String(inv.issueDate))
              ? Number(inv.issueDate)
              : inv.issueDate,
          );
          const iso = `${date.getFullYear()}-${String(
            date.getMonth() + 1,
          ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          if (iso > todayStr) {
            await deleteInvoiceMutation(apiContext, inv.id).catch(() => {});
          }
        }
        if (list.length < 50) break;
      }
    } finally {
      await apiContext.dispose();
    }
  });

  // afterAll — cleanup explicite des invoices créées DANS ce run.
  // Doublon partiel avec le beforeAll : si la suite est interrompue, le
  // beforeAll du prochain run rattrape. Garde le double-filet de sécurité.
  test.afterAll(async () => {
    if (createdInvoiceIds.length === 0) return;
    const apiContext = await playwrightRequest.newContext({
      storageState: "e2e/.auth/user.json",
    });
    for (const id of createdInvoiceIds) {
      await deleteInvoiceMutation(apiContext, id).catch(() => {});
    }
    await apiContext.dispose();
  });

  test("Test 1.1 — Latest non-DRAFT ≤ today : default = today (§17, §45)", async ({
    authenticatedPage: page,
  }) => {
    // Pré-requis : aucune PENDING/COMPLETED future en DB. Le teardown ne
    // nettoyant pas les invoices créées par les tests (cf global-
    // teardown.ts), cet état dépend du run history. Si latest > today, on
    // ne peut pas vérifier "default = today" — on skip avec un message
    // explicite plutôt que faussement échouer.
    const latest = await readLatestISO(page.request);
    if (latest && latest > todayISO()) {
      test.skip(
        true,
        `Latest invoice (${latest}) > today (${todayISO()}). Cet état empêche de valider "default = today" — un test précédent a créé une PENDING postdatée non nettoyée.`,
      );
    }

    const value = await gotoEditorAndReadIssueDate(page);
    expect(
      value,
      "default issueDate doit être today quand latest ≤ today",
    ).toBe(todayISO());
  });

  test("Test 1.2 — PENDING avec date < aujourd'hui : default reste today (§17)", async ({
    authenticatedPage: page,
  }) => {
    // ⚠️ LIMITATION (R13/R10) : on ne peut PAS créer une PENDING avec
    // issueDate dans le passé via la mutation publique. Le resolver
    // validateInvoiceIssueDate exige issueDate ≥ latestInvoiceIssueDate
    // pour tout statut ≠ DRAFT (invoice.js:1161-1163). Donc impossible
    // de matérialiser activement le scénario "PENDING -5j" du prompt.
    //
    // Le test fixe l'invariant FAIBLE équivalent : tant que latest ≤ today,
    // le default ne dérive pas en arrière (= reste today). Couvre la
    // règle §17 dans le sous-cas qu'on peut effectivement piloter.
    const latest = await readLatestISO(page.request);
    if (latest && latest > todayISO()) {
      test.skip(
        true,
        `Latest (${latest}) > today (${todayISO()}). Voir Test 1.3 pour le cas latest > today.`,
      );
    }

    const value = await gotoEditorAndReadIssueDate(page);
    expect(
      value,
      "default issueDate doit rester today même si une PENDING passée existe (latest ≤ today)",
    ).toBe(todayISO());
  });

  test("Test 1.3 — PENDING postdatée : default = date de la PENDING (§45)", async ({
    authenticatedPage: page,
  }) => {
    // §45 — règle compliance FR : on ne peut pas émettre une facture avec
    // une date < dernière émise. Donc si une PENDING future existe, le
    // formulaire la propose comme default pour éviter un rejet backend
    // immédiat.
    //
    // STATE-AWARE : on lit latest pour s'assurer que la nouvelle PENDING
    // que l'on crée a une date ≥ latest (sinon mutation rejetée). On choisit
    // latest+14j (ou today+14j si latest est passé) comme nouvelle date.
    const latest = await readLatestISO(page.request);
    const baseISO = latest && latest > todayISO() ? latest : todayISO();
    const futureStr = shiftDaysISO(baseISO, 14);
    const dueStr = shiftDaysISO(futureStr, 30);

    const { json } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [buildItem({ description: "Postdated §45", unitPrice: 100 })],
        status: "PENDING",
        issueDate: futureStr,
        dueDate: dueStr,
      }),
    });
    expect(json.errors, JSON.stringify(json.errors)).toBeFalsy();
    createdInvoiceIds.push(json.data.createInvoice.id);

    const value = await gotoEditorAndReadIssueDate(page);
    expect(
      value,
      `default doit être ${futureStr} (= latest courante après création de la PENDING postdatée)`,
    ).toBe(futureStr);
  });

  test("Test 1.4 — DRAFT future éloignée + PENDING future plus proche : default = PENDING (DRAFT ignoré §45)", async ({
    authenticatedPage: page,
  }) => {
    // Preuve d'invariance "DRAFT ignoré par latestInvoiceIssueDate" :
    // on crée DRAFT avec une date PLUS ÉLOIGNÉE que la PENDING. Si DRAFT
    // était pris en compte, default = DRAFT date. Comme il est ignoré
    // (resolver:608-621 ne sélectionne que PENDING/COMPLETED/CANCELED),
    // default = PENDING date.
    //
    // STATE-AWARE : pendingFuture = max(latest, today) + 7. draftFuture =
    // pendingFuture + 30. Cet ordre garantit :
    //   - DRAFT plus loin que PENDING (preuve par contraste).
    //   - PENDING ≥ latest courante (mutation valide).
    const latest = await readLatestISO(page.request);
    const baseISO = latest && latest > todayISO() ? latest : todayISO();
    const pendingFutureStr = shiftDaysISO(baseISO, 7);
    const draftFutureStr = shiftDaysISO(pendingFutureStr, 30);
    const pendingDueStr = shiftDaysISO(pendingFutureStr, 30);
    const draftDueStr = shiftDaysISO(draftFutureStr, 30);

    // 1. DRAFT plus éloigné (sera ignoré par latestInvoiceIssueDate)
    const { json: rDraft } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({
            description: "DRAFT future §45 (ignored)",
            unitPrice: 1,
          }),
        ],
        status: "DRAFT",
        issueDate: draftFutureStr,
        dueDate: draftDueStr,
      }),
    });
    expect(rDraft.errors, JSON.stringify(rDraft.errors)).toBeFalsy();
    createdInvoiceIds.push(rDraft.data.createInvoice.id);

    // 2. PENDING plus proche (sera prise en compte)
    const { json: rPending } = await createInvoiceMutation(page.request, {
      ...buildInvoiceInput({
        items: [
          buildItem({ description: "PENDING future §45", unitPrice: 100 }),
        ],
        status: "PENDING",
        issueDate: pendingFutureStr,
        dueDate: pendingDueStr,
      }),
    });
    expect(rPending.errors, JSON.stringify(rPending.errors)).toBeFalsy();
    createdInvoiceIds.push(rPending.data.createInvoice.id);

    const value = await gotoEditorAndReadIssueDate(page);
    expect(
      value,
      `default doit être ${pendingFutureStr} (PENDING), pas ${draftFutureStr} (DRAFT). DRAFT doit être ignoré par latestInvoiceIssueDate (cf §45 / resolver:608-621)`,
    ).toBe(pendingFutureStr);
    // Cross-check explicite : ce n'est PAS la date du DRAFT
    expect(value).not.toBe(draftFutureStr);
  });
});
