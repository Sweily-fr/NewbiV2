import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

import { useDocumentUpload } from "@/src/hooks/useDocumentUpload";
import { UPLOAD_DOCUMENT } from "@/src/graphql/mutations/documentUpload";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useDocumentUpload — initial state", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => useDocumentUpload(), {
      wrapper: wrap([]),
    });
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.uploadError).toBeNull();
    expect(result.current.uploadResult).toBeNull();
  });
});

describe("useDocumentUpload.uploadDocument", () => {
  it("sets uploadResult on success", async () => {
    const mocks = [
      {
        request: {
          query: UPLOAD_DOCUMENT,
          variables: { file: "fake-file", folderType: null },
        },
        result: {
          data: {
            uploadDocument: {
              success: true,
              cloudflareUrl: "https://cdn/file",
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useDocumentUpload(), {
      wrapper: wrap(mocks),
    });

    await act(async () => {
      await result.current.uploadDocument("fake-file");
    });

    await waitFor(() => expect(result.current.uploadResult).toBeTruthy());
    expect(result.current.uploadProgress).toBe(100);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.uploadError).toBeNull();
  });

  it("sets uploadError when API returns success=false", async () => {
    const mocks = [
      {
        request: {
          query: UPLOAD_DOCUMENT,
          variables: { file: "f", folderType: null },
        },
        result: {
          data: {
            uploadDocument: {
              success: false,
              message: "File too large",
              cloudflareUrl: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useDocumentUpload(), {
      wrapper: wrap(mocks),
    });
    await act(async () => {
      await result.current.uploadDocument("f");
    });
    await waitFor(() =>
      expect(result.current.uploadError).toBe("File too large"),
    );
  });

  it("forwards folderType to the mutation", async () => {
    const mocks = [
      {
        request: {
          query: UPLOAD_DOCUMENT,
          variables: { file: "f", folderType: "INVOICES" },
        },
        result: {
          data: {
            uploadDocument: { success: true, cloudflareUrl: "u" },
          },
        },
      },
    ];
    const { result } = renderHook(() => useDocumentUpload(), {
      wrapper: wrap(mocks),
    });
    await act(async () => {
      await result.current.uploadDocument("f", "INVOICES");
    });
    await waitFor(() => expect(result.current.uploadResult).toBeTruthy());
  });
});

describe("useDocumentUpload.resetUpload", () => {
  it("clears all state", async () => {
    const mocks = [
      {
        request: {
          query: UPLOAD_DOCUMENT,
          variables: { file: "f", folderType: null },
        },
        result: {
          data: { uploadDocument: { success: true, cloudflareUrl: "u" } },
        },
      },
    ];
    const { result } = renderHook(() => useDocumentUpload(), {
      wrapper: wrap(mocks),
    });

    await act(async () => {
      await result.current.uploadDocument("f");
    });
    await waitFor(() => expect(result.current.uploadResult).toBeTruthy());

    act(() => result.current.resetUpload());
    expect(result.current.uploadResult).toBeNull();
    expect(result.current.uploadError).toBeNull();
    expect(result.current.uploadProgress).toBe(0);
    expect(result.current.isUploading).toBe(false);
  });
});
