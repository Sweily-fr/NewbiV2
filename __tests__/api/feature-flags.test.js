// @vitest-environment node
import { describe, it, expect, afterEach } from "vitest";

const originalFlag = process.env.ENABLE_APP_TRIAL;

afterEach(() => {
  if (originalFlag === undefined) delete process.env.ENABLE_APP_TRIAL;
  else process.env.ENABLE_APP_TRIAL = originalFlag;
});

describe("GET /api/feature-flags", () => {
  it("returns appTrialEnabled=false when env var is unset", async () => {
    delete process.env.ENABLE_APP_TRIAL;
    const { GET } = await import("@/app/api/feature-flags/route");
    const response = await GET();
    const body = await response.json();
    expect(body.appTrialEnabled).toBe(false);
  });

  it("returns appTrialEnabled=true when env var is exactly 'true'", async () => {
    process.env.ENABLE_APP_TRIAL = "true";
    const { GET } = await import("@/app/api/feature-flags/route");
    const response = await GET();
    const body = await response.json();
    expect(body.appTrialEnabled).toBe(true);
  });

  it("returns appTrialEnabled=false for non-'true' values", async () => {
    process.env.ENABLE_APP_TRIAL = "1";
    const { GET } = await import("@/app/api/feature-flags/route");
    const response = await GET();
    const body = await response.json();
    expect(body.appTrialEnabled).toBe(false);
  });
});
