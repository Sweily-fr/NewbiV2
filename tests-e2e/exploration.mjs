/**
 * « Tous les boutons » : chaque élément actionnable d'une page (bouton, onglet,
 * case à cocher, liste déroulante, lien, élément de menu) est essayé un par
 * un, en repartant d'une page neuve, et ce qu'il fait est relevé : fenêtre
 * ouverte, menu, navigation, téléchargement, sélecteur de fichier, message,
 * changement d'état, ou rien du tout.
 *
 *   - elementsActionnables() : ce qu'une zone propose, lu dans l'arbre
 *     d'accessibilité (ce que voit un lecteur d'écran, donc un humain) ;
 *   - observer() : ce qu'une action a produit ;
 *   - inventorier() : relevé complet d'une page, menus compris (mode
 *     E2E_INVENTAIRE=1, voir inventaire.spec.mjs), pour écrire les tests.
 *
 * Les lignes d'un tableau répètent les mêmes actions : seule la première
 * ligne est essayée.
 */
import { expect } from "@playwright/test";
import { attendreCalme } from "./navigation.mjs";

export const ROLES_ACTIONNABLES = ["button", "tab", "checkbox", "switch", "radio", "combobox", "link", "menuitem", "menuitemcheckbox", "menuitemradio"];
export const ROLES_SAISIE = ["textbox", "searchbox", "spinbutton", "combobox", "checkbox", "switch", "radio", "slider"];

/**
 * Actions jamais essayées automatiquement : elles couperaient la session du
 * compte de test ou supprimeraient le compte lui-même. Elles ont leurs propres
 * tests, sur des comptes dédiés.
 */
export const JAMAIS = /d[ée]connect|d[ée]connexion|log ?out|sign ?out|supprimer (mon|le) compte|d[ée]sactiver (mon|le) compte|r[ée]voquer toutes|quitter l'espace|transf[ée]rer (le r[ôo]le|la propri)/i;

/** Contenu propre à la page : sous l'en-tête commun du tableau de bord. */
export const contenu = (page) => page.locator("main > div").last();

/** Première ligne de l'arbre d'accessibilité d'un élément : `- button "Nom" [disabled]`. */
const LIGNE = /^- ([a-z]+)(?: "((?:[^"\\]|\\.)*)")?((?: \[[^\]]*\])*)/;

async function decrire(el) {
  const snap = await el.ariaSnapshot({ timeout: 2_000 }).catch(() => "");
  const m = LIGNE.exec(snap.split("\n")[0] || "");
  const attributs = m?.[3] || "";
  const nom = m?.[2] ? JSON.parse(`"${m[2]}"`) : "";
  return {
    // Un bouton dont le nom se réduit à un nombre (pastille de compteur) n'a
    // pas de vrai nom : « 1, bouton ». Une option « 10 » (lignes par page) si.
    nom: m?.[1] === "button" && /^\d+$/.test(nom) ? "" : nom,
    desactive: /\[disabled\]/.test(attributs),
    etat: attributs.trim(),
  };
}

/** Nom de secours d'un élément sans nom accessible : titre, icône (lucide), sinon rien. */
async function indice(el) {
  return el
    .evaluate((e) => {
      const titre = e.getAttribute("title") || e.getAttribute("data-tooltip");
      if (titre) return `titre « ${titre} »`;
      const icone = [...(e.querySelector("svg")?.classList || [])].find((c) => c.startsWith("lucide-") && c !== "lucide");
      return icone ? `icône ${icone.slice(7)}` : "";
    })
    .catch(() => "");
}

/** Position dans un tableau : -1 hors tableau, 0 en-tête, 1 première ligne, 2 et plus les suivantes. */
async function ligneDeTableau(el) {
  return el
    .evaluate((e) => {
      const ligne = e.closest("tr, [role=row]");
      if (!ligne) return -1;
      const corps = ligne.closest("tbody, [role=rowgroup]");
      if (!corps || corps.matches("thead, [data-slot=table-header]")) return 0;
      const lignes = [...corps.querySelectorAll(":scope > tr, :scope > [role=row]")];
      return lignes.indexOf(ligne) + 1;
    })
    .catch(() => -1);
}

/** Chemin d'un lien, identifiants masqués (« /dashboard/clients/:id »), pour regrouper les liens d'une liste. */
export function motifDeLien(href) {
  if (!href) return "";
  try {
    const url = new URL(href, "http://localhost");
    return url.pathname.replace(/\/[0-9a-f]{24}(?=\/|$)/gi, "/:id").replace(/\/\d+(?=\/|$)/g, "/:n");
  } catch {
    return href;
  }
}

/**
 * Éléments actionnables visibles d'une zone, dans l'ordre de la page.
 * Chacun : { role, nom, occurrence, index, desactive, etat, lien }.
 * `occurrence` : rang parmi les éléments de même rôle et même nom, pour le
 * retrouver sur une page neuve.
 */
export async function elementsActionnables(zone, { roles = ROLES_ACTIONNABLES, toutesLesLignes = false } = {}) {
  const trouves = [];
  const vus = new Map();
  for (const role of roles) {
    const tous = await zone.getByRole(role).all();
    for (const [index, el] of tous.entries()) {
      if (!(await el.isVisible().catch(() => false))) continue;
      const ligne = toutesLesLignes ? -1 : await ligneDeTableau(el);
      if (ligne > 1) continue;
      const { nom, desactive, etat } = await decrire(el);
      const lien = role === "link" ? motifDeLien(await el.getAttribute("href").catch(() => "")) : "";
      // Liens d'une même liste (une fiche par ligne) : un seul essai par motif.
      const cle = role === "link" ? `${role}|${lien}` : `${role}|${nom}`;
      const occurrence = vus.get(cle) || 0;
      vus.set(cle, occurrence + 1);
      if (role === "link" && occurrence > 0) continue;
      trouves.push({
        role,
        nom: nom || (await indice(el)),
        sansNom: !nom,
        occurrence,
        index,
        desactive,
        etat,
        ...(lien ? { lien } : {}),
        ...(ligne === 1 ? { premiereLigne: true } : {}),
      });
    }
  }
  return trouves;
}

/** Retrouve un élément décrit par elementsActionnables() sur une page neuve. */
export async function retrouver(zone, cible) {
  const meme = cible.sansNom && !cible.nom ? null : parNom(zone, cible.role, cible.nom);
  if (meme && (await meme.count()) > cible.occurrence) return meme.nth(cible.occurrence);
  if (!cible.sansNom) return null;
  const parIndex = zone.getByRole(cible.role).nth(cible.index);
  return (await parIndex.count()) ? parIndex : null;
}

/** Champs de saisie d'une zone (page, fenêtre) : rôle, nom, obligatoire, type. */
export async function champsDe(zone) {
  const champs = [];
  for (const role of ROLES_SAISIE) {
    for (const el of await zone.getByRole(role).all()) {
      if (!(await el.isVisible().catch(() => false))) continue;
      const { nom, desactive } = await decrire(el);
      const infos = await el
        .evaluate((e) => ({
          type: e.getAttribute("type") || e.tagName.toLowerCase(),
          obligatoire: e.required || e.getAttribute("aria-required") === "true",
          placeholder: e.getAttribute("placeholder") || "",
          valeur: "value" in e ? String(e.value ?? "").slice(0, 60) : "",
          max: e.getAttribute("maxlength") || "",
        }))
        .catch(() => ({}));
      champs.push({ role, nom: nom || infos.placeholder || "", desactive, ...infos });
    }
  }
  return champs;
}

/** Fenêtres ouvertes (dialogues, panneaux, popovers) : leur nom accessible ou leur premier titre. */
export async function fenetresOuvertes(page) {
  const noms = [];
  for (const f of await page.getByRole("dialog").or(page.getByRole("alertdialog")).all()) {
    if (!(await f.isVisible().catch(() => false))) continue;
    let { nom } = await decrire(f);
    if (!nom) nom = (await f.getByRole("heading").first().textContent({ timeout: 1_000 }).catch(() => "")) || "";
    noms.push(nom.replace(/\s+/g, " ").trim() || "(fenêtre sans titre)");
  }
  return noms;
}

/** Notifications (sonner) affichées : « succès : Contact créé ». */
export async function notificationsAffichees(page) {
  return page
    .locator("[data-sonner-toast]")
    .evaluateAll((toasts) =>
      toasts.map((t) => {
        const type = t.getAttribute("data-type") || (t.querySelector("svg.text-red-500") ? "erreur" : t.querySelector("svg.text-green-600") ? "succès" : "info");
        return `${type} : ${t.textContent.replace(/\s+/g, " ").trim()}`;
      }),
    )
    .catch(() => []);
}

async function nomsDe(zone, roles) {
  const noms = [];
  for (const role of roles) {
    for (const el of await zone.getByRole(role).all()) {
      if (await el.isVisible().catch(() => false)) noms.push((await decrire(el)).nom || (await indice(el)));
    }
  }
  return noms;
}

const chemin = (url) => {
  const u = new URL(url);
  return u.pathname + u.search;
};

/**
 * Lance une action et relève ce qu'elle a produit. `cible` (facultatif) :
 * l'élément lui-même, pour voir s'il a changé d'état (coché, déplié…).
 */
/** Empreinte du texte visible de la page principale, pour voir si une action l'a changé. */
const empreinte = (page) =>
  page
    .locator("main")
    .first()
    .evaluate((m) => m.innerText.replace(/\s+/g, " ").trim())
    .catch(() => "");

export async function observer(page, action, { cible = null, attente = 400 } = {}) {
  const urlAvant = chemin(page.url());
  const texteAvant = await empreinte(page);
  const fenetresAvant = await fenetresOuvertes(page);
  const notificationsAvant = await notificationsAffichees(page);
  const etatAvant = cible ? (await decrire(cible)).etat : "";
  const telechargements = [];
  const fichiers = [];
  const onglets = [];
  const surTelechargement = (d) => telechargements.push(d.suggestedFilename());
  const surFichier = () => fichiers.push(true);
  const surOnglet = (p) => onglets.push(p);
  page.on("download", surTelechargement);
  page.on("filechooser", surFichier);
  page.context().on("page", surOnglet);
  let erreur = null;
  try {
    await action();
  } catch (err) {
    erreur = err.message.split("\n")[0];
  }
  await attendreCalme(page).catch(() => {});
  await page.waitForTimeout(attente);
  page.off("download", surTelechargement);
  page.off("filechooser", surFichier);
  page.context().off("page", surOnglet);

  const issue = {};
  if (erreur) issue.erreur = erreur;
  const urlApres = chemin(page.url());
  if (urlApres !== urlAvant) issue.navigation = urlApres;
  const nouvelles = (await fenetresOuvertes(page)).filter((f) => !fenetresAvant.includes(f));
  if (nouvelles.length) {
    issue.fenetres = nouvelles;
    const derniere = page.getByRole("dialog").or(page.getByRole("alertdialog")).last();
    issue.contenuFenetre = {
      champs: await champsDe(derniere),
      boutons: await nomsDe(derniere, ["button", "tab", "link"]),
    };
  }
  const menu = page.getByRole("menu").last();
  if (await menu.isVisible().catch(() => false)) issue.menu = await nomsDe(menu, ["menuitem", "menuitemcheckbox", "menuitemradio"]);
  const liste = page.getByRole("listbox").last();
  if (await liste.isVisible().catch(() => false)) {
    const options = await nomsDe(liste, ["option"]);
    issue.options = options.length > 15 ? [...options.slice(0, 15), `… ${options.length} en tout`] : options;
  }
  const nouvellesNotifications = (await notificationsAffichees(page)).filter((n) => !notificationsAvant.includes(n));
  if (nouvellesNotifications.length) issue.notifications = nouvellesNotifications;
  if (telechargements.length) issue.telechargements = telechargements;
  if (fichiers.length) issue.selecteurDeFichier = true;
  for (const o of onglets) {
    issue.nouvelOnglet = o.url();
    await o.close().catch(() => {});
  }
  if (cible && !issue.navigation) {
    const etatApres = await decrire(cible).then((d) => d.etat).catch(() => etatAvant);
    if (etatApres !== etatAvant) issue.etat = `${etatAvant || "(aucun)"} → ${etatApres || "(aucun)"}`;
  }
  if (!issue.navigation && !issue.fenetres && (await empreinte(page)) !== texteAvant) issue.contenuModifie = true;
  if (!Object.keys(issue).length) issue.rien = true;
  return issue;
}

/** Ferme ce qui est ouvert (menus, fenêtres) sans rien valider. */
export async function toutFermer(page) {
  for (let i = 0; i < 3; i++) {
    if (!(await fenetresOuvertes(page)).length && !(await page.getByRole("menu").count())) return;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);
  }
}

/**
 * Relevé complet d'une page : chaque élément essayé sur une page neuve, et
 * chaque élément de chaque menu ouvert. `problemes` : tableau de la fixture
 * de surveillance ; les erreurs relevées sont rangées avec l'élément qui les a
 * causées puis retirées, pour que le relevé aille jusqu'au bout.
 */
export async function inventorier(page, { ouvrir, zone = contenu, problemes = [], exclure = null, limite = 80 }) {
  await ouvrir(page);
  const releve = { url: chemin(page.url()), champs: await champsDe(zone(page)), elements: [] };
  const elements = await elementsActionnables(zone(page));
  releve.total = elements.length;
  const prendreProblemes = () => problemes.splice(0, problemes.length);
  const auChargement = prendreProblemes();
  if (auChargement.length) releve.problemesAuChargement = auChargement;

  for (const cible of elements.slice(0, limite)) {
    const entree = { ...cible };
    releve.elements.push(entree);
    try {
      await essayerElement(entree, cible);
    } catch (err) {
      entree.issue = { ...(entree.issue || {}), erreurDuReleve: err.message.split("\n")[0] };
    }
    const reste = prendreProblemes();
    if (reste.length) entree.problemes = [...(entree.problemes || []), ...reste];
  }
  if (elements.length > limite) releve.tronque = `${elements.length - limite} éléments non essayés (limite ${limite})`;
  return releve;

  async function essayerElement(entree, cible) {
    if (JAMAIS.test(cible.nom) || exclure?.test(cible.nom)) {
      entree.issue = { nonEssaye: "action exclue (session ou compte)" };
      return;
    }
    if (cible.desactive) {
      entree.issue = { nonEssaye: "désactivé" };
      return;
    }
    await ouvrir(page);
    const el = await retrouver(zone(page), cible);
    if (!el) {
      entree.issue = { nonEssaye: "introuvable sur une page neuve" };
      return;
    }
    entree.issue = await observer(page, () => el.click({ timeout: 5_000 }), { cible: el });
    const pb = prendreProblemes();
    if (pb.length) entree.problemes = pb;

    // Un menu : chaque élément essayé à son tour, menu rouvert sur une page neuve.
    for (const item of entree.issue.menu || []) {
      const sous = { nom: item };
      (entree.sousElements ||= []).push(sous);
      if (JAMAIS.test(item) || exclure?.test(item)) {
        sous.issue = { nonEssaye: "action exclue (session ou compte)" };
        continue;
      }
      await ouvrir(page);
      const declencheur = await retrouver(zone(page), cible);
      if (!declencheur) {
        sous.issue = { nonEssaye: "menu introuvable sur une page neuve" };
        continue;
      }
      await declencheur.click({ timeout: 5_000 }).catch(() => {});
      const menu = page.getByRole("menu").last();
      const elementMenu = ["menuitem", "menuitemcheckbox", "menuitemradio"]
        .map((role) => menu.getByRole(role, { name: item, exact: true }))
        .reduce((a, b) => a.or(b));
      if (!(await elementMenu.count())) {
        sous.issue = { nonEssaye: "élément de menu introuvable" };
        continue;
      }
      sous.issue = await observer(page, () => elementMenu.first().click({ timeout: 5_000 }));
      const pbSous = prendreProblemes();
      if (pbSous.length) sous.problemes = pbSous;
    }
  }
}

/**
 * Retrouve un élément par la clé d'une description : son nom accessible, ou,
 * pour un élément sans nom, son icône (« icône settings2 ») ou son titre.
 */
function parNom(zone, role, nom) {
  const icone = /^icône (.+)$/.exec(nom);
  if (icone) return zone.getByRole(role).filter({ has: zone.page().locator(`svg.lucide-${icone[1]}`) });
  const titre = /^titre « (.+) »$/.exec(nom);
  if (titre) return zone.getByRole(role).and(zone.page().locator(`[title="${titre[1]}"], [data-tooltip="${titre[1]}"]`));
  return zone.getByRole(role, { name: nom, exact: true });
}

/** Premier lien d'une zone dont l'adresse suit ce motif (« /dashboard/clients/:id »). */
async function trouverLien(zone, motif) {
  for (const lien of await zone.getByRole("link").all()) {
    if (motifDeLien(await lien.getAttribute("href").catch(() => "")) === motif) return lien;
  }
  return zone.getByRole("link", { name: "__lien introuvable__" });
}

/** Clé d'un élément dans la description d'une page : « button Nouveau contact », « link /dashboard/clients/:id ». */
export const cleElement = (e) => (e.role === "link" ? `link ${e.lien}` : `${e.role} ${e.nom}`);

/** Les éléments trouvés correspondent exactement à ceux décrits par le test. */
export function comparerAuxAttendus(trouves, attendus) {
  const cles = new Set(trouves.map(cleElement));
  const decrits = new Set(Object.keys(attendus).filter((c) => !c.includes(" > ")));
  return {
    nonCouverts: [...cles].filter((c) => !decrits.has(c)),
    disparus: [...decrits].filter((c) => !cles.has(c)),
  };
}

const correspond = (attendu, recu) => (attendu instanceof RegExp ? attendu.test(recu ?? "") : recu === attendu);
const lisible = (v) => (v instanceof RegExp ? String(v) : JSON.stringify(v));

/**
 * Vérifie l'issue observée d'un clic contre ce qu'en dit la description :
 *   fenetre: "Titre" | /motif/        une fenêtre s'ouvre avec ce titre
 *   menu: ["A", "B"]                  un menu s'ouvre avec exactement ces éléments
 *                                     ([] : un sous-menu sans élément de menu, ex. des cases)
 *   menuContient: ["A"]               un menu s'ouvre et propose au moins ces éléments
 *   navigation: "/chemin" | /motif/   la page change pour cette adresse
 *   telechargement: /\.csv$/          un fichier est téléchargé
 *   notification: /motif/             une notification apparaît
 *   etat: /\[checked\]/               l'élément change d'état (coché, déplié…)
 *   contenu: true                     le contenu de la page change (filtre, tri, section)
 *   options: ["5", "10"]              une liste de choix s'ouvre
 *   selecteurDeFichier: true          le sélecteur de fichiers s'ouvre
 *   desactive: "raison"               l'élément est grisé (et doit le rester)
 *   sansEffet: "raison"               rien de visible : comportement voulu, expliqué
 */
export function verifierIssue(issue, attendu, contexte) {
  if (issue.erreur) throw new Error(`${contexte} : le clic a échoué (${issue.erreur})`);
  if (attendu.fenetre !== undefined) {
    expect(issue.fenetres?.some((f) => correspond(attendu.fenetre, f)), `${contexte} : fenêtre ${lisible(attendu.fenetre)} attendue, ouvertes : ${JSON.stringify(issue.fenetres || [])}`).toBe(true);
  }
  if (attendu.menu !== undefined) {
    const recu = issue.menu || [];
    const ok = recu.length === attendu.menu.length && attendu.menu.every((a, i) => correspond(a, recu[i]));
    expect(ok, `${contexte} : menu attendu ${JSON.stringify(attendu.menu.map(String))}, reçu ${JSON.stringify(recu)}`).toBe(true);
  }
  if (attendu.navigation !== undefined) {
    expect(correspond(attendu.navigation, issue.navigation), `${contexte} : navigation vers ${lisible(attendu.navigation)}, reçue ${issue.navigation || "aucune"}`).toBe(true);
  }
  if (attendu.telechargement !== undefined) {
    expect(issue.telechargements?.some((t) => correspond(attendu.telechargement, t)), `${contexte} : téléchargement ${lisible(attendu.telechargement)}, reçus ${JSON.stringify(issue.telechargements || [])}`).toBe(true);
  }
  if (attendu.notification !== undefined) {
    expect(issue.notifications?.some((n) => correspond(attendu.notification, n)), `${contexte} : notification ${lisible(attendu.notification)}, reçues ${JSON.stringify(issue.notifications || [])}`).toBe(true);
  }
  if (attendu.menuContient !== undefined) {
    const recu = issue.menu || [];
    expect(issue.menu, `${contexte} : un menu devait s'ouvrir`).toBeTruthy();
    for (const a of attendu.menuContient) expect(recu.some((r) => correspond(a, r)), `${contexte} : le menu doit proposer ${lisible(a)}, reçu ${JSON.stringify(recu)}`).toBe(true);
  }
  if (attendu.etat !== undefined) expect(correspond(attendu.etat, issue.etat), `${contexte} : changement d'état ${lisible(attendu.etat)}, reçu ${issue.etat || "aucun"}`).toBe(true);
  if (attendu.contenu) expect(issue.contenuModifie || issue.etat, `${contexte} : le contenu de la page devait changer`).toBeTruthy();
  if (attendu.options !== undefined) expect(issue.options, `${contexte} : choix proposés`).toEqual(attendu.options);
  if (attendu.selecteurDeFichier) expect(issue.selecteurDeFichier, `${contexte} : le sélecteur de fichiers devait s'ouvrir`).toBe(true);
  if (attendu.sansEffet) expect(issue.rien, `${contexte} : aucun effet attendu (${attendu.sansEffet}), observé ${JSON.stringify(issue)}`).toBe(true);
  const decrit = ["fenetre", "menu", "menuContient", "navigation", "telechargement", "notification", "etat", "contenu", "options", "selecteurDeFichier", "sansEffet"].some((k) => attendu[k] !== undefined);
  if (!decrit) throw new Error(`${contexte} : description sans effet attendu (${JSON.stringify(attendu)})`);
}

/**
 * Les tests « tous les boutons » d'une page, à partir de sa description :
 *   titre      : « Contacts »
 *   ouvrir     : (page) => ouvre la page, prête
 *   zone       : (page) => zone explorée (par défaut le contenu sous l'en-tête)
 *   boutons    : { "button Nouveau contact": { fenetre: "Ajouter un client" },
 *                  "button Exporter": { menu: ["CSV", "Excel"] },
 *                  "button Exporter > CSV": { telechargement: /\.csv$/ }, … }
 *     Un élément de menu se décrit « déclencheur > élément ». `parcours:
 *     "…"` renvoie au test qui couvre l'action en entier (rien n'est cliqué
 *     ici). `desactive: "raison"` : présent mais grisé.
 *   test       : la fonction `test` (fixtures de outils.mjs)
 * Un test vérifie que la page propose exactement les éléments décrits : un
 * bouton ajouté sans test, ou un bouton disparu, le fait échouer.
 */
export function verifierBoutons({ titre, ouvrir, zone = contenu, boutons, test }) {
  test.describe(`${titre} : tous les boutons`, () => {
    test("Chaque élément de la page est décrit et testé", async ({ page }) => {
      await ouvrir(page);
      const trouves = await elementsActionnables(zone(page));
      const { nonCouverts, disparus } = comparerAuxAttendus(trouves, boutons);
      expect.soft(nonCouverts, "Éléments présents sur la page mais sans test (à décrire)").toEqual([]);
      expect.soft(disparus, "Éléments décrits mais absents de la page").toEqual([]);
      for (const e of trouves) {
        const attendu = boutons[cleElement(e)];
        if (!attendu) continue;
        expect.soft(e.desactive, `${cleElement(e)} : ${attendu.desactive ? "doit être grisé" : "ne doit pas être grisé"}`).toBe(Boolean(attendu.desactive));
      }
    });

    for (const [cle, attendu] of Object.entries(boutons)) {
      if (attendu.parcours || attendu.desactive) continue;
      const [declencheur, item] = cle.split(" > ");
      test(item ? `« ${declencheur.replace(/^\w+ /, "")} » puis « ${item} »` : `« ${declencheur.replace(/^\w+ /, "")} »`, async ({ page }) => {
        await ouvrir(page);
        const role = declencheur.split(" ")[0];
        const nom = declencheur.slice(role.length + 1);
        const el = role === "link" ? await trouverLien(zone(page), nom) : parNom(zone(page), role, nom).first();
        await expect(el, `Élément « ${declencheur} »`).toBeVisible();
        if (!item) {
          const issue = await observer(page, () => el.click({ timeout: 5_000 }), { cible: el });
          verifierIssue(issue, attendu, `« ${nom} »`);
          return;
        }
        await el.click();
        const menu = page.getByRole("menu").last();
        await expect(menu, `Menu de « ${nom} »`).toBeVisible();
        const elementMenu = ["menuitem", "menuitemcheckbox", "menuitemradio"].map((r) => menu.getByRole(r, { name: item, exact: true })).reduce((a, b) => a.or(b)).first();
        const issue = await observer(page, () => elementMenu.click({ timeout: 5_000 }));
        verifierIssue(issue, attendu, `« ${nom} » puis « ${item} »`);
      });
    }
  });
}

export { expect };
