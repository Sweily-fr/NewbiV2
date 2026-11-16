import { describe, it, expect } from "vitest";
import {
  BLOCK_TYPES,
  DEFAULT_PADDING,
  DEFAULT_STYLE,
  addBlock,
  blockWithDefaults,
  clampNumber,
  createBlock,
  designSummary,
  duplicateBlock,
  emptyDesign,
  findBlock,
  htmlToText,
  insertBlock,
  isBlankHtml,
  moveBlock,
  moveBlockBy,
  normalizeDesign,
  removeBlock,
  resolvePadding,
  resolveStyle,
  updateBlock,
  updateStyle,
} from "@/src/utils/email-campaign-design";

const design = (...types) =>
  normalizeDesign({
    blocks: types.map((type, index) => ({ id: `b${index + 1}`, type })),
  });

const ids = (d) => d.blocks.map((block) => block.id);

describe("normalizeDesign", () => {
  it("complète un design vide : version, style par défaut, aucun bloc", () => {
    const result = normalizeDesign(null);
    expect(result.version).toBe(1);
    expect(result.style).toEqual(DEFAULT_STYLE);
    expect(result.blocks).toEqual([]);
    expect(emptyDesign()).toEqual(result);
  });

  it("garde le style enregistré et complète le reste", () => {
    const result = normalizeDesign({ style: { primaryColor: "#ff0000" } });
    expect(result.style.primaryColor).toBe("#ff0000");
    expect(result.style.backgroundColor).toBe(DEFAULT_STYLE.backgroundColor);
  });

  it("écarte les blocs inconnus et remplace les identifiants manquants ou en double", () => {
    const result = normalizeDesign({
      blocks: [
        { id: "a", type: "text" },
        { id: "a", type: "button" },
        { type: "heading" },
        { id: "z", type: "video" },
        null,
      ],
    });
    expect(result.blocks.map((block) => block.type)).toEqual([
      "text",
      "button",
      "heading",
    ]);
    const blockIds = ids(result);
    expect(new Set(blockIds).size).toBe(3);
    expect(blockIds[0]).toBe("a");
    expect(blockIds[1]).not.toBe("a");
  });
});

describe("valeurs par défaut", () => {
  it("chaque type se crée avec un identifiant unique et ses réglages complets", () => {
    const created = BLOCK_TYPES.map((type) => createBlock(type));
    expect(new Set(created.map((block) => block.id)).size).toBe(
      BLOCK_TYPES.length,
    );
    const button = created.find((block) => block.type === "button");
    expect(button).toMatchObject({
      label: "En savoir plus",
      textColor: "#ffffff",
      borderRadius: 6,
      fontSize: 16,
      fullWidth: false,
      align: "center",
      backgroundColor: null,
    });
    expect(button.padding).toEqual(DEFAULT_PADDING.button);
    // L'espace n'a pas de marges
    expect(created.find((block) => block.type === "spacer").padding).toBe(
      undefined,
    );
  });

  it("un type inconnu est refusé", () => {
    expect(() => createBlock("video")).toThrow();
  });

  it("une propriété absente prend la valeur par défaut, une valeur hors bornes est ramenée", () => {
    const text = blockWithDefaults({
      id: "t",
      type: "text",
      fontSize: 40,
      lineHeight: 0.5,
      align: "justify",
    });
    expect(text).toMatchObject({
      fontSize: 22,
      lineHeight: 1.2,
      align: "left",
      color: null,
    });
    expect(text.padding).toEqual(DEFAULT_PADDING.text);

    expect(
      blockWithDefaults({ id: "s", type: "spacer", height: 500 }).height,
    ).toBe(120);
    // Titre moyen par défaut, comme l'API
    expect(
      blockWithDefaults({ id: "h", type: "heading", level: 7 }).level,
    ).toBe(2);
    expect(blockWithDefaults({ id: "x", type: "video" })).toBe(null);
  });

  it("remplace un réseau inconnu par « Site web », comme l'API", () => {
    const social = blockWithDefaults({
      id: "r",
      type: "social",
      items: [
        { network: "facebook", url: "https://facebook.com/x" },
        { network: "myspace", url: "https://myspace.com/x" },
        null,
      ],
      iconStyle: "neon",
    });
    expect(social.items.map((item) => item.network)).toEqual([
      "facebook",
      "website",
    ]);
    expect(social.iconStyle).toBe("color");
  });

  it("complète des marges partielles et borne chaque côté", () => {
    expect(resolvePadding("text", { top: 0, left: 200 })).toEqual({
      top: 0,
      right: DEFAULT_PADDING.text.right,
      bottom: DEFAULT_PADDING.text.bottom,
      left: 80,
    });
  });

  it("corrige un style hors bornes ou une police inconnue", () => {
    const style = resolveStyle({
      contentWidth: 2000,
      fontFamily: "Comic Sans",
    });
    expect(style.contentWidth).toBe(720);
    expect(style.fontFamily).toBe("Arial");
    expect(style.textColor).toBe(DEFAULT_STYLE.textColor);
  });

  it("clampNumber renvoie le repli pour une valeur non numérique", () => {
    expect(clampNumber("12", 0, 10, 5)).toBe(10);
    expect(clampNumber("abc", 0, 10, 5)).toBe(5);
    expect(clampNumber(undefined, 0, 10, 5)).toBe(5);
  });
});

describe("ajout de blocs", () => {
  it("ajoute après le bloc sélectionné", () => {
    const { design: next, block } = addBlock(
      design("heading", "text", "button"),
      "image",
      "b1",
    );
    expect(next.blocks.map((b) => b.type)).toEqual([
      "heading",
      "image",
      "text",
      "button",
    ]);
    expect(next.blocks[1].id).toBe(block.id);
  });

  it("ajoute à la fin sans sélection ou si le bloc n'existe plus", () => {
    const base = design("heading", "text");
    expect(addBlock(base, "divider").design.blocks.at(-1).type).toBe("divider");
    expect(addBlock(base, "divider", "inconnu").design.blocks.at(-1).type).toBe(
      "divider",
    );
  });

  it("insère à une position bornée sans modifier le design d'origine", () => {
    const base = design("heading", "text");
    const block = createBlock("spacer");
    expect(ids(insertBlock(base, block, 0))[0]).toBe(block.id);
    expect(ids(insertBlock(base, block, 99)).at(-1)).toBe(block.id);
    expect(ids(base)).toEqual(["b1", "b2"]);
  });
});

describe("déplacement", () => {
  it("déplace un bloc d'une position à une autre", () => {
    expect(ids(moveBlock(design("heading", "text", "button"), 0, 2))).toEqual([
      "b2",
      "b3",
      "b1",
    ]);
  });

  it("monte et descend d'un cran, sans effet en bout de liste", () => {
    const base = design("heading", "text", "button");
    expect(ids(moveBlockBy(base, "b3", -1))).toEqual(["b1", "b3", "b2"]);
    expect(ids(moveBlockBy(base, "b1", 1))).toEqual(["b2", "b1", "b3"]);
    expect(moveBlockBy(base, "b1", -1)).toBe(base);
    expect(moveBlockBy(base, "b3", 1)).toBe(base);
    expect(moveBlockBy(base, "inconnu", 1)).toBe(base);
  });

  it("une position hors liste ne change rien", () => {
    const base = design("heading", "text");
    expect(moveBlock(base, 5, 0)).toBe(base);
    expect(moveBlock(base, 1, 1)).toBe(base);
  });
});

describe("duplication et suppression", () => {
  it("duplique juste après, avec un nouvel identifiant et une copie indépendante", () => {
    const base = normalizeDesign({
      blocks: [
        {
          id: "b1",
          type: "social",
          items: [{ network: "facebook", url: "https://facebook.com/a" }],
        },
        { id: "b2", type: "text" },
      ],
    });
    const { design: next, block } = duplicateBlock(base, "b1");
    expect(next.blocks).toHaveLength(3);
    expect(next.blocks[1].id).toBe(block.id);
    expect(block.id).not.toBe("b1");
    expect(block.items).toEqual(base.blocks[0].items);
    block.items[0].url = "https://modifie.fr";
    expect(base.blocks[0].items[0].url).toBe("https://facebook.com/a");
  });

  it("dupliquer un bloc introuvable ne change rien", () => {
    const base = design("text");
    expect(duplicateBlock(base, "x")).toEqual({ design: base, block: null });
  });

  it("supprime un bloc, sans effet s'il est introuvable", () => {
    const base = design("heading", "text");
    expect(ids(removeBlock(base, "b1"))).toEqual(["b2"]);
    expect(removeBlock(base, "x")).toBe(base);
  });
});

describe("modification", () => {
  it("modifie les propriétés d'un bloc et fusionne les marges", () => {
    const base = normalizeDesign({
      blocks: [
        {
          id: "b1",
          type: "button",
          padding: { top: 4, right: 4, bottom: 4, left: 4 },
        },
      ],
    });
    const next = updateBlock(base, "b1", {
      label: "Réserver",
      padding: { top: 20 },
    });
    expect(findBlock(next, "b1")).toMatchObject({
      label: "Réserver",
      padding: { top: 20, right: 4, bottom: 4, left: 4 },
    });
    expect(findBlock(base, "b1").label).toBe(undefined);
  });

  it("une valeur undefined rend la valeur par défaut (couleur du style)", () => {
    const base = normalizeDesign({
      blocks: [{ id: "b1", type: "text", color: "#ff0000" }],
    });
    const next = updateBlock(base, "b1", { color: undefined });
    expect("color" in findBlock(next, "b1")).toBe(false);
    expect(blockWithDefaults(findBlock(next, "b1")).color).toBe(null);
  });

  it("ne crée pas de nouvel état si rien ne change", () => {
    const base = normalizeDesign({
      blocks: [{ id: "b1", type: "text", align: "center" }],
    });
    expect(updateBlock(base, "b1", { align: "center" })).toBe(base);
    expect(updateBlock(base, "b1", { id: "autre", type: "image" })).toBe(base);
  });

  it("modifie le style général et ignore les clés inconnues", () => {
    const base = emptyDesign();
    const next = updateStyle(base, { primaryColor: "#000000", inconnu: 1 });
    expect(next.style.primaryColor).toBe("#000000");
    expect("inconnu" in next.style).toBe(false);
    expect(updateStyle(next, { primaryColor: "#000000" })).toBe(next);
  });
});

describe("texte riche", () => {
  it("extrait le texte visible", () => {
    expect(
      htmlToText(
        "<p>Bonjour <strong>{{prenom}}</strong>&nbsp;!</p><p>À bientôt</p>",
      ),
    ).toBe("Bonjour {{prenom}} !\nÀ bientôt");
  });

  it("repère un texte vide", () => {
    expect(isBlankHtml("<p></p><p><br></p>")).toBe(true);
    expect(isBlankHtml("<p>a</p>")).toBe(false);
  });

  it("résume le contenu (blocs, boutons, images)", () => {
    const summary = designSummary(
      normalizeDesign({
        blocks: [
          { id: "1", type: "button" },
          {
            id: "2",
            type: "imageText",
            src: "https://x.fr/a.png",
            buttonLabel: "Voir",
          },
          { id: "3", type: "image", src: "" },
        ],
      }),
    );
    expect(summary).toEqual({ blocks: 3, buttons: 2, images: 1 });
  });
});
