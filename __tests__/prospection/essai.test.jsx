/**
 * « M'envoyer un test » : adresse de la boîte par défaut (`emails: null`),
 * autres adresses passées telles quelles, message adapté hors production.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import { SEND_PROSPECTING_TEST } from "@/src/graphql/prospectingQueries";
import { WORKSPACE_ID, fullSequence } from "./fixtures";

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import { TestDialog } from "@/app/dashboard/outils/prospection/components/setup/test-dialog";

const testMock = (emails, served) => ({
  request: {
    query: SEND_PROSPECTING_TEST,
    variables: { workspaceId: WORKSPACE_ID, id: "seq-1", emails },
  },
  result: { data: { sendProspectingTest: served } },
});

function renderDialog(mocks, sendMode = "LIVE") {
  const onOpenChange = vi.fn();
  render(
    <MockedProvider mocks={mocks}>
      <TestDialog
        open
        onOpenChange={onOpenChange}
        workspaceId={WORKSPACE_ID}
        sequence={fullSequence()}
        sendMode={sendMode}
      />
    </MockedProvider>,
  );
  return onOpenChange;
}

describe("« M'envoyer un test »", () => {
  beforeEach(() => {
    toast.success.mockClear();
    toast.error.mockClear();
  });

  it("adresse de la boîte : défaut de l'API", async () => {
    const user = userEvent.setup();
    const onOpenChange = renderDialog([
      testMock(null, ["dylan@atelier-martin.fr"]),
    ]);
    expect(screen.getByLabelText(/Adresses/).value).toBe(
      "dylan@atelier-martin.fr",
    );
    await user.click(screen.getByRole("button", { name: /Envoyer le test/ }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("E-mail de test envoyé", {
        description: "dylan@atelier-martin.fr",
      }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("hors production : envoi ou simulation, sans pouvoir les distinguer", async () => {
    const user = userEvent.setup();
    renderDialog(
      [
        testMock(
          ["marie@exemple.fr", "paul@exemple.fr"],
          ["marie@exemple.fr", "paul@exemple.fr"],
        ),
      ],
      "RESTRICTED",
    );
    expect(
      screen.getByText(/Envois simulés dans cet environnement/),
    ).toBeTruthy();
    const field = screen.getByLabelText(/Adresses/);
    await user.clear(field);
    await user.type(field, "marie@exemple.fr, paul@exemple.fr");
    await user.click(screen.getByRole("button", { name: /Envoyer le test/ }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "E-mail de test envoyé (ou simulé selon l'environnement)",
        { description: "marie@exemple.fr, paul@exemple.fr" },
      ),
    );
  });

  it("adresse invalide : envoi bloqué", async () => {
    const user = userEvent.setup();
    renderDialog([]);
    const field = screen.getByLabelText(/Adresses/);
    await user.clear(field);
    await user.type(field, "pas-une-adresse");
    expect(screen.getByText(/Adresse invalide/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /Envoyer le test/ }).disabled,
    ).toBe(true);
  });
});
