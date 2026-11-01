// @vitest-environment node
import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware, config } from "@/src/middleware";

/**
 * Pages de développement (/dashboard/test-rbac, /dashboard/loaderTest) :
 * introuvables dans un build de production, y compris pour une requête de
 * préchargement, que le reste du matcher laisse passer sans middleware.
 */
afterEach(() => vi.unstubAllEnvs());

const PREFETCH = { "next-router-prefetch": "1", rsc: "1" };

describe("Pages de développement en production", () => {
  for (const chemin of [
    "/dashboard/test-rbac",
    "/dashboard/loaderTest",
    "/dashboard/test-rbac/",
  ]) {
    it(`${chemin} : 404`, () => {
      vi.stubEnv("NODE_ENV", "production");
      const res = middleware(
        new NextRequest(`https://www.newbi.fr${chemin}`, { headers: PREFETCH }),
      );
      expect(res.status).toBe(404);
    });
  }

  it("le matcher couvre ces pages sans exclure les préchargements", () => {
    const entrees = config.matcher.filter((e) =>
      ["/dashboard/test-rbac", "/dashboard/loaderTest"].includes(e.source),
    );
    expect(entrees).toHaveLength(2);
    for (const e of entrees) expect(e.missing).toBeUndefined();
  });

  it("autre page du tableau de bord : laissée passer", () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = middleware(
      new NextRequest("https://www.newbi.fr/dashboard/clients"),
    );
    expect(res.status).toBe(200);
  });
});
