import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import React from "react";

import {
  useDocumentAutomations,
  useDocumentAutomation,
  useDocumentAutomationLogs,
  useToggleDocumentAutomation,
  useTestDocumentAutomation,
  useRunDocumentAutomation,
  useDocumentsForAutomation,
  useProcessAutomationDocument,
  GET_AUTOMATION_PROGRESS,
} from "@/src/hooks/useDocumentAutomations";

// The hooks reference internal gql queries that are not exported. We redefine
// the same query strings here so MockedProvider can match them by AST.

const GET_DOCUMENT_AUTOMATIONS = gql`
  query GetDocumentAutomations($workspaceId: ID!) {
    documentAutomations(workspaceId: $workspaceId) {
      id
      name
      description
      workspaceId
      triggerType
      actionConfig {
        targetFolderId
        targetFolder {
          id
          name
          parentId
        }
        createSubfolder
        subfolderPattern
        filterYear
        filterClientId
        filterClientName
        documentNaming
        tags
        documentStatus
      }
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        lastDocumentId
        failedExecutions
      }
      matchingDocumentsCount
      createdAt
      updatedAt
    }
  }
`;

const GET_DOCUMENT_AUTOMATION = gql`
  query GetDocumentAutomation($workspaceId: ID!, $id: ID!) {
    documentAutomation(workspaceId: $workspaceId, id: $id) {
      id
      name
      description
      workspaceId
      triggerType
      actionConfig {
        targetFolderId
        targetFolder {
          id
          name
          parentId
        }
        createSubfolder
        subfolderPattern
        filterYear
        filterClientId
        filterClientName
        documentNaming
        tags
        documentStatus
      }
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        lastDocumentId
        failedExecutions
      }
      matchingDocumentsCount
      createdAt
      updatedAt
    }
  }
`;

const GET_DOCUMENT_AUTOMATION_LOGS = gql`
  query GetDocumentAutomationLogs(
    $workspaceId: ID!
    $automationId: ID
    $limit: Int
  ) {
    documentAutomationLogs(
      workspaceId: $workspaceId
      automationId: $automationId
      limit: $limit
    ) {
      id
      automationId
      sourceDocumentType
      sourceDocumentId
      sourceDocumentNumber
      sharedDocumentId
      targetFolderId
      targetFolderName
      status
      error
      fileName
      fileSize
      createdAt
    }
  }
`;

const TOGGLE_DOCUMENT_AUTOMATION = gql`
  mutation ToggleDocumentAutomation($workspaceId: ID!, $id: ID!) {
    toggleDocumentAutomation(workspaceId: $workspaceId, id: $id) {
      id
      isActive
      stats {
        totalExecutions
        lastExecutedAt
        failedExecutions
      }
    }
  }
`;

const TEST_DOCUMENT_AUTOMATION = gql`
  mutation TestDocumentAutomation($workspaceId: ID!, $id: ID!) {
    testDocumentAutomation(workspaceId: $workspaceId, id: $id)
  }
`;

const RUN_DOCUMENT_AUTOMATION = gql`
  mutation RunDocumentAutomation($workspaceId: ID!, $id: ID!) {
    runDocumentAutomation(workspaceId: $workspaceId, id: $id) {
      automationId
      status
      totalDocuments
      message
      successCount
      failCount
      firstError
    }
  }
`;

const GET_DOCUMENTS_FOR_AUTOMATION = gql`
  query GetDocumentsForAutomation($workspaceId: ID!, $automationId: ID!) {
    documentsForAutomation(
      workspaceId: $workspaceId
      automationId: $automationId
    ) {
      documentId
      documentType
      documentNumber
      prefix
      clientName
    }
  }
`;

const PROCESS_AUTOMATION_DOCUMENT = gql`
  mutation ProcessAutomationDocument(
    $workspaceId: ID!
    $automationId: ID!
    $documentId: ID!
    $documentType: String!
    $pdfBase64: String
  ) {
    processAutomationDocument(
      workspaceId: $workspaceId
      automationId: $automationId
      documentId: $documentId
      documentType: $documentType
      pdfBase64: $pdfBase64
    ) {
      success
      sharedDocumentId
      fileName
      error
    }
  }
`;

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
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useDocumentAutomations", () => {
  it("returns automations from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_DOCUMENT_AUTOMATIONS,
          variables: { workspaceId: "ws-1" },
        },
        result: {
          data: {
            documentAutomations: [
              {
                id: "a-1",
                name: "Auto 1",
                description: "",
                workspaceId: "ws-1",
                triggerType: "INVOICE_PAID",
                actionConfig: {
                  targetFolderId: null,
                  targetFolder: null,
                  createSubfolder: false,
                  subfolderPattern: null,
                  filterYear: null,
                  filterClientId: null,
                  filterClientName: null,
                  documentNaming: null,
                  tags: null,
                  documentStatus: null,
                },
                isActive: true,
                stats: {
                  totalExecutions: 0,
                  lastExecutedAt: null,
                  lastDocumentId: null,
                  failedExecutions: 0,
                },
                matchingDocumentsCount: 0,
                createdAt: "2026-04-15",
                updatedAt: "2026-04-15",
              },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useDocumentAutomations("ws-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.automations).toHaveLength(1);
    expect(result.current.automations[0].name).toBe("Auto 1");
  });

  it("skips query when workspaceId missing", () => {
    const { result } = renderHook(() => useDocumentAutomations(null), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.automations).toEqual([]);
  });
});

describe("useDocumentAutomation", () => {
  it("returns the single automation", async () => {
    const mocks = [
      {
        request: {
          query: GET_DOCUMENT_AUTOMATION,
          variables: { workspaceId: "ws-1", id: "a-1" },
        },
        result: {
          data: {
            documentAutomation: {
              id: "a-1",
              name: "Auto",
              description: "",
              workspaceId: "ws-1",
              triggerType: "INVOICE_PAID",
              actionConfig: {
                targetFolderId: null,
                targetFolder: null,
                createSubfolder: false,
                subfolderPattern: null,
                filterYear: null,
                filterClientId: null,
                filterClientName: null,
                documentNaming: null,
                tags: null,
                documentStatus: null,
              },
              isActive: true,
              stats: {
                totalExecutions: 0,
                lastExecutedAt: null,
                lastDocumentId: null,
                failedExecutions: 0,
              },
              matchingDocumentsCount: 0,
              createdAt: "2026-04-15",
              updatedAt: "2026-04-15",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useDocumentAutomation("ws-1", "a-1"), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.automation?.id).toBe("a-1");
  });

  it("skips when id missing", () => {
    const { result } = renderHook(() => useDocumentAutomation("ws-1", null), {
      wrapper: wrap([]),
    });
    expect(result.current.loading).toBe(false);
  });
});

describe("useDocumentAutomationLogs", () => {
  it("returns logs from the query", async () => {
    const mocks = [
      {
        request: {
          query: GET_DOCUMENT_AUTOMATION_LOGS,
          variables: { workspaceId: "ws-1", automationId: "a-1", limit: 50 },
        },
        result: {
          data: {
            documentAutomationLogs: [
              {
                id: "log-1",
                automationId: "a-1",
                sourceDocumentType: "invoice",
                sourceDocumentId: "doc-1",
                sourceDocumentNumber: "F-001",
                sharedDocumentId: null,
                targetFolderId: null,
                targetFolderName: null,
                status: "SUCCESS",
                error: null,
                fileName: "f.pdf",
                fileSize: 1024,
                createdAt: "2026-04-15",
              },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(
      () => useDocumentAutomationLogs("ws-1", "a-1", 50),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.logs[0].status).toBe("SUCCESS");
  });

  it("returns [] without data", () => {
    const { result } = renderHook(
      () => useDocumentAutomationLogs("ws-1", "a-1", 50),
      { wrapper: wrap([]) },
    );
    expect(result.current.logs).toEqual([]);
  });
});

describe("useToggleDocumentAutomation", () => {
  it("toggles isActive", async () => {
    const mocks = [
      {
        request: {
          query: TOGGLE_DOCUMENT_AUTOMATION,
          variables: { workspaceId: "ws-1", id: "a-1" },
        },
        result: {
          data: {
            toggleDocumentAutomation: {
              id: "a-1",
              isActive: false,
              stats: {
                totalExecutions: 0,
                lastExecutedAt: null,
                failedExecutions: 0,
              },
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useToggleDocumentAutomation(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.toggleAutomation("ws-1", "a-1");
    });
    expect(out.isActive).toBe(false);
  });
});

describe("useTestDocumentAutomation", () => {
  it("returns mutation result", async () => {
    const mocks = [
      {
        request: {
          query: TEST_DOCUMENT_AUTOMATION,
          variables: { workspaceId: "ws-1", id: "a-1" },
        },
        result: { data: { testDocumentAutomation: 5 } },
      },
    ];
    const { result } = renderHook(() => useTestDocumentAutomation(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.testAutomation("ws-1", "a-1");
    });
    expect(out).toBe(5);
  });
});

describe("useRunDocumentAutomation", () => {
  it("returns the run summary", async () => {
    const mocks = [
      {
        request: {
          query: RUN_DOCUMENT_AUTOMATION,
          variables: { workspaceId: "ws-1", id: "a-1" },
        },
        result: {
          data: {
            runDocumentAutomation: {
              automationId: "a-1",
              status: "completed",
              totalDocuments: 10,
              message: "OK",
              successCount: 9,
              failCount: 1,
              firstError: "x",
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useRunDocumentAutomation(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.runAutomation("ws-1", "a-1");
    });
    expect(out.successCount).toBe(9);
    expect(out.failCount).toBe(1);
  });
});

describe("useDocumentsForAutomation", () => {
  it("returns documents from lazy query", async () => {
    const mocks = [
      {
        request: {
          query: GET_DOCUMENTS_FOR_AUTOMATION,
          variables: { workspaceId: "ws-1", automationId: "a-1" },
        },
        result: {
          data: {
            documentsForAutomation: [
              {
                documentId: "doc-1",
                documentType: "invoice",
                documentNumber: "001",
                prefix: "F-",
                clientName: "Acme",
              },
            ],
          },
        },
      },
    ];
    const { result } = renderHook(() => useDocumentsForAutomation(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.fetchDocuments("ws-1", "a-1");
    });
    expect(out).toHaveLength(1);
    expect(out[0].clientName).toBe("Acme");
  });
});

describe("useProcessAutomationDocument", () => {
  it("processes a document and returns the result", async () => {
    const mocks = [
      {
        request: {
          query: PROCESS_AUTOMATION_DOCUMENT,
          variables: {
            workspaceId: "ws-1",
            automationId: "a-1",
            documentId: "doc-1",
            documentType: "invoice",
            pdfBase64: "base64-data",
          },
        },
        result: {
          data: {
            processAutomationDocument: {
              success: true,
              sharedDocumentId: "sd-1",
              fileName: "f.pdf",
              error: null,
            },
          },
        },
      },
    ];
    const { result } = renderHook(() => useProcessAutomationDocument(), {
      wrapper: wrap(mocks),
    });

    let out;
    await act(async () => {
      out = await result.current.processDocument(
        "ws-1",
        "a-1",
        "doc-1",
        "invoice",
        "base64-data",
      );
    });
    expect(out.success).toBe(true);
    expect(out.sharedDocumentId).toBe("sd-1");
  });
});

describe("GET_AUTOMATION_PROGRESS export", () => {
  it("is a valid gql document", () => {
    expect(GET_AUTOMATION_PROGRESS).toBeTruthy();
    expect(GET_AUTOMATION_PROGRESS.kind).toBe("Document");
  });
});
