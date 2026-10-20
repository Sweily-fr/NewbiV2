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
import { connecte, SESSION_TOKEN_EQUIPE } from "../config.mjs";
import { COMPTES_AUTH, INVITATIONS, MEMBRES_CIBLES, ROLES_PERSO } from "../donnees/lot-parametres-auth.mjs";
import { contenuParametres, ouvrirParametres, SANS_SESSION } from "../authentification/outils-auth.mjs";

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

  test("Inviter un membre : invitation en attente, avec le rôle choisi", async ({ page }) => {
    const zone = await ouvrirMembres(page, EQUIPE.organisation.name);
    await zone.getByRole("button", { name: "Inviter des membres" }).click();
    const fenetre = page.getByRole("dialog", { name: "Inviter des membres" });
    await fenetre.getByPlaceholder("exemple@email.com").fill("nouvelle-recrue@e2e.test");
    await fenetre.getByPlaceholder("exemple@email.com").press("Enter");
    await fenetre.getByRole("combobox").click();
    await page.getByRole("option", { name: "Éditeur" }).click();
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await fenetre.getByRole("button", { name: /Envoyer les invitations/ }).click();
    await expect.poll(async () => (await (await db()).collection("invitation").findOne({ email: "nouvelle-recrue@e2e.test" }))?.role, { message: "Invitation absente de la base" }).toBe(
      "member",
    );
    const inv = await (await db()).collection("invitation").findOne({ email: "nouvelle-recrue@e2e.test" });
    expect(String(inv.organizationId)).toBe(EQUIPE.organisation._id.toHexString());
    expect(inv.status).toBe("pending");
  });

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
    test.use({ storageState: connecte(COMPTES_AUTH.invite.token) });
    test("L'invité connecté accepte : il devient membre d'« Équipe »", async ({ page }) => {
      await ouvrir(page, `/accept-invitation/${idInvitation("acceptee").toHexString()}`, { pret: page.getByRole("button", { name: "Accepter l'invitation" }) });
      await expect(page.getByText(EQUIPE.organisation.name).first()).toBeVisible();
      await page.getByRole("button", { name: "Accepter l'invitation" }).click();
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
      const membre = await (await db()).collection("member").findOne({ organizationId: EQUIPE.organisation._id, userId: COMPTES_AUTH.invite.utilisateur._id });
      expect(membre?.role, "L'invité n'est pas membre après avoir accepté").toBe("viewer");
      expect((await (await db()).collection("invitation").findOne({ _id: idInvitation("acceptee") }))?.status).toBe("accepted");
    });

    test("L'invité refuse une invitation : elle est close, il n'est pas membre", async ({ page }) => {
      await ouvrir(page, `/accept-invitation/${idInvitation("aRefuser").toHexString()}`, { pret: page.getByRole("button", { name: "Refuser" }) });
      await page.getByRole("button", { name: "Refuser" }).click();
      await expect.poll(async () => (await (await db()).collection("invitation").findOne({ _id: idInvitation("aRefuser") }))?.status).toBe("rejected");
      expect(await (await db()).collection("member").findOne({ organizationId: COMPTES.configuration.organisation._id, userId: COMPTES_AUTH.invite.utilisateur._id })).toBeNull();
    });
  });

  test.describe(() => {
    // Refus attendu de la route d'acceptation (403), écrit dans la console.
    test.use({ storageState: connecte(COMPTES_AUTH.inviteAutre.token), erreursConsoleAutorisees: /status of 403/ });
    test("Un autre compte connecté ne peut pas accepter l'invitation : message clair, pas membre", async ({ page }) => {
      await ouvrir(page, `/accept-invitation/${idInvitation("autreDestinataire").toHexString()}`, { pret: page.getByRole("button", { name: "Accepter l'invitation" }) });
      await page.getByRole("button", { name: "Accepter l'invitation" }).click();
      await etape(page, "Un message explique le refus", () => expect(page.getByText(/adress|destin|autre compte|e-mail|email/i).first()).toBeVisible(), { capture: "ecran" });
      expect(await (await db()).collection("member").findOne({ organizationId: EQUIPE.organisation._id, userId: COMPTES_AUTH.inviteAutre.utilisateur._id })).toBeNull();
      expect((await (await db()).collection("invitation").findOne({ _id: idInvitation("autreDestinataire") }))?.status).toBe("pending");
    });
  });

  test.describe(() => {
    test.use({ storageState: SANS_SESSION });
    test("Invitation expirée : la page le dit", async ({ page }) => {
      await page.goto(`/accept-invitation/${idInvitation("expiree").toHexString()}`);
      await expect(page.getByText(/expir/i).first()).toBeVisible({ timeout: 30_000 });
    });

    test("Invitation annulée : la page le dit", async ({ page }) => {
      await page.goto(`/accept-invitation/${idInvitation("annulee").toHexString()}`);
      await expect(page.getByText(/annul|n'est plus valide|plus disponible/i).first()).toBeVisible({ timeout: 30_000 });
    });

    test.describe(() => {
      test.use({ erreursConsoleAutorisees: /status of 404/ });
      test("Invitation inconnue : la page le dit", async ({ page }) => {
        await page.goto(`/accept-invitation/${"e2e1e".padEnd(24, "f")}`);
        await expect(page.getByText(/introuvable|n'existe pas|non trouvée|invalide/i).first()).toBeVisible({ timeout: 30_000 });
      });
    });

    test("Lien d'invitation mal formé : message clair, pas d'erreur serveur", async ({ page }) => {
      await page.goto("/accept-invitation/lien-tronque");
      await page.waitForTimeout(3_000);
      await expect(page.getByText(/introuvable|invalide|n'existe pas|non trouvée/i).first(), "Aucun message pour un lien mal formé").toBeVisible();
    });

    // L'API ne renvoie plus l'e-mail de l'invitation (données minimales avant connexion) :
    // la redirection construit alors « email=undefined ».
    test("« Se connecter pour accepter » : l'adresse transmise n'est pas « undefined »", async ({ page }) => {
      await ouvrir(page, `/accept-invitation/${idInvitation("nouvelInscrit").toHexString()}`, { pret: page.getByRole("button", { name: "Se connecter pour accepter" }) });
      await page.getByRole("button", { name: "Se connecter pour accepter" }).click();
      await expect(page).toHaveURL(/\/auth\/(signup|login)/, { timeout: 30_000 });
      expect(page.url(), "L'adresse de la page de connexion porte « email=undefined »").not.toContain("email=undefined");
      await expect(page.locator("input[value='undefined']"), "Un champ est prérempli avec « undefined »").toHaveCount(0);
    });
  });
});

