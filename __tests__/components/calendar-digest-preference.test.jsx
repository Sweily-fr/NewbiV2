import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const digest = vi.hoisted(() => ({
  enabled: false,
  available: true,
  saving: false,
  setEnabled: vi.fn(),
}));

vi.mock("@/src/hooks/useCalendarFeed", () => ({
  useCalendarWeeklyDigest: () => digest,
}));

import { CalendarDigestPreference } from "@/src/components/settings/calendar-digest-preference";

describe("CalendarDigestPreference", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(digest, { enabled: false, available: true, saving: false });
  });

  it("e-mail seulement, désactivé par défaut", () => {
    render(<CalendarDigestPreference />);

    expect(screen.getByText("Récap du lundi")).toBeInTheDocument();
    const toggle = screen.getByRole("switch", {
      name: "Récap du lundi par e-mail",
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    expect(digest.setEnabled).toHaveBeenCalledWith(true);
  });

  it("masqué tant que l'API ne connaît pas le réglage", () => {
    digest.available = false;
    const { container } = render(<CalendarDigestPreference />);

    expect(container).toBeEmptyDOMElement();
  });
});
