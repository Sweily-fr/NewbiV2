import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

import { useOcr } from "@/src/hooks/useOcr";
import {
  PROCESS_DOCUMENT_OCR,
  PROCESS_DOCUMENT_OCR_FROM_URL,
} from "@/src/graphql/mutations/ocr";

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

describe("useOcr.processDocument", () => {
  it("starts with idle state", () => {
    const { result } = renderHook(() => useOcr(), { wrapper: wrap([]) });
    expect(result.current.ocrResult).toBeNull();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("stores the OCR result on success", async () => {
    const ocrPayload = { rawText: "Facture 001", structuredData: {} };
    const file = "fake-file";
    const mocks = [
      {
        request: {
          query: PROCESS_DOCUMENT_OCR,
          variables: {
            file,
            workspaceId: "ws-1",
            options: {
              model: "mistral-ocr-latest",
              includeImageBase64: false,
            },
          },
        },
        result: { data: { processDocumentOcr: ocrPayload } },
      },
    ];

    const { result } = renderHook(() => useOcr(), { wrapper: wrap(mocks) });

    await act(async () => {
      await result.current.processDocument(file, "ws-1");
    });

    await waitFor(() => expect(result.current.ocrResult).toEqual(ocrPayload));
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("merges custom options into the OCR variables", async () => {
    const file = "f";
    const mocks = [
      {
        request: {
          query: PROCESS_DOCUMENT_OCR,
          variables: {
            file,
            workspaceId: "ws-1",
            options: {
              model: "custom-model",
              includeImageBase64: true,
            },
          },
        },
        result: {
          data: { processDocumentOcr: { rawText: "ok" } },
        },
      },
    ];

    const { result } = renderHook(() => useOcr(), { wrapper: wrap(mocks) });
    await act(async () => {
      await result.current.processDocument(file, "ws-1", {
        model: "custom-model",
        includeImageBase64: true,
      });
    });
    await waitFor(() => expect(result.current.ocrResult).toBeTruthy());
  });

  it("captures and surfaces GraphQL errors", async () => {
    const file = "f";
    const mocks = [
      {
        request: {
          query: PROCESS_DOCUMENT_OCR,
          variables: {
            file,
            workspaceId: "ws-1",
            options: {
              model: "mistral-ocr-latest",
              includeImageBase64: false,
            },
          },
        },
        error: new Error("OCR provider down"),
      },
    ];

    const { result } = renderHook(() => useOcr(), { wrapper: wrap(mocks) });
    await act(async () => {
      await result.current.processDocument(file, "ws-1");
    });
    await waitFor(() => expect(result.current.error).toContain("OCR"));
    expect(result.current.isProcessing).toBe(false);
  });
});

describe("useOcr.processDocumentFromUrl", () => {
  it("forwards URL params to the mutation", async () => {
    const variables = {
      cloudflareUrl: "https://r2/key",
      fileName: "ticket.pdf",
      mimeType: "application/pdf",
      fileSize: 12345,
      workspaceId: "ws-1",
      options: {
        model: "mistral-ocr-latest",
        includeImageBase64: false,
      },
    };
    const mocks = [
      {
        request: { query: PROCESS_DOCUMENT_OCR_FROM_URL, variables },
        result: {
          data: { processDocumentOcrFromUrl: { rawText: "From URL" } },
        },
      },
    ];

    const { result } = renderHook(() => useOcr(), { wrapper: wrap(mocks) });
    await act(async () => {
      await result.current.processDocumentFromUrl(
        variables.cloudflareUrl,
        variables.fileName,
        variables.mimeType,
        variables.fileSize,
        variables.workspaceId,
      );
    });
    await waitFor(() =>
      expect(result.current.ocrResult).toEqual({ rawText: "From URL" }),
    );
  });
});

describe("useOcr.resetOcr", () => {
  it("clears result/error/processing", async () => {
    const mocks = [
      {
        request: {
          query: PROCESS_DOCUMENT_OCR,
          variables: {
            file: "f",
            workspaceId: "ws-1",
            options: {
              model: "mistral-ocr-latest",
              includeImageBase64: false,
            },
          },
        },
        result: { data: { processDocumentOcr: { rawText: "x" } } },
      },
    ];

    const { result } = renderHook(() => useOcr(), { wrapper: wrap(mocks) });
    await act(async () => {
      await result.current.processDocument("f", "ws-1");
    });
    await waitFor(() => expect(result.current.ocrResult).toBeTruthy());

    act(() => result.current.resetOcr());
    expect(result.current.ocrResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isProcessing).toBe(false);
  });
});
