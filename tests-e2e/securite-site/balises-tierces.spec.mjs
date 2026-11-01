/**
 * Pages dont l'adresse porte un secret (jeton de réinitialisation, clé d'un
 * transfert, jeton de réactivation, de tableau public ou de gestion d'un
 * rendez-vous, adresse invitée) : aucune balise publicitaire ou de mesure
 * n'y est chargée, même avec le consentement. Ces services reçoivent
 * l'adresse complète de la page (page_location, dl, $current_url) : le
 * secret partirait chez eux.
 *
 * Les appels vers l'extérieur sont coupés pendant les tests (outils.mjs) :
 * une balise n'envoie donc rien ici, mais toute requête vers ces services
 * est relevée, même bloquée. Défaut connu tant que la balise Google Ads
 * (app/layout.jsx) et les pixels (MarketingPixels.jsx) sont chargés sur
 * toutes les pages : tests rouges jusqu'à la décision.
 */
import { test, expect, etape } from "../outils.mjs";
import { BASE_URL } from "../config.mjs";
import { oid } from "../donnees/base.mjs";
import { PARTAGES, TRANSFERTS } from "../donnees/lot-collaboration.mjs";
import { INVITATIONS } from "../donnees/lot-parametres-auth.mjs";

const TRACEURS = /googletagmanager\.com|google-analytics\.com|googleadservices\.com|doubleclick\.net|facebook\.(com|net)|analytics\.tiktok\.com|tiktok\.com\/i18n|posthog\.com|\/ingest\//;

const JETON = "e2eJetonSecretPage0123456789abcdef";
const TRANSFERT = TRANSFERTS.actif;
const invitation = INVITATIONS.attenteParametres;

const PAGES = [
  ["Réinitialisation du mot de passe", `/auth/reset-password?token=${JETON}`, JETON],
  ["Transfert de fichiers", `/transfer/${TRANSFERT.shareLink}?key=${TRANSFERT.accessKey}`, TRANSFERT.accessKey],
  ["Réactivation du compte", `/reactivate-account?email=reactivation%40e2e.test&token=${JETON}`, JETON],
  ["Tableau Kanban public", `/public/kanban/${PARTAGES.actif.token}`, PARTAGES.actif.token],
  ["Gestion d'un rendez-vous", `/rdv/gerer/${JETON}`, JETON],
  ["Invitation dans un espace", `/accept-invitation/${oid("invitationAuth", invitation.n).toHexString()}?email=${encodeURIComponent(invitation.email)}`, invitation.email],
];

const consentement = (accord) => ({
  cookies: [],
  origins: [
    {
      origin: BASE_URL,
      localStorage: [
        { name: "cookie_consent", value: JSON.stringify({ necessary: true, functional: accord, analytics: accord, marketing: accord }) },
        { name: "cookie_consent_date", value: new Date().toISOString() },
      ],
    },
  ],
});

for (const [libelle, accord] of [
  ["consentement accordé (mesure et publicité)", true],
  ["consentement refusé", false],
]) {
  test.describe(`Pages à secret dans l'adresse : ${libelle}`, () => {
    // Ces pages lisent un jeton inventé ou une ressource absente de la base
    // de test : leurs erreurs de chargement ne sont pas l'objet du test.
    test.use({ storageState: consentement(accord), erreursConsoleAutorisees: /status of 4\d\d|Failed to load resource|401|403|404|token|jeton|invitation|Erreur/i });

    for (const [page_, chemin, secret] of PAGES) {
      test(`${page_} : aucune balise tierce chargée`, async ({ page }) => {
        const traceurs = [];
        page.on("request", (req) => {
          if (TRACEURS.test(req.url())) traceurs.push(req.url());
        });
        await page.goto(chemin);
        await page.waitForLoadState("load");
        // Pixels chargés après le chargement de la page (lazyOnload, consentement)
        await page.waitForTimeout(4_000);
        await etape(page, "Aucune requête vers un service de mesure ou de publicité", async () => {
          expect.soft(traceurs.filter((u) => u.includes(secret) || u.includes(encodeURIComponent(secret))), "Le secret de l'adresse part chez un tiers").toEqual([]);
          expect(traceurs.map((u) => new URL(u).host + new URL(u).pathname), `Balises tierces chargées sur ${chemin.split("?")[0]}`).toEqual([]);
        });
        expect(await page.evaluate(() => typeof window.gtag), "gtag défini sur une page à secret").toBe("undefined");
      });
    }
  });
}
