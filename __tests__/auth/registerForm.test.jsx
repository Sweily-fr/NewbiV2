import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ─── Mocks ──────────────────────────────────────────────────────────
const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

const mockSignUpEmail = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("../../src/lib/auth-client", () => ({
  signUp: { email: (...args) => mockSignUpEmail(...args) },
  authClient: {
    organization: { setActive: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: {
    error: (...args) => mockToastError(...args),
    success: (...args) => mockToastSuccess(...args),
  },
}));

vi.mock("../../src/lib/auth/api", () => ({
  registerUser: vi.fn(),
  verifyEmail: vi.fn(),
}));

import RegisterForm from "../../app/auth/signup/registerForm";

// Helper : récupère l'input password (pas de label/placeholder fiable)
function getPasswordInput(container) {
  return container.querySelector('input[name="password"]');
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("affiche les champs email + password + bouton S'inscrire", () => {
    const { container } = render(<RegisterForm />);
    expect(
      screen.getByPlaceholderText(/Saisissez votre email/i),
    ).toBeInTheDocument();
    expect(getPasswordInput(container)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /S'inscrire/i }),
    ).toBeInTheDocument();
  });

  it("affiche une erreur si on submit avec des champs vides", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.click(screen.getByRole("button", { name: /S'inscrire/i }));
    expect(
      await screen.findByText(/(email valide|mot de passe est nécessaire)/i),
    ).toBeInTheDocument();
    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("affiche une erreur si l'email a un format invalide", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    container.querySelector("form").setAttribute("novalidate", "true");

    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "pas-un-email",
    );
    await user.click(screen.getByRole("button", { name: /S'inscrire/i }));
    expect(
      await screen.findByText(
        /Veuillez saisir une adresse email valide pour continuer/i,
      ),
    ).toBeInTheDocument();
    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le mot de passe ne respecte pas les règles", async () => {
    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    container.querySelector("form").setAttribute("novalidate", "true");

    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "user@example.com",
    );
    // Mot de passe trop simple : pas de majuscule
    await user.type(getPasswordInput(container), "password123");
    await user.click(screen.getByRole("button", { name: /S'inscrire/i }));

    // Le message d'erreur unique du form (pas le strength indicator qui contient les mêmes mots)
    expect(
      await screen.findByText(
        /Le mot de passe doit contenir au moins 8 caractères/i,
      ),
    ).toBeInTheDocument();
    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("appelle signUp.email avec les bonnes valeurs sur soumission valide", async () => {
    mockSignUpEmail.mockImplementation(async (_data, callbacks) => {
      await callbacks?.onSuccess?.({ data: {} });
      return { data: {}, error: null };
    });

    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "newuser@example.com",
    );
    await user.type(getPasswordInput(container), "Password123!");
    await user.click(screen.getByRole("button", { name: /S'inscrire/i }));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "newuser@example.com",
          password: "Password123!",
        }),
        expect.any(Object),
      );
    });
  });

  it("affiche un toast 'Cet email est déjà utilisé' si l'API renvoie une erreur d'unicité", async () => {
    mockSignUpEmail.mockResolvedValue({
      data: null,
      error: { message: "User already exists" },
    });

    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "existing@example.com",
    );
    await user.type(getPasswordInput(container), "Password123!");
    await user.click(screen.getByRole("button", { name: /S'inscrire/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        expect.stringMatching(/déjà utilisé/i),
      );
    });
  });

  it("ajoute le code partenaire si présent dans l'URL", async () => {
    mockSearchParams = new URLSearchParams("?partner=PARTNER_XYZ");
    mockSignUpEmail.mockResolvedValue({ data: {}, error: null });

    const user = userEvent.setup();
    const { container } = render(<RegisterForm />);
    await user.type(
      screen.getByPlaceholderText(/Saisissez votre email/i),
      "newuser@example.com",
    );
    await user.type(getPasswordInput(container), "Password123!");
    await user.click(screen.getByRole("button", { name: /S'inscrire/i }));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          referralCode: "PARTNER_XYZ",
        }),
        expect.any(Object),
      );
    });
  });
});
