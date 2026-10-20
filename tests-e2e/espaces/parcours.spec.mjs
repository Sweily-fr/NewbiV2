/**
 * Espaces, membres et invitations : les parcours à l'écran, chaque action
 * vérifiée en base. Le propriétaire d'« Équipe » invite, change un rôle,
 * retire un membre, annule une invitation, crée, modifie et supprime des
 * rôles ; le propriétaire de « Transfert » cède son rôle de super admin ;
 * les invités ouvrent leur lien d'invitation. Une donnée par action
 * (donnees/lot-parametres-auth.mjs).
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir } from "../navigation.mjs";
import { base } from "../base.mjs";
import { COMPTES, oid } from "../donnees/base.mjs";
import { connecte, SESSION_TOKEN_EQUIPE, SESSION_TOKEN_GESTION_EQUIPE } from "../config.mjs";
import { COMPTES_AUTH, INVITATIONS, MEMBRES_CIBLES, ROLES_PERSO } from "../donnees/lot-parametres-auth.mjs";
import { appelSite, connecteAvecConsentement, contenuParametres, ouvrirParametres, SANS_SESSION } from "../authentification/outils-auth.mjs";

const EQUIPE = COMPTES.equipe;
const idInvitation = (cle) => oid("invitationAuth", INVITATIONS[cle].n);
const idCible = (cle) => oid("membreAuth", MEMBRES_CIBLES[cle].n);
const db = () => base();

/** Onglet Espaces, puis la liste des membres de l'espace choisi. */
async function ouvrirMembres(page, nomEspace) {
  await ouvrirParametres(page, "espaces", { pret: (z) => z.getByRole("row").filter({ hasText: nomEspace }) });
  await contenuParametres(page).getByRole("row").filter({ hasText: nomEspace }).first().click();
  const recherche = contenuParametres(page).getByPlaceholder("Rechercher par nom ou email");
  await expect(recherche).toBeVisible();
  return contenuParametres(page);
}

/** Menu « … » de la ligne d'un membre ou d'une invitation. */
async function menuDeLigne(page, zone, texte) {
  const ligne = zone.getByRole("row").filter({ hasText: texte });
  await expect(ligne.first(), `Ligne « ${texte} » absente de la liste`).toBeVisible();
  await ligne.first().locator("button:has(svg.lucide-ellipsis), button:has(svg.lucide-more-horizontal)").click();
  return page.getByRole("menu").last();
}

test.describe("Espaces : le propriétaire gère les membres d'« Équipe »", () => {
  test.use({ storageState: connecte(SESSION_TOKEN_EQUIPE) });

  test("Changer le rôle d'un membre : Membre devient Éditeur", async ({ page }) => {
    const zone = await ouvrirMembres(page, EQUIPE.organisation.name);
    const menu = await menuDeLigne(page, zone, MEMBRES_CIBLES.roleChange.name);
    await menu.getByRole("menuitem", { name: "Changer le rôle" }).click();
    const fenetre = page.getByRole("dialog").filter({ hasText: "Nouveau rôle" });
    await fenetre.getByRole("combobox").click();
    await page.getByRole("option", { name: /^Éditeur/ }).click();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await fenetre.getByRole("button", { name: "Confirmer" }).click();
    await expect.poll(async () => (await (await db()).collection("member").findOne({ _id: idCible("roleChange") }))?.role).toBe("member");
  });

  test("Retirer un membre : il n'est plus dans l'espace", async ({ page }) => {
    const zone = await ouvrirMembres(page, EQUIPE.organisation.name);
    const menu = await menuDeLigne(page, zone, MEMBRES_CIBLES.retrait.name);
    await menu.getByRole("menuitem", { name: "Retirer de l'espace" }).click();
    const alerte = page.getByRole("alertdialog");
    await etape(page, "Confirmation demandée", () => expect(alerte).toBeVisible(), { capture: "ecran" });
    await alerte.getByRole("button", { name: "Retirer", exact: true }).click();
    await expect.poll(async () => (await db()).collection("member").findOne({ _id: idCible("retrait") })).toBeNull();
    await expect(zone.getByRole("row").filter({ hasText: MEMBRES_CIBLES.retrait.name })).toHaveCount(0);
  });

  test("Annuler une invitation : elle n'est plus en attente", async ({ page }) => {
    const zone = await ouvrirMembres(page, EQUIPE.organisation.name);
    const menu = await menuDeLigne(page, zone, INVITATIONS.annuler.email);
    await menu.getByRole("menuitem", { name: "Annuler l'invitation" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Annuler l'invitation" }).click();
    await expect.poll(async () => (await (await db()).collection("invitation").findOne({ _id: idInvitation("annuler") }))?.status).toBe("canceled");
  });

  test("Le super admin n'a pas de menu sur sa propre ligne", async ({ page }) => {
    const zone = await ouvrirMembres(page, EQUIPE.organisation.name);
    const ligne = zone.getByRole("row").filter({ hasText: EQUIPE.utilisateur.email });
    await expect(ligne.first()).toBeVisible();
    await expect(ligne.first().getByRole("button")).toHaveCount(0);
  });

  test("Créer un rôle personnalisé : enregistré avec ses droits", async ({ page }) => {
    await ouvrirParametres(page, "roles");
    await contenuParametres(page).getByRole("button", { name: "Créer un rôle" }).click();
    const fenetre = page.getByRole("dialog", { name: "Nouveau rôle" });
    await fenetre.getByRole("textbox", { name: "Nom du rôle" }).fill("Support client");
    await fenetre.getByRole("textbox", { name: "Description (facultatif)" }).fill("Répond aux clients, consulte les factures");
    await fenetre.getByRole("button", { name: "Créer le rôle" }).click();
    await expect
      .poll(async () => (await (await db()).collection("organizationRole").findOne({ organizationId: EQUIPE.organisation._id, name: "Support client" }))?.description)
      .toBe("Répond aux clients, consulte les factures");
    const role = await (await db()).collection("organizationRole").findOne({ organizationId: EQUIPE.organisation._id, name: "Support client" });
    expect(role.role).toMatch(/^role_[0-9a-f]{24}$/);
  });

  test("Modifier un rôle personnalisé : nom et description enregistrés", async ({ page }) => {
    await ouvrirParametres(page, "roles");
    await contenuParametres(page).getByRole("button", { name: new RegExp(`^${ROLES_PERSO.aModifier.name}`) }).click();
    const fenetre = page.getByRole("dialog", { name: `Modifier « ${ROLES_PERSO.aModifier.name} »` });
    await fenetre.getByRole("textbox", { name: "Description (facultatif)" }).fill("Description modifiée à l'écran");
    await fenetre.getByRole("button", { name: "Enregistrer" }).click();
    await expect.poll(async () => (await (await db()).collection("organizationRole").findOne({ _id: ROLES_PERSO.aModifier._id }))?.description).toBe("Description modifiée à l'écran");
  });

  test("Supprimer un rôle personnalisé : ses membres passent à un autre rôle", async ({ page }) => {
    await ouvrirParametres(page, "roles");
    await contenuParametres(page).getByRole("button", { name: new RegExp(`^${ROLES_PERSO.aSupprimer.name}`) }).click();
    const fenetre = page.getByRole("dialog", { name: `Modifier « ${ROLES_PERSO.aSupprimer.name} »` });
    await fenetre.getByRole("button", { name: "Supprimer", exact: true }).click();
    const alerte = page.getByRole("alertdialog", { name: `Supprimer le rôle « ${ROLES_PERSO.aSupprimer.name} »` });
    await alerte.getByRole("button", { name: "Supprimer", exact: true }).click();
    await expect.poll(async () => (await db()).collection("organizationRole").findOne({ _id: ROLES_PERSO.aSupprimer._id })).toBeNull();
    const membre = await (await db()).collection("member").findOne({ _id: idCible("roleSupprime") });
    expect(membre, "Le membre du rôle supprimé a été retiré de l'espace").not.toBeNull();
    expect(membre.role, "Le membre garde un rôle qui n'existe plus").not.toBe(ROLES_PERSO.aSupprimer.role);
  });
});

test.describe("Espaces : inviter un membre à l'écran", () => {
  // « Équipe » dépasse les 10 utilisateurs de l'offre (membres et invitations des
  // autres tests) : l'invitation passe par l'achat de sièges. Espace à part.
  test.use({ storageState: connecte(COMPTES_AUTH.invitationsEcran.token) });
  test("Inviter un membre : invitation en attente, avec le rôle choisi", async ({ page }) => {
    const compte = COMPTES_AUTH.invitationsEcran;
    const zone = await ouvrirMembres(page, compte.organisation.name);
    await zone.getByRole("button", { name: "Inviter des membres" }).click();
    const fenetre = page.getByRole("dialog", { name: "Inviter des membres" });
    await fenetre.getByPlaceholder("exemple@email.com").fill("nouvelle-recrue@e2e.test");
    await fenetre.getByPlaceholder("exemple@email.com").press("Enter");
    await fenetre.getByRole("combobox").click();
    await page.getByRole("option", { name: "Éditeur" }).click();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await fenetre.getByRole("button", { name: /Envoyer les invitations/ }).click();
    await expect.poll(async () => (await (await db()).collection("invitation").findOne({ email: "nouvelle-recrue@e2e.test" }))?.role, { message: "Invitation absente de la base" }).toBe("member");
    const inv = await (await db()).collection("invitation").findOne({ email: "nouvelle-recrue@e2e.test" });
    expect(String(inv.organizationId)).toBe(compte.organisation._id.toHexString());
    expect(inv.status).toBe("pending");
  });
});

test.describe("Espaces : le rôle « Gestion d'équipe » gère les membres à l'écran", () => {
  // Le tableau de bord lance des requêtes refusées à ce rôle limité (défaut dédié,
  // parametres/lecture-seule.spec.mjs) : tolérées ici.
  test.use({ storageState: connecte(SESSION_TOKEN_GESTION_EQUIPE), erreursConsoleAutorisees: /GraphQL Error|FORBIDDEN|permission/ });
  // Le rôle a « Changer le rôle » et « Retirer » sur la page Membres (le serveur
  // les accepte, voir securite.spec.mjs) ; le menu d'une ligne dépend pourtant du
  // droit de modifier les informations de l'entreprise.
  test("Le menu d'un membre propose « Changer le rôle » et « Retirer de l'espace »", async ({ page }) => {
    const zone = await ouvrirMembres(page, EQUIPE.organisation.name);
    const ligne = zone.getByRole("row").filter({ hasText: MEMBRES_CIBLES.intrus.name });
    await expect(ligne.first()).toBeVisible();
    const menu = ligne.first().locator("button:has(svg.lucide-ellipsis), button:has(svg.lucide-more-horizontal)");
    await expect(menu, "Aucun menu sur la ligne d'un membre : le rôle ne peut ni changer un rôle ni retirer un membre à l'écran").toHaveCount(1);
    await menu.click();
    await expect(page.getByRole("menuitem", { name: "Changer le rôle" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Retirer de l'espace" })).toBeVisible();
  });
});

test.describe("Espaces : transférer le rôle de super admin", () => {
  test.use({ storageState: connecte(COMPTES_AUTH.transfert.token) });
  test("Le membre choisi devient super admin, l'ancien garde l'accès", async ({ page }) => {
    const zone = await ouvrirMembres(page, COMPTES_AUTH.transfert.organisation.name);
    const menu = await menuDeLigne(page, zone, MEMBRES_CIBLES.transfert.name);
    await menu.getByRole("menuitem", { name: "Transférer le rôle de super admin" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Transférer", exact: true }).click();
    const org = COMPTES_AUTH.transfert.organisation._id;
    await expect.poll(async () => (await (await db()).collection("member").findOne({ _id: idCible("transfert") }))?.role).toBe("owner");
    const ancien = await (await db()).collection("member").findOne({ organizationId: org, userId: COMPTES_AUTH.transfert.utilisateur._id });
    expect(ancien, "L'ancien super admin a perdu l'accès à son espace").not.toBeNull();
    expect(ancien.role).not.toBe("owner");
    expect(await (await db()).collection("member").countDocuments({ organizationId: org, role: "owner" }), "Un seul super admin par espace").toBe(1);
  });
});

test.describe("Espaces : ouvrir son invitation", () => {
  test.describe(() => {
    test.use({ storageState: connecteAvecConsentement(COMPTES_AUTH.invite.token) });

    // La page lit invitation.email, que la route ne renvoie plus (données minimales
    // avant connexion) : « Cannot read properties of undefined (reading 'toLowerCase') ».
    test("Invité connecté : la page de son invitation s'affiche (sans erreur)", async ({ page }) => {
      await ouvrir(page, `/accept-invitation/${idInvitation("acceptee").toHexString()}`);
      await expect(page.getByRole("button", { name: "Accepter l'invitation" }), "La page de l'invitation ne s'affiche pas : « Une erreur est survenue »").toBeVisible();
    });

    // Même action que le bouton « Accepter l'invitation » (route appelée par la page).
    test("Accepter (route de la page) : l'invité devient membre d'« Équipe »", async ({ page }) => {
      await ouvrir(page, "/mentions-legales");
      const r = await appelSite(page, `/api/invitations/${idInvitation("acceptee").toHexString()}`, { methode: "POST", corps: { action: "accept" } });
      expect(r.statut, `Acceptation refusée : ${JSON.stringify(r.corps).slice(0, 200)}`).toBe(200);
      const membre = await (await db()).collection("member").findOne({ organizationId: EQUIPE.organisation._id, userId: COMPTES_AUTH.invite.utilisateur._id });
      expect(membre?.role, "L'invité n'est pas membre après avoir accepté").toBe("viewer");
      expect((await (await db()).collection("invitation").findOne({ _id: idInvitation("acceptee") }))?.status).toBe("accepted");
    });

    test("Refuser (route de la page) : l'invitation est close, il n'est pas membre", async ({ page }) => {
      await ouvrir(page, "/mentions-legales");
      const r = await appelSite(page, `/api/invitations/${idInvitation("aRefuser").toHexString()}`, { methode: "POST", corps: { action: "reject" } });
      expect(r.statut, `Refus impossible : ${JSON.stringify(r.corps).slice(0, 200)}`).toBe(200);
      expect((await (await db()).collection("invitation").findOne({ _id: idInvitation("aRefuser") }))?.status).toBe("rejected");
      expect(await (await db()).collection("member").findOne({ organizationId: COMPTES.configuration.organisation._id, userId: COMPTES_AUTH.invite.utilisateur._id })).toBeNull();
    });
  });

  test.describe(() => {
    // Refus attendu de la route d'acceptation (403), écrit dans la console.
    test.use({ storageState: connecteAvecConsentement(COMPTES_AUTH.inviteAutre.token), erreursConsoleAutorisees: /status of 403/ });
    test("Un autre compte connecté ne peut pas accepter l'invitation : refus explicite, pas membre", async ({ page }) => {
      await ouvrir(page, "/mentions-legales");
      const r = await appelSite(page, `/api/invitations/${idInvitation("autreDestinataire").toHexString()}`, { methode: "POST", corps: { action: "accept" } });
      expect(r.statut).toBe(403);
      expect(JSON.stringify(r.corps)).toMatch(/adresse|destin|e-mail|email/i);
      expect(await (await db()).collection("member").findOne({ organizationId: EQUIPE.organisation._id, userId: COMPTES_AUTH.inviteAutre.utilisateur._id })).toBeNull();
      expect((await (await db()).collection("invitation").findOne({ _id: idInvitation("autreDestinataire") }))?.status).toBe("pending");
    });
  });

  test.describe(() => {
    test.use({ storageState: SANS_SESSION });
    test("Invitation expirée : la page le dit au lieu de proposer de créer un compte", async ({ page }) => {
      await page.goto(`/accept-invitation/${idInvitation("expiree").toHexString()}`);
      await expect(page.getByText(/Rejoindre/).first()).toBeVisible({ timeout: 30_000 });
      await etape(page, "L'expiration est annoncée", () => expect(page.getByText(/expir/i).first(), "La page propose « Créer mon compte » pour une invitation expirée").toBeVisible(), { capture: "ecran" });
    });

    test("Invitation annulée : la page dit qu'elle n'est plus utilisable", async ({ page }) => {
      await page.goto(`/accept-invitation/${idInvitation("annulee").toHexString()}`);
      await expect(page.getByText(/déjà été traitée|annul|n'est plus valide/i).first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("button", { name: /Créer mon compte|Accepter/ })).toHaveCount(0);
    });

    test.describe(() => {
      // Réponse 404 attendue (invitation inconnue), écrite dans la console par la page.
      test.use({ erreursConsoleAutorisees: /status of 404|Erreur 404/ });
      test("Invitation inconnue : un message compréhensible, pas « Erreur 404: Not Found »", async ({ page }) => {
        await page.goto(`/accept-invitation/${"e2e1e".padEnd(24, "f")}`);
        await expect(page.getByText(/Erreur/).first()).toBeVisible({ timeout: 30_000 });
        await etape(page, "Message compréhensible", () => expect(page.getByText(/introuvable|n'existe pas|n'est plus valide|invalide/i).first(), "Seul un message technique s'affiche (« Erreur 404: Not Found »)").toBeVisible(), { capture: "ecran" });
      });
    });

    test("Lien d'invitation mal formé : message clair, pas d'erreur serveur", async ({ page }) => {
      await page.goto("/accept-invitation/lien-tronque");
      await page.waitForTimeout(3_000);
      await expect(page.getByText(/introuvable|invalide|n'existe pas|non trouvée/i).first(), "Aucun message pour un lien mal formé").toBeVisible();
    });

    // L'API ne renvoie plus l'e-mail de l'invitation (données minimales avant connexion) :
    // la redirection construit alors « email=undefined ».
    test("« Créer mon compte » : l'adresse transmise n'est pas « undefined »", async ({ page }) => {
      await page.goto(`/accept-invitation/${idInvitation("nouvelInscrit").toHexString()}`);
      const bouton = page.getByRole("button", { name: /Créer mon compte|Se connecter pour accepter/ });
      await expect(bouton).toBeVisible({ timeout: 30_000 });
      await bouton.click();
      await expect(page).toHaveURL(/\/auth\/(signup|login)/, { timeout: 30_000 });
      expect(page.url(), "L'adresse de la page d'inscription porte « email=undefined »").not.toContain("email=undefined");
      await expect(page.locator("input[value='undefined']"), "Un champ est prérempli avec « undefined »").toHaveCount(0);
    });
  });
});
