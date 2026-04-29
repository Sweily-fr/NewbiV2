import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

import {
  useSharedDocuments,
  useSharedFolders,
  useSharedDocumentsStats,
  useUploadSharedDocument,
  useMoveSharedDocuments,
  useDeleteSharedDocuments,
  GET_SHARED_DOCUMENTS,
  GET_SHARED_FOLDERS,
  GET_SHARED_DOCUMENTS_STATS,
  UPLOAD_SHARED_DOCUMENT,
  MOVE_SHARED_DOCUMENTS,
  DELETE_SHARED_DOCUMENTS,
} from "@/src/hooks/useSharedDocuments";

import { toast } from "@/src/components/ui/sonner";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

const baseDocsVariables = {
  workspaceId: "ws-1",
  filter: {
    folderId: undefined,
    search: undefined,
    status: undefined,
    fileType: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    minSize: undefined,
    maxSize: undefined,
  },
  limit: 50,
  offset: 0,
  sortBy: "createdAt",
  sortOrder: "desc",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSharedDocuments", () => {
  it("returns documents from query", async () => {
    const mocks = [
      {
        request: {
          query: GET_SHARED_DOCUMENTS,
          variables: baseDocsVariables,
        },
        result: {
          data: {
            sharedDocuments: {
              documents: [
                { id: "d-1", name: "doc1.pdf" },
                { id: "d-2", name: "doc2.pdf" },
              ],
              total: 2,
              hasMore: false,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useSharedDocuments(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.documents).toHaveLength(2);
    expect(result.current.total).toBe(2);
    expect(result.current.hasMore).toBe(false);
  });

  it("returns sensible defaults without data", () => {
    const { result } = renderHook(() => useSharedDocuments(), {
      wrapper: wrap([]),
    });
    expect(result.current.documents).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.hasMore).toBe(false);
  });

  it("flags isInitialLoading=true when loading without data", () => {
    const { result } = renderHook(() => useSharedDocuments(), {
      wrapper: wrap([]),
    });
    expect(result.current.isInitialLoading).toBe(true);
  });
});

describe("useSharedFolders", () => {
  it("returns folders from query", async () => {
    const mocks = [
      {
        request: {
          query: GET_SHARED_FOLDERS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            sharedFolders: {
              folders: [
                { id: "f-1", name: "Factures" },
                { id: "f-2", name: "Devis" },
              ],
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useSharedFolders(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.folders).toHaveLength(2);
  });

  it("returns [] without data", () => {
    const { result } = renderHook(() => useSharedFolders(), {
      wrapper: wrap([]),
    });
    expect(result.current.folders).toEqual([]);
  });
});

describe("useSharedDocumentsStats", () => {
  it("returns stats from query", async () => {
    const mocks = [
      {
        request: {
          query: GET_SHARED_DOCUMENTS_STATS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            sharedDocumentsStats: {
              totalDocuments: 10,
              pendingDocuments: 2,
              classifiedDocuments: 8,
              archivedDocuments: 0,
              totalFolders: 3,
              totalSize: 1024,
              trashedDocuments: 0,
              trashedFolders: 0,
              trashedSize: 0,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useSharedDocumentsStats(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stats.totalDocuments).toBe(10);
    expect(result.current.stats.totalFolders).toBe(3);
  });

  it("returns canonical default zero stats without data", () => {
    const { result } = renderHook(() => useSharedDocumentsStats(), {
      wrapper: wrap([]),
    });
    expect(result.current.stats.totalDocuments).toBe(0);
    expect(result.current.stats.totalFolders).toBe(0);
    expect(result.current.stats.totalSize).toBe(0);
  });
});

describe("useUploadSharedDocument", () => {
  it("returns the document on successful upload", async () => {
    const mocks = [
      {
        request: {
          query: UPLOAD_SHARED_DOCUMENT,
          variables: {
            workspaceId: "ws-1",
            file: "fake-file",
            folderId: null,
            name: undefined,
            description: undefined,
            tags: undefined,
          },
        },
        result: {
          data: {
            uploadSharedDocument: {
              success: true,
              document: { id: "d-1", name: "x.pdf" },
              message: null,
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useUploadSharedDocument(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.upload("fake-file");
    });
    expect(out?.id).toBe("d-1");
    expect(toast.success).toHaveBeenCalled();
  });

  it("throws and toasts on backend error", async () => {
    const mocks = [
      {
        request: {
          query: UPLOAD_SHARED_DOCUMENT,
          variables: {
            workspaceId: "ws-1",
            file: "fake",
            folderId: null,
            name: undefined,
            description: undefined,
            tags: undefined,
          },
        },
        result: {
          data: {
            uploadSharedDocument: {
              success: false,
              document: null,
              message: "File too big",
            },
          },
        },
      },
    ];

    const { result } = renderHook(() => useUploadSharedDocument(), {
      wrapper: wrap(mocks),
    });

    await expect(
      act(async () => {
        await result.current.upload("fake");
      }),
    ).rejects.toThrow();
    expect(toast.error).toHaveBeenCalled();
  });
});

describe("useMoveSharedDocuments", () => {
  it("moves documents and toasts movedCount", async () => {
    const mocks = [
      {
        request: {
          query: MOVE_SHARED_DOCUMENTS,
          variables: {
            ids: ["d-1", "d-2"],
            workspaceId: "ws-1",
            targetFolderId: "f-1",
          },
        },
        result: {
          data: {
            moveSharedDocuments: {
              success: true,
              movedCount: 2,
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useMoveSharedDocuments(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.move(["d-1", "d-2"], "f-1");
    });
    expect(out).toBe(true);
    expect(toast.success).toHaveBeenCalled();
  });

  it("respects silent option (no toast)", async () => {
    const mocks = [
      {
        request: {
          query: MOVE_SHARED_DOCUMENTS,
          variables: {
            ids: ["d-1"],
            workspaceId: "ws-1",
            targetFolderId: "f-1",
          },
        },
        result: {
          data: {
            moveSharedDocuments: {
              success: true,
              movedCount: 1,
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useMoveSharedDocuments(), {
      wrapper: wrap(mocks),
    });

    await act(async () => {
      await result.current.move(["d-1"], "f-1", { silent: true });
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe("useDeleteSharedDocuments", () => {
  it("deletes documents and toasts on success", async () => {
    const mocks = [
      {
        request: {
          query: DELETE_SHARED_DOCUMENTS,
          variables: { ids: ["d-1"], workspaceId: "ws-1" },
        },
        result: {
          data: {
            deleteSharedDocuments: {
              success: true,
              deletedCount: 1,
              message: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useDeleteSharedDocuments(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.deleteDocuments(["d-1"]);
    });
    expect(out).toBe(true);
  });
});
