/**
 * Connexion de la boîte d'envoi : appel direct de l'API (jeton de session,
 * espace dans les en-têtes, cookie de liaison au navigateur), puis départ
 * vers la page d'autorisation de Google ; refus de l'API affiché.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { settings as settingsFixture, mailbox } from "./fixtures";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import { MailboxCard } from "@/app/dashboard/outils/prospection/components/mailbox-card";

const access = {
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canSend: true,
  readOnly: false,
  readOnlyReason: null,
};

const json = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe("carte « Boîte d'envoi »", () => {
  const originalLocation = window.location;
  let fetchMock;

  beforeEach(() => {
    toast.error.mockClear();
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "http://localhost:3000/dashboard/outils/prospection" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("« Connecter Gmail » : route de l'API, en-têtes et départ vers Google", async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { token: "jeton-session" }))
      .mockResolvedValueOnce(
        json(200, { authUrl: "https://accounts.google.com/o/oauth2/auth?x=1" }),
      );
    const user = userEvent.setup();
    render(
      <MailboxCard
        settings={settingsFixture({ myMailbox: null, mailboxes: [] })}
        access={access}
        onOpenSettings={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Connecter Gmail/ }));

    await waitFor(() =>
      expect(window.location.href).toBe(
        "https://accounts.google.com/o/oauth2/auth?x=1",
      ),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/auth/token", {
      credentials: "include",
    });
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toMatch(/\/mailbox-connect\/google\/authorize$/);
    expect(options.credentials).toBe("include");
    expect(options.headers).toMatchObject({
      Authorization: "Bearer jeton-session",
      "x-organization-id": "ws-1",
    });
  });

  it("refus de l'API : message, pas de départ", async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { token: "jeton-session" }))
      .mockResolvedValueOnce(
        json(403, {
          error: "FORBIDDEN",
          message: "Votre rôle ne permet pas de connecter une boîte.",
        }),
      );
    const user = userEvent.setup();
    render(
      <MailboxCard
        settings={settingsFixture({ myMailbox: null, mailboxes: [] })}
        access={access}
        onOpenSettings={() => {}}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Connecter Gmail/ }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Connexion Gmail impossible", {
        description: "Votre rôle ne permet pas de connecter une boîte.",
      }),
    );
    expect(window.location.href).toBe(
      "http://localhost:3000/dashboard/outils/prospection",
    );
  });

  it("sans le droit de créer : boutons désactivés", () => {
    render(
      <MailboxCard
        settings={settingsFixture({ myMailbox: null, mailboxes: [] })}
        access={{ ...access, canCreate: false }}
        onOpenSettings={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Connecter Gmail/ }).disabled,
    ).toBe(true);
  });

  it("boîte connectée : rythme, conseil d'adresse pro et boîtes de l'équipe", async () => {
    const onOpenSettings = vi.fn();
    const user = userEvent.setup();
    render(
      <MailboxCard
        settings={settingsFixture({
          myMailbox: mailbox({
            accountEmail: "dylan.martin@gmail.com",
            isPersonalAddress: true,
          }),
          mailboxes: [
            mailbox({ accountEmail: "dylan.martin@gmail.com" }),
            mailbox({
              id: "mb-2",
              accountEmail: "marie@atelier-martin.fr",
              isMine: false,
              ownerName: "Marie Durand",
            }),
          ],
        })}
        access={access}
        onOpenSettings={onOpenSettings}
      />,
    );
    expect(screen.getByText("dylan.martin@gmail.com")).toBeTruthy();
    expect(
      screen.getByText(/30 e-mails par jour au plus · Du lundi au vendredi/),
    ).toBeTruthy();
    expect(screen.getByText(/inspire plus confiance/)).toBeTruthy();
    expect(
      screen.getByText(/marie@atelier-martin\.fr \(Marie Durand\)/),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Réglages/ }));
    expect(onOpenSettings).toHaveBeenCalled();
  });
});
