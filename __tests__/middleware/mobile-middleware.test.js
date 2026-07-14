import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextResponse with simple sentinel objects so we can assert on
// what the middleware decided to do. Use vi.hoisted so the mocks are
// available inside the hoisted vi.mock factory below.
const { NextResponseMock, userAgentMock } = vi.hoisted(() => ({
  NextResponseMock: {
    next: vi.fn(() => ({ type: "next" })),
    redirect: vi.fn((url) => ({ type: "redirect", url })),
  },
  userAgentMock: vi.fn(() => ({ device: {} })),
}));

vi.mock("next/server", () => ({
  NextResponse: NextResponseMock,
  userAgent: userAgentMock,
}));

import { middleware, config } from "@/src/middleware";

function makeReq(pathname) {
  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    headers: new Headers(),
  };
}

function deviceIs(type) {
  userAgentMock.mockReturnValue({ device: { type } });
}

beforeEach(() => {
  vi.clearAllMocks();
  userAgentMock.mockReturnValue({ device: {} });
});

describe("mobile middleware — téléphones bloqués sur l'app", () => {
  it.each([
    "/dashboard",
    "/dashboard/outils/factures-achat",
    "/onboarding",
    "/create-workspace",
  ])("redirige un téléphone vers /mobile-non-disponible sur %s", (path) => {
    deviceIs("mobile");

    const res = middleware(makeReq(path));

    expect(NextResponseMock.redirect).toHaveBeenCalledTimes(1);
    const url = NextResponseMock.redirect.mock.calls[0][0];
    expect(url).toBeInstanceOf(URL);
    expect(url.pathname).toBe("/mobile-non-disponible");
    expect(res.type).toBe("redirect");
  });

  it("laisse passer un desktop (device.type undefined) sur /dashboard", () => {
    deviceIs(undefined);

    const res = middleware(makeReq("/dashboard"));

    expect(NextResponseMock.redirect).not.toHaveBeenCalled();
    expect(NextResponseMock.next).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ type: "next" });
  });

  it("laisse passer une tablette sur /dashboard", () => {
    deviceIs("tablet");

    const res = middleware(makeReq("/dashboard"));

    expect(NextResponseMock.redirect).not.toHaveBeenCalled();
    expect(res).toEqual({ type: "next" });
  });
});

describe("mobile middleware — routes non concernées", () => {
  it.each([
    "/transfer/abc123XYZ",
    "/",
    "/auth/login",
    "/mobile-non-disponible",
    "/produits/factures",
  ])(
    "laisse passer un téléphone sur %s sans même parser le User-Agent",
    (path) => {
      deviceIs("mobile");

      const res = middleware(makeReq(path));

      expect(userAgentMock).not.toHaveBeenCalled();
      expect(NextResponseMock.redirect).not.toHaveBeenCalled();
      expect(res).toEqual({ type: "next" });
    },
  );
});

describe("mobile middleware — config matcher", () => {
  it("ne matche que les préfixes de l'app (transfert et site public exclus)", () => {
    expect(config.matcher).toEqual([
      "/dashboard/:path*",
      "/onboarding/:path*",
      "/create-workspace/:path*",
    ]);
  });
});
