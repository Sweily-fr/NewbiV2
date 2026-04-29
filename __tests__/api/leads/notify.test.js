import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSendEmail, mockGuideLeadNotification } = vi.hoisted(() => ({
  mockSendEmail: vi.fn(),
  mockGuideLeadNotification: vi.fn(() => "<html>...</html>"),
}));

vi.mock("@/src/lib/resend", () => ({
  resend: { emails: { send: mockSendEmail } },
}));

vi.mock("@/src/lib/email-templates", () => ({
  emailTemplates: { guideLeadNotification: mockGuideLeadNotification },
}));

import { POST } from "@/app/api/leads/notify/route";

function makeReq({ body, headers = {} } = {}) {
  return new Request("http://localhost/api/leads/notify", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.INTERNAL_API_SECRET = "secret-123";
});

describe("POST /api/leads/notify", () => {
  it("returns 401 when secret missing", async () => {
    const res = await POST(makeReq({ body: {} }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret is wrong", async () => {
    const res = await POST(
      makeReq({ body: {}, headers: { "x-api-secret": "wrong" } }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when lead/recipients missing", async () => {
    const res = await POST(
      makeReq({ body: {}, headers: { "x-api-secret": "secret-123" } }),
    );
    expect(res.status).toBe(400);
  });

  it("sends notification email successfully", async () => {
    mockSendEmail.mockResolvedValueOnce({ id: "email1" });
    const res = await POST(
      makeReq({
        body: {
          lead: { firstName: "John", lastName: "Doe", email: "j@d.com" },
          recipients: ["dest@d.com"],
        },
        headers: { "x-api-secret": "secret-123" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("returns 500 on email send failure", async () => {
    mockSendEmail.mockRejectedValueOnce(new Error("Resend down"));
    const res = await POST(
      makeReq({
        body: {
          lead: { firstName: "J", lastName: "D" },
          recipients: ["a@b.com"],
        },
        headers: { "x-api-secret": "secret-123" },
      }),
    );
    expect(res.status).toBe(500);
  });
});
