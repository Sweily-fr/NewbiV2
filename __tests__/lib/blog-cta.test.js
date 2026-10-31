// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { CTA_CONTENT, ctaIntentFor } from "@/src/lib/blog-cta";
import { getMDXComponents } from "@/src/components/blog/mdx-components";

/**
 * Appels à l'action des articles adaptés au sujet, et FAQ servie dans le
 * HTML (31/10/2026).
 */

describe("ctaIntentFor", () => {
  const cases = [
    ["modele-facture-gratuit-word-excel-pdf", "generateur-facture"],
    ["logiciel-devis-facture-gratuit", "generateur-facture"],
    ["modele-devis-gratuit-word-excel-pdf", "generateur-devis"],
    ["devis-coach-formateur-modele", "generateur-devis"],
    ["relancer-devis-sans-reponse-modeles", "devis"],
    ["modifier-devis-signe-avenant", "devis"],
    // « devise » n'est pas « devis »
    ["facture-en-devise-etrangere-regles", "facture"],
    ["top-outils-scan-tickets-caisse-notes-frais", "achats"],
    [
      "facture-electronique-clients-etrangers-regles",
      "facturation-electronique",
    ],
    [
      "comment-choisir-sa-pdp-plateforme-dematerialisation",
      "facturation-electronique",
    ],
    ["relance-facture-impayee-modele", "relance"],
    ["plan-de-tresorerie-previsionnel-comment-faire", "tresorerie"],
    ["signature-mail-professionnelle-guide", "signature"],
    ["pennylane-vs-tiime-comparatif", "comparatif"],
    ["facturer-en-sous-traitance-regles", "facture"],
  ];
  it.each(cases)("%s → %s", (slug, intent) => {
    expect(ctaIntentFor({ slug })).toBe(intent);
  });

  it("le frontmatter `cta` force le thème, une valeur inconnue est ignorée", () => {
    expect(
      ctaIntentFor({ slug: "facturer-en-sous-traitance-regles", cta: "devis" }),
    ).toBe("devis");
    expect(
      ctaIntentFor({
        slug: "facturer-en-sous-traitance-regles",
        cta: "nimporte",
      }),
    ).toBe("facture");
  });

  it("la catégorie comparaison ou liste retombe sur le comparatif", () => {
    expect(
      ctaIntentFor({ slug: "quel-outil-choisir", category: "liste" }),
    ).toBe("comparatif");
  });

  it("chaque thème a un bouton principal et aucun tiret cadratin", () => {
    for (const content of Object.values(CTA_CONTENT)) {
      expect(content.primary.href).toMatch(/^\//);
      expect(JSON.stringify(content)).not.toMatch(/[—–]/);
    }
  });
});

describe("composants MDX des articles", () => {
  it("ArticleCta suit le thème de l'article", () => {
    const { ArticleCta } = getMDXComponents({
      slug: "modele-devis-gratuit-word-excel-pdf",
    });
    const html = renderToStaticMarkup(ArticleCta({}));
    expect(html).toContain('href="/outils/generateur-de-devis"');
    expect(html).toContain("Faites votre devis en ligne");
  });

  it("la FAQ sert les réponses dans le HTML, même fermées", () => {
    const c = getMDXComponents({ slug: "facturer-en-sous-traitance-regles" });
    const html = renderToStaticMarkup(
      c.Accordion({
        type: "single",
        collapsible: true,
        children: c.AccordionItem({
          value: "item-1",
          children: [
            c.AccordionTrigger({
              key: "q",
              children: "Qui facture le sous-traitant ?",
            }),
            c.AccordionContent({
              key: "r",
              children: "L'entrepreneur principal.",
            }),
          ],
        }),
      }),
    );
    expect(html).toMatch(/<details[^>]*><summary/);
    expect(html).toContain("<h3");
    expect(html).toContain("L&#x27;entrepreneur principal.");
    expect(html).not.toContain(" open");
  });
});

describe("articles publiés", () => {
  const dir = path.join(process.cwd(), "content/blog");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  it("un `cta` de frontmatter, s'il existe, est un thème connu", () => {
    for (const f of files) {
      const { data } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
      if (data.cta !== undefined)
        expect(Object.keys(CTA_CONTENT)).toContain(data.cta);
    }
  });

  it("aucun bloc d'inscription générique ne reste à côté d'un ArticleCta", () => {
    for (const f of files) {
      const src = fs.readFileSync(path.join(dir, f), "utf8");
      if (!src.includes("<ArticleCta")) continue;
      expect(src).not.toMatch(
        /<div className="not-prose[^"]*">\s*<Button asChild[^>]*>\s*<Link href="\/auth\/signup"[^>]*>[^<]*<\/Link>\s*<\/Button>\s*<\/div>/,
      );
    }
  });
});
