import { describe, it, expect, vi, beforeEach } from "vitest";

const { puppeteerMock, chromiumMock, existsSyncMock } = vi.hoisted(() => ({
  puppeteerMock: { launch: vi.fn() },
  chromiumMock: {
    args: ["--mock-arg"],
    defaultViewport: { width: 1280, height: 720 },
    executablePath: vi.fn().mockResolvedValue("/var/task/chromium"),
  },
  existsSyncMock: vi.fn(),
}));

vi.mock("puppeteer-core", () => ({ default: puppeteerMock }));
vi.mock("@sparticuz/chromium", () => ({ default: chromiumMock }));
vi.mock("fs", () => ({
  default: { existsSync: existsSyncMock },
  existsSync: existsSyncMock,
}));

import { launchBrowser } from "@/src/lib/puppeteer";

beforeEach(() => {
  puppeteerMock.launch.mockReset();
  existsSyncMock.mockReset();
  chromiumMock.executablePath.mockClear();
  delete process.env.VERCEL;
  delete process.env.PUPPETEER_EXECUTABLE_PATH;
  delete process.env.CHROME_PATH;
});

describe("launchBrowser (Vercel)", () => {
  it("launches with @sparticuz/chromium when running on Vercel", async () => {
    process.env.VERCEL = "1";
    puppeteerMock.launch.mockResolvedValue({ name: "vercel-browser" });

    const browser = await launchBrowser();

    expect(browser).toEqual({ name: "vercel-browser" });
    expect(chromiumMock.executablePath).toHaveBeenCalled();
    const opts = puppeteerMock.launch.mock.calls[0][0];
    expect(opts.headless).toBe(true);
    expect(opts.args).toBe(chromiumMock.args);
    expect(opts.executablePath).toBe("/var/task/chromium");
  });
});

describe("launchBrowser (local)", () => {
  it("uses PUPPETEER_EXECUTABLE_PATH if set and existing", async () => {
    process.env.PUPPETEER_EXECUTABLE_PATH = "/custom/chrome";
    existsSyncMock.mockImplementation((p) => p === "/custom/chrome");
    puppeteerMock.launch.mockResolvedValue({ name: "custom" });

    await launchBrowser();
    const opts = puppeteerMock.launch.mock.calls[0][0];
    expect(opts.executablePath).toBe("/custom/chrome");
    expect(opts.args).toContain("--no-sandbox");
    expect(opts.args).toContain("--disable-gpu");
  });

  it("uses CHROME_PATH as fallback when PUPPETEER_EXECUTABLE_PATH is not set", async () => {
    process.env.CHROME_PATH = "/opt/chrome";
    existsSyncMock.mockImplementation((p) => p === "/opt/chrome");
    puppeteerMock.launch.mockResolvedValue({});

    await launchBrowser();
    expect(puppeteerMock.launch.mock.calls[0][0].executablePath).toBe(
      "/opt/chrome",
    );
  });

  it("scans the platform's known Chrome paths when no env override is set", async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, "platform", { value: "darwin" });
    existsSyncMock.mockImplementation(
      (p) =>
        p === "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    );
    puppeteerMock.launch.mockResolvedValue({});

    await launchBrowser();
    expect(puppeteerMock.launch.mock.calls[0][0].executablePath).toBe(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    );

    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("throws a French error message when no browser is found", async () => {
    existsSyncMock.mockReturnValue(false);
    await expect(launchBrowser()).rejects.toThrow(
      /Aucun navigateur Chromium trouvé/,
    );
    expect(puppeteerMock.launch).not.toHaveBeenCalled();
  });

  it("passes headless: true and the standard sandbox-disable flags", async () => {
    process.env.CHROME_PATH = "/x";
    existsSyncMock.mockReturnValue(true);
    puppeteerMock.launch.mockResolvedValue({});

    await launchBrowser();
    const opts = puppeteerMock.launch.mock.calls[0][0];
    expect(opts.headless).toBe(true);
    expect(opts.args).toEqual(
      expect.arrayContaining([
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ]),
    );
    expect(opts.defaultViewport).toBe(chromiumMock.defaultViewport);
  });
});
