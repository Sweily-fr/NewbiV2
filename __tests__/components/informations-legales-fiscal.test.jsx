import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { InformationsLegalesSection } from "@/src/components/settings/informations-legales-section";
import { defaultFiscalYearEnd } from "@/src/utils/fiscalYear";

/**
 * Paramètres > Informations légales : réglages lus par le calendrier des
 * échéances fiscales (périodicité Urssaf d'un micro-entrepreneur, clôture
 * proposée de l'exercice).
 */

function Harness({ legal }) {
  const methods = useForm({
    defaultValues: {
      name: "Jean Dupont",
      address: { street: "", city: "", postalCode: "", country: "France" },
      legal: {
        siret: "",
        legalForm: "",
        regime: "",
        category: "",
        microDeclarationFrequency: "",
        ...legal,
      },
    },
  });
  return (
    <TooltipProvider>
      <FormProvider {...methods}>
        <InformationsLegalesSection organization={{ id: "org" }} />
      </FormProvider>
    </TooltipProvider>
  );
}

const LABEL = "Déclaration du chiffre d'affaires (Urssaf)";

describe("périodicité des déclarations Urssaf", () => {
  it("proposée à une entreprise individuelle au régime micro", () => {
    render(<Harness legal={{ legalForm: "EI", regime: "micro-bnc" }} />);

    expect(screen.getByText(LABEL)).toBeInTheDocument();
    expect(screen.getByText("Sélectionnez la périodicité")).toBeInTheDocument();
  });

  it("valeur enregistrée affichée", () => {
    render(
      <Harness
        legal={{
          legalForm: "EI",
          regime: "micro-entreprise",
          microDeclarationFrequency: "trimestriel",
        }}
      />,
    );

    expect(screen.getByText("Trimestrielle")).toBeInTheDocument();
  });

  it("absente au réel et pour une société", () => {
    const { unmount } = render(
      <Harness legal={{ legalForm: "EI", regime: "reel-simplifie" }} />,
    );
    expect(screen.queryByText(LABEL)).not.toBeInTheDocument();
    unmount();

    render(<Harness legal={{ legalForm: "SAS", regime: "reel-normal" }} />);
    expect(screen.queryByText(LABEL)).not.toBeInTheDocument();
  });
});

describe("clôture proposée de l'exercice", () => {
  it("la veille de la date anniversaire du début", () => {
    const end = defaultFiscalYearEnd(new Date(2026, 0, 1));
    expect([end.getFullYear(), end.getMonth(), end.getDate()]).toEqual([
      2026, 11, 31,
    ]);

    const offset = defaultFiscalYearEnd(new Date(2026, 6, 1));
    expect([offset.getFullYear(), offset.getMonth(), offset.getDate()]).toEqual(
      [2027, 5, 30],
    );
  });
});
