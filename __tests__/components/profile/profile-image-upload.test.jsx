import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  hookState: {
    isUploading: false,
    uploadProgress: 0,
    fileInputRef: { current: null },
    openFileSelector: vi.fn(),
    handleFileSelect: vi.fn(),
    removeImage: vi.fn(),
    setExistingImage: vi.fn(),
    getDisplayImageUrl: vi.fn().mockReturnValue(null),
    hasImage: false,
    isNewImage: false,
  },
}));

vi.mock("@/src/hooks/useProfileImageUpload", () => ({
  useProfileImageUpload: () => mocks.hookState,
}));

import { ProfileImageUpload } from "@/src/components/profile/ProfileImageUpload";

describe("ProfileImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hookState.isUploading = false;
    mocks.hookState.uploadProgress = 0;
    mocks.hookState.hasImage = false;
    mocks.hookState.isNewImage = false;
    mocks.hookState.getDisplayImageUrl = vi.fn().mockReturnValue(null);
    mocks.hookState.openFileSelector = vi.fn();
    mocks.hookState.handleFileSelect = vi.fn();
    mocks.hookState.removeImage = vi.fn();
    mocks.hookState.setExistingImage = vi.fn();
  });

  it("renders the placeholder when no image is set", () => {
    render(<ProfileImageUpload />);
    expect(screen.getByLabelText(/Uploader une image/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Glissez une image ou cliquez pour uploader/i),
    ).toBeInTheDocument();
  });

  it("renders the existing image when displayImageUrl exists", () => {
    mocks.hookState.getDisplayImageUrl = vi
      .fn()
      .mockReturnValue("https://example.com/avatar.png");
    render(<ProfileImageUpload />);
    const img = screen.getByAltText("Image de profil");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.png");
  });

  it("calls openFileSelector when the drop button is clicked", async () => {
    render(<ProfileImageUpload />);
    await userEvent.click(screen.getByLabelText(/Uploader une image/i));
    expect(mocks.hookState.openFileSelector).toHaveBeenCalled();
  });

  it("does not open file selector when uploading", async () => {
    mocks.hookState.isUploading = true;
    mocks.hookState.uploadProgress = 50;
    render(<ProfileImageUpload />);
    // Button is disabled, click should not trigger
    const btn = screen.getByLabelText(/Uploader une image/i);
    expect(btn).toBeDisabled();
  });

  it("displays the upload progress when uploading", () => {
    mocks.hookState.isUploading = true;
    mocks.hookState.uploadProgress = 42;
    render(<ProfileImageUpload />);
    expect(screen.getByText(/Upload\.\.\. 42%/)).toBeInTheDocument();
  });

  it("removes the image when the remove button is clicked", async () => {
    mocks.hookState.getDisplayImageUrl = vi
      .fn()
      .mockReturnValue("https://example.com/avatar.png");
    const onImageChange = vi.fn();
    render(<ProfileImageUpload onImageChange={onImageChange} />);
    await userEvent.click(screen.getByLabelText(/Supprimer l'image/i));
    expect(mocks.hookState.removeImage).toHaveBeenCalled();
    expect(onImageChange).toHaveBeenCalledWith(null);
  });

  it("handles a drop event and forwards the file to handleFileSelect", () => {
    render(<ProfileImageUpload />);
    const dropArea = screen.getByLabelText(/Uploader une image/i);
    const file = new File(["x"], "test.png", { type: "image/png" });
    fireEvent.drop(dropArea, {
      dataTransfer: { files: [file] },
    });
    expect(mocks.hookState.handleFileSelect).toHaveBeenCalled();
  });

  it("hides description when showDescription=false", () => {
    render(<ProfileImageUpload showDescription={false} />);
    expect(
      screen.queryByText(/Glissez une image ou cliquez pour uploader/i),
    ).not.toBeInTheDocument();
  });
});
