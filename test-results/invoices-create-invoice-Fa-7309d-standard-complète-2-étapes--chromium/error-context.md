# Test info

- Name: Factures >> Flow: Création facture standard complète (2 étapes)
- Location: /Users/sofianemtimet/Downloads/newbiV2ALL/newbiv2/e2e/invoices/create-invoice.spec.js:63:7

# Error details

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('[data-state="closed"]').first()
    - locator resolved to <button type="button" data-size="lg" id="radix-_r_1h_" data-active="false" data-state="closed" aria-haspopup="menu" aria-expanded="false" data-sidebar="menu-button" data-tutorial="team-switcher" data-slot="dropdown-menu-trigger" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left font-normal -tracking-[0.01em] text-sidebar-foreground outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent disabled:poin…>…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
      - waiting 100ms
    148 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - element is outside of the viewport
      - retrying click action
        - waiting 500ms

    at /Users/sofianemtimet/Downloads/newbiV2ALL/newbiv2/e2e/invoices/create-invoice.spec.js:101:30
```

# Page snapshot

```yaml
- list:
  - listitem:
    - button "NewBi Logo":
      - img "NewBi Logo"
- list:
  - listitem:
    - link "Dashboard":
      - /url: /dashboard
      - button "Dashboard"
  - listitem:
    - button "Finances"
  - listitem:
    - button "Ventes"
  - listitem:
    - button "Clients"
  - listitem:
    - link "Factures d'achat":
      - /url: /dashboard/outils/factures-achat
      - button "Factures d'achat"
  - listitem:
    - link "Calendrier":
      - /url: /dashboard/calendar
      - button "Calendrier"
- list:
  - listitem:
    - button "Tâches"
  - listitem:
    - button "Documents"
  - listitem:
    - button "Communication"
- list:
  - listitem:
    - button "Notifications"
    - text: "3"
- list:
  - listitem:
    - button "Paramètres"
- list:
  - listitem:
    - button "Aide et support"
- list:
  - listitem:
    - link "Recherche":
      - /url: "#"
- list:
  - listitem:
    - button "Sophies Abonnement actif":
      - img "Sophies"
      - text: Abonnement actif
- main:
  - button "Toggle Sidebar"
  - text: Espace sweily PRO
  - button
  - heading "Nouvelle facture" [level=1]
  - paragraph: Modifications non sauvegardées
  - button
  - button "1 erreur à corriger":
    - paragraph: 1 erreur à corriger
  - list:
    - listitem: "Certains articles sont incomplets: Article 1: description manquante"
  - text: Articles et produits
  - checkbox "Auto-liquidation (TVA non applicable - Article 283 du CGI)"
  - text: Auto-liquidation (TVA non applicable - Article 283 du CGI)
  - combobox: Rechercher un produit...
  - button "Ajouter un article"
  - heading "Article 1 1 unité • 0,00 €/unité 0,00 € HT • 20% TVA • 0,00 € TTC" [level=3]:
    - button "Article 1 1 unité • 0,00 €/unité 0,00 € HT • 20% TVA • 0,00 € TTC":
      - text: Article 1 1 unité • 0,00 €/unité 0,00 € HT • 20% TVA • 0,00 € TTC
      - button
  - button "Ajouter un article"
  - text: Remises et totaux Type de remise
  - combobox: Pourcentage (%)
  - text: Valeur de la remise
  - spinbutton "Valeur de la remise": "0"
  - button "Options avancées"
  - text: Champs personnalisés
  - paragraph: Aucun champ personnalisé ajouté
  - button "Ajouter un champ personnalisé"
  - button "Annuler"
  - button "Brouillon"
  - button
  - button "Créer la facture" [disabled]
  - img "Logo entreprise"
  - text: "Facture proforma Numéro de facture: F-032026-0018 Date d'émission: 11/03/2026 Date d'échéance: 10/04/2026 MOVEO 14 RUE ROGER SALENGRO 64000 PAU 64000 PAU France luffy32291@gmail.com +33644725409 http://www.newbi.fr SIRET: 85403887400012 APPLE LE BORD DES BOIS 76870 GAILLEFONTAINE France sofiane23@gmail.ui SIRET: 408004323"
  - table:
    - rowgroup:
      - row "Description Qté Prix unitaire TVA (%) Total HT":
        - cell "Description"
        - cell "Qté"
        - cell "Prix unitaire"
        - cell "TVA (%)"
        - cell "Total HT"
    - rowgroup:
      - row "1 0,00 € 20 % 0,00 €":
        - cell
        - cell "1"
        - cell "0,00 €"
        - cell "20 %"
        - cell "0,00 €"
  - text: "Total HT 0,00 € TVA 20% 0,00 € Total TTC 0,00 € MOVEO • 6589 au capital de 10000 • SIREN 854038874 • RCS Ville 123 456 789 • Siège: 14 RUE ROGER SALENGRO 64000 PAU, 64000, PAU"
- button "S"
- region "Notifications alt+T"
- button
- alert
```

# Test source

```ts
   1 | import { test, expect } from '../fixtures/auth.fixture.js';
   2 |
   3 | // Helper : attend que la page factures liste soit chargée (après ProRouteGuard + GraphQL)
   4 | async function waitForInvoicesPage(page) {
   5 |   await page.goto('/dashboard/outils/factures', { waitUntil: 'domcontentloaded', timeout: 45000 });
   6 |   await expect(page.locator('text=Factures clients').first()).toBeVisible({ timeout: 30000 });
   7 |   // Attendre que les skeletons disparaissent et les vraies données chargent
   8 |   await page.waitForTimeout(3000);
   9 | }
   10 |
   11 | // Helper : attend que l'éditeur de facture soit chargé
   12 | async function waitForInvoiceEditor(page) {
   13 |   await page.goto('/dashboard/outils/factures/new', { waitUntil: 'domcontentloaded', timeout: 45000 });
   14 |   await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 30000 });
   15 | }
   16 |
   17 | // Helper : sélectionner le premier client disponible via le combobox
   18 | async function selectFirstClient(page) {
   19 |   // Le sélecteur client est un button[role="combobox"]
   20 |   const combobox = page.locator('button[role="combobox"]').first();
   21 |   await combobox.click();
   22 |
   23 |   // Attendre que la liste de clients charge (pas "Aucun client trouvé" ni "Recherche...")
   24 |   // Les clients sont des boutons dans le popover avec une classe hover:bg-accent
   25 |   const clientOption = page.locator('[data-radix-popper-content-wrapper] .max-h-\\[280px\\] button').first();
   26 |
   27 |   // Attendre que le premier client apparaisse (max 10s)
   28 |   await expect(clientOption).toBeVisible({ timeout: 10000 });
   29 |   await clientOption.click();
   30 |   await page.waitForTimeout(500);
   31 |   return true;
   32 | }
   33 |
   34 | // Helper : passer à l'étape 2
   35 | async function goToStep2(page) {
   36 |   await page.locator('button:has-text("Suivant")').first().click();
   37 |   await expect(page.locator('text=Articles et produits')).toBeVisible({ timeout: 10000 });
   38 | }
   39 |
   40 | test.describe('Factures', () => {
   41 |   test.setTimeout(90000); // Ces tests font beaucoup de navigation + attente GraphQL
   42 |
   43 |   test('Flow: Page liste — header, stats, boutons, dropdown, tableau', async ({ authenticatedPage: page }) => {
   44 |     await waitForInvoicesPage(page);
   45 |
   46 |     // Stats
   47 |     await expect(page.locator('text=CA facturé')).toBeVisible();
   48 |     await expect(page.locator('text=CA payé')).toBeVisible();
   49 |
   50 |     // Boutons d'action
   51 |     await expect(page.locator('button:has-text("Nouvelle facture")').first()).toBeVisible();
   52 |     await expect(page.locator('button:has-text("Importer")').first()).toBeVisible();
   53 |
   54 |     // Dropdown "Facture vierge"
   55 |     const dropdownTrigger = page.locator('button:has-text("Nouvelle facture") + button').first();
   56 |     if (await dropdownTrigger.isVisible({ timeout: 3000 })) {
   57 |       await dropdownTrigger.click();
   58 |       await expect(page.locator('[role="menuitem"]:has-text("Facture vierge")')).toBeVisible({ timeout: 3000 });
   59 |       await page.keyboard.press('Escape');
   60 |     }
   61 |   });
   62 |
   63 |   test('Flow: Création facture standard complète (2 étapes)', async ({ authenticatedPage: page }) => {
   64 |     // Naviguer depuis la liste
   65 |     await waitForInvoicesPage(page);
   66 |     await page.locator('button:has-text("Nouvelle facture")').first().click();
   67 |     await page.waitForURL('**/factures/new**', { timeout: 15000 });
   68 |
   69 |     // --- ÉTAPE 1 : Client + Infos facture ---
   70 |     await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 15000 });
   71 |
   72 |     // Vérifier type de facture avec 3 options
   73 |     await expect(page.locator('text=Type de facture')).toBeVisible({ timeout: 5000 });
   74 |     const typeSelect = page.locator('#invoice-type').first();
   75 |     await typeSelect.click();
   76 |     await expect(page.locator('[role="option"]:has-text("Facture")').first()).toBeVisible({ timeout: 3000 });
   77 |     await expect(page.locator('[role="option"]:has-text("Facture d\'acompte")')).toBeVisible();
   78 |     await expect(page.locator('[role="option"]:has-text("Facture de situation")')).toBeVisible();
   79 |     await page.locator('[role="option"]:has-text("Facture")').first().click();
   80 |
   81 |     // Sélectionner un client via le combobox
   82 |     await selectFirstClient(page);
   83 |
   84 |     // Numéro de facture pré-rempli
   85 |     const pageText = await page.textContent('body');
   86 |     expect(pageText).toContain('F-');
   87 |
   88 |     // Suivant → Étape 2
   89 |     await goToStep2(page);
   90 |
   91 |     // Checkbox auto-liquidation visible
   92 |     await expect(page.locator('label:has-text("Auto-liquidation")').first()).toBeVisible();
   93 |
   94 |     // Ajouter un article
   95 |     await page.locator('button:has-text("Ajouter un article")').first().click();
   96 |     await page.waitForTimeout(500);
   97 |
   98 |     // Ouvrir l'accordion de l'article
   99 |     const accordionTrigger = page.locator('[data-state="closed"]').first();
  100 |     if (await accordionTrigger.isVisible({ timeout: 3000 })) {
> 101 |       await accordionTrigger.click();
      |                              ^ Error: locator.click: Test timeout of 90000ms exceeded.
  102 |       await page.waitForTimeout(300);
  103 |     }
  104 |
  105 |     // Remplir description
  106 |     const descInput = page.locator('input[id*="item-description"]').first();
  107 |     if (await descInput.isVisible({ timeout: 3000 })) {
  108 |       await descInput.fill('Prestation de conseil');
  109 |     }
  110 |
  111 |     // Remplir prix unitaire
  112 |     const priceInput = page.locator('input[id*="unitPrice"], input[name*="unitPrice"]').first();
  113 |     if (await priceInput.isVisible({ timeout: 3000 })) {
  114 |       await priceInput.click();
  115 |       await priceInput.fill('2000');
  116 |     }
  117 |
  118 |     // Total avec TVA 20% visible
  119 |     await page.waitForTimeout(500);
  120 |     await expect(page.locator('text=20% TVA').first()).toBeVisible({ timeout: 3000 });
  121 |
  122 |     // Bouton "Créer la facture" visible
  123 |     await expect(page.locator('button:has-text("Créer la facture")').first()).toBeVisible({ timeout: 5000 });
  124 |
  125 |     // Retour étape 1 et retour étape 2 (navigation bi-directionnelle)
  126 |     await page.locator('button:has(svg.lucide-chevron-left)').first().click();
  127 |     await expect(page.locator('text=Sélection d\'un client').first()).toBeVisible({ timeout: 5000 });
  128 |     await goToStep2(page);
  129 |   });
  130 |
  131 |   test('Flow: Création facture d\'acompte', async ({ authenticatedPage: page }) => {
  132 |     await waitForInvoiceEditor(page);
  133 |
  134 |     // Sélectionner type "Facture d'acompte"
  135 |     const typeSelect = page.locator('#invoice-type').first();
  136 |     await typeSelect.click();
  137 |     await page.locator('[role="option"]:has-text("Facture d\'acompte")').click();
  138 |     await expect(typeSelect).toContainText('acompte');
  139 |
  140 |     // Sélectionner un client
  141 |     await selectFirstClient(page);
  142 |
  143 |     // Passer à l'étape 2
  144 |     await goToStep2(page);
  145 |
  146 |     // Ajouter un article
  147 |     await page.locator('button:has-text("Ajouter un article")').first().click();
  148 |     await page.waitForTimeout(500);
  149 |     await expect(page.locator('button:has-text("Créer la facture")').first()).toBeVisible({ timeout: 5000 });
  150 |   });
  151 |
  152 |   test('Flow: Création facture de situation — référence auto-générée', async ({ authenticatedPage: page }) => {
  153 |     await waitForInvoiceEditor(page);
  154 |
  155 |     // Sélectionner type "Facture de situation"
  156 |     const typeSelect = page.locator('#invoice-type').first();
  157 |     await typeSelect.click();
  158 |     await page.locator('[role="option"]:has-text("Facture de situation")').click();
  159 |
  160 |     // Vérifier le texte sur la référence auto
  161 |     await page.waitForTimeout(500);
  162 |     const infoText = page.locator('text=référence unique').first();
  163 |     const hasInfo = await infoText.isVisible({ timeout: 3000 }).catch(() => false);
  164 |     expect(hasInfo).toBeTruthy();
  165 |
  166 |     // Sélectionner un client
  167 |     await selectFirstClient(page);
  168 |     await goToStep2(page);
  169 |   });
  170 |
  171 |   test('Flow: Auto-liquidation met la TVA à 0%', async ({ authenticatedPage: page }) => {
  172 |     await waitForInvoiceEditor(page);
  173 |     await selectFirstClient(page);
  174 |     await goToStep2(page);
  175 |
  176 |     // Cocher auto-liquidation
  177 |     await page.locator('#isReverseCharge').first().click();
  178 |
  179 |     // Ajouter un article
  180 |     await page.locator('button:has-text("Ajouter un article")').first().click();
  181 |     await page.waitForTimeout(500);
  182 |
  183 |     // TVA 0%
  184 |     await expect(page.locator('text=0% TVA').first()).toBeVisible({ timeout: 3000 });
  185 |   });
  186 |
  187 |   test('Flow: Actions liste — clic ligne, menu, paramètres, relances', async ({ authenticatedPage: page }) => {
  188 |     await waitForInvoicesPage(page);
  189 |
  190 |     // Attendre que le tableau ait des vraies données
  191 |     // Les skeletons sont des Skeleton components, les vraies lignes ont du texte lisible
  192 |     await page.waitForTimeout(5000);
  193 |     const realRow = page.locator('table tbody tr').first();
  194 |     await expect(realRow).toBeVisible({ timeout: 15000 });
  195 |
  196 |     // --- Clic sur une facture → sidebar ou navigation ---
  197 |     await realRow.click();
  198 |     await page.waitForTimeout(2000);
  199 |
  200 |     // Vérifier que quelque chose s'est passé (sidebar, navigation, ou page de détail)
  201 |     const pageText = await page.textContent('body');
```