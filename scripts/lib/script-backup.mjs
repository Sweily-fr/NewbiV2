/**
 * Sauvegarde avant écriture et retour arrière, pour les scripts lancés sur la
 * base de production. Même principe que scripts/lib/remise-en-etat.js de
 * newbi-api.
 *
 * Avant la première écriture, le script enregistre un fichier EJSON (dates et
 * ObjectId conservés) dont chaque entrée décrit un document :
 *   { collection, _id, before, after }
 * `before` : valeurs des champs modifiés avant le script (null = champ
 * absent) ; `after` : valeurs écrites. Seuls les champs touchés sont gardés,
 * déjà lus par le script : la sauvegarde n'ajoute aucune requête.
 *
 * Le retour arrière remet `before` seulement si le document porte encore
 * `after` : une modification faite depuis dans l'appli n'est jamais écrasée.
 *
 * Les fichiers vont dans ~/newbi-backups/<script>/ (ou SCRIPT_BACKUP_DIR),
 * hors du dépôt : ils peuvent contenir des données clients et ne doivent
 * jamais être commités. Lisibles par leur seul propriétaire.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BSON } from "mongodb";

const { EJSON } = BSON;

export function backupDir(name) {
  return path.join(
    process.env.SCRIPT_BACKUP_DIR || path.join(os.homedir(), "newbi-backups"),
    name,
  );
}

/** Valeur de --restore <fichier>, ou null. */
export function restoreArg(argv = process.argv.slice(2)) {
  const index = argv.indexOf("--restore");
  return index === -1 ? null : argv[index + 1] || null;
}

/**
 * Écrit la sauvegarde. À appeler AVANT toute écriture en base : si le
 * fichier ne peut pas être écrit, le script s'arrête sans rien modifier.
 * @returns {string} chemin du fichier
 */
export function writeBackup({
  name,
  entries,
  meta = {},
  dir = backupDir(name),
}) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${name}-${stamp}.json`);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(
    file,
    EJSON.stringify(
      { script: name, createdAt: new Date(), ...meta, entries },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  return file;
}

/** $set des valeurs renseignées, $unset des valeurs nulles. */
export function setOrUnset(values = {}) {
  const $set = {};
  const $unset = {};
  for (const [field, value] of Object.entries(values)) {
    if (value === null || value === undefined) $unset[field] = "";
    else $set[field] = value;
  }
  return {
    ...(Object.keys($set).length ? { $set } : {}),
    ...(Object.keys($unset).length ? { $unset } : {}),
  };
}

/** Filtre « le document porte encore ces valeurs » (null = champ absent). */
export function stillMatches(values = {}) {
  return Object.fromEntries(
    Object.entries(values).map(([field, value]) => [
      field,
      value === undefined ? null : value,
    ]),
  );
}

/**
 * Retour arrière depuis une sauvegarde. Aperçu sans `apply`.
 * @returns {Promise<{entries: number, restorable: number, restored: number}>}
 */
export async function restoreBackup({
  file,
  db,
  apply = false,
  log = console.log,
}) {
  const { entries = [] } = EJSON.parse(fs.readFileSync(file, "utf8"));
  const stats = { entries: entries.length, restorable: 0, restored: 0 };

  for (const entry of entries) {
    const filter = { _id: entry._id, ...stillMatches(entry.after) };
    const collection = db.collection(entry.collection);
    const current = await collection.findOne(filter, {
      projection: { _id: 1 },
    });
    if (!current) {
      log(`- ${entry._id} : modifié depuis le script, laissé tel quel`);
      continue;
    }
    stats.restorable += 1;
    if (apply) {
      const result = await collection.updateOne(
        filter,
        setOrUnset(entry.before),
      );
      if (result.modifiedCount === 1) stats.restored += 1;
    }
  }

  log(
    apply
      ? `${stats.restored} document(s) remis comme avant sur ${stats.entries}.`
      : `Aperçu : ${stats.restorable} document(s) sur ${stats.entries} seraient remis comme avant (ajouter --apply).`,
  );
  return stats;
}
