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
  return {
    nom: m?.[2] ? JSON.parse(`"${m[2]}"`) : "",
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
  if (!cible.sansNom) {
    const meme = zone.getByRole(cible.role, { name: cible.nom, exact: true });
    if ((await meme.count()) > cible.occurrence) return meme.nth(cible.occurrence);
  }
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
    .evaluateAll((toasts) => toasts.map((t) => `${t.getAttribute("data-type") || "info"} : ${t.textContent.replace(/\s+/g, " ").trim()}`))
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
export async function observer(page, action, { cible = null, attente = 400 } = {}) {
  const urlAvant = chemin(page.url());
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

/** Les éléments trouvés correspondent exactement à ceux décrits par le test. */
export function comparerAuxAttendus(trouves, attendus) {
  const cles = new Set(trouves.map((e) => (e.role === "link" ? `link ${e.lien}` : `${e.role} ${e.nom}`)));
  const decrits = new Set(Object.keys(attendus));
  return {
    nonCouverts: [...cles].filter((c) => !decrits.has(c)),
    disparus: [...decrits].filter((c) => !cles.has(c)),
  };
}

export { expect };
