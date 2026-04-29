import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  hookState: {
    isUploading: false,
    isDeleting: false,
    uploadProgress: 0,
    fileInputRef: { current: null },
    openFileSelector: vi.fn(),
    handleFileSelect: vi.fn(),
    deleteImage: vi.fn().mockResolvedValue(),
    setExistingImage: vi.fn(),
    forceDeleteImage: vi.fn(),
    getDisplayImageUrl: vi.fn().mockReturnValue(null),
    hasImage: false,
    isNewImage: false,
    cleanup: vi.fn(),
  },
}));

vi.mock("@/src/hooks/useGraphQLImageUpload", () => ({
  useGraphQLImageUpload: () => mocks.hookState,
}));

import { GraphQLProfileImageUpload } from "@/src/components/profile/GraphQLProfileImageUpload";

describe("GraphQLProfileImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hookState.isUploading = false;
    mocks.hookState.isDeleting = false;
    mocks.hookState.uploadProgress = 0;
    mocks.hookState.hasImage = false;
    mocks.hookState.isNewImage = false;
    mocks.hookState.getDisplayImageUrl = vi.fn().mockReturnValue(null);
    mocks.hookState.openFileSelector = vi.fn();
    mocks.hookState.handleFileSelect = vi.fn();
    mocks.hookState.deleteImage = vi.fn().mockResolvedValue();
    mocks.hookState.setExistingImage = vi.fn();
    mocks.hookState.cleanup = vi.fn();
  });

  it("renders the placeholder", () => {
    render(<GraphQLProfileImageUpload />);
    expect(screen.getByLabelText("Upload image")).toBeInTheDocument();
  });

  it("renders the existing image when displayImageUrl exists", () => {
    mocks.hookState.getDisplayImageUrl = vi
      .fn()
      .mockReturnValue("https://example.com/me.png");
    render(<GraphQLProfileImageUpload />);
    expect(screen.getByLabelText("Change image")).toBeInTheDocument();
    expect(screen.getByAltText(/Uploaded image/i)).toBeInTheDocument();
  });

  it("triggers openFileSelector when clicking the drop area", async () => {
    render(<GraphQLProfileImageUpload />);
    await userEvent.click(screen.getByLabelText("Upload image"));
    expect(mocks.hookState.openFileSelector).toHaveBeenCalled();
  });

  it("triggers openFileSelector when pressing Enter on the drop area", () => {
    render(<GraphQLProfileImageUpload />);
    const dropArea = screen.getByLabelText("Upload image");
    fireEvent.keyDown(dropArea, { key: "Enter" });
    expect(mocks.hookState.openFileSelector).toHaveBeenCalled();
  });

  it("calls deleteImage when remove button is clicked", async () => {
    mocks.hookState.getDisplayImageUrl = vi
      .fn()
      .mockReturnValue("https://example.com/me.png");
    render(<GraphQLProfileImageUpload />);
    await userEvent.click(screen.getByLabelText("Remove image"));
    expect(mocks.hookState.deleteImage).toHaveBeenCalled();
  });

  it("shows the upload progress", () => {
    mocks.hookState.isUploading = true;
    mocks.hookState.uploadProgress = 88;
    render(<GraphQLProfileImageUpload />);
    expect(screen.getByText(/Upload en cours\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/88%/)).toBeInTheDocument();
  });

  it("forwards dropped file to handleFileSelect", () => {
    render(<GraphQLProfileImageUpload />);
    fireEvent.drop(screen.getByLabelText("Upload image"), {
      dataTransfer: {
        files: [new File(["x"], "x.png", { type: "image/png" })],
      },
    });
    expect(mocks.hookState.handleFileSelect).toHaveBeenCalled();
  });
});
