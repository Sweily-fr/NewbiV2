import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useRequiredWorkspace: () => ({ workspaceId: "ws-1" }),
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));

vi.mock(
  "@/app/dashboard/outils/transactions/components/transactions/utils/mappers",
  () => ({
    mapCategoryToEnum: (cat) => (cat ? cat.toUpperCase() : "OTHER"),
  }),
);

vi.mock("@/src/utils/dateFormatter", () => ({
  formatLocalDate: () => "2026-04-15",
}));

import { useExpense } from "@/src/hooks/useExpense";
import {
  CREATE_EXPENSE,
  ADD_EXPENSE_FILE,
  UPDATE_EXPENSE_OCR_METADATA,
  APPLY_OCR_DATA_TO_EXPENSE,
} from "@/src/graphql/mutations/expense";
import { GET_EXPENSES } from "@/src/graphql/queries/expense";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

const baseOcr = {
  id: "ocr-1",
  extractedText: "raw",
  financialAnalysis: {
    document_analysis: { document_type: "invoice", confidence: 0.95 },
    transaction_data: {
      vendor_name: "OVH",
      amount: "120",
      tax_amount: "20",
      tax_rate: "20",
      currency: "EUR",
      transaction_date: "2026-04-15",
      payment_date: "2026-04-16",
      document_number: "INV-1",
      payment_method: "card",
      category: "software",
      description: "Hosting",
    },
    extracted_fields: {
      vendor_siret: "12345678901234",
      vendor_address: "1 rue",
    },
  },
};

const baseFile = {
  cloudflareUrl: "https://r2.example.com/inv.pdf",
  fileName: "inv.pdf",
  fileSize: 1024,
  mimeType: "application/pdf",
};

describe("useExpense.createExpenseFromOcrData — happy path", () => {
  it.skip("creates expense, applies OCR metadata + file + applyOcrData and returns final result", async () => {
    const createMock = {
      request: {
        query: CREATE_EXPENSE,
        variables: {
          input: expect.any(Object),
        },
      },
      result: {
        data: {
          createExpense: { id: "exp-1", title: "Hosting", status: "PAID" },
        },
      },
    };

    const updateMetaMock = {
      request: {
        query: UPDATE_EXPENSE_OCR_METADATA,
        variables: { expenseId: "exp-1", metadata: expect.any(Object) },
      },
      result: {
        data: {
          updateExpenseOCRMetadata: { id: "exp-1", ocrApplied: false },
        },
      },
    };

    const addFileMock = {
      request: {
        query: ADD_EXPENSE_FILE,
        variables: { expenseId: "exp-1", input: expect.any(Object) },
      },
      result: { data: { addExpenseFile: { id: "exp-1" } } },
    };

    const applyMock = {
      request: {
        query: APPLY_OCR_DATA_TO_EXPENSE,
        variables: { expenseId: "exp-1" },
      },
      result: {
        data: {
          applyOCRDataToExpense: { id: "exp-1", ocrApplied: true },
        },
      },
    };

    const refetchMock = {
      request: {
        query: GET_EXPENSES,
        variables: { workspaceId: "ws-1", status: "PAID", page: 1, limit: 20 },
      },
      result: { data: { expenses: { items: [], totalItems: 0 } } },
    };
    const refetchMock2 = {
      request: {
        query: GET_EXPENSES,
        variables: { workspaceId: "ws-1", page: 1, limit: 20 },
      },
      result: { data: { expenses: { items: [], totalItems: 0 } } },
    };

    const { result } = renderHook(() => useExpense(), {
      wrapper: wrap([
        createMock,
        refetchMock,
        refetchMock2,
        updateMetaMock,
        addFileMock,
        applyMock,
      ]),
    });

    let out;
    await act(async () => {
      out = await result.current.createExpenseFromOcrData(baseOcr, baseFile);
    });

    // The hook returns the applyOCRDataToExpense result on the full path
    expect(out?.id).toBe("exp-1");
  });
});

describe("useExpense.createExpenseFromOcrData — partial paths", () => {
  it.skip("returns the created expense when financialAnalysis is missing", async () => {
    const createMock = {
      request: {
        query: CREATE_EXPENSE,
        variables: { input: expect.any(Object) },
      },
      result: {
        data: { createExpense: { id: "exp-2" } },
      },
    };
    const refetchMock = {
      request: {
        query: GET_EXPENSES,
        variables: { workspaceId: "ws-1", status: "PAID", page: 1, limit: 20 },
      },
      result: { data: { expenses: { items: [], totalItems: 0 } } },
    };
    const refetchMock2 = {
      request: {
        query: GET_EXPENSES,
        variables: { workspaceId: "ws-1", page: 1, limit: 20 },
      },
      result: { data: { expenses: { items: [], totalItems: 0 } } },
    };

    const { result } = renderHook(() => useExpense(), {
      wrapper: wrap([createMock, refetchMock, refetchMock2]),
    });

    let out;
    await act(async () => {
      out = await result.current.createExpenseFromOcrData(
        { extractedText: "x", financialAnalysis: null },
        { cloudflareUrl: null },
      );
    });
    expect(out?.id).toBe("exp-2");
  });

  it.skip("parses financialAnalysis when given as JSON string", async () => {
    const createMock = {
      request: {
        query: CREATE_EXPENSE,
        variables: { input: expect.any(Object) },
      },
      result: { data: { createExpense: { id: "exp-3" } } },
    };
    const updateMetaMock = {
      request: {
        query: UPDATE_EXPENSE_OCR_METADATA,
        variables: { expenseId: "exp-3", metadata: expect.any(Object) },
      },
      result: {
        data: { updateExpenseOCRMetadata: { id: "exp-3" } },
      },
    };
    const refetchMock = {
      request: {
        query: GET_EXPENSES,
        variables: { workspaceId: "ws-1", status: "PAID", page: 1, limit: 20 },
      },
      result: { data: { expenses: { items: [] } } },
    };
    const refetchMock2 = {
      request: {
        query: GET_EXPENSES,
        variables: { workspaceId: "ws-1", page: 1, limit: 20 },
      },
      result: { data: { expenses: { items: [] } } },
    };

    const ocrWithStringJSON = {
      ...baseOcr,
      financialAnalysis: JSON.stringify(baseOcr.financialAnalysis),
    };

    const { result } = renderHook(() => useExpense(), {
      wrapper: wrap([createMock, refetchMock, refetchMock2, updateMetaMock]),
    });

    let out;
    await act(async () => {
      out = await result.current.createExpenseFromOcrData(ocrWithStringJSON, {
        cloudflareUrl: null,
      });
    });
    expect(out?.id).toBe("exp-3");
  });
});

describe("useExpense.createExpenseFromOcrData — failure", () => {
  it("rethrows when CREATE_EXPENSE fails", async () => {
    const createMock = {
      request: {
        query: CREATE_EXPENSE,
        variables: { input: expect.any(Object) },
      },
      error: new Error("network"),
    };
    const refetchMock = {
      request: {
        query: GET_EXPENSES,
        variables: { workspaceId: "ws-1", status: "PAID", page: 1, limit: 20 },
      },
      result: { data: { expenses: { items: [] } } },
    };
    const refetchMock2 = {
      request: {
        query: GET_EXPENSES,
        variables: { workspaceId: "ws-1", page: 1, limit: 20 },
      },
      result: { data: { expenses: { items: [] } } },
    };

    const { result } = renderHook(() => useExpense(), {
      wrapper: wrap([createMock, refetchMock, refetchMock2]),
    });

    await expect(
      act(async () => {
        await result.current.createExpenseFromOcrData(baseOcr, baseFile);
      }),
    ).rejects.toThrow();
  });
});
