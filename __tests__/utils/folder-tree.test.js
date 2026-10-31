import { describe, it, expect } from "vitest";
import { ancestorIds, isFolderInAncestry } from "@/src/utils/folder-tree";

const FOLDERS = [
  { id: "a", parentId: null },
  { id: "b", parentId: "a" },
  { id: "c", parentId: "b" },
  { id: "d", parentId: null },
];

describe("folder-tree", () => {
  it("remonte la chaîne des parents", () => {
    const byId = new Map(FOLDERS.map((f) => [f.id, f]));
    expect(ancestorIds("c", (id) => byId.get(id)?.parentId)).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(ancestorIds(null, () => "x")).toEqual([]);
  });

  it("détecte un dépôt sous soi-même ou sous un descendant", () => {
    expect(isFolderInAncestry(FOLDERS, "a", "a")).toBe(true);
    expect(isFolderInAncestry(FOLDERS, "c", "a")).toBe(true);
    expect(isFolderInAncestry(FOLDERS, "d", "a")).toBe(false);
    expect(isFolderInAncestry(FOLDERS, null, "a")).toBe(false);
  });

  it("termine sur un cycle présent dans les données", () => {
    const cyclic = [
      { id: "a", parentId: "c" },
      { id: "b", parentId: "a" },
      { id: "c", parentId: "b" },
    ];
    expect(isFolderInAncestry(cyclic, "a", "x")).toBe(false);
    expect(isFolderInAncestry(cyclic, "a", "b")).toBe(true);
    const byId = new Map(cyclic.map((f) => [f.id, f]));
    expect(ancestorIds("a", (id) => byId.get(id)?.parentId)).toHaveLength(3);
  });
});
