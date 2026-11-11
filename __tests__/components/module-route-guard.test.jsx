/**
 * Garde des pages selon le rôle : tant que la grille des droits se charge,
 * la page n'est pas montée (ses requêtes partiraient avant le refus) ; en
 * cas d'erreur de chargement, elle s'affiche (l'API reste juge). Page en
 * accès anticipé (TVA, rendez-vous) : introuvable pour un espace sans accès.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let permissions;
let pathname;
let features;
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  notFound,
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => permissions,
}));
vi.mock("@/src/hooks/useWorkspaceFeatures", () => ({
  useWorkspaceFeatures: () => features,
}));
vi.mock("@/src/components/rbac/AccessDeniedPage", () => ({
  AccessDeniedPage: () => <h1>Cette page ne fait pas partie de votre rôle</h1>,
}));

import { ModuleRouteGuard } from "@/src/components/rbac/ModuleRouteGuard";

const Page = () => <p>Contenu de la prévision</p>;
const base = {
  role: "role_perso",
  actions: null,
  canDo: () => false,
  isReady: false,
  loading: false,
};

describe("ModuleRouteGuard", () => {
  beforeEach(() => {
    permissions = { ...base };
    pathname = "/dashboard/outils/prevision";
    features = { isReady: false, isEnabled: () => false };
    notFound.mockClear();
  });

  it("page ordinaire : n'attend pas les fonctionnalités en accès anticipé", () => {
    permissions = {
      ...base,
      isReady: true,
      actions: { forecast: ["view"] },
      canDo: (m) => m === "forecast",
    };
    render(
      <ModuleRouteGuard>
        <Page />
      </ModuleRouteGuard>,
    );
    expect(screen.getByText("Contenu de la prévision")).toBeTruthy();
  });

  it("page TVA, accès anticipé en cours de chargement : rien de monté", () => {
    pathname = "/dashboard/outils/tva";
    permissions = { ...base, isReady: true, canDo: () => true };
    render(
      <ModuleRouteGuard>
        <Page />
      </ModuleRouteGuard>,
    );
    expect(screen.queryByText("Contenu de la prévision")).toBeNull();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("page TVA pour un espace sans accès anticipé : introuvable", () => {
    pathname = "/dashboard/outils/tva";
    permissions = { ...base, isReady: true, canDo: () => true };
    features = { isReady: true, isEnabled: () => false };
    expect(() =>
      render(
        <ModuleRouteGuard>
          <Page />
        </ModuleRouteGuard>,
      ),
    ).toThrow("NEXT_NOT_FOUND");
  });

  it("prise de rendez-vous ouverte à l'espace : suit ensuite le rôle", () => {
    pathname = "/dashboard/outils/rendez-vous";
    permissions = {
      ...base,
      isReady: true,
      actions: { appointments: ["view"] },
      canDo: (m) => m === "appointments",
    };
    features = { isReady: true, isEnabled: (f) => f === "appointments" };
    render(
      <ModuleRouteGuard>
        <Page />
      </ModuleRouteGuard>,
    );
    expect(screen.getByText("Contenu de la prévision")).toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("grille en cours de chargement : la page n'est pas montée", () => {
    permissions = { ...base, loading: true };
    render(
      <ModuleRouteGuard>
        <Page />
      </ModuleRouteGuard>,
    );
    expect(screen.queryByText("Contenu de la prévision")).toBeNull();
  });

  it("grille illisible (erreur) : la page s'affiche", () => {
    render(
      <ModuleRouteGuard>
        <Page />
      </ModuleRouteGuard>,
    );
    expect(screen.getByText("Contenu de la prévision")).toBeTruthy();
  });

  it("page hors du rôle : refus, sans la page", () => {
    permissions = { ...base, isReady: true, actions: { overview: ["view"] } };
    render(
      <ModuleRouteGuard>
        <Page />
      </ModuleRouteGuard>,
    );
    expect(
      screen.getByRole("heading", {
        name: "Cette page ne fait pas partie de votre rôle",
      }),
    ).toBeTruthy();
    expect(screen.queryByText("Contenu de la prévision")).toBeNull();
  });

  it("page du rôle : affichée", () => {
    permissions = {
      ...base,
      isReady: true,
      actions: { forecast: ["view"] },
      canDo: (m) => m === "forecast",
    };
    render(
      <ModuleRouteGuard>
        <Page />
      </ModuleRouteGuard>,
    );
    expect(screen.getByText("Contenu de la prévision")).toBeTruthy();
  });
});
