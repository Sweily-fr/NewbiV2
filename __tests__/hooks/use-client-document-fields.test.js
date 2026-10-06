import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@apollo/client", () => ({
  useQuery: vi.fn(),
  gql: (strings) => strings.join(""),
}));
vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: vi.fn(),
}));

import { useQuery } from "@apollo/client";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useWithClientDocumentFields } from "@/src/hooks/useClientDocumentFields";

const data = {
  number: "F-0001",
  client: {
    id: "c1",
    name: "ACME",
    documentFields: [{ label: "Ancien", value: "valeur enregistrée" }],
  },
};

describe("useWithClientDocumentFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspace.mockReturnValue({ workspaceId: "w1" });
    useQuery.mockReturnValue({ data: undefined });
  });

  it("remplace les champs enregistrés par ceux du client à jour", () => {
    useQuery.mockReturnValue({
      data: {
        clientDocumentFields: [
          { label: "Code client", value: "C-042", __typename: "X" },
        ],
      },
    });
    const { result } = renderHook(() => useWithClientDocumentFields(data));

    expect(result.current.client.documentFields).toEqual([
      { label: "Code client", value: "C-042" },
    ]);
    expect(result.current.client.name).toBe("ACME");
    expect(result.current.number).toBe("F-0001");
  });

  it("garde les champs enregistrés tant que l'API n'a pas répondu", () => {
    const { result } = renderHook(() => useWithClientDocumentFields(data));
    expect(result.current).toBe(data);
  });

  it("n'interroge pas l'API pour un document finalisé", () => {
    renderHook(() => useWithClientDocumentFields(data, false));
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it("n'interroge pas l'API sans client sélectionné", () => {
    const { result } = renderHook(() =>
      useWithClientDocumentFields({ number: "F-0002", client: null }),
    );
    expect(useQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
    expect(result.current.client).toBeNull();
  });

  it("ignore une réponse restée en cache quand le client n'est plus suivi", () => {
    useQuery.mockReturnValue({
      data: { clientDocumentFields: [{ label: "Code", value: "X" }] },
    });
    const { result } = renderHook(() => useWithClientDocumentFields(data, false));
    expect(result.current).toBe(data);
  });
});
