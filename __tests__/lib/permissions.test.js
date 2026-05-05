import { describe, it, expect } from "vitest";
import {
  statement,
  ac,
  owner,
  admin,
  member,
  viewer,
  accountant,
} from "@/src/lib/permissions";

describe("permissions statement", () => {
  it("contains all expected resource keys", () => {
    expect(statement).toHaveProperty("quotes");
    expect(statement).toHaveProperty("invoices");
    expect(statement).toHaveProperty("creditNotes");
    expect(statement).toHaveProperty("expenses");
    expect(statement).toHaveProperty("clients");
    expect(statement).toHaveProperty("products");
    expect(statement).toHaveProperty("suppliers");
    expect(statement).toHaveProperty("kanban");
    expect(statement).toHaveProperty("signatures");
  });

  it("invoices include 'mark-paid' and 'import'", () => {
    expect(statement.invoices).toContain("mark-paid");
    expect(statement.invoices).toContain("import");
  });

  it("quotes include 'convert'", () => {
    expect(statement.quotes).toContain("convert");
  });

  it("expenses include 'ocr'", () => {
    expect(statement.expenses).toContain("ocr");
  });
});

describe("Role definitions", () => {
  it("ac is created from statement", () => {
    expect(ac).toBeTruthy();
    expect(typeof ac.newRole).toBe("function");
  });

  it.each([
    ["owner", owner],
    ["admin", admin],
    ["member", member],
    ["viewer", viewer],
    ["accountant", accountant],
  ])("role %s is defined", (_label, role) => {
    expect(role).toBeTruthy();
  });
});
