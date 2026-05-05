import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mocks for jspdf and modern-screenshot ───────────────────────────────────

const jspdfInstance = vi.hoisted(() => ({
  addPage: vi.fn(),
  addImage: vi.fn(),
  setFontSize: vi.fn(),
  setTextColor: vi.fn(),
  text: vi.fn(),
  output: vi.fn(() => new ArrayBuffer(64)),
}));

vi.mock("jspdf", () => ({
  default: vi.fn(function MockJsPDF() {
    return jspdfInstance;
  }),
}));

const domToJpegMock = vi.hoisted(() => vi.fn());
vi.mock("modern-screenshot", () => ({
  domToJpeg: domToJpegMock,
}));

// ─── Image polyfill ──────────────────────────────────────────────────────────
// We replace `Image` with a controllable constructor where each instance
// gets configurable width/height and synchronously fires onload after src is set.

let mockImageDimensions = { width: 794, height: 500 };

beforeEach(() => {
  jspdfInstance.addPage.mockClear();
  jspdfInstance.addImage.mockClear();
  jspdfInstance.setFontSize.mockClear();
  jspdfInstance.setTextColor.mockClear();
  jspdfInstance.text.mockClear();
  jspdfInstance.output.mockClear();
  jspdfInstance.output.mockImplementation(() => new ArrayBuffer(64));
  domToJpegMock.mockReset();
  domToJpegMock.mockResolvedValue("data:image/jpeg;base64,AAAA");

  mockImageDimensions = { width: 794, height: 500 };

  globalThis.Image = class {
    constructor() {
      this.width = mockImageDimensions.width;
      this.height = mockImageDimensions.height;
      this.onload = null;
      this.onerror = null;
    }
    set src(_value) {
      // Defer to next microtask so awaiters capture onload
      Promise.resolve().then(() => {
        if (this.onload) this.onload();
      });
    }
  };

  // Mock canvas getContext + toDataURL because happy-dom may not implement it
  globalThis.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  }));
  globalThis.HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => "data:image/jpeg;base64,page",
  );

  // Speed up the 500ms wait + image-load timeout.
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// Helper: a real DOM element from happy-dom
function makeElement({ withImages = 0, allComplete = true } = {}) {
  const el = document.createElement("div");
  for (let i = 0; i < withImages; i++) {
    const img = document.createElement("img");
    // happy-dom: assigning to `complete` is generally fine; we read it back
    Object.defineProperty(img, "complete", {
      configurable: true,
      get: () => allComplete,
    });
    el.appendChild(img);
  }
  return el;
}

// Helper: import after mocks are set up. We re-import to get a fresh reference.
async function loadModule() {
  // Bust module cache so each test starts clean
  vi.resetModules();
  return await import("@/src/utils/generatePDF");
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("generatePDFFromElement", () => {
  it("throws when no element is provided", async () => {
    const { generatePDFFromElement } = await loadModule();
    await expect(generatePDFFromElement(null)).rejects.toThrow(
      /Élément DOM non fourni/,
    );
    await expect(generatePDFFromElement(undefined)).rejects.toThrow();
  });

  it("invokes domToJpeg with the element and JPEG options", async () => {
    const { generatePDFFromElement } = await loadModule();
    const el = makeElement();
    const promise = generatePDFFromElement(el);
    // Fast-forward the 500ms internal delay
    await vi.advanceTimersByTimeAsync(600);
    const result = await promise;
    expect(domToJpegMock).toHaveBeenCalledTimes(1);
    const [target, opts] = domToJpegMock.mock.calls[0];
    expect(target).toBe(el);
    expect(opts).toMatchObject({
      width: 794,
      scale: 2,
      quality: 0.95,
    });
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("returns a Uint8Array buffer", async () => {
    const { generatePDFFromElement } = await loadModule();
    const promise = generatePDFFromElement(makeElement());
    await vi.advanceTimersByTimeAsync(600);
    const result = await promise;
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("calls jsPDF.addImage exactly once for a single-page document", async () => {
    mockImageDimensions = { width: 794, height: 500 }; // shorter than A4
    const { generatePDFFromElement } = await loadModule();
    const promise = generatePDFFromElement(makeElement());
    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(jspdfInstance.addImage).toHaveBeenCalledTimes(1);
    expect(jspdfInstance.addPage).not.toHaveBeenCalled();
  });

  it("paginates when document is taller than A4", async () => {
    // Make image very tall so imgHeightMM > 297
    mockImageDimensions = { width: 794, height: 5000 };
    const { generatePDFFromElement } = await loadModule();
    const promise = generatePDFFromElement(makeElement());
    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(jspdfInstance.addPage).toHaveBeenCalled();
    // Multiple addImage calls (one per page)
    expect(jspdfInstance.addImage.mock.calls.length).toBeGreaterThan(1);
  });

  it("adds page numbers when paginating", async () => {
    mockImageDimensions = { width: 794, height: 5000 };
    const { generatePDFFromElement } = await loadModule();
    const promise = generatePDFFromElement(makeElement());
    await vi.advanceTimersByTimeAsync(600);
    await promise;
    // setFontSize/setTextColor are called for the page number footer
    expect(jspdfInstance.setFontSize).toHaveBeenCalledWith(8);
    expect(jspdfInstance.setTextColor).toHaveBeenCalledWith(150);
    expect(jspdfInstance.text).toHaveBeenCalled();
    const textArgs = jspdfInstance.text.mock.calls.map((c) => c[0]);
    // At least one call uses the "n/m" page-number format
    expect(textArgs.some((s) => /^\d+\/\d+$/.test(s))).toBe(true);
  });

  it("does not add page numbers for a single-page document", async () => {
    mockImageDimensions = { width: 794, height: 500 };
    const { generatePDFFromElement } = await loadModule();
    const promise = generatePDFFromElement(makeElement());
    await vi.advanceTimersByTimeAsync(600);
    await promise;
    // Single page never invokes the footer text
    expect(jspdfInstance.text).not.toHaveBeenCalled();
  });

  it("waits for already-loaded images without hanging", async () => {
    const { generatePDFFromElement } = await loadModule();
    const el = makeElement({ withImages: 3, allComplete: true });
    const promise = generatePDFFromElement(el);
    await vi.advanceTimersByTimeAsync(600);
    const result = await promise;
    expect(result).toBeInstanceOf(Uint8Array);
    expect(domToJpegMock).toHaveBeenCalled();
  });

  it("waits for not-yet-loaded images via timeout fallback", async () => {
    const { generatePDFFromElement } = await loadModule();
    const el = makeElement({ withImages: 2, allComplete: false });
    const promise = generatePDFFromElement(el);
    // Push past the 3-second image timeout AND the 500ms render delay
    await vi.advanceTimersByTimeAsync(4000);
    const result = await promise;
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("creates a jsPDF instance with A4 portrait config", async () => {
    const jspdfModule = await import("jspdf");
    const { generatePDFFromElement } = await loadModule();
    const promise = generatePDFFromElement(makeElement());
    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(jspdfModule.default).toHaveBeenCalled();
    const config = jspdfModule.default.mock.calls.at(-1)[0];
    expect(config).toMatchObject({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });
  });

  it("propagates errors from domToJpeg", async () => {
    const { generatePDFFromElement } = await loadModule();
    domToJpegMock.mockRejectedValueOnce(new Error("capture failed"));
    const promise = generatePDFFromElement(makeElement());
    // Attach the rejection assertion BEFORE advancing timers so it is awaited
    const assertion = expect(promise).rejects.toThrow(/capture failed/);
    await vi.advanceTimersByTimeAsync(600);
    await assertion;
  });

  it("calls addImage with JPEG format and full A4 width", async () => {
    mockImageDimensions = { width: 794, height: 500 };
    const { generatePDFFromElement } = await loadModule();
    const promise = generatePDFFromElement(makeElement());
    await vi.advanceTimersByTimeAsync(600);
    await promise;
    const args = jspdfInstance.addImage.mock.calls[0];
    expect(args[1]).toBe("JPEG");
    expect(args[2]).toBe(0); // x
    expect(args[3]).toBe(0); // y
    expect(args[4]).toBe(210); // width = pdfWidth
  });

  it("requests output as 'arraybuffer'", async () => {
    const { generatePDFFromElement } = await loadModule();
    const promise = generatePDFFromElement(makeElement());
    await vi.advanceTimersByTimeAsync(600);
    await promise;
    expect(jspdfInstance.output).toHaveBeenCalledWith("arraybuffer");
  });

  it("works with an element that has no images", async () => {
    const { generatePDFFromElement } = await loadModule();
    const el = makeElement({ withImages: 0 });
    const promise = generatePDFFromElement(el);
    await vi.advanceTimersByTimeAsync(600);
    const result = await promise;
    expect(result).toBeInstanceOf(Uint8Array);
  });
});
