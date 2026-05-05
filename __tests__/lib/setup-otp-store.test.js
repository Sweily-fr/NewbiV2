import { describe, it, expect, vi, beforeEach } from "vitest";

const collection = vi.hoisted(() => ({
  updateOne: vi.fn(),
  findOne: vi.fn(),
  deleteOne: vi.fn(),
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: vi.fn(() => collection),
  },
}));

import { setupOtpStore } from "@/src/lib/setup-otp-store";

beforeEach(() => {
  collection.updateOne.mockReset();
  collection.findOne.mockReset();
  collection.deleteOne.mockReset();
});

describe("setupOtpStore.set", () => {
  it("upserts the OTP entry with expiry derived from ttlMs", async () => {
    collection.updateOne.mockResolvedValue({ acknowledged: true });
    const before = Date.now();
    await setupOtpStore.set("user-1", 123456, 60_000);

    expect(collection.updateOne).toHaveBeenCalledTimes(1);
    const [filter, update, opts] = collection.updateOne.mock.calls[0];
    expect(filter).toEqual({ userId: "user-1" });
    expect(update.$set.userId).toBe("user-1");
    expect(update.$set.otp).toBe("123456"); // stored as string
    expect(update.$set.expiresAt).toBeInstanceOf(Date);
    expect(update.$set.expiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 60_000 - 5,
    );
    expect(opts).toEqual({ upsert: true });
  });

  it("coerces non-string OTP to string", async () => {
    collection.updateOne.mockResolvedValue({});
    await setupOtpStore.set("u", 999_000, 1000);
    expect(collection.updateOne.mock.calls[0][1].$set.otp).toBe("999000");
  });
});

describe("setupOtpStore.verify", () => {
  it("returns false when no OTP exists for the user", async () => {
    collection.findOne.mockResolvedValue(null);
    expect(await setupOtpStore.verify("u", "123456")).toBe(false);
    expect(collection.deleteOne).not.toHaveBeenCalled();
  });

  it("returns false AND deletes the entry when expired", async () => {
    collection.findOne.mockResolvedValue({
      userId: "u",
      otp: "123456",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await setupOtpStore.verify("u", "123456")).toBe(false);
    expect(collection.deleteOne).toHaveBeenCalledWith({ userId: "u" });
  });

  it("returns true and deletes the entry on a correct code", async () => {
    collection.findOne.mockResolvedValue({
      userId: "u",
      otp: "123456",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await setupOtpStore.verify("u", "123456")).toBe(true);
    expect(collection.deleteOne).toHaveBeenCalledWith({ userId: "u" });
  });

  it("trims whitespace before comparing", async () => {
    collection.findOne.mockResolvedValue({
      userId: "u",
      otp: "123456",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await setupOtpStore.verify("u", "  123456  ")).toBe(true);
  });

  it("returns false on a wrong code AND keeps the entry (typo tolerance)", async () => {
    collection.findOne.mockResolvedValue({
      userId: "u",
      otp: "123456",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await setupOtpStore.verify("u", "999999")).toBe(false);
    expect(collection.deleteOne).not.toHaveBeenCalled();
  });

  it("compares as strings when called with a numeric code", async () => {
    collection.findOne.mockResolvedValue({
      userId: "u",
      otp: "123456",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await setupOtpStore.verify("u", 123456)).toBe(true);
  });
});
