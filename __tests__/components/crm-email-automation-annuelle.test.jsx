import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("@/src/hooks/useClientAutomations", () => ({}));
vi.mock("@/src/hooks/useClientLists", () => ({}));
vi.mock("@/src/hooks/useWorkspace", () => ({}));
vi.mock("@/src/hooks/useMyPermissions", () => ({}));
vi.mock("@/src/hooks/useCrmEmailAutomations", () => ({}));
vi.mock("@/src/hooks/useClientCustomFields", () => ({}));
vi.mock("@/src/contexts/dashboard-layout-context", () => ({}));

import {
  EmailAutomationForm,
  isBirthdayFieldName,
} from "@/app/dashboard/clients/components/automations-popover";

const dateFields = [
  { id: "f-anniv", name: "Date d'anniversaire" },
  { id: "f-contrat", name: "Fin de contrat" },
];

const automation = (timing = {}) => ({
  id: "a1",
  name: "Rappel anniversaire",
  customFieldId: "f-anniv",
  timing: { type: "ON_DATE", daysOffset: 0, sendHour: 9, ...timing },
  email: { subject: "Bonjour", body: "Texte" },
  isActive: true,
});

function renderForm(props) {
  const onSubmit = vi.fn();
  render(
    <EmailAutomationForm
      dateFields={dateFields}
      onSubmit={onSubmit}
      onCancel={() => {}}
      isSubmitting={false}
      {...props}
    />,
  );
  return onSubmit;
}

describe("Automatisation d'e-mail : option « Chaque année »", () => {
  it("reconnaît un champ d'anniversaire ou de naissance", () => {
    expect(isBirthdayFieldName("Date d'anniversaire")).toBe(true);
    expect(isBirthdayFieldName("Date de naissance")).toBe(true);
    expect(isBirthdayFieldName("Fin de contrat")).toBe(false);
    expect(isBirthdayFieldName(undefined)).toBe(false);
  });

  it("option enregistrée affichée, modifiée et envoyée à l'API", () => {
    const onSubmit = renderForm({
      automation: automation({ repeatYearly: true }),
    });
    const yearly = screen.getByRole("switch", { name: "Chaque année" });
    expect(yearly).toHaveAttribute("aria-checked", "true");

    fireEvent.click(yearly);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].timing).toEqual({
      type: "ON_DATE",
      daysOffset: 0,
      sendHour: 9,
      repeatYearly: false,
    });
  });

  it("automatisation d'avant l'option : valeur renvoyée par l'API reprise", () => {
    const onSubmit = renderForm({ automation: automation() });
    expect(
      screen.getByRole("switch", { name: "Chaque année" }),
    ).toHaveAttribute("aria-checked", "false");
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(onSubmit.mock.calls[0][0].timing.repeatYearly).toBe(false);
  });
});
