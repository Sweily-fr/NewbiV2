import { describe, it, expect } from "vitest";
import {
  useSignatureData,
  SignatureProvider,
} from "@/src/hooks/use-signature-data";

// The source was renamed from .js to .jsx so the JSX `SignatureContext.Provider`
// component now parses correctly. This is a smoke test to ensure the module
// loads and exports the expected surface.
describe("useSignatureData module", () => {
  it("exports the useSignatureData hook", () => {
    expect(typeof useSignatureData).toBe("function");
  });

  it("exports the SignatureProvider component", () => {
    expect(typeof SignatureProvider).toBe("function");
  });
});
