import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CACHE_POLICIES,
  getOptimizedPolicy,
  invalidateCache,
  preloadCriticalData,
  optimizedMutate,
} from "@/src/lib/cache-utils";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("CACHE_POLICIES", () => {
  it("exposes named policies", () => {
    expect(CACHE_POLICIES).toHaveProperty("STATIC");
    expect(CACHE_POLICIES).toHaveProperty("CRITICAL");
    expect(CACHE_POLICIES).toHaveProperty("REALTIME");
    expect(CACHE_POLICIES).toHaveProperty("READONLY");
  });

  it("STATIC uses cache-first", () => {
    expect(CACHE_POLICIES.STATIC.fetchPolicy).toBe("cache-first");
  });

  it("REALTIME uses network-only as next policy", () => {
    expect(CACHE_POLICIES.REALTIME.nextFetchPolicy).toBe("network-only");
  });
});

describe("getOptimizedPolicy", () => {
  it("organization → STATIC", () => {
    expect(getOptimizedPolicy("organization")).toEqual(CACHE_POLICIES.STATIC);
  });

  it("lists + table context → CRITICAL", () => {
    expect(getOptimizedPolicy("lists", "table")).toEqual(
      CACHE_POLICIES.CRITICAL,
    );
  });

  it("lists + non-table context → STATIC", () => {
    expect(getOptimizedPolicy("lists", "form")).toEqual(CACHE_POLICIES.STATIC);
  });

  it("forms → STATIC", () => {
    expect(getOptimizedPolicy("forms")).toEqual(CACHE_POLICIES.STATIC);
  });

  it("stats → CRITICAL", () => {
    expect(getOptimizedPolicy("stats")).toEqual(CACHE_POLICIES.CRITICAL);
  });

  it("settings → STATIC", () => {
    expect(getOptimizedPolicy("settings")).toEqual(CACHE_POLICIES.STATIC);
  });

  it("unknown dataType → STATIC fallback", () => {
    expect(getOptimizedPolicy("unknown")).toEqual(CACHE_POLICIES.STATIC);
  });
});

describe("invalidateCache", () => {
  it("evicts each pattern from the apollo cache and runs gc", () => {
    const evict = vi.fn();
    const gc = vi.fn();
    const apolloClient = { cache: { evict, gc } };

    invalidateCache(apolloClient, ["clients", "invoices"]);
    expect(evict).toHaveBeenCalledTimes(2);
    expect(evict).toHaveBeenCalledWith({
      fieldName: "clients",
      broadcast: false,
    });
    expect(gc).toHaveBeenCalled();
  });

  it("logs a warning when evict throws but does not propagate", () => {
    const apolloClient = {
      cache: {
        evict: vi.fn().mockImplementation(() => {
          throw new Error("evict fail");
        }),
        gc: vi.fn(),
      },
    };
    expect(() => invalidateCache(apolloClient, ["x"])).not.toThrow();
  });
});

describe("preloadCriticalData", () => {
  it("calls apolloClient.query for each query", async () => {
    const apolloClient = { query: vi.fn().mockResolvedValue({ data: {} }) };
    const queries = [
      { query: "Q1", variables: { id: 1 } },
      { query: "Q2", variables: { id: 2 } },
    ];
    await preloadCriticalData(apolloClient, queries);
    expect(apolloClient.query).toHaveBeenCalledTimes(2);
    expect(apolloClient.query.mock.calls[0][0]).toMatchObject({
      query: "Q1",
      fetchPolicy: "network-only",
    });
  });

  it("uses custom policy when provided", async () => {
    const apolloClient = { query: vi.fn().mockResolvedValue({}) };
    await preloadCriticalData(apolloClient, [
      { query: "Q1", policy: "cache-first" },
    ]);
    expect(apolloClient.query.mock.calls[0][0].fetchPolicy).toBe("cache-first");
  });

  it("does not throw when a query rejects", async () => {
    const apolloClient = {
      query: vi.fn().mockRejectedValue(new Error("oops")),
    };
    await expect(
      preloadCriticalData(apolloClient, [{ query: "Q1" }]),
    ).resolves.toBeUndefined();
  });
});

describe("optimizedMutate", () => {
  it("calls mutate with the merged options", async () => {
    const apolloClient = {
      mutate: vi.fn().mockResolvedValue({ data: { x: 1 } }),
      cache: { evict: vi.fn(), gc: vi.fn() },
    };

    await optimizedMutate(apolloClient, "MUTATION", {
      variables: { input: 1 },
      refetchQueries: ["Q1"],
    });

    expect(apolloClient.mutate).toHaveBeenCalled();
    const opts = apolloClient.mutate.mock.calls[0][0];
    expect(opts.mutation).toBe("MUTATION");
    expect(opts.refetchQueries).toEqual([
      { query: "Q1", variables: { input: 1 } },
    ]);
    expect(opts.awaitRefetchQueries).toBe(false);
    expect(opts.errorPolicy).toBe("all");
  });

  it("invalidates cache for invalidateQueries", async () => {
    const evict = vi.fn();
    const gc = vi.fn();
    const apolloClient = {
      mutate: vi.fn().mockResolvedValue({}),
      cache: { evict, gc },
    };

    await optimizedMutate(apolloClient, "M", {
      invalidateQueries: ["clients"],
    });
    expect(evict).toHaveBeenCalledWith({
      fieldName: "clients",
      broadcast: false,
    });
  });
});
