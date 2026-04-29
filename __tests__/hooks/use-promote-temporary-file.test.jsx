import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

import { usePromoteTemporaryFile } from "@/src/hooks/usePromoteTemporaryFile";
import { PROMOTE_TEMPORARY_FILE } from "@/src/graphql/mutations/documentUpload";

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

describe("usePromoteTemporaryFile", () => {
  it("starts idle", () => {
    const { result } = renderHook(() => usePromoteTemporaryFile(), {
      wrapper: wrap([]),
    });
    expect(result.current.isPromoting).toBe(false);
    expect(result.current.promoteError).toBeNull();
    expect(result.current.promoteResult).toBeNull();
  });

  it("sets promoteResult on success", async () => {
    const mocks = [
      {
        request: {
          query: PROMOTE_TEMPORARY_FILE,
          variables: { tempKey: "tmp-1" },
        },
        result: {
          data: {
            promoteTemporaryFile: {
              success: true,
              key: "permanent-1",
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePromoteTemporaryFile(), {
      wrapper: wrap(mocks),
    });
    await act(async () => {
      await result.current.promoteTemporaryFile("tmp-1");
    });
    await waitFor(() => expect(result.current.promoteResult).toBeTruthy());
    expect(result.current.promoteError).toBeNull();
  });

  it("sets promoteError when API returns success=false", async () => {
    const mocks = [
      {
        request: {
          query: PROMOTE_TEMPORARY_FILE,
          variables: { tempKey: "tmp-1" },
        },
        result: {
          data: {
            promoteTemporaryFile: {
              success: false,
              message: "File not found",
              key: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePromoteTemporaryFile(), {
      wrapper: wrap(mocks),
    });
    await act(async () => {
      await result.current.promoteTemporaryFile("tmp-1");
    });
    await waitFor(() =>
      expect(result.current.promoteError).toBe("File not found"),
    );
  });

  it("resetPromote clears state", async () => {
    const mocks = [
      {
        request: {
          query: PROMOTE_TEMPORARY_FILE,
          variables: { tempKey: "tmp-1" },
        },
        result: {
          data: {
            promoteTemporaryFile: { success: true, key: "p-1" },
          },
        },
      },
    ];
    const { result } = renderHook(() => usePromoteTemporaryFile(), {
      wrapper: wrap(mocks),
    });
    await act(async () => {
      await result.current.promoteTemporaryFile("tmp-1");
    });
    await waitFor(() => expect(result.current.promoteResult).toBeTruthy());

    act(() => result.current.resetPromote());
    expect(result.current.promoteResult).toBeNull();
    expect(result.current.promoteError).toBeNull();
    expect(result.current.isPromoting).toBe(false);
  });
});
