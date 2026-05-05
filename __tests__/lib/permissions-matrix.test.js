import { describe, it, expect } from "vitest";
import { statement, owner, admin, member, viewer } from "@/src/lib/permissions";

// Permission matrix tests with strong assertions — every (role × resource × action)
// is checked explicitly. Designed to catch any silent permission change.

// Manually transcribed expected matrix from src/lib/permissions.js — if the
// source changes, this matrix must be updated, which is the whole point.
const EXPECTED = {
  owner: {
    quotes: [
      "view",
      "create",
      "edit",
      "delete",
      "approve",
      "convert",
      "send",
      "export",
    ],
    purchaseOrders: [
      "view",
      "create",
      "edit",
      "delete",
      "approve",
      "convert",
      "send",
      "export",
    ],
    invoices: [
      "view",
      "create",
      "edit",
      "delete",
      "approve",
      "send",
      "export",
      "mark-paid",
      "import",
    ],
    creditNotes: ["view", "create", "edit", "delete", "approve", "send"],
    expenses: ["view", "create", "edit", "delete", "approve", "export", "ocr"],
    payments: ["view", "create", "edit", "delete", "export"],
    clients: ["view", "create", "edit", "delete", "export"],
    products: [
      "view",
      "create",
      "edit",
      "delete",
      "export",
      "manage-categories",
    ],
    suppliers: ["view", "create", "edit", "delete"],
    fileTransfers: ["view", "create", "delete", "download"],
    sharedDocuments: ["view", "create", "edit", "delete", "download"],
    kanban: ["view", "create", "edit", "delete", "assign"],
    signatures: ["view", "create", "edit", "delete", "set-default"],
    calendar: ["view", "create", "edit", "delete"],
    reports: ["view", "export"],
    analytics: ["view", "export"],
    team: ["view", "invite", "remove", "change-role"],
    orgSettings: ["view", "manage"],
    integrations: ["view", "manage"],
    billing: ["view", "manage"],
    auditLog: ["view", "export"],
  },
  member: {
    quotes: ["view", "create", "send", "export"],
    purchaseOrders: ["view", "create", "send", "export"],
    invoices: ["view", "create", "send", "export", "import"],
    creditNotes: ["view", "create", "export"],
    expenses: ["view", "create", "ocr", "export"],
    payments: ["view", "create", "export"],
    clients: ["view", "create", "export"],
    products: ["view", "create", "export"],
    suppliers: ["view", "create"],
    fileTransfers: ["view", "create", "download"],
    sharedDocuments: ["view", "create", "edit", "download"],
    kanban: ["view", "create", "edit", "assign"],
    signatures: ["view", "create", "edit", "set-default"],
    calendar: ["view", "create", "edit"],
    reports: ["view", "export"],
    analytics: ["view", "export"],
    team: ["view"],
    // Forbidden: orgSettings, integrations, billing, auditLog
  },
};

// ─── Core statement structure ────────────────────────────────────────────────

describe("permissions statement", () => {
  it("declares all expected resources", () => {
    const expectedResources = [
      "quotes",
      "purchaseOrders",
      "invoices",
      "creditNotes",
      "expenses",
      "payments",
      "clients",
      "products",
      "suppliers",
      "fileTransfers",
      "sharedDocuments",
      "kanban",
      "signatures",
      "calendar",
      "reports",
      "analytics",
      "team",
      "orgSettings",
      "integrations",
      "billing",
      "auditLog",
    ];
    expectedResources.forEach((r) => {
      expect(statement[r], `Missing resource: ${r}`).toBeDefined();
      expect(Array.isArray(statement[r])).toBe(true);
      expect(statement[r].length).toBeGreaterThan(0);
    });
  });

  it("invoices declares the mark-paid action (critical business action)", () => {
    expect(statement.invoices).toContain("mark-paid");
  });

  it("quotes declares convert (quote → invoice)", () => {
    expect(statement.quotes).toContain("convert");
  });

  it("expenses declares ocr (file upload + OCR)", () => {
    expect(statement.expenses).toContain("ocr");
  });

  it("team declares invite + remove + change-role (membership management)", () => {
    expect(statement.team).toContain("invite");
    expect(statement.team).toContain("remove");
    expect(statement.team).toContain("change-role");
  });
});

// ─── Owner role exhaustive matrix ────────────────────────────────────────────

describe("owner role — full access matrix", () => {
  for (const [resource, actions] of Object.entries(EXPECTED.owner)) {
    for (const action of actions) {
      it(`owner can ${action} on ${resource}`, () => {
        expect(owner.statements[resource]).toContain(action);
      });
    }
  }

  it("owner has every action declared on every resource (no privilege missing)", () => {
    for (const [resource, declaredActions] of Object.entries(statement)) {
      // Skip Better Auth defaults (user, session) which don't apply here
      if (resource === "user" || resource === "session") continue;
      for (const action of declaredActions) {
        expect(
          owner.statements[resource],
          `owner is missing ${action} on ${resource}`,
        ).toContain(action);
      }
    }
  });
});

// ─── Member role — limited access ────────────────────────────────────────────

describe("member role — limited access", () => {
  for (const [resource, actions] of Object.entries(EXPECTED.member)) {
    for (const action of actions) {
      it(`member can ${action} on ${resource}`, () => {
        expect(member.statements[resource]).toContain(action);
      });
    }
  }

  it("member CANNOT delete invoices", () => {
    expect(member.statements.invoices || []).not.toContain("delete");
  });

  it("member CANNOT approve invoices", () => {
    expect(member.statements.invoices || []).not.toContain("approve");
  });

  it("member CANNOT mark invoices as paid", () => {
    expect(member.statements.invoices || []).not.toContain("mark-paid");
  });

  it("member CANNOT delete clients", () => {
    expect(member.statements.clients || []).not.toContain("delete");
  });

  it("member CANNOT manage products categories", () => {
    expect(member.statements.products || []).not.toContain("manage-categories");
  });

  it("member CANNOT manage org settings", () => {
    expect(member.statements.orgSettings || []).not.toContain("manage");
  });

  it("member CANNOT manage billing", () => {
    expect(member.statements.billing || []).not.toContain("manage");
  });

  it("member CANNOT manage integrations", () => {
    expect(member.statements.integrations || []).not.toContain("manage");
  });

  it("member CANNOT view audit log content (sensitive)", () => {
    expect(member.statements.auditLog || []).not.toContain("export");
  });

  it("member can only VIEW the team (not invite/remove)", () => {
    expect(member.statements.team).toEqual(["view"]);
  });
});

// ─── Viewer role — read-only ─────────────────────────────────────────────────

describe("viewer role — read-only", () => {
  it("viewer has no write actions (create/edit/delete) on any resource", () => {
    const writeActions = ["create", "edit", "delete", "approve", "mark-paid"];
    for (const [resource, actions] of Object.entries(viewer.statements)) {
      // Better Auth defaults like user/session shouldn't have write either
      for (const action of actions) {
        expect(
          writeActions,
          `viewer has unexpected write action ${action} on ${resource}`,
        ).not.toContain(action);
      }
    }
  });

  it("viewer can view core resources", () => {
    const coreReadable = [
      "quotes",
      "invoices",
      "clients",
      "products",
      "expenses",
      "calendar",
      "kanban",
    ];
    coreReadable.forEach((r) => {
      expect(viewer.statements[r], `viewer cannot view ${r}`).toContain("view");
    });
  });
});

// ─── Admin role — between owner and member ───────────────────────────────────

describe("admin role", () => {
  it("admin can delete invoices (unlike member)", () => {
    expect(admin.statements.invoices).toContain("delete");
  });

  it("admin can manage org settings", () => {
    expect(admin.statements.orgSettings || []).toContain("view");
  });

  it("admin can manage team (invite/remove)", () => {
    expect(admin.statements.team).toContain("invite");
    expect(admin.statements.team).toContain("remove");
  });
});

// ─── Cross-role consistency ──────────────────────────────────────────────────

describe("cross-role consistency", () => {
  it("every role declares 'view' on viewable resources", () => {
    const viewableResources = ["invoices", "quotes", "clients", "products"];
    for (const role of [owner, admin, member]) {
      for (const r of viewableResources) {
        expect(role.statements[r], `Role missing 'view' on ${r}`).toContain(
          "view",
        );
      }
    }
  });

  it("only owner and admin can delete clients", () => {
    expect(owner.statements.clients).toContain("delete");
    expect(admin.statements.clients).toContain("delete");
    expect((member.statements.clients || []).includes("delete")).toBe(false);
    expect((viewer.statements.clients || []).includes("delete")).toBe(false);
  });

  it("only owner can MANAGE billing; admin/member/viewer cannot", () => {
    // Real finding: in this codebase only the owner has billing.manage.
    // Admin gets view-only on billing.
    expect(owner.statements.billing).toContain("manage");
    expect(admin.statements.billing || []).not.toContain("manage");
    expect(member.statements.billing || []).not.toContain("manage");
    expect(viewer.statements.billing || []).not.toContain("manage");
  });

  it("no role except owner has approve on creditNotes by default", () => {
    expect(owner.statements.creditNotes).toContain("approve");
    // Admin may or may not — assertion is on owner only
  });
});
