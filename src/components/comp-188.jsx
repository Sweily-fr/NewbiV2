import { useId } from "react";

import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";

export default function Component() {
  const id = useId();
  return (
    <div className="border-input has-data-[state=checked]:border-primary/50 relative flex w-full items-start gap-2 rounded-md border p-4 shadow-xs outline-none">
      <Switch
        id={id}
        className="order-1 h-4 w-6 after:absolute after:inset-0 [&_span]:size-3 data-[state=checked]:[&_span]:translate-x-2 data-[state=checked]:[&_span]:rtl:-translate-x-2"
        aria-describedby={`${id}-description`}
      />
      <div className="flex grow items-center gap-3">
        <div className="relative shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={32}
            height={32}
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="16" fill="#121212" />
          </svg>
          <img
            src="/stripe.svg"
            alt="Stripe"
            width={20}
            height={20}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          />
        </div>
        <div className="grid grow gap-2">
          <Label htmlFor={id}>
            Label{" "}
            <span className="text-muted-foreground text-xs leading-[inherit] font-normal">
              (Sublabel)
            </span>
          </Label>
          <p id={`${id}-description`} className="text-muted-foreground text-xs">
            A short description goes here.
          </p>
        </div>
      </div>
    </div>
  );
}
