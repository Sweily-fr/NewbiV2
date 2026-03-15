"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva } from "class-variance-authority";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { cn } from "@/src/lib/utils";

// ─── Trigger variants (CVA) ───

const selectTriggerVariants = cva(
  "appearance-none m-0 flex w-full items-center justify-between overflow-hidden text-sm font-medium leading-5 -tracking-[0.01em] text-[#242529] dark:text-white outline-none transition-[background-color,box-shadow] duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-none bg-transparent hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.06)] text-[#242529] [box-shadow:rgba(255,255,255,0)_0_0_0_1px_inset,rgba(28,40,64,0.18)_0_0_2px_0,rgba(24,41,75,0.04)_0_1px_3px_0] dark:bg-[#171717] dark:text-white dark:hover:bg-[#222] dark:active:bg-[#2a2a2a] dark:[box-shadow:rgba(255,255,255,0.08)_0_0_0_1px_inset,rgba(255,255,255,0.1)_0_0_2px_0,rgba(0,0,0,0.2)_0_1px_3px_0]",
        ghost:
          "border border-transparent bg-transparent hover:bg-accent/50",
      },
      size: {
        default: "h-8 rounded-[9px] pr-2 pl-2.5 gap-3",
        sm: "h-7 rounded-md pr-1.5 pl-2 gap-2.5 text-xs leading-4",
        lg: "h-9 rounded-[9px] pr-3 pl-3 gap-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ─── Root ───

function Select({ ...props }) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

// ─── Group ───

function SelectGroup({ ...props }) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

// ─── Value ───

function SelectValue({ ...props }) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

// ─── Trigger ───

const SelectTrigger = React.memo(function SelectTrigger({
  className,
  variant,
  size,
  children,
  ...props
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(selectTriggerVariants({ variant, size, className }))}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

// ─── Content ───

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

// ─── Label ───

function SelectLabel({ className, ...props }) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "text-muted-foreground px-2 py-1.5 text-xs",
        className
      )}
      {...props}
    />
  );
}

// ─── Item ───

function SelectItem({ className, children, ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

// ─── Item with description ───

function SelectItemWithDescription({ className, children, description, ...props }) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item-with-description"
      className={cn(
        "data-[state=checked]:bg-accent/50 focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default flex-col items-start gap-1 rounded-sm py-2 px-3 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {description && (
        <span className="text-xs text-muted-foreground font-normal">
          {description}
        </span>
      )}
    </SelectPrimitive.Item>
  );
}

// ─── Separator ───

function SelectSeparator({ className, ...props }) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "bg-border pointer-events-none -mx-1 my-1 h-px",
        className
      )}
      {...props}
    />
  );
}

// ─── Scroll buttons ───

function SelectScrollUpButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({ className, ...props }) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemWithDescription,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  selectTriggerVariants,
};
