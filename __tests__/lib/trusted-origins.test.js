import { describe, it, expect } from "vitest";
import {
  buildTrustedOrigins,
  isAcceptedExpoOrigin,
  isAllowedAuthorizationURL,
} from "@/src/lib/trusted-origins";

const requete = (headers = {}) => ({ headers: new Headers(headers) });
const PROD = { VERCEL_ENV: "production", NODE_ENV: "production" };
const PREVIEW = { VERCEL_ENV: "preview", NODE_ENV: "production" };

describe("Origines de confiance", () => {
  it("le site et le scheme de l'application mobile, partout", () => {
    for (const env of [PROD, PREVIEW]) {
      const origines = buildTrustedOrigins(requete(), env);
      expect(origines).toEqual(
        expect.arrayContaining([
          "https://www.newbi.fr",
          "https://newbi.fr",
          "newbi://",
        ]),
      );
    }
  });

  it("http://localhost:3000 : de confiance hors production seulement", () => {
    expect(buildTrustedOrigins(requete(), PROD)).not.toContain(
      "http://localhost:3000",
    );
    expect(buildTrustedOrigins(requete(), PREVIEW)).toContain(
      "http://localhost:3000",
    );
    expect(
      buildTrustedOrigins(requete(), { NODE_ENV: "development" }),
    ).toContain("http://localhost:3000");
  });

  it("production : « exp:// » (Expo Go) n'est plus de confiance", () => {
    expect(buildTrustedOrigins(requete(), PROD)).not.toContain("exp://");
    expect(
      buildTrustedOrigins(
        requete({ "expo-origin": "exp://exemple.invalid" }),
        PROD,
      ),
    ).not.toContain("exp://exemple.invalid");
  });

  it("hors production : « exp:// » reste accepté pour le développement", () => {
    expect(buildTrustedOrigins(requete(), PREVIEW)).toContain("exp://");
  });

  it("en-tête expo-origin de l'application (newbi://) : accepté", () => {
    expect(
      buildTrustedOrigins(requete({ "expo-origin": "newbi://" }), PROD),
    ).toContain("newbi://");
  });

  it.each([
    "https://exemple.invalid",
    "http://exemple.invalid",
    "javascript:alert(1)",
    "evil://",
  ])("en-tête expo-origin « %s » : jamais ajouté aux origines", (valeur) => {
    expect(isAcceptedExpoOrigin(valeur, PROD)).toBe(false);
    expect(
      buildTrustedOrigins(requete({ "expo-origin": valeur }), PROD),
    ).not.toContain(valeur);
  });

  it("origines supplémentaires de la configuration conservées", () => {
    expect(
      buildTrustedOrigins(requete(), {
        ...PROD,
        ADDITIONAL_TRUSTED_ORIGINS: "http://localhost:3201, https://a.test",
      }),
    ).toEqual(
      expect.arrayContaining(["http://localhost:3201", "https://a.test"]),
    );
  });
});

describe("Proxy d'autorisation de l'application mobile", () => {
  it.each([
    "https://accounts.google.com/o/oauth2/v2/auth?client_id=x&state=abc",
    "https://appleid.apple.com/auth/authorize?state=abc",
    "https://github.com/login/oauth/authorize?state=abc",
  ])("fournisseur de connexion accepté : %s", (url) => {
    expect(isAllowedAuthorizationURL(url)).toBe(true);
  });

  it.each([
    ["autre domaine", "https://exemple.invalid/?state=abc"],
    [
      "domaine qui imite Google",
      "https://accounts.google.com.exemple.invalid/",
    ],
    ["identifiants dans l'adresse", "https://user:pass@accounts.google.com/"],
    ["http", "http://accounts.google.com/"],
    ["javascript:", "javascript:alert(1)"],
    ["adresse mal formée", "pas une adresse"],
    ["absente", undefined],
  ])("%s : refusé", (_cas, url) => {
    expect(isAllowedAuthorizationURL(url)).toBe(false);
  });
});
