/**
 * Liens du contenu des articles : un article qui cite un article écrit
 * d'avance, pas encore publié par le robot du blog, n'affiche que le texte
 * (le lien mènerait à une 404 jusqu'à la sortie de l'article).
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { getMDXComponents } from "@/src/components/blog/mdx-components";

const post = { slug: "article-courant" };
const brouillons = new Set(["augmenter-ses-tarifs"]);

function rendu(nom, props) {
  const Composant = getMDXComponents(post, brouillons)[nom];
  return render(<Composant {...props} />).container;
}

describe("liens vers les articles pas encore publiés", () => {
  it("affiche seulement le texte d'un lien vers un brouillon", () => {
    const zone = rendu("a", {
      href: "/blog/augmenter-ses-tarifs",
      children: "augmentation de ses tarifs",
    });
    expect(zone.querySelector("a")).toBeNull();
    expect(zone.textContent).toBe("augmentation de ses tarifs");
  });

  it("vaut aussi pour <Link> et pour l'adresse complète", () => {
    const zone = rendu("Link", {
      href: "https://www.newbi.fr/blog/augmenter-ses-tarifs#exemples",
      children: "nos exemples",
    });
    expect(zone.querySelector("a")).toBeNull();
    expect(zone.textContent).toBe("nos exemples");
  });

  it("garde le lien vers un article publié", () => {
    const zone = rendu("a", {
      href: "/blog/facture-en-ligne-vs-excel",
      children: "facture en ligne",
    });
    expect(zone.querySelector("a")?.getAttribute("href")).toBe(
      "/blog/facture-en-ligne-vs-excel",
    );
  });

  it("garde les liens hors articles et les liens externes", () => {
    expect(
      rendu("a", { href: "/tarifs", children: "tarifs" })
        .querySelector("a")
        ?.getAttribute("href"),
    ).toBe("/tarifs");
    const externe = rendu("a", {
      href: "https://www.impots.gouv.fr",
      children: "impots.gouv.fr",
    }).querySelector("a");
    expect(externe?.getAttribute("target")).toBe("_blank");
  });

  it("sans liste de brouillons, rien ne change", () => {
    const Composant = getMDXComponents(post).a;
    const zone = render(
      <Composant href="/blog/augmenter-ses-tarifs">texte</Composant>,
    ).container;
    expect(zone.querySelector("a")?.getAttribute("href")).toBe(
      "/blog/augmenter-ses-tarifs",
    );
  });
});
