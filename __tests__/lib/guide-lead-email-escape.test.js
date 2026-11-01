import { describe, it, expect } from "vitest";
import { guideLeadNotification } from "@/src/lib/email-templates/leads/guide-notification";

/**
 * E-mail interne envoyé à chaque prospect du guide : les champs viennent
 * d'un formulaire public et sont affichés comme du texte.
 */
const PIEGE = '<a href="//x.example">clic</a><img src=x onerror=alert(1)>';

describe("guideLeadNotification : champs du formulaire affichés comme du texte", () => {
  for (const champ of [
    "firstName",
    "lastName",
    "companyName",
    "email",
    "phone",
    "source",
    "guideName",
  ]) {
    it(`${champ} piégé : aucune balise ajoutée`, () => {
      const html = guideLeadNotification({ [champ]: PIEGE });
      expect(html).not.toContain('<a href="//x.example"');
      expect(html).not.toContain("<img src=x");
      expect(html).toContain(
        "&lt;a href=&quot;//x.example&quot;&gt;clic&lt;/a&gt;",
      );
    });
  }

  it("guillemet dans l'adresse : le lien mailto reste fermé", () => {
    const html = guideLeadNotification({ email: 'a@b.fr" onclick="x' });
    expect(html).toContain('href="mailto:a@b.fr&quot; onclick=&quot;x"');
  });

  it("valeurs ordinaires : affichées telles quelles, accents compris", () => {
    const html = guideLeadNotification({
      firstName: "Zoé",
      lastName: "Lefèvre",
      companyName: "Boulangerie Lefèvre & Fils",
      email: "zoe@boulangerie.fr",
      phone: "06 12 34 56 78",
      source: "LinkedIn",
    });
    expect(html).toContain("Zoé");
    expect(html).toContain("Boulangerie Lefèvre &amp; Fils");
    expect(html).toContain("mailto:zoe@boulangerie.fr");
    expect(html).toContain("06 12 34 56 78");
  });

  it("champ absent : valeur par défaut, sans « undefined »", () => {
    const html = guideLeadNotification({ firstName: "Zoé", phone: undefined });
    expect(html).not.toContain("undefined");
    expect(html).toContain("06 12 34 56 78");
  });
});
