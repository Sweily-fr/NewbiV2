/**
 * Routes d'administration de Better Auth (/api/auth/admin/*) : exposées par
 * le site, elles ne servent qu'au super administrateur. Un propriétaire
 * d'espace, un Membre ou un visiteur n'en obtient rien : aucune liste de
 * comptes, aucune session ouverte au nom d'un autre, aucun rôle, mot de
 * passe, bannissement ni suppression, et la base ne bouge pas.
 */
import { test, expect } from "../outils.mjs";
import { base } from "../base.mjs";
import { BASE_URL, connecte, SESSION_TOKEN_MEMBRE_PARAMETRES, SESSION_TOKEN_PARAMETRES } from "../config.mjs";
import { COMPTES } from "../donnees/base.mjs";

const CIBLE = COMPTES.intrus.utilisateur;
const CIBLE_ID = CIBLE._id.toHexString();

/** Compte visé, ses sessions et ses identifiants de connexion, tels qu'en base. */
async function photoCible() {
  const db = await base();
  const [utilisateur, sessions, comptes] = await Promise.all([
    db.collection("user").findOne({ _id: CIBLE._id }),
    db.collection("session").find({ userId: { $in: [CIBLE._id, CIBLE_ID] } }).sort({ _id: 1 }).toArray(),
    db.collection("account").find({ userId: { $in: [CIBLE._id, CIBLE_ID] } }).sort({ _id: 1 }).toArray(),
  ]);
  const { updatedAt, ...u } = utilisateur || {};
  return JSON.stringify({ u, sessions: sessions.map((s) => s.token), comptes: comptes.map(({ updatedAt: _, ...c }) => c) });
}

const sessionsUsurpees = async () => (await base()).collection("session").countDocuments({ impersonatedBy: { $exists: true } });

const OPERATIONS = [
  ["Lister les comptes", "GET", "/api/auth/admin/list-users?limit=100", null],
  ["Ouvrir une session au nom d'un autre", "POST", "/api/auth/admin/impersonate-user", { userId: CIBLE_ID }],
  ["Se donner le rôle d'administrateur", "POST", "/api/auth/admin/set-role", { userId: CIBLE_ID, role: "admin" }],
  ["Changer le mot de passe d'un autre", "POST", "/api/auth/admin/set-user-password", { userId: CIBLE_ID, newPassword: "MotDePasseE2e!2026" }],
  ["Bannir un compte", "POST", "/api/auth/admin/ban-user", { userId: CIBLE_ID, banReason: "e2e" }],
  ["Supprimer un compte", "POST", "/api/auth/admin/remove-user", { userId: CIBLE_ID }],
  ["Lister les sessions d'un autre", "POST", "/api/auth/admin/list-user-sessions", { userId: CIBLE_ID }],
  ["Révoquer les sessions d'un autre", "POST", "/api/auth/admin/revoke-user-sessions", { userId: CIBLE_ID }],
  ["Créer un compte", "POST", "/api/auth/admin/create-user", { email: "cree-par-admin@e2e.test", password: "MotDePasseE2e!2026", name: "Créé" }],
  ["Modifier un autre compte", "POST", "/api/auth/admin/update-user", { userId: CIBLE_ID, data: { name: "Renommé" } }],
];

async function appeler(request, [, methode, chemin, corps]) {
  // Origin du site : la requête passe le contrôle d'origine de Better Auth et
  // n'est refusée que pour les droits
  const options = { headers: { origin: BASE_URL }, maxRedirects: 0 };
  return methode === "GET" ? request.get(chemin, options) : request.post(chemin, { ...options, data: corps });
}

for (const [qui, etat] of [
  ["Propriétaire d'un espace", connecte(SESSION_TOKEN_PARAMETRES)],
  ["Membre (lecture seule)", connecte(SESSION_TOKEN_MEMBRE_PARAMETRES)],
  ["Visiteur sans session", { cookies: [], origins: [] }],
]) {
  test.describe(`Administration Better Auth : ${qui}`, () => {
    test.use({ storageState: etat });

    for (const op of OPERATIONS) {
      test(`${op[0]} : refusé, base inchangée`, async ({ request }) => {
        const avant = await photoCible();
        const usurpeesAvant = await sessionsUsurpees();
        const reponse = await appeler(request, op);
        const texte = await reponse.text();
        expect.soft([401, 403, 404], `${op[0]} : statut ${reponse.status()} (${texte.slice(0, 160)})`).toContain(reponse.status());
        expect.soft(texte, `${op[0]} : la réponse contient des données d'un autre compte`).not.toContain(CIBLE.email);
        expect.soft(await photoCible(), `${op[0]} : le compte visé a changé`).toBe(avant);
        expect.soft(await sessionsUsurpees(), `${op[0]} : une session au nom d'un autre a été créée`).toBe(usurpeesAvant);
        if (op[2].includes("create-user")) {
          expect(await (await base()).collection("user").countDocuments({ email: "cree-par-admin@e2e.test" })).toBe(0);
        }
      });
    }
  });
}
