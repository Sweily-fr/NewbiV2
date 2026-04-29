import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const { mockGetSuggestedTags, mockGetFilteredTags } = vi.hoisted(() => ({
  mockGetSuggestedTags: vi.fn(),
  mockGetFilteredTags: vi.fn(),
}));

// Mock the useTags hook (a stub now exists at src/hooks/useTags.js).
vi.mock("@/src/hooks/useTags", () => ({
  useTags: () => ({
    getFilteredTags: mockGetFilteredTags,
    getSuggestedTags: mockGetSuggestedTags,
  }),
}));

import { TagsInput, getTagColor } from "@/src/components/TagsInput";

beforeEach(() => {
  mockGetSuggestedTags.mockReset().mockReturnValue([]);
  mockGetFilteredTags.mockReset().mockReturnValue([]);
});

describe("getTagColor", () => {
  it("cycles through the palette", () => {
    const c0 = getTagColor(0);
    const c7 = getTagColor(7);
    expect(c0.className).toBe(c7.className);
  });

  it("includes bg, text, border classes", () => {
    const c = getTagColor(2);
    expect(c.className).toContain("bg-yellow-100");
    expect(c.className).toContain("text-yellow-800");
  });
});

describe("TagsInput", () => {
  it("renders the existing tags as pills", () => {
    render(<TagsInput value={["alpha", "beta"]} onChange={() => {}} />);
    expect(screen.getByText("alpha")).toBeInTheDocument();
    expect(screen.getByText("beta")).toBeInTheDocument();
  });

  it("removes a tag when its X is clicked", () => {
    const onChange = vi.fn();
    render(<TagsInput value={["alpha", "beta"]} onChange={onChange} />);
    // Find the close button next to "alpha"
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);
    expect(onChange).toHaveBeenCalled();
  });
});
