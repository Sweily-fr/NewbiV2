"use client";

import { useId } from "react";
import { OTPInput, SlotProps } from "input-otp";
import { MinusIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";

export function OtpInput({
  value,
  onChange,
  maxLength = 6,
  label,
  className,
  disabled = false,
  ...props
}) {
  const id = useId();

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-normal">
          {label}
        </Label>
      )}
      <OTPInput
        id={id}
        value={value}
        onChange={(newValue) => {
          console.log("OTPInput onChange:", newValue);
          onChange(newValue);
        }}
        maxLength={maxLength}
        disabled={disabled}
        containerClassName="flex items-center gap-3 has-disabled:opacity-50"
        render={({ slots }) => (
          <>
            <div className="flex">
              {slots.slice(0, 3).map((slot, idx) => (
                <Slot key={idx} {...slot} />
              ))}
            </div>

            <div className="text-muted-foreground/80">
              <MinusIcon size={16} aria-hidden="true" />
            </div>

            <div className="flex">
              {slots.slice(3).map((slot, idx) => (
                <Slot key={idx} {...slot} />
              ))}
            </div>
          </>
        )}
        {...props}
      />
    </div>
  );
}

function Slot(props) {
  return (
    <div
      className={cn(
        "border-input bg-background text-foreground relative -ms-px flex size-9 items-center justify-center border font-medium shadow-xs transition-[color,box-shadow] first:ms-0 first:rounded-s-md last:rounded-e-md",
        { "border-ring ring-ring/50 z-10 ring-[3px]": props.isActive }
      )}
    >
      {props.char !== null && <div>{props.char}</div>}
    </div>
  );
}
