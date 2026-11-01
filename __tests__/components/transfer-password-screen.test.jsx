// Écran de mot de passe d'un transfert public : champ et bouton
// afficher/masquer nommés, Entrée valide, mauvais mot de passe annoncé.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import { PasswordModal } from "@/app/transfer/[shareLink]/components/password-screen";

const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({ success: false, message: "Mot de passe incorrect" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      ),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const afficher = (props = {}) =>
  render(
    <PasswordModal
      transferId="t1"
      shareLink="lien"
      accessKey="cle"
      onPasswordVerified={vi.fn()}
      {...props}
    />,
  );

describe("Écran de mot de passe d'un transfert", () => {
  it("champ et bouton afficher/masquer ont un nom accessible", () => {
    afficher();
    const champ = screen.getByLabelText("Mot de passe du transfert");
    expect(champ).toHaveAttribute("type", "password");
    fireEvent.click(
      screen.getByRole("button", { name: "Afficher le mot de passe" }),
    );
    expect(champ).toHaveAttribute("type", "text");
    expect(
      screen.getByRole("button", { name: "Masquer le mot de passe" }),
    ).toBeInTheDocument();
  });

  it("Entrée valide, un mauvais mot de passe est annoncé, rien n'est déverrouillé", async () => {
    const onPasswordVerified = vi.fn();
    afficher({ onPasswordVerified });
    const champ = screen.getByLabelText("Mot de passe du transfert");
    fireEvent.change(champ, { target: { value: "mauvais" } });
    fireEvent.keyDown(champ, { key: "Enter" });
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Mot de passe incorrect"),
    );
    expect(onPasswordVerified).not.toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toMatchObject({
      transferId: "t1",
      password: "mauvais",
      link: "lien",
      key: "cle",
    });
  });

  it("mot de passe vide : aucun appel", () => {
    afficher();
    fireEvent.click(screen.getByRole("button", { name: "Accéder" }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalled();
  });
});
