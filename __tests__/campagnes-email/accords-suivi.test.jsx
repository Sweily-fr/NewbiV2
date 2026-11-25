// Campagnes e-mail, accords de suivi par contact (recommandation CNIL sur
// les pixels de suivi) : fenêtre latérale des accords de l'espace (liste et
// origines, onglets, actions réservées aux accords saisis par l'espace,
// ajout avec attestation obligatoire, refus et retrait confirmés), ouverte
// depuis la section Suivi.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
vi.mock("@/src/components/ui/sonner", () => ({ toast }));

import {
  GET_EMAIL_TRACKING_CONSENTS,
  GRANT_EMAIL_TRACKING,
  REFUSE_EMAIL_TRACKING,
  REMOVE_EMAIL_TRACKING_CONSENT,
} from "@/src/graphql/emailCampaignQueries";
import { TrackingConsentsSheet } from "@/app/dashboard/outils/campagnes-email/components/tracking-consents-sheet";
import { TrackingSection } from "@/app/dashboard/outils/campagnes-email/components/setup/tracking-section";

const accord = (overrides = {}) => ({
  __typename: "EmailTrackingConsent",
  id: "t1",
  email: "lea@exemple.fr",
  status: "GRANTED",
  source: "CONTACT",
  note: null,
  decidedAt: "2026-11-20T10:00:00.000Z",
  decidedByName: null,
  ...overrides,
});

// Choix des contacts (définitifs) et saisies de l'espace, acceptés et refusés
const ACCORDS = [
  accord({ id: "t1", email: "lea@exemple.fr" }),
  accord({
    id: "t2",
    email: "marc@exemple.fr",
    source: "SENDER",
    decidedByName: "Jean Dupont",
    note: "Formulaire d'inscription",
  }),
  accord({ id: "t3", email: "paul@exemple.fr", status: "REFUSED" }),
  accord({
    id: "t4",
    email: "zoe@exemple.fr",
    status: "REFUSED",
    source: "SENDER",
    decidedByName: "Jean Dupont",
  }),
];

const liste = (items = ACCORDS, status = null) => ({
  request: {
    query: GET_EMAIL_TRACKING_CONSENTS,
    variables: { workspaceId: "w1", status, search: null, page: 1, limit: 50 },
  },
  result: {
    data: {
      emailTrackingConsents: {
        __typename: "EmailTrackingConsentPage",
        items,
        total: items.length,
        page: 1,
        limit: 50,
      },
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

function ouvrir({ canEdit = true, mocks = [liste()] } = {}) {
  render(
    <MockedProvider mocks={mocks}>
      <TrackingConsentsSheet
        open
        onOpenChange={vi.fn()}
        workspaceId="w1"
        canEdit={canEdit}
      />
    </MockedProvider>,
  );
}

const ligne = (email) => screen.getByText(email).closest("li");
const libelles = (element) =>
  within(element)
    .queryAllByRole("button")
    .map((button) => button.textContent);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fenêtre des accords de suivi", () => {
  it("liste : statut, origine (contact ou membre de l'espace), date et note", async () => {
    ouvrir();
    expect(await screen.findByText("lea@exemple.fr")).toBeInTheDocument();
    expect(screen.getByText("Accords de suivi")).toBeInTheDocument();
    expect(screen.getByText("4 adresses")).toBeInTheDocument();

    const lea = ligne("lea@exemple.fr");
    expect(within(lea).getByText("Accepté")).toBeInTheDocument();
    expect(
      within(lea).getByText(/^Choix du contact · 20 nov\..* à 11:00$/),
    ).toBeInTheDocument();

    const marc = ligne("marc@exemple.fr");
    expect(within(marc).getByText("Accepté")).toBeInTheDocument();
    expect(
      within(marc).getByText(/^Saisi par Jean Dupont · 20 nov\..* à 11:00$/),
    ).toBeInTheDocument();
    expect(
      within(marc).getByText("Note : Formulaire d'inscription"),
    ).toBeInTheDocument();

    expect(
      within(ligne("paul@exemple.fr")).getByText("Refusé"),
    ).toBeInTheDocument();
    expect(
      within(ligne("zoe@exemple.fr")).getByText(/^Saisi par Jean Dupont/),
    ).toBeInTheDocument();
  });

  it("actions seulement pour les accords saisis par l'espace", async () => {
    ouvrir();
    await screen.findByText("lea@exemple.fr");
    // Choix des contacts : définitifs, ni modifiables ni retirables
    expect(libelles(ligne("lea@exemple.fr"))).toEqual([]);
    expect(libelles(ligne("paul@exemple.fr"))).toEqual([]);
    // Accord saisi : noter un refus ou retirer ; refus saisi : retirer
    expect(libelles(ligne("marc@exemple.fr"))).toEqual([
      "Noter un refus",
      "Retirer",
    ]);
    expect(
      screen.getByRole("button", {
        name: "Retirer l'accord de marc@exemple.fr",
      }),
    ).toBeInTheDocument();
    expect(libelles(ligne("zoe@exemple.fr"))).toEqual(["Retirer"]);
    expect(
      screen.getByRole("button", {
        name: "Retirer le refus de zoe@exemple.fr",
      }),
    ).toBeInTheDocument();
  });

  it("sans droit de modification : ni ajout ni actions", async () => {
    ouvrir({ canEdit: false });
    await screen.findByText("marc@exemple.fr");
    expect(
      screen.queryByRole("button", { name: "Ajouter des accords" }),
    ).toBeNull();
    for (const email of ["marc@exemple.fr", "zoe@exemple.fr"]) {
      expect(libelles(ligne(email))).toEqual([]);
    }
  });

  it("onglets : la liste suit le statut demandé", async () => {
    ouvrir({
      mocks: [liste(), liste([ACCORDS[2], ACCORDS[3]], "REFUSED")],
    });
    await screen.findByText("marc@exemple.fr");
    fireEvent.click(screen.getByRole("tab", { name: "Refusés" }));
    await waitFor(() =>
      expect(screen.queryByText("marc@exemple.fr")).toBeNull(),
    );
    expect(screen.getByText("zoe@exemple.fr")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Refusés" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("ajout : Enregistrer bloqué sans la case, variables exactes, adresses écartées dans le toast", async () => {
    const ajout = {
      request: {
        query: GRANT_EMAIL_TRACKING,
        variables: {
          workspaceId: "w1",
          emails: ["marc@exemple.fr", "lea@exemple.fr"],
          note: "Formulaire d'inscription",
          attestation: true,
        },
      },
      result: {
        data: {
          grantEmailTracking: {
            __typename: "EmailTrackingGrantResult",
            granted: 1,
            skipped: [
              {
                __typename: "EmailTrackingGrantSkip",
                email: "lea@exemple.fr",
                reason: "CONTACT_REFUSED",
              },
            ],
          },
        },
      },
    };
    ouvrir({ mocks: [liste(), ajout] });
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter des accords" }),
    );

    // Doublon et majuscules fusionnés, adresse illisible écartée
    fireEvent.change(
      screen.getByLabelText("Adresses qui ont accepté le suivi"),
      {
        target: {
          value: "Marc@Exemple.fr, lea@exemple.fr;\njean@ marc@exemple.fr",
        },
      },
    );
    expect(
      screen.getByText(/^2\sadresses à enregistrer · 1\sinvalide ignorée$/),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByLabelText(/Comment avez-vous recueilli cet accord/),
      { target: { value: "  Formulaire d'inscription " } },
    );

    const enregistrer = screen.getByRole("button", { name: "Enregistrer" });
    expect(enregistrer).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Ces contacts m'ont donné leur accord pour mesurer l'ouverture de mes e-mails et les clics sur leurs liens, et je peux le prouver.",
      }),
    );
    expect(enregistrer).toBeEnabled();
    fireEvent.click(enregistrer);

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(toast.error).not.toHaveBeenCalled();
    const [titre, { description }] = toast.success.mock.calls[0];
    expect(titre).toMatch(/^1\saccord enregistré$/);
    expect(description.split("\n")).toEqual([
      expect.stringMatching(/^2\sadresses écartées :$/),
      "jean@ (adresse invalide)",
      "lea@exemple.fr (refus du contact, lui seul peut changer d'avis)",
    ]);
    // Formulaire refermé : la prochaine saisie demandera une nouvelle attestation
    expect(
      await screen.findByRole("button", { name: "Ajouter des accords" }),
    ).toBeInTheDocument();
  });

  it("ajout : 500 adresses au plus à la fois", async () => {
    ouvrir();
    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter des accords" }),
    );
    const adresses = Array.from(
      { length: 501 },
      (_, index) => `contact${index}@exemple.fr`,
    ).join("\n");
    fireEvent.change(
      screen.getByLabelText("Adresses qui ont accepté le suivi"),
      {
        target: { value: adresses },
      },
    );
    expect(
      screen.getByText(
        "500 adresses au plus à la fois : vous en avez collé 501.",
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });

  it("refus noté : confirmation qui annonce l'effacement, puis refuseEmailTracking", async () => {
    const refus = {
      request: {
        query: REFUSE_EMAIL_TRACKING,
        variables: { workspaceId: "w1", email: "marc@exemple.fr" },
      },
      result: {
        data: {
          refuseEmailTracking: {
            ...ACCORDS[1],
            status: "REFUSED",
            decidedAt: "2026-11-25T09:00:00.000Z",
          },
        },
      },
    };
    ouvrir({ mocks: [liste(), refus] });
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Noter un refus pour marc@exemple.fr",
      }),
    );
    const dialogue = await screen.findByRole("alertdialog");
    expect(within(dialogue).getByText("Noter un refus ?")).toBeInTheDocument();
    expect(
      within(dialogue).getByText(
        /Les ouvertures et les clics déjà enregistrés pour marc@exemple\.fr sont effacés/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialogue).getByRole("button", { name: "Noter le refus" }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Refus noté", {
        description:
          "Ce qui avait été enregistré pour marc@exemple.fr est effacé.",
      }),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("retrait d'un accord saisi : confirmation qui annonce l'effacement, puis removeEmailTrackingConsent", async () => {
    const retrait = {
      request: {
        query: REMOVE_EMAIL_TRACKING_CONSENT,
        variables: { workspaceId: "w1", id: "t2" },
      },
      result: { data: { removeEmailTrackingConsent: true } },
    };
    ouvrir({ mocks: [liste(), retrait] });
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Retirer l'accord de marc@exemple.fr",
      }),
    );
    const dialogue = await screen.findByRole("alertdialog");
    expect(
      within(dialogue).getByText("Retirer l'accord ?"),
    ).toBeInTheDocument();
    expect(
      within(dialogue).getByText(
        /Les ouvertures et les clics déjà enregistrés pour marc@exemple\.fr sont effacés/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      within(dialogue).getByRole("button", { name: "Retirer l'accord" }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Accord retiré", {
        description:
          "Ce qui avait été enregistré pour marc@exemple.fr est effacé.",
      }),
    );
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("depuis la section Suivi", () => {
  it("« Gérer les accords » ouvre la fenêtre des accords de l'espace", async () => {
    render(
      <MockedProvider mocks={[liste()]}>
        <TrackingSection
          campaign={{
            id: "c1",
            status: "DRAFT",
            trackOpens: true,
            trackClicks: false,
            privacyPolicyUrl: "",
          }}
          canEdit
          onSave={vi.fn()}
          workspaceId="w1"
          audienceCount={{ sendable: 3, trackingGranted: 1 }}
          canEditConsents
        />
      </MockedProvider>,
    );
    expect(screen.queryByText("Accords de suivi")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Gérer les accords" }));
    expect(await screen.findByText("Accords de suivi")).toBeInTheDocument();
    expect(await screen.findByText("marc@exemple.fr")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ajouter des accords" }),
    ).toBeInTheDocument();
  });
});
