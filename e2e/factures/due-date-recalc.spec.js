/**
 * Date d'échéance recalculée dynamiquement sur /factures/new.
 *
 * Couvre INVOICES_PAGE.md §17 (calcul automatique date d'échéance =
 * date d'émission + délai de paiement).
 *
 * Règle métier (telle que documentée par le produit) :
 *   "Quand l'utilisateur change la date d'émission, la date d'échéance
 *   doit se recalculer automatiquement = issueDate + N jours, où N est
 *   le délai sélectionné dans le dropdown."
 *
 * État du code (cf InvoiceInfoSection.jsx:753-781) :
 *   - Changer le DÉLAI dans le Select déclenche le recalcul
 *     (onValueChange recalcule explicitement dueDate).
 *   - Changer la DATE D'ÉMISSION via le Calendar ne re-déclenche PAS le
 *     recalcul — pas d'effet "sync dueDate quand issueDate change".
 *     Conséquence : Tests 2.1-2.5 sont attendus rouges (cf R13).
 *
 * Stratégie : on simule le changement d'issueDate par un événement
 * "change" DOM sur le hidden input — c'est la même mécanique que celle
 * qu'utilise react-hook-form via register(). Si un effet "issueDate →
 * dueDate" existait, il s'exécuterait quel que soit le déclencheur (UI
 * Calendar ou event direct), donc l'invariant est testable sans piloter
 * la complexité de react-day-picker dans Playwright.
 */
import { test } from "../fixtures/auth.fixture";
import { expect } from "@playwright/test";

function shiftDaysISO(baseISO, days) {
  // baseISO au format YYYY-MM-DD (cf formatLocalDate). On manipule via Date
  // en timezone locale pour éviter les drifts UTC (cf bug du 7 janvier
  // documenté dans formatLocalDate).
  const [y, m, d] = baseISO.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function gotoEditor(page) {
  // On enregistre l'écoute de la query latestInvoiceIssueDate AVANT le
  // navigate — sinon la query peut résoudre avant qu'on s'abonne.
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

  // Attendre la query latest avant de lire les valeurs — l'effet
  // d'ajustement issueDate/dueDate (use-invoice-editor.js:1231-1272) en
  // dépend.
  await latestQueryResponse;

  // Attendre que les valeurs initiales soient remplies (non vides).
  await page.waitForFunction(
    () => {
      const issue = document.querySelector('input[name="issueDate"]');
      const due = document.querySelector('input[name="dueDate"]');
      return (
        issue?.value &&
        /^\d{4}-\d{2}-\d{2}$/.test(issue.value) &&
        due?.value &&
        /^\d{4}-\d{2}-\d{2}$/.test(due.value)
      );
    },
    { timeout: 15000 },
  );

  // Polling de stabilité : la valeur peut être réécrite par
  // l'effet latestIssueDate. On attend 2 lectures successives identiques
  // (séparées de 200ms) avant de considérer la valeur stable.
  await page.waitForFunction(
    () => {
      const el = document.querySelector('input[name="issueDate"]');
      if (!window.__lastIssueDateValue) {
        window.__lastIssueDateValue = el.value;
        return false;
      }
      if (window.__lastIssueDateValue === el.value) {
        return true;
      }
      window.__lastIssueDateValue = el.value;
      return false;
    },
    { timeout: 10000, polling: 250 },
  );
  // Cleanup pour ne pas polluer les tests suivants
  await page.evaluate(() => {
    delete window.__lastIssueDateValue;
  });
}

async function readField(page, name) {
  return page.locator(`input[name="${name}"]`).first().inputValue();
}

/**
 * Sélectionne un délai dans le dropdown "Date d'échéance > délai".
 * Le SelectTrigger est sans label dédié — on l'identifie via son placeholder
 * "30 jours" (option par défaut affichée tant que l'utilisateur n'a pas
 * sélectionné autre chose).
 *
 * @param {string} optionLabel  Texte exact de l'option (ex: "60 jours",
 *                              "Paiement à réception", "30 jours").
 */
async function selectPaymentDelay(page, optionLabel) {
  // Le Select trigger est dans la grid à 2 colonnes sous "Date d'échéance".
  // Premier SelectTrigger qui contient "jours" ou "Paiement à réception".
  const trigger = page
    .locator('button[role="combobox"]')
    .filter({ hasText: /jours|Paiement à réception/i })
    .first();
  await expect(trigger).toBeVisible({ timeout: 5000 });
  await trigger.click();
  // Les options sont dans un Radix popper portal
  const option = page
    .locator(`[role="option"]:has-text("${optionLabel}")`)
    .first();
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();
  // Le Select onValueChange recalcule dueDate immédiatement (synchronous
  // setValue), pas besoin d'attente longue.
  await page.waitForTimeout(150);
}

/**
 * Simule un changement d'issueDate via le mécanisme DOM identique à celui
 * que pilote react-day-picker (Calendar onSelect → setValue). On dispatch
 * un événement input/change sur le hidden input enregistré par RHF, ce qui
 * met à jour la valeur côté form state et déclenche les useEffect qui
 * watchent issueDate.
 *
 * Si un effet "issueDate → dueDate recalc" existait dans use-invoice-editor
 * ou InvoiceInfoSection, il se déclencherait ici comme via le Calendar
 * (RHF.subscribe est event-source-agnostique).
 */
async function setIssueDateViaEvent(page, dateISO) {
  await page
    .locator('input[name="issueDate"]')
    .first()
    .evaluate((el, value) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, dateISO);
  // Laisser passer un tick pour que les effets RHF s'exécutent
  await page.waitForTimeout(200);
}

test.describe("[Factures] Date d'échéance — recalcul dynamique (§17)", () => {
  test.describe.configure({ retries: 1 });
  test.setTimeout(60000);

  test("Test 2.1 — Délai 30j : changer issueDate doit recalculer dueDate à +30j", async ({
    authenticatedPage: page,
  }) => {
    // ⚠️ Comportement attendu non implémenté côté front (R13). Aucun useEffect
    // ne re-synchronise dueDate quand issueDate change. Test attendu ROUGE.
    await gotoEditor(page);

    // Le délai par défaut est 30j (defaultValue="30"), pas besoin de toucher
    // au Select. Lire l'état initial pour s'assurer que dueDate = issue+30.
    const initialIssue = await readField(page, "issueDate");
    const initialDue = await readField(page, "dueDate");
    expect(initialDue).toBe(shiftDaysISO(initialIssue, 30));

    // Changer issueDate à une nouvelle date connue
    const newIssue = shiftDaysISO(initialIssue, 5); // +5j arbitraire
    await setIssueDateViaEvent(page, newIssue);

    // Asserter que dueDate s'est recalculé : new issue + 30
    const expectedDue = shiftDaysISO(newIssue, 30);
    const actualDue = await readField(page, "dueDate");
    expect(
      actualDue,
      `R13 — dueDate doit se recalculer quand issueDate change. Attendu ${expectedDue} (=${newIssue}+30), reçu ${actualDue}.`,
    ).toBe(expectedDue);
  });

  test("Test 2.2 — Délai 60j : changer issueDate doit recalculer dueDate à +60j", async ({
    authenticatedPage: page,
  }) => {
    // ⚠️ R13 — même limitation que Test 2.1.
    await gotoEditor(page);
    await selectPaymentDelay(page, "60 jours");

    const initialIssue = await readField(page, "issueDate");
    expect(await readField(page, "dueDate")).toBe(
      shiftDaysISO(initialIssue, 60),
    );

    const newIssue = shiftDaysISO(initialIssue, 3);
    await setIssueDateViaEvent(page, newIssue);

    const expectedDue = shiftDaysISO(newIssue, 60);
    const actualDue = await readField(page, "dueDate");
    expect(actualDue, "R13 — dueDate doit se recalculer (+60j)").toBe(
      expectedDue,
    );
  });

  test("Test 2.3 — Délai 15j : changer issueDate doit recalculer dueDate à +15j", async ({
    authenticatedPage: page,
  }) => {
    // ⚠️ R13.
    // Note : la liste PAYMENT_TERMS_SUGGESTIONS expose 0/15/30/45/60. Le
    // prompt mentionnait 7 jours mais cette option n'existe pas dans le
    // dropdown — on teste 15j à la place (option valide la plus proche).
    await gotoEditor(page);
    await selectPaymentDelay(page, "15 jours");

    const initialIssue = await readField(page, "issueDate");
    expect(await readField(page, "dueDate")).toBe(
      shiftDaysISO(initialIssue, 15),
    );

    const newIssue = shiftDaysISO(initialIssue, 2);
    await setIssueDateViaEvent(page, newIssue);

    const expectedDue = shiftDaysISO(newIssue, 15);
    const actualDue = await readField(page, "dueDate");
    expect(actualDue, "R13 — dueDate doit se recalculer (+15j)").toBe(
      expectedDue,
    );
  });

  test("Test 2.4 — Délai personnalisé : skipped (pas d'option custom dans le dropdown)", async () => {
    // Le dropdown PAYMENT_TERMS_SUGGESTIONS (cf InvoiceInfoSection.jsx:78-84)
    // expose : 0, 15, 30, 45, 60. Aucune option "Personnalisé". Pour saisir
    // un délai arbitraire, l'utilisateur doit choisir la dueDate dans le
    // Calendar manuellement — flux différent du dropdown. Test 2.4 du prompt
    // est inapplicable en l'état.
    test.skip(
      true,
      "Le dropdown délai n'expose pas d'option 'Personnalisé' (cf PAYMENT_TERMS_SUGGESTIONS). " +
        "Pour un délai custom, l'utilisateur doit ouvrir le Calendar dueDate, " +
        "ce qui est un autre flux. Test à activer si le dropdown évolue.",
    );
    // Simulacre d'assertion pour conserver la signature (jamais exécuté)
    expect(true).toBe(true);
  });

  test("Test 2.5 — Délai 0j (à réception) : dueDate = issueDate", async ({
    authenticatedPage: page,
  }) => {
    // Cas particulier — le Select expose "Paiement à réception" pour
    // délai=0. Quand l'utilisateur le choisit puis change issueDate,
    // dueDate doit suivre (= nouvelle issueDate, sans offset).
    // ⚠️ R13 — non implémenté actuellement.
    await gotoEditor(page);
    await selectPaymentDelay(page, "Paiement à réception");

    const initialIssue = await readField(page, "issueDate");
    expect(
      await readField(page, "dueDate"),
      "Avec délai=0, dueDate doit valoir issueDate immédiatement après sélection",
    ).toBe(initialIssue);

    const newIssue = shiftDaysISO(initialIssue, 4);
    await setIssueDateViaEvent(page, newIssue);

    const actualDue = await readField(page, "dueDate");
    expect(actualDue, "R13 — dueDate doit suivre issueDate (délai=0)").toBe(
      newIssue,
    );
  });

  test("Test 2.6 — Changer le délai sans toucher issueDate : dueDate recalcule (cas implémenté)", async ({
    authenticatedPage: page,
  }) => {
    // CE test fixe le comportement DÉJÀ implémenté (Select.onValueChange
    // recalcule dueDate explicitement, cf InvoiceInfoSection.jsx:753-763).
    // Sert de canary positif : si quelqu'un casse cette branche, on le sait.
    await gotoEditor(page);

    const initialIssue = await readField(page, "issueDate");
    // Default delay = 30
    expect(await readField(page, "dueDate")).toBe(
      shiftDaysISO(initialIssue, 30),
    );

    // Passer à 60 jours sans toucher issueDate
    await selectPaymentDelay(page, "60 jours");
    const dueAfter60 = await readField(page, "dueDate");
    expect(
      dueAfter60,
      "dueDate doit se recalculer à issueDate+60 quand on change le délai",
    ).toBe(shiftDaysISO(initialIssue, 60));

    // Vérification croisée : repasser à 15 jours
    await selectPaymentDelay(page, "15 jours");
    expect(await readField(page, "dueDate")).toBe(
      shiftDaysISO(initialIssue, 15),
    );
  });
});
