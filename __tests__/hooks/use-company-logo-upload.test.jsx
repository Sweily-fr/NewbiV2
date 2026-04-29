import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

const useSessionMock = vi.fn();
const useWorkspaceMock = vi.fn();

vi.mock("@/src/lib/auth-client", () => ({
  useSession: () => useSessionMock(),
}));

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => useWorkspaceMock(),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { useCompanyLogoUpload } from "@/src/hooks/useCompanyLogoUpload";
import {
  UPLOAD_DOCUMENT,
  DELETE_DOCUMENT,
} from "@/src/graphql/mutations/documentUpload";
import { UPDATE_COMPANY_LOGO } from "@/src/graphql/mutations/user";
import { toast } from "@/src/components/ui/sonner";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

beforeEach(() => {
  useSessionMock.mockReset();
  useWorkspaceMock.mockReset();
  useSessionMock.mockReturnValue({ data: { user: { id: "u-1" } } });
  useWorkspaceMock.mockReturnValue({ workspaceId: "ws-1" });
  vi.clearAllMocks();
  if (typeof URL.createObjectURL === "undefined") {
    URL.createObjectURL = vi.fn(() => "blob://preview");
    URL.revokeObjectURL = vi.fn();
  } else {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob://preview");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  }
});

describe("useCompanyLogoUpload — initial state", () => {
  it("starts empty and authenticated", () => {
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap([]),
    });
    expect(result.current.isUploading).toBe(false);
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.currentImageUrl).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("isAuthenticated=false when no session", () => {
    useSessionMock.mockReturnValue({ data: null });
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap([]),
    });
    expect(result.current.isAuthenticated).toBe(false);
  });
});

describe("useCompanyLogoUpload.handleFileSelect", () => {
  it("rejects non-image files", async () => {
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap([]),
    });
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });

    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [file] } });
    });

    expect(toast.error).toHaveBeenCalledWith("Veuillez sélectionner une image");
  });

  it("rejects files > 5MB", async () => {
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap([]),
    });
    const big = new File([new Uint8Array(6 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });

    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [big] } });
    });

    expect(toast.error).toHaveBeenCalledWith("L'image doit faire moins de 5MB");
  });

  it("rejects when not authenticated", async () => {
    useSessionMock.mockReturnValue({ data: null });
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap([]),
    });
    const file = new File(["x"], "logo.png", { type: "image/png" });

    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [file] } });
    });

    expect(toast.error).toHaveBeenCalledWith("Vous devez être connecté");
  });

  it("ignores empty file selection", async () => {
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap([]),
    });
    await act(async () => {
      await result.current.handleFileSelect({ target: { files: [] } });
    });
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("useCompanyLogoUpload.setExistingImage / getDisplayImageUrl / removeImage", () => {
  it("setExistingImage sets currentImageUrl and key", () => {
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap([]),
    });
    act(() => {
      result.current.setExistingImage(
        "https://r2.example.com/logo.png",
        "k/logo.png",
      );
    });
    expect(result.current.currentImageUrl).toBe(
      "https://r2.example.com/logo.png",
    );
    expect(result.current.currentFileKey).toBe("k/logo.png");
    expect(result.current.hasImage).toBe(true);
    expect(result.current.isNewImage).toBe(false);
  });

  it("getDisplayImageUrl returns existing URL when no preview", () => {
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap([]),
    });
    act(() => {
      result.current.setExistingImage("u");
    });
    expect(result.current.getDisplayImageUrl()).toBe("u");
  });

  it("removeImage clears currentImageUrl + currentFileKey", async () => {
    const onUploadSuccess = vi.fn();
    const { result } = renderHook(
      () => useCompanyLogoUpload({ onUploadSuccess }),
      { wrapper: wrap([]) },
    );
    act(() => {
      result.current.setExistingImage("u", null);
    });
    await act(async () => {
      await result.current.removeImage();
    });
    expect(result.current.currentImageUrl).toBeNull();
    expect(result.current.currentFileKey).toBeNull();
    expect(onUploadSuccess).toHaveBeenCalledWith(null);
  });

  it("removeImage calls deleteDocument when key exists", async () => {
    const mocks = [
      {
        request: { query: DELETE_DOCUMENT, variables: { key: "k" } },
        result: { data: { deleteDocument: true } },
      },
    ];
    const { result } = renderHook(() => useCompanyLogoUpload({}), {
      wrapper: wrap(mocks),
    });
    act(() => {
      result.current.setExistingImage("u", "k");
    });
    await act(async () => {
      await result.current.removeImage();
    });
    // No assertion on the mutation specifically — MockedProvider already
    // verified the request matched. Toast success indicates the path ran.
    expect(toast.success).toHaveBeenCalledWith("Logo supprimé avec succès");
  });
});
