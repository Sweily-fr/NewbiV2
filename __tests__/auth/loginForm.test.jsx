import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ─── Mocks ──────────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockSignInEmail = vi.fn();
const mockGetSession = vi.fn();
const mockClearStore = vi.fn();
const mockResetOrgId = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastInfo = vi.fn();

vi.mock("../../src/lib/auth-client", () => ({
  authClient: {
    signIn: { email: (...args) => mockSignInEmail(...args) },
    getSession: (...args) => mockGetSession(...args),
    organization: {
      getActive: vi.fn().mockResolvedValue({ data: null }),
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      setActive: vi.fn().mockResolvedValue({ error: null }),
      create: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getFullOrganization: vi.fn().mockResolvedValue({ data: null }),
    },
    twoFactor: {
      sendOtp: vi.fn().mockResolvedValue({ data: null, error: null }),
      verifyOtp: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    subscription: {
      list: vi.fn().mockResolvedValue({ data: [] }),
    },
    updateUser: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../src/lib/apolloClient", () => ({
  apolloClient: { clearStore: (...args) => mockClearStore(...args) },
  resetOrganizationIdForApollo: (...args) => mockResetOrgId(...args),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    error: (...args) => mockToastError(...args),
    success: (...args) => mockToastSuccess(...args),
    info: (...args) => mockToastInfo(...args),
  },
}));

// Stub fetch so check-session-limit & check-user don't blow up
const mockFetch = vi.fn();

// Stub the email verification dialog (it pulls in big components)
vi.mock("../../app/auth/login/components/EmailVerificationDialog", () => ({
  EmailVerificationDialog: ({ isOpen }) =>
    isOpen ? <div data-testid="email-verification-dialog" /> : null,
}));

vi.mock("../../app/auth/login/components/TwoFactorModal", () => ({
  TwoFactorModal: () => null,
}));

import LoginForm from "../../app/auth/login/loginForm";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ hasReachedLimit: false }),
    });
    vi.stubGlobal("fetch", mockFetch);
    mockGetSession.mockResolvedValue({
      data: {
        user: { id: "u1", email: "test@example.com" },
        session: { activeOrganizationId: "org1" },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("affiche les champs email et password + le bouton Se connecter", () => {
    render(<LoginForm />);
    expect(
      screen.getByPlaceholderText(/Saisissez votre email/i),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Saisissez votre mot de passe/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Se connecter/i }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur si on submit avec des champs vides", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));
    expect(
      await screen.findByText(/(Email est requis|Mot de passe est requis)/i),
    ).toBeInTheDocument();
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("affiche une erreur si l'email a un format invalide", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginForm />);
    // Désactive la validation HTML5 (type=email) qui bloquerait le submit en happy-dom
    container.querySelector("form").setAttribute("novalidate", "true");

    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "pas-un-email",
    );
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre mot de passe/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));
    expect(await screen.findByText(/Email invalide/i)).toBeInTheDocument();
    expect(mockSignInEmail).not.toHaveBeenCalled();
  });

  it("vide le cache Apollo et appelle signIn.email avec les bonnes valeurs", async () => {
    mockSignInEmail.mockImplementation(async (data, callbacks) => {
      // Simule succès, callback onSuccess
      await callbacks.onSuccess({ data: {} });
    });

    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "user@example.com",
    );
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre mot de passe/i),
      "MyPassword123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockResetOrgId).toHaveBeenCalled();
      expect(mockClearStore).toHaveBeenCalled();
      expect(mockSignInEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@example.com",
          password: "MyPassword123!",
        }),
        expect.any(Object),
      );
    });
  });

  it("affiche un toast 'Email ou mot de passe incorrect' si onError générique", async () => {
    mockSignInEmail.mockImplementation(async (_data, callbacks) => {
      await callbacks.onError({ message: "Some random error" });
    });
    // Le fallback check-user retourne 'utilisateur n'existe pas'
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ exists: false }),
    });

    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "wrong@example.com",
    );
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre mot de passe/i),
      "WrongPass123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/incorrect/i),
      );
    });
  });

  it("redirige vers /auth/manage-devices si la limite de sessions est dépassée (via onError)", async () => {
    mockSignInEmail.mockImplementation(async (_data, callbacks) => {
      await callbacks.onError({
        message: "Too many sessions, maximum reached",
      });
    });

    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "user@example.com",
    );
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre mot de passe/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/manage-devices");
    });
  });

  it("affiche un toast quand check-session-limit a révoqué d'autres sessions", async () => {
    mockSignInEmail.mockImplementation(async (_data, callbacks) => {
      await callbacks.onSuccess({ data: {} });
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ hasReachedLimit: false, revokedCount: 1 }),
    });

    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "user@example.com",
    );
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre mot de passe/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockToastInfo).toHaveBeenCalledWith(
        expect.stringMatching(/d[ée]connect[ée]/i),
      );
    });
    expect(mockPush).not.toHaveBeenCalledWith("/auth/manage-devices");
  });

  it("ouvre la dialog de vérification email si l'email n'est pas vérifié", async () => {
    mockSignInEmail.mockImplementation(async (_data, callbacks) => {
      await callbacks.onError({
        message:
          "Veuillez vérifier votre adresse email avant de vous connecter",
      });
    });

    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "unverified@example.com",
    );
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre mot de passe/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(
        screen.getByTestId("email-verification-dialog"),
      ).toBeInTheDocument();
    });
  });

  it("redirige vers /dashboard sur succès (sans 2FA, sans invitation, sans callbackUrl)", async () => {
    mockSignInEmail.mockImplementation(async (_data, callbacks) => {
      await callbacks.onSuccess({ data: {} });
    });

    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "user@example.com",
    );
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre mot de passe/i),
      "Password123!",
    );
    await user.click(screen.getByRole("button", { name: /Se connecter/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
