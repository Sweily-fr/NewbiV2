import { describe, it, expect, vi, beforeEach } from "vitest";
import { ObjectId } from "mongodb";

const { findMock, deleteManyMock, logMock } = vi.hoisted(() => ({
  findMock: vi.fn(),
  deleteManyMock: vi.fn(),
  logMock: vi.fn(),
}));

vi.mock("@/src/lib/mongodb", () => ({
  mongoDb: {
    collection: () => ({
      find: (q) => ({ toArray: () => findMock(q) }),
      deleteMany: deleteManyMock,
    }),
  },
}));
vi.mock("@/src/lib/session-revocation-log", () => ({
  logSessionRevocation: logMock,
}));

import { revokeSessionsAfterPasswordChange } from "@/src/lib/revoke-sessions-after-password";

const USER = new ObjectId().toHexString();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("revokeSessionsAfterPasswordChange", () => {
  it("ferme les autres sessions, garde la courante et journalise", async () => {
    const others = [
      { _id: new ObjectId(), token: "autre-1" },
      { _id: new ObjectId(), token: "autre-2" },
    ];
    findMock.mockResolvedValue(others);
    deleteManyMock.mockResolvedValue({ deletedCount: 2 });

    const count = await revokeSessionsAfterPasswordChange({
      userId: USER,
      keepToken: "courant",
      trigger: "change_password",
    });

    expect(count).toBe(2);
    const query = findMock.mock.calls[0][0];
    expect(query.token).toEqual({ $ne: "courant" });
    expect(query.userId.$in.map(String)).toEqual([USER, USER]);
    expect(deleteManyMock).toHaveBeenCalledWith({
      _id: { $in: others.map((s) => s._id) },
    });
    expect(logMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mechanism: "password_change",
        trigger: "change_password",
        revokedSessions: others,
        keptToken: "courant",
      }),
    );
  });

  it("lien « mot de passe oublié » : toutes les sessions", async () => {
    findMock.mockResolvedValue([{ _id: new ObjectId(), token: "t" }]);
    deleteManyMock.mockResolvedValue({ deletedCount: 1 });
    await revokeSessionsAfterPasswordChange({
      userId: USER,
      trigger: "reset_password",
    });
    expect(findMock.mock.calls[0][0].token).toBeUndefined();
  });

  it("aucune autre session : rien supprimé ni journalisé", async () => {
    findMock.mockResolvedValue([]);
    expect(
      await revokeSessionsAfterPasswordChange({ userId: USER, keepToken: "c" }),
    ).toBe(0);
    expect(deleteManyMock).not.toHaveBeenCalled();
    expect(logMock).not.toHaveBeenCalled();
  });

  it("identifiant invalide : rien", async () => {
    expect(await revokeSessionsAfterPasswordChange({ userId: "x" })).toBe(0);
    expect(findMock).not.toHaveBeenCalled();
  });
});
