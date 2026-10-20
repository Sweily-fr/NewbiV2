/**
 * Transferts : parcours d'interface vérifiés en base. Renommer (depuis le
 * tiroir de détail) et supprimer (depuis le menu de la ligne), chacun sur sa
 * propre donnée. L'envoi réel passe par R2 (absent en CI) et n'est pas testé.
 */
import { test, expect, etape } from "../outils.mjs";
import { ouvrir, attendreCalme } from "../navigation.mjs";
import { base } from "../base.mjs";
import { connecte, SESSION_TOKEN_COLLAB } from "../config.mjs";
import { TRANSFERTS } from "../donnees/lot-collaboration.mjs";

test.use({ storageState: connecte(SESSION_TOKEN_COLLAB) });

const transfertEnBase = (idDoc) => base().then((db) => db.collection("filetransfers").findOne({ _id: idDoc }));
const ouvrirListe = (page) => ouvrir(page, "/dashboard/outils/transferts-fichiers", { pret: page.getByRole("tab", { name: /Tous/ }) });

test.describe("Transferts : renommer depuis le tiroir", () => {
  test("Le nouveau titre est enregistré", async ({ page }) => {
    const nouveau = "Transfert renommé œuvre 2026";
    await ouvrirListe(page);
    // Clic sur la ligne : ouvre le tiroir de détail.
    await page.getByText(TRANSFERTS.renommerUi.title).first().click();
    await attendreCalme(page);
    // Menu du tiroir (MoreVertical) puis « Renommer le transfert ».
    await page.locator("button:has(svg.lucide-ellipsis-vertical)").last().click();
    await page.getByRole("menuitem", { name: "Renommer le transfert" }).click();
    const fenetre = page.getByRole("dialog").filter({ hasText: "Renommer le transfert" });
    await expect(fenetre).toBeVisible();
    await fenetre.getByPlaceholder("Nom du transfert").fill(nouveau);
    await etape(
      page,
      "Valider le renommage",
      async () => {
        await fenetre.getByRole("button", { name: "Renommer", exact: true }).click();
        await expect(fenetre).toBeHidden({ timeout: 15_000 });
      },
      { capture: "ecran" },
    );
    await expect.poll(async () => (await transfertEnBase(TRANSFERTS.renommerUi._id))?.title, { timeout: 10_000 }).toBe(nouveau);
  });
});

test.describe("Transferts : supprimer depuis le menu de la ligne", () => {
  test("Le transfert passe en « deleted » en base", async ({ page }) => {
    await ouvrirListe(page);
    const ligne = page.getByRole("row").filter({ hasText: TRANSFERTS.supprimerUi.title });
    await ligne.getByRole("button", { name: "Ouvrir le menu" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    const confirmation = page.getByRole("alertdialog").or(page.getByRole("dialog").filter({ hasText: /Confirmer la suppression/ }));
    await expect(confirmation).toBeVisible();
    await etape(
      page,
      "Confirmer la suppression",
      async () => {
        await confirmation.getByRole("button", { name: "Supprimer" }).click();
      },
      { capture: "ecran" },
    );
    await expect.poll(async () => (await transfertEnBase(TRANSFERTS.supprimerUi._id))?.status, { timeout: 10_000 }).toBe("deleted");
  });
});
