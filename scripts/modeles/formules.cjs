// Évaluateur des formules écrites dans les classeurs.
//
// Les classeurs sont écrits à la main en OOXML (voir generate-xlsx-newbi.cjs).
// Excel et Numbers recalculent à l'ouverture, mais LibreOffice affiche par
// défaut les valeurs en cache des fichiers Excel, et les aperçus (Finder,
// Google Drive, messageries) n'affichent qu'elles : sans valeur en cache, un
// total apparaît vide. On calcule donc chaque formule ici, avec la même
// sémantique qu'Excel pour le sous-ensemble utilisé, et le générateur écrit
// le résultat à côté de la formule.
//
// L'évaluateur sert aussi de garde-fou : une formule qui renverrait #VALUE!,
// #REF! ou #N/A dans Excel fait échouer la génération.
//
// Sous-ensemble pris en charge : références A1 (avec $ et nom de feuille),
// plages, nombres, textes, opérateurs + - * / ^ & = <> < > <= >=, et les
// fonctions listées dans FONCTIONS.

class ErreurXl {
  constructor(code) {
    this.code = code;
  }
  toString() {
    return this.code;
  }
}
const err = (c) => new ErreurXl(c);
const estErreur = (v) => v instanceof ErreurXl;

// ----------------------------------------------------------- adresses ---
const colVersNum = (s) => [...s].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const numVersCol = (n) => {
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};
const decoder = (a) => {
  const m = /^\$?([A-Z]{1,3})\$?(\d+)$/.exec(a);
  if (!m) throw new Error(`Adresse invalide : ${a}`);
  return { c: colVersNum(m[1]), l: Number(m[2]) };
};
const adresse = (c, l) => `${numVersCol(c)}${l}`;

// --------------------------------------------------------- analyse ---
function decouper(src) {
  const jetons = [];
  let i = 0;
  const reRef = /^(?:('(?:[^']|'')+'|[A-Za-zÀ-ÿ_][\wÀ-ÿ.]*)!)?(\$?[A-Z]{1,3}\$?\d+)(?::(\$?[A-Z]{1,3}\$?\d+))?/;
  while (i < src.length) {
    const reste = src.slice(i);
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '"') {
      let j = i + 1;
      let s = "";
      while (j < src.length) {
        if (src[j] === '"') {
          if (src[j + 1] === '"') {
            s += '"';
            j += 2;
            continue;
          }
          break;
        }
        s += src[j++];
      }
      jetons.push({ t: "str", v: s });
      i = j + 1;
      continue;
    }
    let m = /^\d+(\.\d+)?/.exec(reste);
    if (m) {
      jetons.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
      continue;
    }
    m = /^([A-Z][A-Z0-9.]*)\(/.exec(reste);
    if (m) {
      jetons.push({ t: "fn", v: m[1] });
      i += m[0].length;
      continue;
    }
    m = reRef.exec(reste);
    if (m) {
      let feuille = m[1] || null;
      if (feuille && feuille.startsWith("'")) feuille = feuille.slice(1, -1).replace(/''/g, "'");
      jetons.push({ t: "ref", feuille, de: m[2].replace(/\$/g, ""), a: m[3] ? m[3].replace(/\$/g, "") : null });
      i += m[0].length;
      continue;
    }
    m = /^(TRUE|FALSE)\b/.exec(reste);
    if (m) {
      jetons.push({ t: "bool", v: m[1] === "TRUE" });
      i += m[0].length;
      continue;
    }
    m = /^(<>|<=|>=|[-+*/^&=<>(),])/.exec(reste);
    if (m) {
      jetons.push({ t: "op", v: m[1] });
      i += m[1].length;
      continue;
    }
    throw new Error(`Formule illisible près de « ${reste} » dans ${src}`);
  }
  return jetons;
}

// Descente récursive, priorités d'Excel : comparaison < & < + - < * / < ^ <
// moins unaire.
function analyser(src) {
  const j = decouper(src);
  let p = 0;
  const voir = () => j[p];
  const prendre = () => j[p++];
  const attendre = (v) => {
    const x = prendre();
    if (!x || x.v !== v) throw new Error(`« ${v} » attendu dans ${src}`);
  };
  function comparaison() {
    let g = concat();
    while (voir() && ["=", "<>", "<", ">", "<=", ">="].includes(voir().v) && voir().t === "op") {
      const op = prendre().v;
      g = { op, g, d: concat() };
    }
    return g;
  }
  function concat() {
    let g = somme();
    while (voir() && voir().t === "op" && voir().v === "&") {
      prendre();
      g = { op: "&", g, d: somme() };
    }
    return g;
  }
  function somme() {
    let g = produit();
    while (voir() && voir().t === "op" && (voir().v === "+" || voir().v === "-")) {
      const op = prendre().v;
      g = { op, g, d: produit() };
    }
    return g;
  }
  function produit() {
    let g = puissance();
    while (voir() && voir().t === "op" && (voir().v === "*" || voir().v === "/")) {
      const op = prendre().v;
      g = { op, g, d: puissance() };
    }
    return g;
  }
  function puissance() {
    let g = unaire();
    while (voir() && voir().t === "op" && voir().v === "^") {
      prendre();
      g = { op: "^", g, d: unaire() };
    }
    return g;
  }
  function unaire() {
    if (voir() && voir().t === "op" && (voir().v === "-" || voir().v === "+")) {
      const op = prendre().v;
      const x = unaire();
      return op === "-" ? { op: "neg", x } : x;
    }
    return primaire();
  }
  function primaire() {
    const x = prendre();
    if (!x) throw new Error(`Formule incomplète : ${src}`);
    if (x.t === "num" || x.t === "str" || x.t === "bool") return { lit: x.v };
    if (x.t === "ref") return { ref: x };
    if (x.t === "fn") {
      const args = [];
      if (!(voir() && voir().v === ")")) {
        args.push(comparaison());
        while (voir() && voir().v === ",") {
          prendre();
          args.push(comparaison());
        }
      }
      attendre(")");
      return { fn: x.v, args };
    }
    if (x.v === "(") {
      const e = comparaison();
      attendre(")");
      return e;
    }
    throw new Error(`Jeton inattendu « ${x.v} » dans ${src}`);
  }
  const arbre = comparaison();
  if (p !== j.length) throw new Error(`Fin de formule inattendue dans ${src}`);
  return arbre;
}

// ------------------------------------------------------- évaluation ---
// Valeurs : nombre, texte, booléen, null (cellule vide), ErreurXl, ou plage
// { plage: [[...]] } pour les arguments de fonction.
const vide = (v) => v === null || v === undefined;

function nombre(v) {
  if (estErreur(v)) return v;
  if (vide(v)) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "string") {
    if (v === "") return err("#VALUE!");
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : err("#VALUE!");
  }
  return err("#VALUE!");
}
const texteDe = (v) => (vide(v) ? "" : typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v));
const vrai = (v) => {
  if (typeof v === "boolean") return v;
  if (vide(v)) return false;
  if (typeof v === "number") return v !== 0;
  return err("#VALUE!");
};

// Comparaison à la manière d'Excel : vide = 0 face à un nombre, vide = ""
// face à un texte ; nombres < textes < booléens ; textes sans casse.
function comparer(a, b) {
  const rang = (v) => (typeof v === "number" ? 0 : typeof v === "string" ? 1 : 2);
  if (vide(a)) a = typeof b === "string" ? "" : typeof b === "boolean" ? false : 0;
  if (vide(b)) b = typeof a === "string" ? "" : typeof a === "boolean" ? false : 0;
  if (rang(a) !== rang(b)) return rang(a) - rang(b);
  if (typeof a === "string") {
    const x = a.toLowerCase();
    const y = b.toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

// Critère de SUMIF, COUNTIF... : "<0", ">="&A1, "Payée", 0.2.
function critere(c) {
  if (typeof c === "number") return (v) => typeof v === "number" && v === c;
  const s = texteDe(c);
  const m = /^(<>|<=|>=|<|>|=)?(.*)$/.exec(s);
  const op = m[1] || "=";
  const brut = m[2];
  const n = brut !== "" && Number.isFinite(Number(brut)) ? Number(brut) : null;
  return (v) => {
    if (n !== null) {
      if (typeof v !== "number") return op === "<>";
      const r = v - n;
      return { "=": r === 0, "<>": r !== 0, "<": r < 0, ">": r > 0, "<=": r <= 0, ">=": r >= 0 }[op];
    }
    if (op === "=" && brut === "") return vide(v) || v === "";
    if (op === "<>" && brut === "") return !(vide(v) || v === "");
    const t = vide(v) ? "" : texteDe(v);
    if (op === "=" || op === "<>") {
      const egal = t.toLowerCase() === brut.toLowerCase();
      return op === "=" ? egal : !egal;
    }
    if (typeof v !== "string") return false;
    const r = comparer(t, brut);
    return { "<": r < 0, ">": r > 0, "<=": r <= 0, ">=": r >= 0 }[op];
  };
}

const aplatir = (v) => (v && v.plage ? v.plage.flat() : [v]);
const premiereErreur = (vals) => vals.find(estErreur);

const FONCTIONS = {
  SUM: (args) => {
    let s = 0;
    for (const a of args) {
      for (const v of aplatir(a)) {
        if (estErreur(v)) return v;
        if (a && a.plage) {
          if (typeof v === "number") s += v;
        } else {
          const n = nombre(v);
          if (estErreur(n)) return n;
          s += n;
        }
      }
    }
    return s;
  },
  SUMPRODUCT: (args) => {
    const plages = args.map(aplatir);
    const n = plages[0].length;
    if (plages.some((p) => p.length !== n)) return err("#VALUE!");
    let s = 0;
    for (let i = 0; i < n; i++) {
      let prod = 1;
      for (const p of plages) {
        if (estErreur(p[i])) return p[i];
        prod *= typeof p[i] === "number" ? p[i] : 0;
      }
      s += prod;
    }
    return s;
  },
  SUMIF: ([plage, crit, somme]) => {
    const test = critere(crit);
    const p = aplatir(plage);
    const s = aplatir(somme || plage);
    let t = 0;
    p.forEach((v, i) => {
      if (test(v) && typeof s[i] === "number") t += s[i];
    });
    return t;
  },
  SUMIFS: ([somme, ...paires]) => {
    const s = aplatir(somme);
    let t = 0;
    for (let i = 0; i < s.length; i++) {
      let ok = true;
      for (let k = 0; k < paires.length; k += 2) {
        if (!critere(paires[k + 1])(aplatir(paires[k])[i])) ok = false;
      }
      if (ok && typeof s[i] === "number") t += s[i];
    }
    return t;
  },
  COUNTIF: ([plage, crit]) => aplatir(plage).filter(critere(crit)).length,
  COUNTIFS: (paires) => {
    const n = aplatir(paires[0]).length;
    let c = 0;
    for (let i = 0; i < n; i++) {
      let ok = true;
      for (let k = 0; k < paires.length; k += 2) {
        if (!critere(paires[k + 1])(aplatir(paires[k])[i])) ok = false;
      }
      if (ok) c++;
    }
    return c;
  },
  COUNTA: (args) => args.flatMap(aplatir).filter((v) => !vide(v)).length,
  AVERAGE: (args) => {
    const vals = args.flatMap(aplatir);
    const e = premiereErreur(vals);
    if (e) return e;
    const n = vals.filter((v) => typeof v === "number");
    return n.length ? n.reduce((s, v) => s + v, 0) / n.length : err("#DIV/0!");
  },
  MIN: (args) => {
    const vals = args.flatMap(aplatir);
    const e = premiereErreur(vals);
    if (e) return e;
    const n = vals.filter((v) => typeof v === "number");
    return n.length ? Math.min(...n) : 0;
  },
  MAX: (args) => {
    const vals = args.flatMap(aplatir);
    const e = premiereErreur(vals);
    if (e) return e;
    const n = vals.filter((v) => typeof v === "number");
    return n.length ? Math.max(...n) : 0;
  },
  ROUND: ([x, d]) => {
    const n = nombre(x);
    const k = nombre(d);
    if (estErreur(n)) return n;
    if (estErreur(k)) return k;
    const f = 10 ** k;
    // Arrondi commercial d'Excel (0,5 s'éloigne de zéro), corrigé des
    // imprécisions binaires (1,005 * 100 = 100,49999...).
    return (Math.sign(n) * Math.round(Math.abs(n) * f + 1e-9)) / f;
  },
  ABS: ([x]) => {
    const n = nombre(x);
    return estErreur(n) ? n : Math.abs(n);
  },
  N: ([x]) => (typeof x === "number" ? x : typeof x === "boolean" ? (x ? 1 : 0) : estErreur(x) ? x : 0),
  ISNUMBER: ([x]) => typeof x === "number",
  AND: (args) => {
    for (const v of args.flatMap(aplatir)) {
      const b = vrai(v);
      if (estErreur(b)) return b;
      if (!b) return false;
    }
    return true;
  },
  OR: (args) => {
    for (const v of args.flatMap(aplatir)) {
      const b = vrai(v);
      if (estErreur(b)) return b;
      if (b) return true;
    }
    return false;
  },
  NOT: ([x]) => {
    const b = vrai(x);
    return estErreur(b) ? b : !b;
  },
  VLOOKUP: ([cle, plage, col, approx]) => {
    if (estErreur(cle)) return cle;
    if (approx !== false && approx !== 0) throw new Error("VLOOKUP approché non pris en charge");
    const lignes = plage.plage;
    const ligne = lignes.find((l) => !vide(l[0]) && comparer(l[0], cle) === 0);
    if (!ligne) return err("#N/A");
    const v = ligne[nombre(col) - 1];
    return v === undefined ? err("#REF!") : vide(v) ? 0 : v;
  },
  MATCH: ([cle, plage, type]) => {
    if (nombre(type) !== 0) throw new Error("MATCH approché non pris en charge");
    const i = aplatir(plage).findIndex((v) => !vide(v) && comparer(v, cle) === 0);
    return i < 0 ? err("#N/A") : i + 1;
  },
  INDEX: ([plage, l, c]) => {
    const lignes = plage.plage;
    let li = nombre(l);
    let co = c === undefined ? 1 : nombre(c);
    if (lignes.length === 1 && c === undefined) {
      co = li;
      li = 1;
    }
    const v = lignes[li - 1] && lignes[li - 1][co - 1];
    return v === undefined ? err("#REF!") : vide(v) ? 0 : v;
  },
  DATEDIF: ([a, b, u]) => {
    if (texteDe(u).toUpperCase() !== "D") throw new Error("DATEDIF : seule l'unité D est prise en charge");
    const x = nombre(a);
    const y = nombre(b);
    if (estErreur(x)) return x;
    if (estErreur(y)) return y;
    return y < x ? err("#NUM!") : Math.floor(y) - Math.floor(x);
  },
  YEAR: ([x]) => dateDeSerie(nombre(x)).getUTCFullYear(),
  MONTH: ([x]) => dateDeSerie(nombre(x)).getUTCMonth() + 1,
  DATE: ([a, m, j]) => serieDeDate(Date.UTC(nombre(a), nombre(m) - 1, nombre(j))),
};
const AGREGATS = new Set(["SUM", "MIN", "MAX", "AVERAGE", "COUNTA"]);

// Fonctions à évaluation paresseuse : seul l'argument retenu est calculé.
const PARESSEUSES = {
  IF: (args, ev) => {
    const c = vrai(ev(args[0]));
    if (estErreur(c)) return c;
    if (c) return args.length > 1 ? ev(args[1]) : true;
    return args.length > 2 ? ev(args[2]) : false;
  },
  IFERROR: (args, ev) => {
    const v = ev(args[0]);
    return estErreur(v) ? ev(args[1]) : v;
  },
};

// Dates : numéro de série Excel (jours depuis le 30/12/1899).
const ORIGINE = Date.UTC(1899, 11, 30);
const serieDeDate = (ms) => Math.round((ms - ORIGINE) / 86400000);
const dateDeSerie = (n) => new Date(ORIGINE + n * 86400000);
const serie = (iso) => {
  const [a, m, j] = iso.split("-").map(Number);
  return serieDeDate(Date.UTC(a, m - 1, j));
};

// ------------------------------------------------------------ classeur ---
// `feuilles` : Map nom -> Map adresse -> { v, f }. `aujourdhui` : numéro de
// série utilisé pour TODAY().
function evaluerClasseur(feuilles, { aujourdhui }) {
  const cache = new Map();
  const enCours = new Set();
  const arbres = new Map();

  const valeur = (feuille, a) => {
    const cle = `${feuille}!${a}`;
    if (cache.has(cle)) return cache.get(cle);
    const f = feuilles.get(feuille);
    if (!f) return err("#REF!");
    const cel = f.get(a);
    if (!cel) return null;
    if (!cel.f) return vide(cel.v) || cel.v === "" ? null : cel.v;
    if (enCours.has(cle)) throw new Error(`Référence circulaire : ${cle}`);
    enCours.add(cle);
    if (!arbres.has(cel.f)) arbres.set(cel.f, analyser(cel.f));
    // Une formule qui renvoie une cellule vide (=B5) vaut 0 dans Excel.
    const brut = evaluer(arbres.get(cel.f), feuille);
    const v = vide(brut) ? 0 : brut;
    enCours.delete(cle);
    cache.set(cle, v);
    return v;
  };

  const plage = (feuille, de, a) => {
    const x = decoder(de);
    const y = decoder(a);
    const lignes = [];
    for (let l = Math.min(x.l, y.l); l <= Math.max(x.l, y.l); l++) {
      const ligne = [];
      for (let c = Math.min(x.c, y.c); c <= Math.max(x.c, y.c); c++) ligne.push(valeur(feuille, adresse(c, l)));
      lignes.push(ligne);
    }
    return { plage: lignes };
  };

  function evaluer(n, feuille) {
    const ev = (x) => evaluer(x, feuille);
    if ("lit" in n) return n.lit;
    if (n.ref) {
      const fe = n.ref.feuille || feuille;
      if (!feuilles.has(fe)) return err("#REF!");
      return n.ref.a ? plage(fe, n.ref.de, n.ref.a) : valeur(fe, n.ref.de);
    }
    if (n.fn) {
      if (n.fn === "TODAY") return aujourdhui;
      if (PARESSEUSES[n.fn]) return PARESSEUSES[n.fn](n.args, (x) => scalaire(ev(x)));
      const f = FONCTIONS[n.fn];
      if (!f) throw new Error(`Fonction non prise en charge : ${n.fn}`);
      // Dans SUM, MIN, MAX, AVERAGE et COUNTA, une référence à une seule
      // cellule se comporte comme une plage : un texte y est ignoré, alors
      // qu'un texte saisi directement en argument provoquerait #VALUE!.
      if (AGREGATS.has(n.fn)) {
        return f(
          n.args.map((a) => {
            const v = ev(a);
            return a.ref && !a.ref.a ? { plage: [[v]] } : v;
          })
        );
      }
      return f(n.args.map(ev));
    }
    if (n.op === "neg") {
      const x = nombre(scalaire(ev(n.x)));
      return estErreur(x) ? x : -x;
    }
    const g = scalaire(ev(n.g));
    const d = scalaire(ev(n.d));
    if (estErreur(g)) return g;
    if (estErreur(d)) return d;
    if (n.op === "&") return texteDe(g) + texteDe(d);
    if (["=", "<>", "<", ">", "<=", ">="].includes(n.op)) {
      const r = comparer(g, d);
      return { "=": r === 0, "<>": r !== 0, "<": r < 0, ">": r > 0, "<=": r <= 0, ">=": r >= 0 }[n.op];
    }
    const x = nombre(g);
    const y = nombre(d);
    if (estErreur(x)) return x;
    if (estErreur(y)) return y;
    switch (n.op) {
      case "+":
        return x + y;
      case "-":
        return x - y;
      case "*":
        return x * y;
      case "/":
        return y === 0 ? err("#DIV/0!") : x / y;
      case "^":
        return x ** y;
    }
    throw new Error(`Opérateur inconnu ${n.op}`);
  }
  // Une plage utilisée là où une valeur est attendue : Excel prend
  // l'intersection implicite ; on ne s'en sert pas, c'est donc une erreur.
  const scalaire = (v) => (v && v.plage ? err("#VALUE!") : v);

  const resultats = new Map();
  for (const [nom, f] of feuilles) {
    for (const [a, cel] of f) {
      if (cel.f) resultats.set(`${nom}!${a}`, scalaire(valeur(nom, a)));
    }
  }
  return resultats;
}

module.exports = { evaluerClasseur, estErreur, serie, decoder, adresse, numVersCol, colVersNum };
