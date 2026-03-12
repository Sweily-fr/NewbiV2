# Test info

- Name: Factures >> Flow: Actions liste — clic ligne, menu, paramètres, relances
- Location: /Users/sofianemtimet/Downloads/newbiV2ALL/newbiv2/e2e/invoices/create-invoice.spec.js:187:7

# Error details

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('button:has(svg.lucide-settings)').first()
    - locator resolved to <button type="button" id="radix-_r_m_" data-size="default" data-active="false" data-state="closed" aria-haspopup="menu" aria-expanded="false" data-sidebar="menu-button" data-slot="dropdown-menu-trigger" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left font-normal -tracking-[0.01em] text-sidebar-foreground outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent disabled:pointer-events-none disabled:o…>…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="absolute inset-0 bg-black/60 p-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">…</div> from <main data-slot="sidebar-inset" class="bg-background relative flex w-full flex-1 flex-col overflow-hidden md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2">…</main> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="absolute inset-0 bg-black/60 p-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">…</div> from <main data-slot="sidebar-inset" class="bg-background relative flex w-full flex-1 flex-col overflow-hidden md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2">…</main> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    138 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <div class="absolute inset-0 bg-black/60 p-0 flex items-start justify-center overflow-y-auto py-4 md:py-12 px-2 md:px-24">…</div> from <main data-slot="sidebar-inset" class="bg-background relative flex w-full flex-1 flex-col overflow-hidden md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2">…</main> subtree intercepts pointer events
      - retrying click action
        - waiting 500ms

    at /Users/sofianemtimet/Downloads/newbiV2ALL/newbiv2/e2e/invoices/create-invoice.spec.js:214:28
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
  - heading "Factures clients" [level=1]
  - button
  - button
  - button "Importer"
  - button "Exporter"
  - button "Nouvelle facture"
  - text: CA facturé
  - img
  - text: 90 550,00 € HT CA payé
  - img
  - text: 55 100,00 € HT Factures en retard 1
  - img
  - text: 2 000,00 € HT
  - textbox "Recherchez par numéro, client ou montant..."
  - button "Filtres"
  - tablist:
    - tab "Toutes les factures 84" [selected]
    - tab "Brouillons 0"
    - tab "À encaisser 4"
    - tab "Terminées 13"
  - table:
    - rowgroup:
      - row "Sélectionner tout Client Date d'émission Échéance Statut Montant TTC Actions":
        - cell "Sélectionner tout":
          - checkbox "Sélectionner tout"
        - cell "Client"
        - cell "Date d'émission"
        - cell "Échéance"
        - cell "Statut"
        - cell "Montant TTC":
          - button "Montant TTC"
        - cell "Actions"
  - table:
    - rowgroup:
      - row "Sélectionner la ligne MARIO 0017 03/03/2026 02/04/2026 En attente 1 608,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "MARIO 0017"
        - cell "03/03/2026"
        - cell "02/04/2026"
        - cell "En attente"
        - cell "1 608,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 000015 26/02/2026 23/03/2026 En attente 5 400,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 000015"
        - cell "26/02/2026"
        - cell "23/03/2026"
        - cell "En attente"
        - cell "5 400,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne APPLE 000016 21/02/2026 13/03/2026 En attente 4 320,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "APPLE 000016"
        - cell "21/02/2026"
        - cell "13/03/2026"
        - cell "En attente"
        - cell "4 320,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne Jane Doe 000017 06/02/2026 08/03/2026 En retard En attente 2 400,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Jane Doe 000017"
        - cell "06/02/2026"
        - cell "08/03/2026 En retard"
        - cell "En attente"
        - cell "2 400,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne MARIO 0014 02/02/2026 04/03/2026 Terminée 1 476,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "MARIO 0014"
        - cell "02/02/2026"
        - cell "04/03/2026"
        - cell "Terminée"
        - cell "1 476,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne Kouloud Sweily 0013 02/02/2026 04/03/2026 Terminée 1 476,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Kouloud Sweily 0013"
        - cell "02/02/2026"
        - cell "04/03/2026"
        - cell "Terminée"
        - cell "1 476,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne John Doe 0012 29/01/2026 28/02/2026 Terminée 880,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "John Doe 0012"
        - cell "29/01/2026"
        - cell "28/02/2026"
        - cell "Terminée"
        - cell "880,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne Jane Doe 0011 29/01/2026 28/02/2026 Terminée 250,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Jane Doe 0011"
        - cell "29/01/2026"
        - cell "28/02/2026"
        - cell "Terminée"
        - cell "250,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne MARIO 000018 17/01/2026 16/02/2026 OVERDUE 960,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "MARIO 000018"
        - cell "17/01/2026"
        - cell "16/02/2026"
        - cell "OVERDUE"
        - cell "960,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 000019 12/01/2026 11/02/2026 OVERDUE 1 800,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 000019"
        - cell "12/01/2026"
        - cell "11/02/2026"
        - cell "OVERDUE"
        - cell "1 800,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 0010 22/12/2025 21/01/2026 Terminée 26 956,80 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 0010"
        - cell "22/12/2025"
        - cell "21/01/2026"
        - cell "Terminée"
        - cell "26 956,80 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 0009 22/12/2025 21/01/2026 Terminée 14 515,20 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 0009"
        - cell "22/12/2025"
        - cell "21/01/2026"
        - cell "Terminée"
        - cell "14 515,20 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne APPLE 0008 22/12/2025 21/01/2026 Terminée 3 330,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "APPLE 0008"
        - cell "22/12/2025"
        - cell "21/01/2026"
        - cell "Terminée"
        - cell "3 330,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne APPLE 0007 22/12/2025 21/01/2026 Terminée 3 330,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "APPLE 0007"
        - cell "22/12/2025"
        - cell "21/01/2026"
        - cell "Terminée"
        - cell "3 330,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 0006 21/12/2025 20/01/2026 Annulée 12,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 0006"
        - cell "21/12/2025"
        - cell "20/01/2026"
        - cell "Annulée"
        - cell "12,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 0005 21/12/2025 20/01/2026 Terminée 5 000,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 0005"
        - cell "21/12/2025"
        - cell "20/01/2026"
        - cell "Terminée"
        - cell "5 000,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 0004 21/12/2025 20/01/2026 Terminée 5 000,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 0004"
        - cell "21/12/2025"
        - cell "20/01/2026"
        - cell "Terminée"
        - cell "5 000,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 0003 21/12/2025 20/01/2026 Terminée 500,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 0003"
        - cell "21/12/2025"
        - cell "20/01/2026"
        - cell "Terminée"
        - cell "500,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 0002 21/12/2025 20/01/2026 Terminée 600,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 0002"
        - cell "21/12/2025"
        - cell "20/01/2026"
        - cell "Terminée"
        - cell "600,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 000001 20/12/2025 19/01/2026 Terminée 400,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 000001"
        - cell "20/12/2025"
        - cell "19/01/2026"
        - cell "Terminée"
        - cell "400,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne APPLE 000020 03/12/2025 17/01/2026 OVERDUE 3 600,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "APPLE 000020"
        - cell "03/12/2025"
        - cell "17/01/2026"
        - cell "OVERDUE"
        - cell "3 600,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne Jane Doe 000021 03/11/2025 18/12/2025 OVERDUE 5 040,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Jane Doe 000021"
        - cell "03/11/2025"
        - cell "18/12/2025"
        - cell "OVERDUE"
        - cell "5 040,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne MARIO 000022 04/10/2025 23/11/2025 OVERDUE 9 600,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "MARIO 000022"
        - cell "04/10/2025"
        - cell "23/11/2025"
        - cell "OVERDUE"
        - cell "9 600,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne SWEILY 000023 04/09/2025 24/10/2025 OVERDUE 7 800,00 € Ouvrir le menu":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "SWEILY 000023"
        - cell "04/09/2025"
        - cell "24/10/2025"
        - cell "OVERDUE"
        - cell "7 800,00 €"
        - cell "Ouvrir le menu":
          - button "Ouvrir le menu"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
      - row "Sélectionner la ligne Client inconnu - - À vérifier 0,00 € Import":
        - cell "Sélectionner la ligne":
          - checkbox "Sélectionner la ligne"
        - cell "Client inconnu"
        - cell "-"
        - cell "-"
        - cell "À vérifier"
        - cell "0,00 €"
        - cell "Import"
  - text: 0 sur 84 ligne(s) sélectionnée(s).
  - paragraph: Lignes par page
  - combobox: "50"
  - text: Page 1 sur 2
  - navigation "pagination":
    - list:
      - listitem:
        - button "Go to first page" [disabled]
      - listitem:
        - button "Go to previous page" [disabled]
      - listitem:
        - button "Go to next page"
      - listitem:
        - button "Go to last page"
  - img "Logo entreprise"
  - text: "Facture Numéro de facture: F-032026-0017 Date d'émission: 03/03/2026 Date d'échéance: 02/04/2026 MOVEO 14 RUE ROGER SALENGRO 64000 PAU 64000 PAU France luffy32291@gmail.com +33644725409 http://www.newbi.fr SIRET: 85403887400012 MARIO serzer 75001 Paris France sofianetest@gmail.com SIRET: 12345678901234"
  - table:
    - rowgroup:
      - row "Description Qté Prix unitaire TVA (%) Total HT":
        - cell "Description"
        - cell "Qté"
        - cell "Prix unitaire"
        - cell "TVA (%)"
        - cell "Total HT"
    - rowgroup:
      - row "Site vitrine 1 1 340,00 € 20 % 1 340,00 €":
        - cell "Site vitrine"
        - cell "1"
        - cell "1 340,00 €"
        - cell "20 %"
        - cell "1 340,00 €"
  - text: "Total HT 1 340,00 € TVA 20% 268,00 € Total TVA 268,00 € Total TTC 1 608,00 € MOVEO • Capital: 10000 • SIREN 854038874 • RCS Ville 123 456 789 • Siège: 14 RUE ROGER SALENGRO 64000 PAU, 64000, PAU"
  - heading "Facture F-032026-0017" [level=2]
  - text: En attente
  - img "Logo entreprise"
  - text: "Facture Numéro de facture: F-032026-0017 Date d'émission: 03/03/2026 Date d'échéance: 02/04/2026 MOVEO 14 RUE ROGER SALENGRO 64000 PAU 64000 PAU France luffy32291@gmail.com +33644725409 http://www.newbi.fr SIRET: 85403887400012 MARIO serzer 75001 Paris France sofianetest@gmail.com SIRET: 12345678901234"
  - table:
    - rowgroup:
      - row "Description Qté Prix unitaire TVA (%) Total HT":
        - cell "Description"
        - cell "Qté"
        - cell "Prix unitaire"
        - cell "TVA (%)"
        - cell "Total HT"
    - rowgroup:
      - row "Site vitrine 1 1 340,00 € 20 % 1 340,00 €":
        - cell "Site vitrine"
        - cell "1"
        - cell "1 340,00 €"
        - cell "20 %"
        - cell "1 340,00 €"
  - text: "Total HT 1 340,00 € TVA 20% 268,00 € Total TVA 268,00 € Total TTC 1 608,00 € MOVEO • Capital: 10000 • SIREN 854038874 • RCS Ville 123 456 789 • Siège: 14 RUE ROGER SALENGRO 64000 PAU, 64000, PAU"
  - button "Télécharger le PDF"
  - button
  - paragraph: Client
  - paragraph: MARIO
  - paragraph: sofianetest@gmail.com
  - paragraph: serzer
  - paragraph: 75001 Paris
  - paragraph: France
  - paragraph: Dates
  - text: Date d'émission 03/03/2026 Date d'échéance 02/04/2026
  - paragraph: Articles
  - paragraph: Site vitrine
  - paragraph: 1 × 1 340,00 €
  - paragraph: Totaux
  - text: Sous-total HT 1 340,00 € Total HT 1 340,00 € TVA 268,00 € Total TTC 1 608,00 €
  - paragraph: Avoirs
  - button "Créer"
  - paragraph: Aucun avoir créé
  - paragraph: Cliquez sur "Créer" pour ajouter un avoir
  - paragraph: Paiement bancaire
  - button "Rattacher"
  - paragraph: Aucun paiement rattaché
  - paragraph: Rattachez une transaction bancaire pour marquer la facture comme payée
  - button "Annuler la facture"
  - button "Marquer comme payée"
- button "S"
- region "Notifications alt+T"
- button
- alert
```

# Test source

```ts
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
  202 |     // Après clic, le contenu devrait contenir des infos de facture
  203 |     expect(pageText.length).toBeGreaterThan(100);
  204 |
  205 |     // --- Modal Paramètres ---
  206 |     // Revenir à la liste si nécessaire
  207 |     if (!page.url().endsWith('/factures') && !page.url().endsWith('/factures/')) {
  208 |       await page.goto('/dashboard/outils/factures', { waitUntil: 'domcontentloaded', timeout: 45000 });
  209 |       await expect(page.locator('text=Factures clients').first()).toBeVisible({ timeout: 30000 });
  210 |     }
  211 |
  212 |     const settingsButton = page.locator('button:has(svg.lucide-settings)').first();
  213 |     if (await settingsButton.isVisible({ timeout: 3000 })) {
> 214 |       await settingsButton.click();
      |                            ^ Error: locator.click: Test timeout of 90000ms exceeded.
  215 |       await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });
  216 |       await page.keyboard.press('Escape');
  217 |       await page.waitForTimeout(500);
  218 |     }
  219 |
  220 |     // --- Modal Relances auto ---
  221 |     const reminderButton = page.locator('button:has(svg.lucide-mail-check)').first();
  222 |     if (await reminderButton.isVisible({ timeout: 3000 })) {
  223 |       await reminderButton.click();
  224 |       await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5000 });
  225 |       await page.keyboard.press('Escape');
  226 |     }
  227 |   });
  228 |
  229 |   test('Flow: Preview PDF visible en desktop', async ({ authenticatedPage: page }) => {
  230 |     await waitForInvoiceEditor(page);
  231 |
  232 |     const viewport = page.viewportSize();
  233 |     if (viewport && viewport.width >= 1024) {
  234 |       const previewPanel = page.locator('[class*="border-l"]').first();
  235 |       await expect(previewPanel).toBeVisible({ timeout: 5000 });
  236 |     }
  237 |   });
  238 |
  239 | });
  240 |
```