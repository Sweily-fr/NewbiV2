import { describe, it, expect } from "vitest";
import { documentImageUrl, pickItemImage } from "@/src/utils/item-image";
import { buildLinkedItems } from "@/src/utils/linked-products";

const url = "https://pub-x.r2.dev/org/products/a.webp";

describe("documentImageUrl", () => {
  it("copies the image when the product shows it on documents", () => {
    expect(documentImageUrl({ imageUrl: url })).toBe(url);
    expect(documentImageUrl({ imageUrl: url, showImageOnDocuments: true })).toBe(url);
  });

  it("copies nothing when the product hides it or has no image", () => {
    expect(documentImageUrl({ imageUrl: url, showImageOnDocuments: false })).toBeUndefined();
    expect(documentImageUrl({})).toBeUndefined();
  });
});

describe("pickItemImage", () => {
  it("carries a line image and drops an empty one", () => {
    expect(pickItemImage({ imageUrl: url })).toEqual({ imageUrl: url });
    expect(pickItemImage({ imageUrl: "" })).toEqual({});
  });
});

describe("buildLinkedItems", () => {
  it("respects the linked product's document image setting", () => {
    const product = {
      linkedProducts: [
        { quantity: 1, product: { id: "1", name: "Avec", imageUrl: url } },
        {
          quantity: 1,
          product: { id: "2", name: "Sans", imageUrl: url, showImageOnDocuments: false },
        },
      ],
    };
    const [shown, hidden] = buildLinkedItems(product, { parentKey: "p" });
    expect(shown.imageUrl).toBe(url);
    expect(hidden.imageUrl).toBeUndefined();
  });
});
