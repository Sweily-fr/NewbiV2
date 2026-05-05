import { describe, it, expect, beforeEach } from "vitest";
import { getImageUrl, getAssetUrl, getIconUrl } from "@/src/lib/image-utils";

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
});

describe("getImageUrl", () => {
  it("falls back to localhost when BETTER_AUTH_URL is unset", () => {
    expect(getImageUrl("/foo.png")).toBe("http://localhost:3000/foo.png");
  });

  it("uses BETTER_AUTH_URL when set", () => {
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL = "https://prod.newbi.fr";
    expect(getImageUrl("/foo.png")).toBe("https://prod.newbi.fr/foo.png");
  });

  it("prepends a / if missing", () => {
    expect(getImageUrl("foo.png")).toBe("http://localhost:3000/foo.png");
  });

  it("does not double-prepend the slash", () => {
    expect(getImageUrl("/foo.png")).toBe("http://localhost:3000/foo.png");
  });
});

describe("getAssetUrl", () => {
  it("delegates to getImageUrl", () => {
    expect(getAssetUrl("logo.png")).toBe("http://localhost:3000/logo.png");
  });
});

describe("getIconUrl", () => {
  it("prepends a / before the icon name", () => {
    expect(getIconUrl("gmail.svg")).toBe("http://localhost:3000/gmail.svg");
  });
});
