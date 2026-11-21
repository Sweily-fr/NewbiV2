import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";

/**
 * Sélecteur de membres (fenêtre d'événement, kanban, documents partagés) :
 * un membre ajouté s'affiche aussitôt, à partir de la liste de l'espace déjà
 * chargée, sans attendre la requête des infos utilisateurs.
 */

const ORGANIZATION_MEMBERS = [
  {
    id: "u1",
    name: "Alice Martin",
    email: "alice@exemple.fr",
    image: null,
    role: "owner",
  },
  {
    id: "u2",
    name: "Bruno Petit",
    email: "bruno@exemple.fr",
    image: null,
    role: "member",
  },
];

// Réponse stable d'une requête à l'autre, comme le cache Apollo
const ORGANIZATION_MEMBERS_RESULT = {
  data: { organizationMembers: ORGANIZATION_MEMBERS },
};
const EMPTY_RESULT = { data: undefined, loading: false };

// Infos utilisateurs demandées au serveur, par lot d'identifiants
const usersInfoCalls = [];

vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: (query) =>
    query.definitions[0]?.name?.value === "GetOrganizationMembers"
      ? ORGANIZATION_MEMBERS_RESULT
      : EMPTY_RESULT,
}));
// Infos utilisateurs lues sur le serveur : seul un ancien membre (absent de
// la liste de l'espace) y est connu, les autres réponses n'arrivent jamais
// (serveur lent)
vi.mock("@/src/hooks/useAssignedMembersInfo", () => ({
  useAssignedMembersInfo: (userIds = []) => {
    usersInfoCalls.push(userIds);
    if (userIds.length === 1 && userIds[0] === "u9") {
      return {
        members: [{ id: "u9", name: "Chloé Ancienne", email: "", image: null }],
        loading: false,
      };
    }
    return { members: [], loading: userIds.length > 0 };
  },
}));
vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "w1" }),
}));

const { MemberSelector } =
  await import("@/app/dashboard/outils/kanban/[id]/components/MemberSelector");

function Harness({ initial = [] }) {
  const [selected, setSelected] = useState(initial);
  return (
    <div data-testid="badges">
      <MemberSelector
        selectedMembers={selected}
        onMembersChange={setSelected}
        hideLabel
        variant="inline"
      />
    </div>
  );
}

describe("sélecteur de membres", () => {
  it("un membre ajouté s'affiche aussitôt, sans attendre le serveur", () => {
    usersInfoCalls.length = 0;
    render(<Harness />);
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter des membres" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Bruno Petit/ }));

    // Pastille affichée hors de la liste, immédiatement
    const badges = screen.getByTestId("badges");
    expect(within(badges).getByText("Bruno Petit")).toBeInTheDocument();
    // Aucun identifiant connu n'est redemandé au serveur
    expect(usersInfoCalls.every((ids) => ids.length === 0)).toBe(true);
  });

  it("garde les pastilles déjà affichées en ajoutant un deuxième membre", () => {
    render(<Harness initial={["u1"]} />);
    const badges = screen.getByTestId("badges");
    expect(within(badges).getByText("Alice Martin")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter d'autres membres" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Bruno Petit/ }));
    expect(within(badges).getByText("Alice Martin")).toBeInTheDocument();
    expect(within(badges).getByText("Bruno Petit")).toBeInTheDocument();
  });

  it("un ancien membre, absent de la liste, est lu sur le serveur", () => {
    render(<Harness initial={["u9"]} />);
    expect(
      within(screen.getByTestId("badges")).getByText("Chloé Ancienne"),
    ).toBeInTheDocument();
  });
});
