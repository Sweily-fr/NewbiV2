import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

const {
  validateImageFileMock,
  resizeImageMock,
  syncUserAvatarMock,
  syncUserAvatarDeletionMock,
  toastMock,
} = vi.hoisted(() => ({
  validateImageFileMock: vi.fn(),
  resizeImageMock: vi.fn(),
  syncUserAvatarMock: vi.fn(),
  syncUserAvatarDeletionMock: vi.fn(),
  toastMock: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/src/lib/upload/image-upload", () => ({
  validateImageFile: validateImageFileMock,
  resizeImage: resizeImageMock,
}));

vi.mock("@/src/lib/auth/user-sync", () => ({
  syncUserAvatar: syncUserAvatarMock,
  syncUserAvatarDeletion: syncUserAvatarDeletionMock,
}));

vi.mock("@/src/components/ui/sonner", () => ({ toast: toastMock }));

import { useGraphQLImageUpload } from "@/src/hooks/useGraphQLImageUpload";
import {
  UPLOAD_USER_PROFILE_IMAGE,
  DELETE_USER_PROFILE_IMAGE,
} from "@/src/graphql/mutations/user";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

beforeEach(() => {
  validateImageFileMock.mockReset();
  resizeImageMock.mockReset();
  syncUserAvatarMock.mockReset().mockResolvedValue(undefined);
  syncUserAvatarDeletionMock.mockReset().mockResolvedValue(undefined);
  toastMock.error.mockClear();
  toastMock.success.mockClear();

  if (typeof URL.createObjectURL === "undefined") {
    URL.createObjectURL = vi.fn(() => "blob://preview");
    URL.revokeObjectURL = vi.fn();
  } else {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob://preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  }
});

describe("useGraphQLImageUpload — initial state", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useGraphQLImageUpload(), {
      wrapper: wrap([]),
    });
    expect(result.current.isUploading).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.currentImageUrl).toBeNull();
    expect(result.current.hasImage).toBe(false);
  });
});

describe("useGraphQLImageUpload.handleFileSelect", () => {
  it("rejects with toast when validation fails", async () => {
    validateImageFileMock.mockReturnValue({
      isValid: false,
      error: "File too big",
    });

    const { result } = renderHook(() => useGraphQLImageUpload(), {
      wrapper: wrap([]),
    });
    const file = new File(["x"], "x.png", { type: "image/png" });

    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [file] } });
    });

    expect(toastMock.error).toHaveBeenCalledWith("File too big");
  });

  it("ignores empty file selection", async () => {
    const { result } = renderHook(() => useGraphQLImageUpload(), {
      wrapper: wrap([]),
    });
    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [] } });
    });
    expect(validateImageFileMock).not.toHaveBeenCalled();
  });

  it("creates a preview URL when validation passes", async () => {
    validateImageFileMock.mockReturnValue({ isValid: true });
    resizeImageMock.mockResolvedValue(new Blob());

    // The mutation isn't going to complete in this test (no mock provided),
    // but the preview URL should still be set immediately.
    const { result } = renderHook(() => useGraphQLImageUpload(), {
      wrapper: wrap([]),
    });
    const file = new File(["x"], "x.png", { type: "image/png" });
    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [file] } });
    });

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(result.current.previewUrl).toBe("blob://preview");
  });
});

describe("useGraphQLImageUpload.setExistingImage / forceDeleteImage", () => {
  it("setExistingImage sets currentImageUrl", () => {
    const { result } = renderHook(() => useGraphQLImageUpload(), {
      wrapper: wrap([]),
    });
    act(() => {
      result.current.setExistingImage("https://r2/avatar.png");
    });
    expect(result.current.currentImageUrl).toBe("https://r2/avatar.png");
    expect(result.current.hasImage).toBe(true);
  });

  it("forceDeleteImage clears state without calling mutation", () => {
    const { result } = renderHook(() => useGraphQLImageUpload(), {
      wrapper: wrap([]),
    });
    act(() => result.current.setExistingImage("u"));
    act(() => result.current.forceDeleteImage());
    expect(result.current.currentImageUrl).toBeNull();
    expect(result.current.previewUrl).toBeNull();
  });

  it("getDisplayImageUrl returns currentImageUrl when no preview", () => {
    const { result } = renderHook(() => useGraphQLImageUpload(), {
      wrapper: wrap([]),
    });
    act(() => result.current.setExistingImage("u"));
    expect(result.current.getDisplayImageUrl()).toBe("u");
  });
});

describe("useGraphQLImageUpload.deleteImage", () => {
  it("calls deleteImageMutation and clears state", async () => {
    const mocks = [
      {
        request: { query: DELETE_USER_PROFILE_IMAGE },
        result: {
          data: {
            deleteUserProfileImage: { success: true, message: null },
          },
        },
      },
    ];
    const { result } = renderHook(() => useGraphQLImageUpload(), {
      wrapper: wrap(mocks),
    });
    act(() => result.current.setExistingImage("u"));

    await act(async () => {
      await result.current.deleteImage();
    });

    // Optimistic clear happens before mutation
    expect(result.current.currentImageUrl).toBeNull();
  });
});
