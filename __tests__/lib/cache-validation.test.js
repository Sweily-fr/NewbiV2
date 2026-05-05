import { describe, it, expect, vi, beforeEach } from "vitest";

const { cacheMock, apolloClientMock } = vi.hoisted(() => {
  const cacheMock = {
    policies: {
      typePolicies: {
        Query: {},
        Invoice: {},
        Quote: {},
        Client: {},
        Product: {},
        Board: {},
      },
    },
    writeQuery: vi.fn(),
    readQuery: vi.fn(),
    extract: vi.fn(() => ({ root: { x: 1 } })),
    evict: vi.fn(),
    gc: vi.fn(),
  };
  const apolloClientMock = {
    cache: cacheMock,
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-first" },
      mutate: { errorPolicy: "all" },
    },
  };
  return { cacheMock, apolloClientMock };
});

vi.mock("@/src/lib/apolloClient", () => ({
  apolloClient: apolloClientMock,
  getApolloClient: async () => apolloClientMock,
}));

import {
  validateCacheConfiguration,
  testCachePerformance,
  generateValidationReport,
} from "@/src/lib/cache-validation";
import defaultExport from "@/src/lib/cache-validation";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});

  // Reset mock return values
  cacheMock.readQuery.mockReturnValue({ testEntity: { id: "test-1" } });
});

describe("validateCacheConfiguration", () => {
  it("returns a results object with success/info/errors arrays", () => {
    const r = validateCacheConfiguration();
    expect(r).toMatchObject({
      success: expect.any(Boolean),
      errors: expect.any(Array),
      warnings: expect.any(Array),
      info: expect.any(Array),
    });
  });

  it("emits info messages for the standard configuration", () => {
    const r = validateCacheConfiguration();
    expect(r.info.some((i) => i.includes("Apollo Client initialisé"))).toBe(
      true,
    );
    expect(r.info.some((i) => i.includes("TypePolicies configurées"))).toBe(
      true,
    );
  });

  it("warns when a required typePolicy is missing", () => {
    cacheMock.policies.typePolicies = { Query: {} };
    const r = validateCacheConfiguration();
    expect(
      r.warnings.some((w) => w.includes("TypePolicy Invoice manquante")),
    ).toBe(true);

    // Restore
    cacheMock.policies.typePolicies = {
      Query: {},
      Invoice: {},
      Quote: {},
      Client: {},
      Product: {},
      Board: {},
    };
  });

  it("warns when no typePolicies are configured", () => {
    const orig = cacheMock.policies;
    cacheMock.policies = {};
    const r = validateCacheConfiguration();
    expect(r.warnings.some((w) => w.includes("Aucune typePolicy"))).toBe(true);
    cacheMock.policies = orig;
  });

  it("includes info about default options + cache policy", () => {
    const r = validateCacheConfiguration();
    expect(
      r.info.some((i) => i.includes("FetchPolicy par défaut: cache-first")),
    ).toBe(true);
    expect(r.info.some((i) => i.includes("ErrorPolicy mutations: all"))).toBe(
      true,
    );
  });
});

describe("testCachePerformance", () => {
  it("writes & reads a test query and returns timings", async () => {
    const r = await testCachePerformance();
    expect(r.success).toBe(true);
    expect(typeof r.timings.write).toBe("number");
    expect(typeof r.timings.read).toBe("number");
    expect(typeof r.timings.cacheSize).toBe("number");
    expect(cacheMock.writeQuery).toHaveBeenCalled();
    expect(cacheMock.readQuery).toHaveBeenCalled();
    expect(cacheMock.evict).toHaveBeenCalledWith({
      fieldName: "testEntity",
    });
    expect(cacheMock.gc).toHaveBeenCalled();
  });

  it("flags failure when cached data isn't found", async () => {
    cacheMock.readQuery.mockReturnValueOnce(null);
    const r = await testCachePerformance();
    expect(r.success).toBe(false);
    expect(r.errors.some((e) => e.includes("non trouvées dans le cache"))).toBe(
      true,
    );
  });

  it("flags failure when an error is thrown during the test", async () => {
    cacheMock.writeQuery.mockImplementationOnce(() => {
      throw new Error("write boom");
    });
    const r = await testCachePerformance();
    expect(r.success).toBe(false);
    expect(r.errors.some((e) => e.includes("write boom"))).toBe(true);
  });
});

describe("generateValidationReport", () => {
  it("returns an aggregated report", async () => {
    const r = await generateValidationReport();
    expect(r).toHaveProperty("configuration");
    expect(r).toHaveProperty("performance");
    expect(typeof r.overall).toBe("boolean");
    expect(console.log).toHaveBeenCalled();
  });
});

describe("default export", () => {
  it("exposes all named functions", () => {
    expect(defaultExport.validateCacheConfiguration).toBe(
      validateCacheConfiguration,
    );
    expect(defaultExport.testCachePerformance).toBe(testCachePerformance);
    expect(defaultExport.generateValidationReport).toBe(
      generateValidationReport,
    );
  });
});
