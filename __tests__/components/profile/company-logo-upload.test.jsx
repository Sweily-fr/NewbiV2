import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mocks = vi.hoisted(() => ({
  hookState: {
    isUploading: false,
    uploadProgress: 0,
    previewUrl: null,
    hasImage: false,
    isNewImage: false,
    fileInputRef: { current: null },
    openFileDialog: vi.fn(),
    handleFileSelect: vi.fn(),
    removeImage: vi.fn(),
    setExistingImage: vi.fn(),
    getDisplayImageUrl: vi.fn().mockReturnValue(null),
    isAuthenticated: true,
  },
}));

vi.mock("@/src/hooks/useCompanyLogoUpload", () => ({
  useCompanyLogoUpload: () => mocks.hookState,
}));

import { CompanyLogoUpload } from "@/src/components/profile/CompanyLogoUpload";

describe("CompanyLogoUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hookState.isUploading = false;
    mocks.hookState.uploadProgress = 0;
    mocks.hookState.hasImage = false;
    mocks.hookState.isNewImage = false;
    mocks.hookState.isAuthenticated = true;
    mocks.hookState.getDisplayImageUrl = vi.fn().mockReturnValue(null);
    mocks.hookState.openFileDialog = vi.fn();
    mocks.hookState.handleFileSelect = vi.fn();
    mocks.hookState.removeImage = vi.fn();
    mocks.hookState.setExistingImage = vi.fn();
  });

  it("renders the unauthenticated state when not logged in", () => {
    mocks.hookState.isAuthenticated = false;
    render(<CompanyLogoUpload />);
    expect(
      screen.getByText(/Connectez-vous pour uploader un logo/i),
    ).toBeInTheDocument();
  });

  it("renders the placeholder when authenticated but no logo", () => {
    render(<CompanyLogoUpload />);
    expect(screen.getByLabelText(/Uploader un logo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Glissez un logo ou cliquez pour uploader/i),
    ).toBeInTheDocument();
  });

  it("renders the existing logo when displayImageUrl exists", () => {
    mocks.hookState.getDisplayImageUrl = vi
      .fn()
      .mockReturnValue("https://example.com/logo.png");
    render(<CompanyLogoUpload />);
    expect(screen.getByLabelText(/Changer le logo/i)).toBeInTheDocument();
  });

  it("opens file dialog when the drop button is clicked", async () => {
    render(<CompanyLogoUpload />);
    await userEvent.click(screen.getByLabelText(/Uploader un logo/i));
    expect(mocks.hookState.openFileDialog).toHaveBeenCalled();
  });

  it("displays progress during upload", () => {
    mocks.hookState.isUploading = true;
    mocks.hookState.uploadProgress = 73;
    render(<CompanyLogoUpload />);
    expect(screen.getByText(/Upload en cours\.\.\. 73%/)).toBeInTheDocument();
  });

  it("forwards dropped files to handleFileSelect", () => {
    render(<CompanyLogoUpload />);
    const drop = screen.getByLabelText(/Uploader un logo/i);
    fireEvent.drop(drop, {
      dataTransfer: {
        files: [new File(["x"], "logo.png", { type: "image/png" })],
      },
    });
    expect(mocks.hookState.handleFileSelect).toHaveBeenCalled();
  });

  it("renders the new-image hint when isNewImage", () => {
    mocks.hookState.isNewImage = true;
    render(<CompanyLogoUpload />);
    expect(screen.getByText(/Nouveau logo sélectionné/i)).toBeInTheDocument();
  });
});
