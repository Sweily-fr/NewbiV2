import { describe, it, expect } from "vitest";
import {
  pickItemImage,
  productItemImage,
  visibleItemImage,
} from "@/src/utils/item-image";
import { buildLinkedItems } from "@/src/utils/linked-products";

const url = "https://pub-x.r2.dev/org/products/a.webp";

describe("productItemImage", () => {
  it("always copies the image, shown by default", () => {
    expect(productItemImage({ imageUrl: url })).toEqual({
      imageUrl: url,
      showImage: true,
    });
    expect(
      productItemImage({ imageUrl: url, showImageOnDocuments: true }),
    ).toEqual({ imageUrl: url, showImage: true });
  });

  it("copies the image hidden when the product hides it on documents", () => {
    expect(
      productItemImage({ imageUrl: url, showImageOnDocuments: false }),
    ).toEqual({ imageUrl: url, showImage: false });
  });

  it("copies nothing without an image", () => {
    expect(productItemImage({})).toEqual({});
    expect(productItemImage(null)).toEqual({});
  });
});

describe("pickItemImage", () => {
  it("carries a line image and its display choice, drops an empty one", () => {
    expect(pickItemImage({ imageUrl: url })).toEqual({ imageUrl: url });
    expect(pickItemImage({ imageUrl: url, showImage: false })).toEqual({
      imageUrl: url,
      showImage: false,
    });
    expect(pickItemImage({ imageUrl: url, showImage: null })).toEqual({
      imageUrl: url,
    });
    expect(pickItemImage({ imageUrl: "", showImage: true })).toEqual({});
  });
});

describe("visibleItemImage", () => {
  it("prints the image unless the line hides it", () => {
    expect(visibleItemImage({ imageUrl: url })).toBe(url);
    expect(visibleItemImage({ imageUrl: url, showImage: true })).toBe(url);
    expect(visibleItemImage({ imageUrl: url, showImage: false })).toBeNull();
    expect(visibleItemImage({})).toBeNull();
  });
});

describe("buildLinkedItems", () => {
  it("follows the linked product's default document image setting", () => {
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
    expect(shown).toMatchObject({ imageUrl: url, showImage: true });
    expect(hidden).toMatchObject({ imageUrl: url, showImage: false });
  });
});
