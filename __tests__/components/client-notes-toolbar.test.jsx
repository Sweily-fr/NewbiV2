import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: () => ({ data: null, loading: false }),
}));
vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => ({ data: null }),
}));
vi.mock("@/src/hooks/useSubscriptionAccess", () => ({
  useSubscriptionAccess: () => ({ isReadOnly: false }),
}));
vi.mock("@/src/hooks/useMyPermissions", () => ({
  useMyPermissions: () => ({ isReady: true, canDo: () => true }),
}));

import { NoteComposer } from "@/app/dashboard/clients/[id]/components/client-notes-tab";

describe("Barre d'outils des notes : boutons nommés", () => {
  it("chaque bouton a un nom accessible, les styles annoncent leur état", () => {
    render(<NoteComposer onSubmit={() => {}} />);
    for (const nom of [
      "Gras",
      "Italique",
      "Souligné",
      "Liste à puces",
      "Liste numérotée",
      "Citation",
      "Code",
    ]) {
      expect(screen.getByRole("button", { name: nom })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
    // Le lien n'est pas un interrupteur
    expect(screen.getByRole("button", { name: "Lien" })).not.toHaveAttribute(
      "aria-pressed",
    );
    expect(
      screen.getByRole("button", { name: "Effacer la note" }),
    ).toBeTruthy();
  });
});
