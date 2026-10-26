/**
 * Rapport des tests pour la page « Tests » de l'admin (E2E_RAPPORT_ADMIN=1).
 * Écrit dans `rapport-admin/` :
 *   - resultats.json : le lancement, chaque test, ses étapes et ses erreurs ;
 *   - captures/*.jpg : les captures prises par `etape()` et la fixture ;
 *   - videos/*.webm : la vidéo de chaque test (video: "on" quand ce rapport est demandé).
 * La CI le publie tel quel comme artefact GitHub, que l'admin lit ensuite.
 * Format lu par src/lib/tests-e2e.js : le faire évoluer des deux côtés.
 */
import { mkdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";

export const VERSION_RAPPORT = 1;

const sansCouleurs = (s) => String(s || "").replace(/\u001b\[[0-9;]*m/g, "");
const tronquer = (s, max) => (s.length > max ? `${s.slice(0, max)}\n…` : s);

/**
 * Erreurs d'une étape : la sienne et celles de ses contrôles directs
 * (expect.soft compris). On ne descend pas dans un contrôle : un expect.poll
 * réussi garde en enfants ses tentatives ratées, qui ne sont pas des échecs.
 */
function erreursDe(step) {
  const messages = [];
  if (step.error) messages.push(sansCouleurs(step.error.message));
  for (const enfant of step.steps || []) {
    if (enfant.category === "test.step") messages.push(...erreursDe(enfant));
    else if (enfant.error) messages.push(sansCouleurs(enfant.error.message));
  }
  return [...new Set(messages)];
}

export default class RapportAdmin {
  constructor({ dossier = "rapport-admin" } = {}) {
    this.dossier = path.resolve(dossier);
    // Une entrée par test, par son id : une nouvelle tentative (retries) remplace la précédente,
    // donc on garde le résultat final (un test instable redevenu vert n'apparaît pas rouge).
    this.parId = new Map();
    this.numeroCapture = 0;
  }

  onBegin(config) {
    this.racine = config.rootDir;
    this.debut = new Date();
    rmSync(this.dossier, { recursive: true, force: true });
    mkdirSync(path.join(this.dossier, "captures"), { recursive: true });
    mkdirSync(path.join(this.dossier, "videos"), { recursive: true });
  }

  /** Copie une pièce jointe dans le rapport ; renvoie son nom (« 0001.jpg »). */
  enregistrerFichier(piece, dossier, extension) {
    const fichier = `${String(++this.numeroCapture).padStart(4, "0")}.${extension}`;
    const cible = path.join(this.dossier, dossier, fichier);
    if (piece.body) writeFileSync(cible, piece.body);
    else if (piece.path) copyFileSync(piece.path, cible);
    else return null;
    return fichier;
  }

  onTestEnd(test, result) {
    // titlePath : ["", projet, fichier, ...groupes, titre]
    const groupes = test.titlePath().slice(3, -1);
    const captures = result.attachments
      .filter((a) => a.contentType === "image/jpeg")
      .map((a) => ({ nom: a.name, fichier: this.enregistrerFichier(a, "captures", "jpg") }))
      .filter((c) => c.fichier);
    const pieceVideo = result.attachments.find((a) => a.contentType === "video/webm");
    const video = pieceVideo ? this.enregistrerFichier(pieceVideo, "videos", "webm") : null;
    const parNom = new Map(captures.map((c) => [c.nom, c]));
    const etapes = result.steps
      .filter((s) => s.category === "test.step")
      .map((s) => {
        const erreurs = erreursDe(s);
        const capture = parNom.get(s.title);
        if (capture) parNom.delete(s.title);
        return {
          titre: s.title,
          duree: s.duration,
          ok: erreurs.length === 0,
          erreurs: erreurs.map((e) => tronquer(e, 3000)),
          capture: capture?.fichier || null,
        };
      });

    this.parId.set(test.id, {
      id: test.id,
      fichier: path.relative(this.racine, test.location.file),
      ligne: test.location.line,
      groupes,
      titre: test.title,
      // passed | failed | timedOut | skipped | interrupted
      statut: result.status,
      duree: result.duration,
      erreurs: result.errors.map((e) => tronquer(sansCouleurs(e.message || e.value), 6000)),
      etapes,
      // Captures qui ne correspondent à aucune étape (fin de test, échec).
      captures: [...parNom.values()],
      video,
    });
  }

  onEnd(result) {
    const tests = [...this.parId.values()];
    const compter = (...statuts) => tests.filter((t) => statuts.includes(t.statut)).length;
    const rapport = {
      version: VERSION_RAPPORT,
      debut: this.debut.toISOString(),
      duree: result.duration,
      statut: result.status,
      commit: process.env.GITHUB_SHA || null,
      declenchePar: process.env.E2E_DECLENCHE_PAR || null,
      totaux: {
        tests: tests.length,
        reussis: compter("passed"),
        echecs: compter("failed", "timedOut", "interrupted"),
        sautes: compter("skipped"),
      },
      tests,
    };
    writeFileSync(path.join(this.dossier, "resultats.json"), JSON.stringify(rapport));
  }

  printsToStdio() {
    return false;
  }
}
