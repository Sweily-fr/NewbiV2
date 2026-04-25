import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { page } from "vitest/browser";

import { Button } from "@/src/components/ui/button";

/**
 * Runs in a REAL Chromium browser (Vitest Browser Mode).
 * You see the button render live, can inspect with devtools, take screenshots, etc.
 */

describe("Button — browser mode", () => {
  it("renders with the default variant", async () => {
    render(<Button>Cliquez-moi</Button>);

    const button = page.getByRole("button", { name: /cliquez-moi/i });
    await expect.element(button).toBeVisible();
  });

  it("fires onClick when the user clicks", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Envoyer</Button>);

    await page.getByRole("button", { name: /envoyer/i }).click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("applies the destructive variant style (red background)", async () => {
    render(<Button variant="destructive">Supprimer</Button>);

    const button = page.getByRole("button", { name: /supprimer/i });
    const element = button.element();
    // Destructive variant uses a red color — either the Tailwind token or hex.
    expect(element.className).toMatch(/E5484D|destructive/);
  });

  it("is disabled when the disabled prop is set", async () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );

    const button = page.getByRole("button", { name: /disabled/i });
    await expect.element(button).toBeDisabled();

    // Clicks on a disabled button must not fire the handler
    await button.click({ force: true }).catch(() => {});
    expect(handleClick).not.toHaveBeenCalled();
  });
});
