import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const { loadAsyncMock } = vi.hoisted(() => ({ loadAsyncMock: vi.fn() }));

vi.mock("jszip", () => ({
  default: {
    loadAsync: loadAsyncMock,
  },
}));

import { useZipPreview } from "@/src/hooks/useZipPreview";

beforeEach(() => {
  loadAsyncMock.mockReset();
  vi.clearAllMocks();
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

  if (typeof URL.createObjectURL === "undefined") {
    URL.createObjectURL = vi.fn((b) => `blob://${b?.type || "x"}`);
    URL.revokeObjectURL = vi.fn();
  } else {
    vi.spyOn(URL, "createObjectURL").mockImplementation(
      (b) => `blob://${b?.type || "x"}`,
    );
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  }
});

describe("useZipPreview — guards", () => {
  it("does not fetch when disabled", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() =>
      useZipPreview({ enabled: false, zipUrl: "https://x/y.zip" }),
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.entries).toEqual([]);
    vi.unstubAllGlobals();
  });

  it("does not fetch when zipUrl is missing", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() =>
      useZipPreview({ enabled: true, zipUrl: null }),
    );

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe("useZipPreview — fetch + parse", () => {
  it("flags tooLarge=true when content-length exceeds maxSizeBytes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        if (init?.method === "HEAD") {
          return {
            ok: true,
            headers: {
              get: (h) => (h === "content-length" ? "999999999" : null),
            },
          };
        }
        return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) };
      }),
    );

    const { result } = renderHook(() =>
      useZipPreview({
        enabled: true,
        zipUrl: "https://x/y.zip",
        maxSizeBytes: 1024,
      }),
    );

    await waitFor(() => expect(result.current.tooLarge).toBe(true));
    expect(loadAsyncMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it.skip("returns error when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        if (init?.method === "HEAD") {
          return {
            ok: true,
            headers: { get: () => "0" },
          };
        }
        return { ok: false, status: 500 };
      }),
    );

    const { result } = renderHook(() =>
      useZipPreview({
        enabled: true,
        zipUrl: "https://x/y.zip",
      }),
    );

    await waitFor(() => expect(result.current.error).toMatch(/HTTP 500/));
    vi.unstubAllGlobals();
  });

  it.skip("parses ZIP entries and generates blob URLs for previewable items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url, init) => {
        if (init?.method === "HEAD") {
          return {
            ok: true,
            headers: { get: () => "0" },
          };
        }
        return {
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(8),
        };
      }),
    );

    // Mock JSZip's loadAsync return value with a `forEach` and `file` API
    const mockZip = {
      forEach: (cb) => {
        const entries = {
          "img.png": { dir: false, _data: { uncompressedSize: 100 } },
          "doc.pdf": { dir: false, _data: { uncompressedSize: 200 } },
          "readme.txt": { dir: false, _data: { uncompressedSize: 50 } },
          "folder/": { dir: true },
          "__MACOSX/.DS_Store": { dir: false }, // ignored
        };
        for (const [path, obj] of Object.entries(entries)) {
          cb(path, obj);
        }
      },
      file: (path) => {
        // Only previewables (img.png + doc.pdf) get extracted
        const map = {
          "img.png": {
            async: async () => new Blob(["png-bytes"], { type: "image/png" }),
          },
          "doc.pdf": {
            async: async () =>
              new Blob(["pdf-bytes"], { type: "application/pdf" }),
          },
        };
        return map[path] || null;
      },
    };
    loadAsyncMock.mockResolvedValue(mockZip);

    const { result } = renderHook(() =>
      useZipPreview({
        enabled: true,
        zipUrl: "https://x/y.zip",
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    // 3 non-folder, non-system entries
    expect(result.current.entries).toHaveLength(3);
    // Sort: previewables first → image, pdf (alphabetical), then txt
    expect(result.current.entries[0].name).toBe("doc.pdf");
    expect(result.current.entries[0].isPreviewable).toBe(true);
    expect(result.current.entries[1].name).toBe("img.png");
    expect(result.current.entries[2].name).toBe("readme.txt");
    expect(result.current.entries[2].isPreviewable).toBe(false);

    // Blob URLs only for previewable entries
    expect(Object.keys(result.current.blobUrls).sort()).toEqual([
      "doc.pdf",
      "img.png",
    ]);
  });
});

describe("useZipPreview.extractBlob", () => {
  it("returns null when zip not loaded", async () => {
    const { result } = renderHook(() =>
      useZipPreview({ enabled: false, zipUrl: null }),
    );
    const blob = await result.current.extractBlob("anything");
    expect(blob).toBeNull();
  });
});
