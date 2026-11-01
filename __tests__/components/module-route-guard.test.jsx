/**
 * Garde des pages selon le rôle : tant que la grille des droits se charge,
 * la page n'est pas montée (ses requêtes partiraient avant le refus) ; en
 * cas d'erreur de chargement, elle s'affiche (l'API reste juge).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let permissions;
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/outils/prevision",
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => permissions,
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
