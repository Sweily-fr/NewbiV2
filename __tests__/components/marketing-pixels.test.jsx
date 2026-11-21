// Pixels marketing (GTM, Meta, TikTok), chargés avec le consentement : jamais
// sur une page à secret, ni pendant une visite commencée sur une telle page
// (son adresse reste dans l'historique du document : bouton Retour).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { SECRET_VISIT_FLAG } from "@/src/lib/secret-pages";

const state = vi.hoisted(() => ({ pathname: "/auth/login" }));

vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
// next/script : remplacé par une balise repérable
vi.mock("next/script", () => ({
  default: ({ id }) => <script data-testid={id} />,
}));

import MarketingPixels from "@/src/components/cookies/MarketingPixels";

const PIXELS = ["gtm-script", "meta-pixel", "tiktok-pixel"];
const charges = (container) =>
  PIXELS.filter((id) => container.querySelector(`[data-testid="${id}"]`));

const ouvrir = (adresse) => {
  window.history.replaceState({}, "", adresse);
  state.pathname = new URL(adresse, window.location.href).pathname;
};

beforeEach(() => {
  localStorage.setItem(
    "cookie_consent",
    JSON.stringify({ necessary: true, analytics: true, marketing: true }),
  );
  ouvrir("/auth/login");
});

afterEach(() => {
  delete window[SECRET_VISIT_FLAG];
});

describe("Pixels marketing", () => {
  it("page publique, consentement donné : GTM, Meta et TikTok chargés", () => {
    const { container } = render(<MarketingPixels />);
    expect(charges(container)).toEqual(PIXELS);
  });

  it("visite commencée sur une page à secret : aucun pixel, même sur une page publique", () => {
    window[SECRET_VISIT_FLAG] = true;
    const { container } = render(<MarketingPixels />);
    expect(charges(container)).toEqual([]);
  });

  it("page à secret : aucun pixel", () => {
    ouvrir("/transfer/abc123?key=xyz");
    const { container } = render(<MarketingPixels />);
    expect(charges(container)).toEqual([]);
  });

  it("sans consentement marketing : aucun pixel", () => {
    localStorage.setItem(
      "cookie_consent",
      JSON.stringify({ necessary: true, analytics: true, marketing: false }),
    );
    const { container } = render(<MarketingPixels />);
    expect(charges(container)).toEqual([]);
  });
});
