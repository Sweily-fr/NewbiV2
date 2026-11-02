import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import EmailAutomationForm, {
  isBirthdayFieldName,
} from "@/app/dashboard/clients/components/email-automation-form";

const dateFields = [
  { id: "f-anniv", name: "Date d'anniversaire", fieldType: "DATE" },
  { id: "f-contrat", name: "Fin de contrat", fieldType: "DATE" },
];

function automation(timing = {}) {
  return {
    id: "a1",
    name: "Rappel anniversaire",
    description: "",
    customFieldId: "f-anniv",
    timing: { type: "ON_DATE", daysOffset: 0, sendHour: 9, ...timing },
    email: { subject: "Bonjour", body: "Texte" },
    isActive: true,
  };
}

function renderForm(props) {
  const onSave = vi.fn();
  render(
    <EmailAutomationForm
      dateFields={dateFields}
      onSave={onSave}
      onCancel={() => {}}
      isLoading={false}
      {...props}
    />,
  );
  return onSave;
}

const next = () =>
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));

describe("Automatisation d'e-mail : option « Chaque année »", () => {
  it("reconnaît un champ d'anniversaire ou de naissance", () => {
    expect(isBirthdayFieldName("Date d'anniversaire")).toBe(true);
    expect(isBirthdayFieldName("Date de naissance")).toBe(true);
    expect(isBirthdayFieldName("Fin de contrat")).toBe(false);
    expect(isBirthdayFieldName(undefined)).toBe(false);
  });

  it("l'option enregistrée est affichée et envoyée à l'API", () => {
    const onSave = renderForm({
      automation: automation({ repeatYearly: true }),
    });
    next();
    const yearly = screen.getByRole("switch", { name: /Chaque année/ });
    expect(yearly).toHaveAttribute("aria-checked", "true");

    fireEvent.click(yearly);
    expect(yearly).toHaveAttribute("aria-checked", "false");
    next();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Modifier" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].timing).toEqual({
      type: "ON_DATE",
      daysOffset: 0,
      sendHour: 9,
      repeatYearly: false,
    });
  });

  it("activée : le récapitulatif l'annonce", () => {
    renderForm({ automation: automation({ repeatYearly: false }) });
    next();
    fireEvent.click(screen.getByRole("switch", { name: /Chaque année/ }));
    next();
    next();
    expect(screen.getByText(/Le jour même, chaque année à 9h00/)).toBeTruthy();
  });
});
