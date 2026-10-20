import { describe, it, expect } from "vitest";
import { normalizeAccountPhone } from "@/src/lib/account-phone";

describe("normalizeAccountPhone", () => {
  it.each([
    "+33 6 12 34 56 78",
    "06.12.34.56.78",
    "06-12-34-56-78",
    "+44 (0)20 7946 0958",
  ])("« %s » est accepté tel quel", (phone) => {
    expect(normalizeAccountPhone(`  ${phone} `)).toBe(phone);
  });

  it.each([
    "",
    "abc",
    "12345",
    "+33 6 12 34 56 78 90 12 34",
    "06 12 34 56 78<script>",
    null,
    42,
  ])("« %s » est refusé", (phone) => {
    expect(normalizeAccountPhone(phone)).toBeNull();
  });
});
