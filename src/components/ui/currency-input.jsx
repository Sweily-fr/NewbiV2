import React from "react";
import { Input } from "@/src/components/ui/input";

export const CurrencyInput = React.forwardRef(
  ({ className, placeholder = "0.00", ...props }, ref) => {
    return (
      <div className="relative flex rounded-md shadow-xs">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
          €
        </span>
        <Input
          ref={ref}
          className={`-me-px rounded-e-none ps-6 shadow-none ${className || ""}`}
          placeholder={placeholder}
          type="text"
          {...props}
        />
        <span className="-z-10 inline-flex items-center rounded-e-md border border-input bg-background px-3 text-sm text-muted-foreground">
          EUR
        </span>
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
