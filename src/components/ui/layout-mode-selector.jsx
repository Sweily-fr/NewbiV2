import { FlipHorizontalIcon, FlipVerticalIcon } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export default function LayoutModeSelector({ className = "" }) {
  return (
    <div
      className={cn(
        "inline-flex -space-x-px rounded-md shadow-xs rtl:space-x-reverse",
        className
      )}
    >
      <Button
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10 flex-1 h-8"
        variant="outline"
        aria-label="Flip Horizontal"
      >
        <FlipHorizontalIcon size={16} aria-hidden="true" />
      </Button>
      <Button
        className="rounded-none shadow-none first:rounded-s-md last:rounded-e-md focus-visible:z-10 flex-1 h-8"
        variant="outline"
        aria-label="Flip Vertical"
      >
        <FlipVerticalIcon size={16} aria-hidden="true" />
      </Button>
    </div>
  );
}
