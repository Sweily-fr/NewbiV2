import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { uploadImageMock, resizeImageMock, validateImageFileMock, toastMock } =
  vi.hoisted(() => ({
    uploadImageMock: vi.fn(),
    resizeImageMock: vi.fn(),
    validateImageFileMock: vi.fn(),
    toastMock: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
  }));

vi.mock("@/src/lib/upload/image-upload", () => ({
  uploadImage: uploadImageMock,
  resizeImage: resizeImageMock,
  validateImageFile: validateImageFileMock,
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

import { useProfileImageUpload } from "@/src/hooks/useProfileImageUpload";

beforeEach(() => {
  uploadImageMock.mockReset();
  resizeImageMock.mockReset();
  validateImageFileMock.mockReset();
  toastMock.error.mockClear();
  toastMock.success.mockClear();
  toastMock.info.mockClear();
  if (typeof URL.createObjectURL === "undefined") {
    URL.createObjectURL = vi.fn(() => "blob://preview");
    URL.revokeObjectURL = vi.fn();
  } else {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob://preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  }
});

describe("useProfileImageUpload — initial state", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useProfileImageUpload());
    expect(result.current.isUploading).toBe(false);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.uploadedImageUrl).toBeNull();
    expect(result.current.hasImage).toBe(false);
  });
});

describe("useProfileImageUpload.handleFileSelect", () => {
  it("uploads after validation and resize", async () => {
    validateImageFileMock.mockReturnValue({ isValid: true });
    resizeImageMock.mockResolvedValue(new Blob());
    uploadImageMock.mockResolvedValue("https://r2.example.com/profile.png");

    const onUploadSuccess = vi.fn();
    const { result } = renderHook(() =>
      useProfileImageUpload({ onUploadSuccess }),
    );

    const file = new File(["x"], "profile.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [file] } });
    });

    expect(validateImageFileMock).toHaveBeenCalledWith(file);
    expect(resizeImageMock).toHaveBeenCalled();
    expect(uploadImageMock).toHaveBeenCalled();
    expect(result.current.uploadedImageUrl).toBe(
      "https://r2.example.com/profile.png",
    );
    expect(toastMock.success).toHaveBeenCalled();
    expect(onUploadSuccess).toHaveBeenCalledWith(
      "https://r2.example.com/profile.png",
    );
  });

  it("skips upload when validation fails", async () => {
    validateImageFileMock.mockReturnValue({
      isValid: false,
      error: "File too big",
    });

    const onUploadError = vi.fn();
    const { result } = renderHook(() =>
      useProfileImageUpload({ onUploadError }),
    );

    const file = new File(["x"], "big.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [file] } });
    });

    expect(toastMock.error).toHaveBeenCalledWith("File too big");
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("calls onUploadError when upload throws", async () => {
    validateImageFileMock.mockReturnValue({ isValid: true });
    resizeImageMock.mockResolvedValue(new Blob());
    uploadImageMock.mockRejectedValue(new Error("R2 down"));

    const onUploadError = vi.fn();
    const { result } = renderHook(() =>
      useProfileImageUpload({ onUploadError }),
    );

    const file = new File(["x"], "p.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [file] } });
    });

    expect(toastMock.error).toHaveBeenCalledWith("R2 down");
    expect(onUploadError).toHaveBeenCalled();
    expect(result.current.isUploading).toBe(false);
  });

  it("skips when no file selected", async () => {
    const { result } = renderHook(() => useProfileImageUpload());
    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [] } });
    });
    expect(validateImageFileMock).not.toHaveBeenCalled();
    expect(uploadImageMock).not.toHaveBeenCalled();
  });

  it("does not resize when autoResize=false", async () => {
    validateImageFileMock.mockReturnValue({ isValid: true });
    uploadImageMock.mockResolvedValue("https://r2.example.com/x.png");

    const { result } = renderHook(() =>
      useProfileImageUpload({ autoResize: false }),
    );
    const file = new File(["x"], "x.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [file] } });
    });

    expect(resizeImageMock).not.toHaveBeenCalled();
    expect(uploadImageMock).toHaveBeenCalled();
  });
});

describe("useProfileImageUpload.removeImage / setExistingImage", () => {
  it("removeImage clears state", () => {
    const { result } = renderHook(() => useProfileImageUpload());
    act(() => {
      result.current.setExistingImage("https://existing.png");
    });
    expect(result.current.uploadedImageUrl).toBe("https://existing.png");
    act(() => {
      result.current.removeImage();
    });
    expect(result.current.uploadedImageUrl).toBeNull();
    expect(result.current.previewUrl).toBeNull();
  });

  it("setExistingImage sets uploadedImageUrl", () => {
    const { result } = renderHook(() => useProfileImageUpload());
    act(() => {
      result.current.setExistingImage("https://r2/avatar.png");
    });
    expect(result.current.uploadedImageUrl).toBe("https://r2/avatar.png");
    expect(result.current.hasImage).toBe(true);
    expect(result.current.isNewImage).toBe(false);
  });

  it("getDisplayImageUrl returns preview when set, else uploaded", () => {
    const { result } = renderHook(() => useProfileImageUpload());
    act(() => result.current.setExistingImage("u"));
    expect(result.current.getDisplayImageUrl()).toBe("u");
  });
});
