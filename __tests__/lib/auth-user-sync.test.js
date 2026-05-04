import { describe, it, expect, vi, beforeEach } from "vitest";

const { updateUserMock } = vi.hoisted(() => ({
  updateUserMock: vi.fn(),
}));

vi.mock("@/src/lib/auth-client", () => ({
  updateUser: updateUserMock,
}));

import {
  syncUserAvatar,
  syncUserAvatarDeletion,
} from "@/src/lib/auth/user-sync";

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  updateUserMock.mockReset();
});

describe("syncUserAvatar", () => {
  it("returns true and calls updateUser with avatar URL when successful", async () => {
    updateUserMock.mockResolvedValue({});
    const out = await syncUserAvatar("https://cdn.example/img.png");
    expect(out).toBe(true);
    expect(updateUserMock).toHaveBeenCalledTimes(1);
    expect(updateUserMock.mock.calls[0][0]).toEqual({
      avatar: "https://cdn.example/img.png",
    });
  });

  it("passes onSuccess and onError callbacks", async () => {
    updateUserMock.mockResolvedValue({});
    await syncUserAvatar("https://cdn.example/img.png");
    const callbacks = updateUserMock.mock.calls[0][1];
    expect(typeof callbacks.onSuccess).toBe("function");
    expect(typeof callbacks.onError).toBe("function");
    // Trigger the callback paths to ensure they don't throw on success
    callbacks.onSuccess();
    expect(console.log).toHaveBeenCalled();
  });

  it("onError callback throws to propagate failure", async () => {
    updateUserMock.mockResolvedValue({});
    await syncUserAvatar("https://cdn.example/img.png");
    const callbacks = updateUserMock.mock.calls[0][1];
    expect(() => callbacks.onError(new Error("boom"))).toThrow("boom");
  });

  it("returns false when updateUser rejects", async () => {
    updateUserMock.mockRejectedValue(new Error("network down"));
    const out = await syncUserAvatar("https://cdn.example/img.png");
    expect(out).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("returns false on synchronous throws too", async () => {
    updateUserMock.mockImplementation(() => {
      throw new Error("sync boom");
    });
    const out = await syncUserAvatar("any");
    expect(out).toBe(false);
  });
});

describe("syncUserAvatarDeletion", () => {
  it("returns true and clears avatar via empty string", async () => {
    updateUserMock.mockResolvedValue({});
    const out = await syncUserAvatarDeletion();
    expect(out).toBe(true);
    expect(updateUserMock.mock.calls[0][0]).toEqual({ avatar: "" });
  });

  it("passes onSuccess and onError callbacks", async () => {
    updateUserMock.mockResolvedValue({});
    await syncUserAvatarDeletion();
    const callbacks = updateUserMock.mock.calls[0][1];
    callbacks.onSuccess();
    expect(console.log).toHaveBeenCalled();
    expect(() => callbacks.onError(new Error("nope"))).toThrow("nope");
  });

  it("returns false when updateUser rejects", async () => {
    updateUserMock.mockRejectedValue(new Error("server fail"));
    const out = await syncUserAvatarDeletion();
    expect(out).toBe(false);
    expect(console.error).toHaveBeenCalled();
  });

  it("returns false when updateUser throws synchronously", async () => {
    updateUserMock.mockImplementation(() => {
      throw new Error("crash");
    });
    const out = await syncUserAvatarDeletion();
    expect(out).toBe(false);
  });
});
