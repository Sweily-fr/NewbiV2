#!/usr/bin/env node
/**
 * Ramène la forme juridique des espaces existants à une valeur de la liste
 * des paramètres (src/lib/company-registry.js).
 *
 * Les anciennes correspondances de l'inscription et de la création d'espace
 * écrivaient des libellés (« Entrepreneur individuel », « SAS unipersonnelle
 * (SASU) »…) ou le code INSEE brut. Conséquences : mention « EI » absente des
 * documents des entrepreneurs individuels, SAS imprimées « SASU », champ vide
 * dans les paramètres.
 *
 * Seules les valeurs ABSENTES de la liste sont touchées : un choix fait dans
 * les paramètres n'est jamais modifié. Les valeurs sans correspondance sûre
 * (« GIE », « Fondation »…) sont listées et laissées telles quelles, comme
 * « AUTRE » (non renseigné) : le vider bloquerait la création de documents.
 * L'ancienne valeur est conservée dans `legalFormBeforeNormalization`.
 *
 * Usage :
 *   MONGODB_URI=… MONGODB_DB_NAME=… node scripts/normalize-legal-forms.mjs
 *     → aperçu, aucune écriture
 *   MONGODB_URI=… MONGODB_DB_NAME=… node scripts/normalize-legal-forms.mjs --apply
 */
import { MongoClient } from "mongodb";
import {
  LEGAL_FORM_VALUES,
  normalizeLegalForm,
} from "../src/lib/company-registry.js";

const apply = process.argv.includes("--apply");
const { MONGODB_URI: uri, MONGODB_DB_NAME: dbName } = process.env;

if (!uri || !dbName) {
  console.error("MONGODB_URI et MONGODB_DB_NAME sont requis.");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();

try {
  const organizations = client.db(dbName).collection("organization");

  // « Auto-entrepreneur » est l'ancien nom de l'EI, reconnu partout
  // (paramètres, PDF) : on n'y touche pas.
  const candidates = await organizations
    .find(
      {
        legalForm: {
          $nin: [...LEGAL_FORM_VALUES, "Auto-entrepreneur", "", null],
        },
      },
      { projection: { legalForm: 1 } },
    )
    .toArray();

  const changes = [];
  const leftAsIs = {};
  for (const org of candidates) {
    const next = normalizeLegalForm(org.legalForm);
    if (next !== org.legalForm) {
      changes.push({ _id: org._id, from: org.legalForm, to: next });
    } else {
      leftAsIs[org.legalForm] = (leftAsIs[org.legalForm] || 0) + 1;
    }
  }

  const summary = {};
  for (const { from, to } of changes) {
    const key = `${from} → ${to}`;
    summary[key] = (summary[key] || 0) + 1;
  }

  console.log(
    apply ? "Mode écriture." : "Aperçu : aucune écriture (ajouter --apply).",
  );
  console.log(`${changes.length} espace(s) à corriger :`);
  console.table(summary);
  console.log("Sans correspondance sûre, laissés tels quels :");
  console.table(leftAsIs);

  if (apply && changes.length > 0) {
    const now = new Date();
    const result = await organizations.bulkWrite(
      changes.map(({ _id, from, to }) => ({
        updateOne: {
          // Garde-fou : la valeur n'a pas changé entre la lecture et
          // l'écriture.
          filter: { _id, legalForm: from },
          update: {
            $set: {
              legalForm: to,
              legalFormBeforeNormalization: from,
              updatedAt: now,
            },
          },
        },
      })),
    );
    console.log(`${result.modifiedCount} espace(s) corrigé(s).`);
  }
} finally {
  await client.close();
}
