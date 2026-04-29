import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/documents/download/route";

function makeReq({
  method = "POST",
  url = "http://localhost/api/documents/download",
  body,
  headers = {},
} = {}) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/documents/download", () => {
  it("returns 400 if data missing", async () => {
    const res = await POST(makeReq({ body: { type: "invoice" } }));
    expect(res.status).toBe(400);
  });

  it("returns 400 if type missing", async () => {
    const res = await POST(makeReq({ body: { data: {} } }));
    expect(res.status).toBe(400);
  });

  it("returns success on happy path", async () => {
    const res = await POST(
      makeReq({
        body: { data: { number: "INV-1" }, type: "invoice", filename: "f.pdf" },
      }),
    );
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(j.success).toBe(true);
    expect(j.type).toBe("invoice");
    expect(j.filename).toBe("f.pdf");
  });

  it("returns 500 on invalid JSON", async () => {
    const req = new Request("http://localhost/api/documents/download", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
