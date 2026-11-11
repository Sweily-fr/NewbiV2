import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const feed = vi.hoisted(() => ({
  link: null,
  loading: false,
  busy: false,
  regenerate: vi.fn(),
  disable: vi.fn(),
}));
const digest = vi.hoisted(() => ({
  enabled: false,
  available: true,
  loading: false,
  saving: false,
  setEnabled: vi.fn(),
}));

vi.mock("@/src/hooks/useCalendarFeed", () => ({
  useCalendarFeedLink: () => feed,
  useCalendarWeeklyDigest: () => digest,
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({
    workspaceId: "w1",
    organization: { name: "Studio Nord" },
  }),
}));
vi.mock("@/src/components/ui/sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { CalendarFeedDialog } from "@/app/dashboard/calendar/components/calendar-feed-dialog";

const URL_SAMPLE = `https://api.newbi.fr/calendar/feed/${"a".repeat(43)}.ics`;

const openDialog = () => {
  render(<CalendarFeedDialog />);
  fireEvent.click(
    screen.getByRole("button", { name: /Recevoir le calendrier ailleurs/ }),
  );
};

describe("CalendarFeedDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(feed, { link: null, loading: false, busy: false });
    Object.assign(digest, { enabled: false, available: true, saving: false });
    feed.regenerate.mockResolvedValue({ enabled: true, url: URL_SAMPLE });
    feed.disable.mockResolvedValue(true);
  });

  it("sans lien : explique et propose de le créer", async () => {
    openDialog();

    expect(
      screen.getByText("Recevoir le calendrier ailleurs", { selector: "h2" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/de Studio Nord dans/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Créer le lien" }));

    await waitFor(() => expect(feed.regenerate).toHaveBeenCalledTimes(1));
  });

  it("avec un lien : adresse à copier, régénérer et désactiver après confirmation", async () => {
    feed.link = {
      enabled: true,
      url: URL_SAMPLE,
      createdAt: "2026-10-28T09:00:00.000Z",
      lastAccessedAt: null,
    };
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    openDialog();

    expect(screen.getByLabelText("Lien d'abonnement")).toHaveValue(URL_SAMPLE);
    expect(
      screen.getByText(/Jamais lu par un agenda pour l'instant/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Copier" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(URL_SAMPLE));

    fireEvent.click(screen.getByRole("button", { name: /Régénérer le lien/ }));
    expect(screen.getByText("Régénérer le lien ?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Régénérer" }));
    await waitFor(() => expect(feed.regenerate).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole("button", { name: /Désactiver/ }));
    expect(screen.getByText("Désactiver le lien ?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Désactiver" }));
    await waitFor(() => expect(feed.disable).toHaveBeenCalledTimes(1));
  });

  it("aide pour Google, Apple et Outlook, sans tiret cadratin", () => {
    openDialog();

    for (const app of ["Google Agenda", "Apple Calendrier", "Outlook"]) {
      expect(screen.getByText(app)).toBeInTheDocument();
    }
    expect(document.body.textContent).not.toContain("—");
  });

  it("récap du lundi : interrupteur, masqué si l'API ne le connaît pas", () => {
    openDialog();

    fireEvent.click(screen.getByRole("switch"));
    expect(digest.setEnabled).toHaveBeenCalledWith(true);
  });

  it("récap du lundi absent tant que le réglage n'est pas disponible", () => {
    digest.available = false;
    openDialog();

    expect(screen.queryByText("Récap du lundi par e-mail")).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
  });
});
