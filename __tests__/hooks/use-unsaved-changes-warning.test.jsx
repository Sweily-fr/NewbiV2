import { describe, it, expect, vi } from "vitest";
import { renderHook, render } from "@testing-library/react";

vi.mock("@/src/components/ui/sonner", () => ({
  toast: { error: vi.fn() },
}));

import { toast } from "@/src/components/ui/sonner";
import { useUnsavedChangesWarning } from "@/src/hooks/useUnsavedChangesWarning";
import { chunkLoadFallback } from "@/src/lib/chunk-load-fallback";

const fireBeforeUnload = () => {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
};

describe("useUnsavedChangesWarning", () => {
  it("demande confirmation avant de quitter quand il y a des modifications", () => {
    const { unmount } = renderHook(() => useUnsavedChangesWarning(true));
    expect(fireBeforeUnload().defaultPrevented).toBe(true);
    unmount();
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });

  it("laisse quitter sans modifications", () => {
    renderHook(() => useUnsavedChangesWarning(false));
    expect(fireBeforeUnload().defaultPrevented).toBe(false);
  });
});

describe("chunkLoadFallback", () => {
  it("referme la fenêtre et prévient au lieu de faire planter la page", () => {
    const Fallback = chunkLoadFallback(new Error("ChunkLoadError"));
    const onOpenChange = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(
      <Fallback onOpenChange={onOpenChange} onCancel={onCancel} />,
    );
    expect(container.innerHTML).toBe("");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onCancel).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledTimes(1);
  });
});
