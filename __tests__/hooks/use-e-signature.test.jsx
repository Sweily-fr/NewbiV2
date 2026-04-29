import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import {
  useDocumentSignatureStatus,
  useSignatureRequests,
  useRequestSignature,
  useCancelSignature,
  useRetrySignature,
} from "@/src/hooks/useESignature";

import {
  GET_SIGNATURE_REQUESTS,
  GET_DOCUMENT_SIGNATURE_STATUS,
  REQUEST_DOCUMENT_SIGNATURE,
  CANCEL_SIGNATURE,
  RETRY_SIGNATURE,
} from "@/src/graphql/esignatureQueries";

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
  vi.clearAllMocks();
});

describe("useDocumentSignatureStatus", () => {
  it.skip("returns terminal=true when status DONE", async () => {
    const mocks = [
      {
        request: {
          query: GET_DOCUMENT_SIGNATURE_STATUS,
          variables: { documentType: "quote", documentId: "doc-1" },
        },
        result: {
          data: {
            getDocumentSignatureStatus: { _id: "s-1", status: "DONE" },
          },
        },
      },
    ];
    const { result } = renderHook(
      () => useDocumentSignatureStatus("quote", "doc-1"),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isDone).toBe(true);
    expect(result.current.isPending).toBeFalsy();
    expect(result.current.hasSignature).toBe(true);
  });

  it.skip("flags isPending=true for WAIT_SIGN", async () => {
    const mocks = [
      {
        request: {
          query: GET_DOCUMENT_SIGNATURE_STATUS,
          variables: { documentType: "quote", documentId: "doc-1" },
        },
        result: {
          data: {
            getDocumentSignatureStatus: { _id: "s-1", status: "WAIT_SIGN" },
          },
        },
      },
    ];
    const { result } = renderHook(
      () => useDocumentSignatureStatus("quote", "doc-1"),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isPending).toBe(true);
    expect(result.current.isDone).toBe(false);
  });

  it("returns hasSignature=false when no signature", async () => {
    const mocks = [
      {
        request: {
          query: GET_DOCUMENT_SIGNATURE_STATUS,
          variables: { documentType: "quote", documentId: "doc-1" },
        },
        result: { data: { getDocumentSignatureStatus: null } },
      },
    ];
    const { result } = renderHook(
      () => useDocumentSignatureStatus("quote", "doc-1"),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.hasSignature).toBe(false);
  });

  it("skips query when documentType or id missing", () => {
    const { result } = renderHook(
      () => useDocumentSignatureStatus(null, null),
      {
        wrapper: wrap([]),
      },
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.signatureRequest).toBeNull();
  });
});

describe("useSignatureRequests", () => {
  it("returns the list", async () => {
    const mocks = [
      {
        request: { query: GET_SIGNATURE_REQUESTS, variables: {} },
        result: {
          data: {
            getSignatureRequests: [
              { _id: "s-1", status: "DONE" },
              { _id: "s-2", status: "WAIT_SIGN" },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useSignatureRequests(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.signatureRequests).toHaveLength(2);
  });

  it("returns [] when no data yet", () => {
    const { result } = renderHook(() => useSignatureRequests(), {
      wrapper: wrap([]),
    });
    expect(result.current.signatureRequests).toEqual([]);
  });
});

describe("useRequestSignature", () => {
  it("returns success=true on success", async () => {
    const input = {
      documentType: "quote",
      documentId: "doc-1",
      signers: [],
    };
    const mocks = [
      {
        request: {
          query: REQUEST_DOCUMENT_SIGNATURE,
          variables: { input },
        },
        result: {
          data: {
            requestDocumentSignature: {
              success: true,
              signatureRequest: { _id: "s-1" },
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useRequestSignature(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.requestSignature(input);
    });
    expect(out.success).toBe(true);
    expect(out.signatureRequest._id).toBe("s-1");
    expect(toast.success).toHaveBeenCalled();
  });

  it("returns success=false when backend reports failure", async () => {
    const input = {
      documentType: "quote",
      documentId: "doc-1",
      signers: [],
    };
    const mocks = [
      {
        request: {
          query: REQUEST_DOCUMENT_SIGNATURE,
          variables: { input },
        },
        result: {
          data: {
            requestDocumentSignature: {
              success: false,
              signatureRequest: null,
              message: "missing siret",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useRequestSignature(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.requestSignature(input);
    });
    expect(out.success).toBe(false);
    expect(out.error).toBe("missing siret");
    expect(toast.error).toHaveBeenCalled();
  });
});

describe("useCancelSignature", () => {
  it("returns success=true on success", async () => {
    const mocks = [
      {
        request: {
          query: CANCEL_SIGNATURE,
          variables: { signatureId: "s-1" },
        },
        result: {
          data: { cancelSignature: { success: true, message: null } },
        },
      },
    ];
    const { result } = renderHook(() => useCancelSignature(), {
      wrapper: wrap(mocks),
    });
    let out;
    await act(async () => {
      out = await result.current.cancelSignature("s-1", "quote", "doc-1");
    });
    expect(out.success).toBe(true);
  });
});

describe("useRetrySignature", () => {
  it("returns success=true on success", async () => {
    const mocks = [
      {
        request: {
          query: RETRY_SIGNATURE,
          variables: { signatureId: "s-1" },
        },
        result: {
          data: { retrySignature: { success: true, message: null } },
        },
      },
    ];
    const { result } = renderHook(() => useRetrySignature(), {
      wrapper: wrap(mocks),
    });
    let out;
    await act(async () => {
      out = await result.current.retrySignature("s-1", "quote", "doc-1");
    });
    expect(out.success).toBe(true);
  });
});
