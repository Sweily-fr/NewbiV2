// Virement annoncé par le destinataire d'un transfert payant (page publique) :
// mutation declareTransferBankPayment, avec ou sans adresse, retrait de
// l'annonce (cancel: true), messages d'erreur, et bascule de la page dès la
// réponse de l'API.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  act,
  render,
  renderHook,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { useQuery } from "@apollo/client";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import { DECLARE_TRANSFER_BANK_PAYMENT } from "@/src/graphql/mutations/stripe";
import { GET_TRANSFER_BY_LINK } from "@/app/dashboard/outils/transferts-fichiers/graphql/mutations";
import {
  BANK_DECLARATION_CANCEL_ERROR,
  BANK_DECLARATION_ERROR,
  useTransferBankDeclaration,
} from "@/src/hooks/useTransferBankDeclaration";
import { TransferPaymentPanel } from "@/app/transfer/[shareLink]/components/transfer-payment-panel";

const ANNONCE = "2026-11-21T09:30:00.000Z";

const declaration = (variables, reponse = {}) => ({
  request: { query: DECLARE_TRANSFER_BANK_PAYMENT, variables },
  result: {
    data: {
      declareTransferBankPayment: {
        __typename: "TransferBankDeclarationResponse",
        success: true,
        message: null,
        declaredAt: variables.cancel ? null : ANNONCE,
        notifyEmailHint: null,
        ...reponse,
      },
    },
  },
});

const avecApollo = (mocks) =>
  function AvecApollo({ children }) {
    return <MockedProvider mocks={mocks}>{children}</MockedProvider>;
  };

const monterHook = (mocks, onChange = vi.fn()) => {
  const { result } = renderHook(
    () =>
      useTransferBankDeclaration({
        transferId: "t1",
        accessKey: "cle",
        onChange,
      }),
    { wrapper: avecApollo(mocks) },
  );
  return { result, onChange };
};

// Appel du hook dans act() : la mutation met à jour son état en fin d'appel
const appeler = async (action) => {
  let reponse;
  await act(async () => {
    reponse = await action();
  });
  return reponse;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTransferBankDeclaration", () => {
  it("annonce avec l'adresse laissée, puis relecture de la page", async () => {
    const { result, onChange } = monterHook([
      declaration(
        { transferId: "t1", accessKey: "cle", email: "jean@exemple.fr" },
        { notifyEmailHint: "j•••@exemple.fr" },
      ),
    ]);
    const reponse = await appeler(() =>
      result.current.declareBankTransfer("jean@exemple.fr"),
    );
    expect(reponse).toMatchObject({
      success: true,
      declaredAt: ANNONCE,
      notifyEmailHint: "j•••@exemple.fr",
    });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("annonce sans adresse : email null", async () => {
    const { result } = monterHook([
      declaration({ transferId: "t1", accessKey: "cle", email: null }),
    ]);
    expect(
      await appeler(() => result.current.declareBankTransfer(null)),
    ).toMatchObject({ success: true });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("« Je n'ai pas encore fait le virement » : cancel: true", async () => {
    const { result, onChange } = monterHook([
      declaration({ transferId: "t1", accessKey: "cle", cancel: true }),
    ]);
    expect(
      await appeler(() => result.current.cancelBankTransferDeclaration()),
    ).toMatchObject({ success: true, declaredAt: null });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("refus de l'API : son message", async () => {
    const { result, onChange } = monterHook([
      declaration(
        { transferId: "t1", accessKey: "cle", email: null },
        { success: false, message: "Ce transfert est déjà payé." },
      ),
    ]);
    expect(
      await appeler(() => result.current.declareBankTransfer(null)),
    ).toBeNull();
    expect(toast.error).toHaveBeenCalledWith("Ce transfert est déjà payé.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("refus sans message : message par défaut", async () => {
    const { result } = monterHook([
      declaration(
        { transferId: "t1", accessKey: "cle", email: null },
        { success: false, message: null },
      ),
    ]);
    await appeler(() => result.current.declareBankTransfer(null));
    expect(toast.error).toHaveBeenCalledWith(
      "Impossible d'enregistrer votre virement. Réessayez.",
    );
    expect(BANK_DECLARATION_ERROR).toBe(
      "Impossible d'enregistrer votre virement. Réessayez.",
    );
  });

  it("erreur réseau : message par défaut, annonce comme retrait", async () => {
    const { result } = monterHook([
      {
        request: {
          query: DECLARE_TRANSFER_BANK_PAYMENT,
          variables: { transferId: "t1", accessKey: "cle", email: null },
        },
        error: new Error("Network error"),
      },
      {
        request: {
          query: DECLARE_TRANSFER_BANK_PAYMENT,
          variables: { transferId: "t1", accessKey: "cle", cancel: true },
        },
        error: new Error("Network error"),
      },
    ]);
    expect(
      await appeler(() => result.current.declareBankTransfer(null)),
    ).toBeNull();
    expect(toast.error).toHaveBeenLastCalledWith(BANK_DECLARATION_ERROR);
    expect(
      await appeler(() => result.current.cancelBankTransferDeclaration()),
    ).toBeNull();
    expect(toast.error).toHaveBeenLastCalledWith(BANK_DECLARATION_CANCEL_ERROR);
  });
});

// Page de paiement réduite à l'essentiel : requête publique du transfert,
// annonce du virement et panneau de paiement
const TRANSFERT = {
  __typename: "FileTransfer",
  id: "t1",
  files: [
    {
      __typename: "FileTransferFile",
      id: "f1",
      originalName: "photo.jpg",
      fileName: "photo.jpg",
      filePath: null,
      downloadUrl: null,
      mimeType: "image/jpeg",
      size: 2048,
      storageType: "r2",
      r2Key: null,
      fileId: "f1",
    },
  ],
  totalSize: 2048,
  expiryDate: "2026-12-01T00:00:00.000Z",
  isPaymentRequired: true,
  paymentAmount: 25,
  paymentCurrency: "EUR",
  isPaid: false,
  paymentMethods: ["stripe", "bank_transfer"],
  paymentPending: false,
  sellerName: "Studio Lumière",
  bankTransferDetails: {
    __typename: "BankTransferDetails",
    holder: "Studio Lumière",
    iban: "FR7630006000011234567890189",
    bic: "AGRIFRPP",
    bankName: "Crédit Agricole",
    reference: "NB-7K2Q9X",
  },
  bankTransferDeclaredAt: null,
  notifyEmailHint: null,
  status: "active",
  downloadCount: 0,
  recipientEmail: null,
  message: null,
  passwordProtected: false,
  allowPreview: true,
  hasWatermark: false,
};

function PageDePaiement({ onChange }) {
  const { data } = useQuery(GET_TRANSFER_BY_LINK, {
    variables: { shareLink: "lien", accessKey: "cle" },
  });
  const fileTransfer = data?.getFileTransferByLink?.fileTransfer;
  const { declareBankTransfer, cancelBankTransferDeclaration } =
    useTransferBankDeclaration({
      transferId: fileTransfer?.id,
      accessKey: "cle",
      onChange,
    });
  if (!fileTransfer) return <p>Chargement</p>;
  return (
    <TransferPaymentPanel
      amount={fileTransfer.paymentAmount}
      currency={fileTransfer.paymentCurrency}
      sellerName={fileTransfer.sellerName}
      paymentMethods={fileTransfer.paymentMethods}
      bankTransferDetails={fileTransfer.bankTransferDetails}
      files={fileTransfer.files}
      onPay={vi.fn()}
      bankTransferDeclaredAt={fileTransfer.bankTransferDeclaredAt}
      notifyEmailHint={fileTransfer.notifyEmailHint}
      onDeclareBankTransfer={declareBankTransfer}
      onCancelBankTransferDeclaration={cancelBankTransferDeclaration}
    />
  );
}

describe("Page du transfert : annonce du virement", () => {
  it("bascule sur l'attente dès la réponse, puis revient au paiement", async () => {
    const onChange = vi.fn();
    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: GET_TRANSFER_BY_LINK,
              variables: { shareLink: "lien", accessKey: "cle" },
            },
            result: {
              data: {
                getFileTransferByLink: {
                  __typename: "FileTransferResponse",
                  success: true,
                  message: null,
                  fileTransfer: TRANSFERT,
                },
              },
            },
          },
          declaration(
            { transferId: "t1", accessKey: "cle", email: "jean@exemple.fr" },
            { notifyEmailHint: "j•••@exemple.fr" },
          ),
          declaration({ transferId: "t1", accessKey: "cle", cancel: true }),
        ]}
      >
        <PageDePaiement onChange={onChange} />
      </MockedProvider>,
    );

    // Requêtes par texte (et non par rôle) : bien plus rapides sur cette page
    fireEvent.click(await screen.findByText("Payer par virement"));
    fireEvent.change(screen.getByLabelText("Votre adresse e-mail"), {
      target: { value: "jean@exemple.fr" },
    });
    fireEvent.click(screen.getByText("J'ai fait le virement"));

    // Réponse de l'API : la page bascule sans attendre sa relecture
    expect(
      await screen.findByText("Virement en attente de réception"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Vous recevrez un e-mail à/)).toHaveTextContent(
      "Vous recevrez un e-mail à j•••@exemple.fr dès qu'ils seront disponibles.",
    );
    expect(screen.queryByText("Payer par carte")).toBeNull();
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("Je n'ai pas encore fait le virement"));
    expect(await screen.findByText("Payer par carte")).toBeInTheDocument();
    expect(screen.queryByText("Virement en attente de réception")).toBeNull();
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(2));
    expect(toast.error).not.toHaveBeenCalled();
  });
});
