/**
 * Devis : signature électronique, de la demande à l'acceptation. Le
 * prestataire est coupé en test : les demandes déjà transmises sont en base
 * (organisation « Contrôles Ventes », donnees/lot-devis-bc-bl.mjs) et ses
 * réponses arrivent par son webhook (POST /api/esignature/webhook), appelé
 * comme il le ferait.
 *
 * Ce qui est vérifié :
 *   - le client signe la version envoyée : pas de modification ni de retour
 *     en brouillon pendant la signature, pas d'acceptation par une demande
 *     annulée ;
 *   - signature terminée : devis accepté, panneau « Signé », automatisation
 *     « devis accepté » journalisée ; erreur et état inconnu du prestataire ;
 *   - devis accepté ou refusé à la main : demandes annulées, le lien de
 *     l'e-mail ne mène plus à la signature ;
 *   - règles de la demande (statut du devis, cachet, relance) et signataires
 *     (nombre, adresses, noms réels) ;
 *   - fenêtre « Faire signer » utilisable au clavier et au lecteur d'écran.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { API_URL, BASE_URL, connecte, SESSION_TOKEN_CONTROLE_VENTES } from "../config.mjs";
import { AUTOMATISATIONS_VENTES, DEVIS_SIGNATURE as D, LIENS_SIGNATURE, SIGNATURES_CONTROLE as S } from "../donnees/lot-devis-bc-bl.mjs";
import { id } from "../securite.mjs";
import { article, PDF_BASE64 } from "./droits.mjs";
import { actionDeLigne, epingler, ouvrirPanneau } from "./ventes.mjs";
import { appelControle, attendreEnBase, collection, messages, MUTATIONS, relire, webhookSignature } from "./controle.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_CONTROLE_VENTES) });

const devisEnBase = (d) => relire("quotes", d._id);
const demandeEnBase = (s) => relire("signaturerequests", s._id);
const demandesDu = async (d) => (await collection("signaturerequests")).find({ documentId: d._id }).toArray();
const statutDu = async (d) => (await devisEnBase(d))?.status;
const statutDe = async (s) => (await demandeEnBase(s))?.status;
const signataire = (n) => ({ name: "Jeanne", surname: `Signataire ${n}`, email: `signataire-${n}@e2e.test` });
const demander = (page, d, signers) =>
  appelControle(page, MUTATIONS.signer, { input: { documentType: "quote", documentId: id(d), signers, documentBase64: PDF_BASE64 } });

/** Redirection du lien « Signer le devis » de l'e-mail d'invitation (signataire 0). */
async function lienDeLEmail(numero) {
  const res = await fetch(`${API_URL}/tracking/sign/${LIENS_SIGNATURE.jeton(numero)}/0`, { redirect: "manual" });
  return { statut: res.status, destination: res.headers.get("location") || "" };
}

test.describe("Devis : signature électronique, version signée", () => {
  test("Devis en cours de signature : la modification est refusée, la signature accepte la version envoyée", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await etape(page, "Passer le prix de 1 000 € à 10 000 € : refusé avec un message", async () => {
      const reponse = await appelControle(page, MUTATIONS.modifierDevis, {
        id: id(D.modifier),
        input: { items: [article("Devis signé puis modifié", 10_000)] },
      });
      expect(reponse.data?.updateQuote ?? null, "Le devis a été modifié pendant la signature").toBeNull();
      expect(messages(reponse), "Le refus doit expliquer la signature en cours").toMatch(/signature est en cours/);
      const devis = await devisEnBase(D.modifier);
      expect(devis.items[0].unitPrice, "Prix en base").toBe(1000);
      expect(devis.finalTotalTTC, "Total TTC en base").toBe(1200);
    });
    await etape(page, "Le client signe : le devis est accepté à son montant d'origine", async () => {
      const reponse = await webhookSignature(S.modifier, "DONE");
      expect(reponse.statut, "Réponse du webhook").toBe(200);
      await attendreEnBase(() => statutDu(D.modifier), "Statut du devis après la signature").toBe("COMPLETED");
      expect((await devisEnBase(D.modifier)).finalTotalTTC, "Le devis accepté n'est pas celui signé").toBe(1200);
    });
  });

  test("Devis en cours de signature : le retour en brouillon est refusé, la demande reste active", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelControle(page, MUTATIONS.statutDevis, { id: id(D.brouillon), status: "DRAFT" });
    expect(reponse.data?.changeQuoteStatus ?? null, "Le devis est repassé en brouillon pendant la signature").toBeNull();
    expect(messages(reponse)).toMatch(/signature est en cours/);
    expect(await statutDu(D.brouillon)).toBe("PENDING");
    expect(await statutDe(S.brouillon), "La demande de signature a changé").toBe("WAIT_SIGN");
  });

  test("Devis en cours de signature supprimé : refusé, ou sa demande est annulée et aucune signature ne l'accepte", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await appelControle(page, MUTATIONS.supprimerDevis, { id: id(D.supprimer) });
    if (await devisEnBase(D.supprimer)) {
      // Suppression refusée : le devis et sa demande restent tels quels.
      expect(await statutDe(S.supprimer), "La demande de signature a changé").toBe("WAIT_SIGN");
      return;
    }
    await etape(page, "Devis supprimé : sa demande de signature est annulée", async () => {
      expect(await statutDe(S.supprimer), "Le client peut encore signer un devis supprimé").toBe("CANCELLED");
    });
    await etape(page, "Signature reçue ensuite : la demande reste annulée", async () => {
      await webhookSignature(S.supprimer, "DONE");
      expect(await statutDe(S.supprimer)).toBe("CANCELLED");
    });
  });

  test("Demande annulée puis signée chez le prestataire : elle reste annulée, le devis reste en attente", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    await etape(page, "Annuler la demande (le prestataire est injoignable)", async () => {
      const reponse = await appelControle(page, MUTATIONS.annulerSignature, { id: id(S.annuler) });
      expect(reponse.errors, "Annulation refusée").toEqual([]);
      expect(reponse.data.cancelSignature.success).toBe(true);
      expect(await statutDe(S.annuler)).toBe("CANCELLED");
    });
    await etape(page, "Le prestataire annonce la signature terminée", async () => {
      const reponse = await webhookSignature(S.annuler, "DONE");
      expect(reponse.statut).toBe(200);
      expect(await statutDe(S.annuler), "La demande annulée a été réactivée").toBe("CANCELLED");
      expect(await statutDu(D.annuler), "Le devis a été accepté par une demande annulée").toBe("PENDING");
    });
  });
});

test.describe("Devis : signature électronique, réponses du prestataire", () => {
  test("Signature terminée : devis accepté, panneau « Signé », automatisation « devis accepté » journalisée", async ({ page }) => {
    await etape(page, "Le prestataire annonce la signature terminée", async () => {
      const reponse = await webhookSignature(S.terminee, "DONE");
      expect(reponse.statut).toBe(200);
      await attendreEnBase(() => statutDu(D.terminee), "Statut du devis").toBe("COMPLETED");
      expect(await statutDe(S.terminee)).toBe("DONE");
    });
    await etape(page, "L'automatisation des devis acceptés est journalisée", async () => {
      await attendreEnBase(
        async () =>
          (await collection("documentautomationlogs")).countDocuments({
            automationId: AUTOMATISATIONS_VENTES.controle._id,
            sourceDocumentId: D.terminee._id,
          }),
        "Journal de l'automatisation « devis acceptés »",
      ).toBe(1);
    });
    await etape(
      page,
      "Panneau du devis : « Signé » et signature vérifiée",
      async () => {
        const panneau = await ouvrirPanneau(page, "devis", D.terminee);
        await expect(panneau.getByText("Signé", { exact: true }).first()).toBeVisible();
        await expect(panneau.getByText("Signature électronique vérifiée")).toBeVisible();
      },
      { capture: "ecran" },
    );
  });

  test("Signature en erreur chez le prestataire : statut « Erreur » en base et dans le panneau, devis en attente", async ({ page }) => {
    const reponse = await webhookSignature(S.erreur, "ERROR");
    expect(reponse.statut).toBe(200);
    expect(await statutDe(S.erreur)).toBe("ERROR");
    expect(await statutDu(D.erreur)).toBe("PENDING");
    await etape(
      page,
      "Panneau du devis",
      async () => {
        const panneau = await ouvrirPanneau(page, "devis", D.erreur);
        await expect(panneau.getByText("Erreur", { exact: true }).first()).toBeVisible();
      },
      { capture: "ecran" },
    );
  });

  test("État inconnu envoyé par le prestataire : la demande garde son statut, le devis reste en attente", async () => {
    const reponse = await webhookSignature(S.inconnu, "FOO");
    expect(reponse.statut).toBe(200);
    expect(await statutDe(S.inconnu)).toBe("WAIT_SIGNER");
    expect(await statutDu(D.inconnu)).toBe("PENDING");
  });
});

test.describe("Devis : décision prise pendant une signature", () => {
  for (const [nom, cle, statut] of [
    ["accepté", "accepter", "COMPLETED"],
    ["refusé", "refuser", "CANCELED"],
  ]) {
    test(`Devis ${nom} à la main pendant la signature : demande annulée, le lien de l'e-mail ne mène plus à la signature`, async ({ page }) => {
      const numero = cle === "accepter" ? 607 : 608;
      await etape(page, "Avant : le lien de l'e-mail mène à la page de signature", async () => {
        const lien = await lienDeLEmail(numero);
        expect(lien.statut).toBe(302);
        expect(lien.destination).toBe(LIENS_SIGNATURE.lien(numero));
      });
      await ouvrir(page, "/dashboard");
      await etape(page, `Devis ${nom}`, async () => {
        const reponse = await appelControle(page, MUTATIONS.statutDevis, { id: id(D[cle]), status: statut });
        expect(reponse.errors, "Changement de statut refusé").toEqual([]);
        expect(await statutDu(D[cle])).toBe(statut);
        await attendreEnBase(() => statutDe(S[cle]), "Statut de la demande de signature").toBe("CANCELLED");
      });
      await etape(page, "Après : le lien de l'e-mail mène au site Newbi", async () => {
        const lien = await lienDeLEmail(numero);
        expect(lien.statut).toBe(302);
        expect(lien.destination, "Le client peut encore signer").not.toContain("signature.e2e.invalid");
        expect(lien.destination).toContain(new URL(BASE_URL).host);
      });
    });
  }
});

test.describe("Devis : règles d'une demande de signature", () => {
  for (const [titre, cle, motif] of [
    ["Faire signer un brouillon : refusé", "brouillonASigner", /brouillons ne peuvent pas être signés/],
    ["Faire signer un devis accepté : refusé", "accepteASigner", /Seul un devis en attente/],
    ["Faire signer un devis importé : refusé", "importe", /Seul un devis en attente/],
  ]) {
    test(`${titre}, aucune demande créée`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await demander(page, D[cle], [signataire(1)]);
      expect(reponse.data?.requestDocumentSignature ?? null).toBeNull();
      expect(messages(reponse)).toMatch(motif);
      expect(await demandesDu(D[cle]), "Une demande de signature a été créée").toEqual([]);
    });
  }

  test("Relancer la signature en erreur d'un devis accepté : refusé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelControle(page, MUTATIONS.relancerSignature, { id: id(S.accepteEnErreur) });
    expect(reponse.data?.retrySignature ?? null).toBeNull();
    expect(messages(reponse)).toMatch(/n'est plus en attente/);
    expect(await statutDe(S.accepteEnErreur), "La demande en erreur a été relancée").toBe("ERROR");
  });

  test("Cachet de l'entreprise sans signature du client terminée : refusé, aucun cachet créé", async ({ page }) => {
    await ouvrir(page, "/dashboard");
    const reponse = await appelControle(page, MUTATIONS.cacheter, { id: id(D.cachet) });
    expect(reponse.data?.sealQuoteDocument ?? null).toBeNull();
    expect(messages(reponse)).toMatch(/doit d'abord être signé par le client/);
    expect(await demandesDu(D.cachet)).toEqual([]);
  });
});

test.describe("Devis : signataires d'une demande", () => {
  for (const [titre, signers, motif] of [
    ["Demande à 50 signataires", Array.from({ length: 50 }, (_, i) => signataire(i + 1)), /5 signataires au plus/],
    ["Demande avec l'adresse « pas-un-email »", [{ ...signataire(1), email: "pas-un-email" }], /adresse e-mail invalide/],
    ["Demande avec deux fois la même adresse", [signataire(1), { ...signataire(2), email: signataire(1).email }], /adresse e-mail différente/],
    ["Demande sans signataire", [], /au moins un signataire/],
  ]) {
    test(`${titre} : refusée avec un message, aucune demande créée`, async ({ page }) => {
      await ouvrir(page, "/dashboard");
      const reponse = await demander(page, D.signataires, signers);
      expect(reponse.data?.requestDocumentSignature ?? null).toBeNull();
      expect(messages(reponse)).toMatch(motif);
      expect(await demandesDu(D.signataires), "Une demande de signature a été créée").toEqual([]);
    });
  }

  test("Signataires aux noms réels : enregistrés à l'identique", async ({ page }) => {
    const signers = [
      { name: "Zoé", surname: "L’Hôte-Ñúñez", email: "zoe.lhote@e2e.test" },
      { name: "Seán", surname: "O'Connor", email: "sean.oconnor@e2e.test" },
      { name: "雷", surname: "李", email: "li.lei@e2e.test" },
    ];
    await ouvrir(page, "/dashboard");
    // Le prestataire est injoignable : la demande, enregistrée avant l'envoi, garde les signataires.
    const reponse = await demander(page, D.nomsReels, signers);
    expect(messages(reponse), "Un nom réel est refusé").not.toMatch(/Signataire \d/);
    const demandes = await demandesDu(D.nomsReels);
    expect(demandes, "Demande de signature enregistrée").toHaveLength(1);
    expect(demandes[0].signers.map((s) => ({ name: s.name, surname: s.surname, email: s.email }))).toEqual(signers);
  });
});

test.describe("Devis : fenêtre « Faire signer » au clavier et au lecteur d'écran", () => {
  test("Deux signataires : champs nommés, retrait au clavier, adresse invalide annoncée", async ({ page }) => {
    await epingler(page, "devis", D.dialogue);
    await actionDeLigne(page, "devis", D.dialogue, "Faire signer");
    const fenetre = page.getByRole("dialog").filter({ hasText: "Faire signer" });
    await fenetre.getByRole("button", { name: "Ajouter un signataire" }).click();
    const signataireN = (n) => fenetre.getByRole("group", { name: `Signataire ${n}`, exact: true });

    await etape(
      page,
      "Chaque champ porte son nom",
      async () => {
        for (const n of [1, 2]) {
          for (const champ of ["Prénom", "Nom", "E-mail", "Téléphone"]) {
            await expect.soft(signataireN(n).getByRole("textbox", { name: champ, exact: true }), `Signataire ${n} : champ « ${champ} »`).toBeVisible();
          }
        }
        await expect(fenetre.getByRole("button", { name: "Retirer le signataire 2" }), "Bouton de retrait sans nom").toBeVisible();
      },
      { capture: "ecran" },
    );

    await etape(
      page,
      "Saisie au clavier : une adresse invalide est annoncée",
      async () => {
        // Champs préremplis avec le client du devis : tout sélectionner, puis saisir.
        const saisir = async (texte) => {
          await page.keyboard.press("ControlOrMeta+A");
          await page.keyboard.type(texte);
        };
        await signataireN(1).getByRole("textbox", { name: "Prénom", exact: true }).focus();
        await saisir("Jeanne");
        await page.keyboard.press("Tab");
        await saisir("Dupont");
        await page.keyboard.press("Tab");
        await saisir("pas-un-email");
        await page.keyboard.press("Tab");
        const email = signataireN(1).getByRole("textbox", { name: "E-mail", exact: true });
        await expect(email, "Le champ ne se signale pas comme invalide").toHaveAttribute("aria-invalid", "true");
        await expect(fenetre.getByText("Adresse e-mail invalide"), "Aucun message n'explique l'erreur").toBeVisible();
        await expect(fenetre.getByRole("button", { name: /Envoyer pour signature/ })).toBeDisabled();
      },
      { capture: "ecran" },
    );

    await etape(page, "Retirer le second signataire au clavier", async () => {
      await fenetre.getByRole("button", { name: "Retirer le signataire 2" }).focus();
      await page.keyboard.press("Enter");
      await expect(signataireN(2)).toHaveCount(0);
      await expect(signataireN(1).getByRole("textbox", { name: "Prénom", exact: true })).toHaveValue("Jeanne");
    });
  });
});
