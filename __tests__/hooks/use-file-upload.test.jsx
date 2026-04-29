import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFileUpload, formatBytes } from "@/src/hooks/use-file-upload";

// Helper to make a File mock that doesn't need the full DOM File API
const makeFile = (name, size, type = "image/png") => {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("formatBytes", () => {
  it("returns '0 Bytes' for 0", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("formats KB correctly", () => {
    expect(formatBytes(1024)).toBe("1KB");
  });

  it("formats MB correctly", () => {
    expect(formatBytes(1024 * 1024)).toBe("1MB");
  });

  it("respects decimals param", () => {
    expect(formatBytes(1500, 0)).toBe("1KB");
    expect(formatBytes(1500, 2)).toBe("1.46KB");
  });

  it("formats GB", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1GB");
  });
});

describe("useFileUpload", () => {
  it("starts with empty state", () => {
    const { result } = renderHook(() => useFileUpload());
    const [state] = result.current;
    expect(state.files).toEqual([]);
    expect(state.isDragging).toBe(false);
    expect(state.errors).toEqual([]);
  });

  it("addFiles adds a single file (multiple=false)", () => {
    const { result } = renderHook(() => useFileUpload());
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("a.png", 1024)]));

    const [state] = result.current;
    expect(state.files).toHaveLength(1);
    expect(state.files[0].file.name).toBe("a.png");
  });

  it("addFiles replaces previous file in single mode", () => {
    const { result } = renderHook(() => useFileUpload({ multiple: false }));
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("a.png", 100)]));
    act(() => actions.addFiles([makeFile("b.png", 200)]));

    const [state] = result.current;
    expect(state.files).toHaveLength(1);
    expect(state.files[0].file.name).toBe("b.png");
  });

  it("multiple=true accumulates files", () => {
    const { result } = renderHook(() => useFileUpload({ multiple: true }));
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("a.png", 100)]));
    act(() => actions.addFiles([makeFile("b.png", 200)]));

    const [state] = result.current;
    expect(state.files).toHaveLength(2);
  });

  it("rejects files exceeding maxSize", () => {
    const { result } = renderHook(() =>
      useFileUpload({ maxSize: 500, multiple: true }),
    );
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("big.png", 1000)]));

    const [state] = result.current;
    expect(state.files).toHaveLength(0);
    expect(state.errors.length).toBeGreaterThan(0);
    expect(state.errors[0]).toMatch(/exceed/i);
  });

  it("rejects files when accept doesn't match", () => {
    const { result } = renderHook(() =>
      useFileUpload({ accept: "image/jpeg", multiple: true }),
    );
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("doc.pdf", 100, "application/pdf")]));
    const [state] = result.current;
    expect(state.files).toHaveLength(0);
    expect(state.errors.length).toBeGreaterThan(0);
  });

  it("accepts files matching wildcard accept", () => {
    const { result } = renderHook(() =>
      useFileUpload({ accept: "image/*", multiple: true }),
    );
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("a.png", 100, "image/png")]));
    const [state] = result.current;
    expect(state.files).toHaveLength(1);
  });

  it("removeFile removes by id", () => {
    const { result } = renderHook(() => useFileUpload({ multiple: true }));
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("a.png", 100)]));
    const [stateAfterAdd] = result.current;
    const id = stateAfterAdd.files[0].id;

    act(() => actions.removeFile(id));
    const [state] = result.current;
    expect(state.files).toHaveLength(0);
  });

  it("clearFiles wipes everything", () => {
    const { result } = renderHook(() => useFileUpload({ multiple: true }));
    const [, actions] = result.current;
    act(() =>
      actions.addFiles([makeFile("a.png", 100), makeFile("b.png", 200)]),
    );
    act(() => actions.clearFiles());
    expect(result.current[0].files).toHaveLength(0);
  });

  it("clearErrors only resets errors", () => {
    const { result } = renderHook(() =>
      useFileUpload({ maxSize: 50, multiple: true }),
    );
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("big.png", 100)]));
    expect(result.current[0].errors.length).toBeGreaterThan(0);

    act(() => actions.clearErrors());
    expect(result.current[0].errors).toEqual([]);
  });

  it("respects maxFiles in multiple mode", () => {
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true, maxFiles: 2 }),
    );
    const [, actions] = result.current;
    act(() =>
      actions.addFiles([
        makeFile("a.png", 100),
        makeFile("b.png", 100),
        makeFile("c.png", 100),
      ]),
    );
    const [state] = result.current;
    expect(state.errors.length).toBeGreaterThan(0);
  });

  it("calls onFilesChange when files change", () => {
    const onFilesChange = vi.fn();
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true, onFilesChange }),
    );
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("a.png", 100)]));
    expect(onFilesChange).toHaveBeenCalled();
  });

  it("calls onFilesAdded for newly added files only", () => {
    const onFilesAdded = vi.fn();
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true, onFilesAdded }),
    );
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("a.png", 100)]));
    expect(onFilesAdded).toHaveBeenCalledTimes(1);
    expect(onFilesAdded.mock.calls[0][0]).toHaveLength(1);
  });

  it("hydrates with initialFiles", () => {
    const initialFiles = [
      {
        id: "remote-1",
        name: "remote.png",
        size: 1024,
        type: "image/png",
        url: "https://r2.example.com/remote.png",
      },
    ];
    const { result } = renderHook(() =>
      useFileUpload({ initialFiles, multiple: true }),
    );
    const [state] = result.current;
    expect(state.files).toHaveLength(1);
    expect(state.files[0].id).toBe("remote-1");
  });

  it("calls onFilesChange on remove", () => {
    const onFilesChange = vi.fn();
    const { result } = renderHook(() =>
      useFileUpload({ multiple: true, onFilesChange }),
    );
    const [, actions] = result.current;
    act(() => actions.addFiles([makeFile("a.png", 100)]));
    onFilesChange.mockClear();
    const id = result.current[0].files[0].id;
    act(() => actions.removeFile(id));
    expect(onFilesChange).toHaveBeenCalled();
  });
});
