// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ObjectId } from "mongodb";
import {
  restoreArg,
  restoreBackup,
  setOrUnset,
  stillMatches,
  writeBackup,
} from "@/scripts/lib/script-backup.mjs";

/**
 * Sauvegarde avant écriture des scripts de production : le fichier existe
 * avant toute modification, et le retour arrière n'écrase jamais un
 * document modifié depuis dans l'appli.
 */

let dir;
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "script-backup-"));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

const id = new ObjectId();
const entry = {
  collection: "organization",
  _id: id,
  before: { legalForm: "Entrepreneur individuel", copy: null },
  after: { legalForm: "EI", copy: "Entrepreneur individuel" },
};

function fakeDb({ stillThere = true } = {}) {
  const collection = {
    findOne: vi.fn(async () => (stillThere ? { _id: id } : null)),
    updateOne: vi.fn(async () => ({ modifiedCount: 1 })),
  };
  return { collection: vi.fn(() => collection), coll: collection };
}

describe("script-backup", () => {
  it("écrit un fichier privé qui conserve les ObjectId", () => {
    const file = writeBackup({ name: "essai", entries: [entry], dir });

    expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    expect(fs.readFileSync(file, "utf8")).toContain('"$oid"');
  });

  it("remet les valeurs d'avant sur un document inchangé depuis", async () => {
    const file = writeBackup({ name: "essai", entries: [entry], dir });
    const db = fakeDb();

    const stats = await restoreBackup({ file, db, apply: true, log: vi.fn() });

    expect(stats).toEqual({ entries: 1, restorable: 1, restored: 1 });
    const [filter, update] = db.coll.updateOne.mock.calls[0];
    // Le filtre exige les valeurs écrites par le script.
    expect(String(filter._id)).toBe(String(id));
    expect(filter.legalForm).toBe("EI");
    expect(update).toEqual({
      $set: { legalForm: "Entrepreneur individuel" },
      $unset: { copy: "" },
    });
  });

  it("n'écrit rien en aperçu", async () => {
    const file = writeBackup({ name: "essai", entries: [entry], dir });
    const db = fakeDb();

    const stats = await restoreBackup({ file, db, log: vi.fn() });

    expect(stats.restorable).toBe(1);
    expect(db.coll.updateOne).not.toHaveBeenCalled();
  });

  it("laisse tel quel un document modifié depuis le script", async () => {
    const file = writeBackup({ name: "essai", entries: [entry], dir });
    const db = fakeDb({ stillThere: false });

    const stats = await restoreBackup({ file, db, apply: true, log: vi.fn() });

    expect(stats).toEqual({ entries: 1, restorable: 0, restored: 0 });
    expect(db.coll.updateOne).not.toHaveBeenCalled();
  });

  it("outils", () => {
    expect(setOrUnset({ a: 1, b: null })).toEqual({
      $set: { a: 1 },
      $unset: { b: "" },
    });
    expect(stillMatches({ a: 1, b: undefined })).toEqual({ a: 1, b: null });
    expect(restoreArg(["--restore", "f.json", "--apply"])).toBe("f.json");
    expect(restoreArg(["--apply"])).toBeNull();
  });
});
