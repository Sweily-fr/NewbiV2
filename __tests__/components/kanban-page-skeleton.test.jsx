import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

let mockPathname = "/dashboard/outils/kanban/board-1";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

import {
  KanbanPageSkeleton,
  getBoardIdFromPathname,
} from "@/app/dashboard/outils/kanban/[id]/components/KanbanPageSkeleton";
import KanbanLoading from "@/app/dashboard/outils/kanban/loading";

const shownView = (container) =>
  container
    .querySelector("[data-kanban-skeleton-view]")
    ?.getAttribute("data-kanban-skeleton-view") ?? null;

describe("KanbanPageSkeleton", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPathname = "/dashboard/outils/kanban/board-1";
    window.innerWidth = 1280;
  });

  it("affiche le Board par défaut", () => {
    const { container } = render(<KanbanPageSkeleton />);
    expect(shownView(container)).toBe("board");
  });

  it.each(["list", "gantt", "board"])(
    "affiche directement la vue enregistrée (%s), sans passer par le Board",
    (view) => {
      localStorage.setItem("kanban-view-mode-board-1", view);
      const { container } = render(<KanbanPageSkeleton />);
      expect(shownView(container)).toBe(view);
    },
  );

  it("prend l'id passé par la page plutôt que l'URL", () => {
    localStorage.setItem("kanban-view-mode-board-2", "gantt");
    const { container } = render(<KanbanPageSkeleton boardId="board-2" />);
    expect(shownView(container)).toBe("gantt");
  });

  it("affiche la Liste sur mobile, comme useViewMode", () => {
    localStorage.setItem("kanban-view-mode-board-1", "gantt");
    window.innerWidth = 500;
    const { container } = render(<KanbanPageSkeleton />);
    expect(shownView(container)).toBe("list");
  });
});

describe("getBoardIdFromPathname", () => {
  it("extrait l'id d'un tableau", () => {
    expect(getBoardIdFromPathname("/dashboard/outils/kanban/abc123")).toBe(
      "abc123",
    );
  });

  it("ignore la liste des tableaux et la création", () => {
    expect(getBoardIdFromPathname("/dashboard/outils/kanban")).toBeNull();
    expect(getBoardIdFromPathname("/dashboard/outils/kanban/new")).toBeNull();
    expect(getBoardIdFromPathname(null)).toBeNull();
  });
});

describe("loading.jsx de /kanban", () => {
  beforeEach(() => {
    localStorage.clear();
    window.innerWidth = 1280;
  });

  it("rend le skeleton du tableau quand on arrive sur un tableau", () => {
    mockPathname = "/dashboard/outils/kanban/board-1";
    localStorage.setItem("kanban-view-mode-board-1", "list");
    const { container } = render(<KanbanLoading />);
    expect(shownView(container)).toBe("list");
  });

  it("rend le skeleton de la liste des tableaux sur /kanban", () => {
    mockPathname = "/dashboard/outils/kanban";
    const { container } = render(<KanbanLoading />);
    expect(shownView(container)).toBeNull();
  });
});
