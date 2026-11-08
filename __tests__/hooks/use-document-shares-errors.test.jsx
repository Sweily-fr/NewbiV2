import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const mutate = vi.hoisted(() => vi.fn());

vi.mock("@apollo/client", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: () => ({ data: { documentShares: [] }, loading: false }),
  useMutation: () => [mutate, { loading: false }],
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));

import { useDocumentShares } from "@/src/hooks/useDocumentShares";

describe("useDocumentShares", () => {
  it("rejette quand l'API refuse, malgré errorPolicy « all »", async () => {
    mutate.mockResolvedValueOnce({
      data: null,
      errors: [
        { message: "Le mot de passe doit contenir entre 6 et 72 caractères" },
      ],
    });
    const { result } = renderHook(() => useDocumentShares());
    await expect(
      result.current.createShare({ folderIds: ["f-1"], password: "abc" }),
    ).rejects.toThrow("Le mot de passe doit contenir entre 6 et 72 caractères");
    expect(mutate).toHaveBeenCalledWith({
      variables: {
        workspaceId: "ws-1",
        input: { folderIds: ["f-1"], password: "abc" },
      },
    });
  });

  it("résout quand la mutation passe", async () => {
    mutate.mockResolvedValueOnce({
      data: { createDocumentShare: { id: "a" } },
    });
    const { result } = renderHook(() => useDocumentShares());
    await expect(
      result.current.createShare({ folderIds: ["f-1"] }),
    ).resolves.toMatchObject({ data: { createDocumentShare: { id: "a" } } });
  });
});
