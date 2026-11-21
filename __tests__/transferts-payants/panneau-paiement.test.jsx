// Page publique d'un transfert payant : montant, fichiers verrouillés,
// un bouton par moyen proposé avec son délai, coordonnées du virement,
// annonce du virement par le destinataire, attente de confirmation.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import {
  TransferPaymentPanel,
  normalizePaymentMethods,
} from "@/app/transfer/[shareLink]/components/transfer-payment-panel";

const VIREMENT = {
  holder: "Studio Lumière",
  iban: "FR7630006000011234567890189",
  bic: "AGRIFRPP",
  bankName: "Crédit Agricole",
  reference: "NB-7K2Q9X",
};

const afficher = (props = {}) => {
  const onPay = vi.fn();
  render(
    <TransferPaymentPanel
      amount={25}
      currency="EUR"
      sellerName="Studio Lumière"
      paymentMethods={["stripe", "paypal", "bank_transfer"]}
      bankTransferDetails={VIREMENT}
      expiryLabel="28 novembre 2026"
      files={[
        { id: "f1", originalName: "photo-1.jpg", size: 2048 },
        { id: "f2", originalName: "photo-2.jpg", size: 4096 },
      ]}
      onPay={onPay}
      {...props}
    />,
  );
  return { onPay };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("normalizePaymentMethods", () => {
  it("transfert antérieur sans liste : carte", () => {
    expect(normalizePaymentMethods(null)).toEqual(["stripe"]);
    expect(normalizePaymentMethods([])).toEqual(["stripe"]);
  });

  it("ordre fixe et moyens inconnus ignorés", () => {
    expect(
      normalizePaymentMethods(["bank_transfer", "inconnu", "stripe"]),
    ).toEqual(["stripe", "bank_transfer"]);
  });
});

describe("TransferPaymentPanel", () => {
  it("montant, vendeur et fichiers verrouillés sans téléchargement", () => {
    afficher();
    expect(screen.getByText(/25,00/)).toBeInTheDocument();
    expect(screen.getByText("Studio Lumière")).toBeInTheDocument();
    expect(screen.getByText("photo-1.jpg")).toBeInTheDocument();
    expect(screen.getByText("photo-2.jpg")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Télécharger/ })).toBeNull();
  });

  it("un bouton par moyen proposé, qui lance le bon prestataire", () => {
    const { onPay } = afficher();
    fireEvent.click(screen.getByRole("button", { name: /Payer par carte/ }));
    fireEvent.click(screen.getByRole("button", { name: "Payer avec PayPal" }));
    expect(onPay).toHaveBeenNthCalledWith(1, "stripe");
    expect(onPay).toHaveBeenNthCalledWith(2, "paypal");
  });

  it("virement : IBAN, BIC, référence et rôle de la référence", () => {
    afficher();
    expect(screen.queryByText("NB-7K2Q9X")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Payer par virement/ }));
    expect(
      screen.getByText("FR76 3000 6000 0112 3456 7890 189"),
    ).toBeInTheDocument();
    expect(screen.getByText("AGRIFRPP")).toBeInTheDocument();
    expect(screen.getByText("NB-7K2Q9X")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Indiquez la référence dans le libellé du virement : elle permet de reconnaître votre paiement.",
      ),
    ).toBeInTheDocument();
  });

  it("virement seul : coordonnées affichées d'emblée", () => {
    afficher({ paymentMethods: ["bank_transfer"] });
    expect(screen.getByText("NB-7K2Q9X")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Payer par carte/ }),
    ).toBeNull();
  });

  it("paiement en cours de confirmation : plus de bouton de paiement", () => {
    afficher({ pending: true });
    expect(
      screen.getByText("Paiement en cours de confirmation"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Payer/ })).toBeNull();
  });

  it("redirection en cours : boutons désactivés", () => {
    afficher({ processingProvider: "stripe" });
    expect(screen.getByText("Redirection…")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Payer avec PayPal" }),
    ).toBeDisabled();
  });

  it("transfert antérieur sans moyens listés : paiement par carte", () => {
    afficher({ paymentMethods: null, bankTransferDetails: null });
    expect(
      screen.getByRole("button", { name: /Payer par carte/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /virement/ })).toBeNull();
  });
});

describe("TransferPaymentPanel : délai annoncé avant le choix", () => {
  it("accès immédiat par carte et PayPal, à réception pour le virement", () => {
    afficher();
    expect(screen.getAllByText("Accès immédiat aux fichiers")).toHaveLength(2);
    expect(
      screen.getByText(
        "Fichiers disponibles à réception, en général sous 1 jour ouvré",
      ),
    ).toBeInTheDocument();
    // Délai relié au bouton (lecteurs d'écran)
    expect(
      screen.getByRole("button", { name: /Payer par carte/ }),
    ).toHaveAccessibleDescription("Accès immédiat aux fichiers");
    expect(
      screen.getByRole("button", { name: /Payer par virement/ }),
    ).toHaveAccessibleDescription(
      "Fichiers disponibles à réception, en général sous 1 jour ouvré",
    );
  });

  it("virement seul : délai annoncé au-dessus des coordonnées", () => {
    afficher({ paymentMethods: ["bank_transfer"] });
    expect(screen.queryByText("Accès immédiat aux fichiers")).toBeNull();
    expect(
      screen.getByText(
        "Fichiers disponibles à réception, en général sous 1 jour ouvré",
      ),
    ).toBeInTheDocument();
  });
});

describe("TransferPaymentPanel : « J'ai fait le virement »", () => {
  const ouvrirVirement = (props = {}) => {
    const onDeclareBankTransfer = vi.fn().mockResolvedValue({ success: true });
    afficher({ onDeclareBankTransfer, ...props });
    fireEvent.click(screen.getByRole("button", { name: /Payer par virement/ }));
    return { onDeclareBankTransfer };
  };

  it("avec l'adresse laissée par le destinataire", async () => {
    const { onDeclareBankTransfer } = ouvrirVirement();
    const champ = screen.getByLabelText("Votre adresse e-mail");
    expect(champ).toHaveAttribute("placeholder", "vous@exemple.fr");
    expect(
      screen.getByText(
        "Pour recevoir le lien dès que les fichiers sont disponibles (facultatif).",
      ),
    ).toBeInTheDocument();
    fireEvent.change(champ, { target: { value: "  jean@exemple.fr " } });
    fireEvent.click(
      screen.getByRole("button", { name: "J'ai fait le virement" }),
    );
    await waitFor(() =>
      expect(onDeclareBankTransfer).toHaveBeenCalledWith("jean@exemple.fr"),
    );
  });

  it("sans adresse : l'annonce part avec null", async () => {
    const { onDeclareBankTransfer } = ouvrirVirement();
    fireEvent.click(
      screen.getByRole("button", { name: "J'ai fait le virement" }),
    );
    await waitFor(() =>
      expect(onDeclareBankTransfer).toHaveBeenCalledWith(null),
    );
  });

  it("adresse mal formée : message, rien n'est envoyé", () => {
    const { onDeclareBankTransfer } = ouvrirVirement();
    fireEvent.change(screen.getByLabelText("Votre adresse e-mail"), {
      target: { value: "jean@exemple" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "J'ai fait le virement" }),
    );
    expect(
      screen.getByText("Saisissez une adresse e-mail valide."),
    ).toBeInTheDocument();
    expect(onDeclareBankTransfer).not.toHaveBeenCalled();
  });

  it("adresse déjà connue : pas de champ, phrase de prévenance", async () => {
    const { onDeclareBankTransfer } = ouvrirVirement({
      notifyEmailHint: "j•••@gmail.com",
    });
    expect(screen.queryByLabelText("Votre adresse e-mail")).toBeNull();
    expect(screen.getByText(/Vous recevrez un e-mail à/)).toHaveTextContent(
      "Vous recevrez un e-mail à j•••@gmail.com dès que les fichiers seront disponibles.",
    );
    fireEvent.click(
      screen.getByRole("button", { name: "J'ai fait le virement" }),
    );
    await waitFor(() =>
      expect(onDeclareBankTransfer).toHaveBeenCalledWith(null),
    );
  });
});

describe("TransferPaymentPanel : virement annoncé", () => {
  const ANNONCE = "2026-11-21T09:30:00.000Z";

  it("carte d'attente à la place des moyens de paiement", () => {
    afficher({ bankTransferDeclaredAt: ANNONCE });
    expect(
      screen.getByText("Virement en attente de réception"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Studio Lumière débloquera vos fichiers dès réception de votre virement de 25,00\s€, en général sous 1 jour ouvré\./,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Revenez sur ce lien : vos fichiers s'afficheront dès réception.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Payer par carte/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Payer avec PayPal" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Payer par virement/ }),
    ).toBeNull();
  });

  it("vendeur sans nom et adresse connue", () => {
    afficher({
      sellerName: null,
      bankTransferDeclaredAt: ANNONCE,
      notifyEmailHint: "j•••@gmail.com",
    });
    expect(
      screen.getByText(/^L'expéditeur débloquera vos fichiers/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Vous recevrez un e-mail à/)).toHaveTextContent(
      "Vous recevrez un e-mail à j•••@gmail.com dès qu'ils seront disponibles.",
    );
  });

  it("coordonnées à revoir, sans nouveau bouton d'annonce", () => {
    afficher({
      bankTransferDeclaredAt: ANNONCE,
      onDeclareBankTransfer: vi.fn(),
    });
    expect(screen.queryByText("NB-7K2Q9X")).toBeNull();
    const revoir = screen.getByRole("button", {
      name: "Revoir les coordonnées bancaires",
    });
    expect(revoir).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(revoir);
    expect(revoir).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("NB-7K2Q9X")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "J'ai fait le virement" }),
    ).toBeNull();
    expect(screen.queryByLabelText("Votre adresse e-mail")).toBeNull();
  });

  it("« Je n'ai pas encore fait le virement » retire l'annonce", async () => {
    const onCancelBankTransferDeclaration = vi
      .fn()
      .mockResolvedValue({ success: true });
    afficher({
      bankTransferDeclaredAt: ANNONCE,
      onCancelBankTransferDeclaration,
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Je n'ai pas encore fait le virement",
      }),
    );
    await waitFor(() =>
      expect(onCancelBankTransferDeclaration).toHaveBeenCalledTimes(1),
    );
  });

  it("paiement en ligne en confirmation : il passe avant l'annonce", () => {
    afficher({ bankTransferDeclaredAt: ANNONCE, pending: true });
    expect(
      screen.getByText("Paiement en cours de confirmation"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Virement en attente de réception")).toBeNull();
  });
});
