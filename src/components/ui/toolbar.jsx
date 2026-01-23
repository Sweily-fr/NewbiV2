"use client";

import * as React from "react";
import * as Ariakit from "@ariakit/react";
import { cn } from "@/src/lib/utils";

export const Toolbar = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <Ariakit.Toolbar
      ref={ref}
      className={cn(
        "flex items-center gap-1 rounded-lg border bg-background p-1",
        className,
      )}
      {...props}
    />
  );
});
Toolbar.displayName = "Toolbar";

export const ToolbarButton = React.forwardRef(
  ({ className, render, ...props }, ref) => {
    const Component = render || "button";
    return (
      <Ariakit.ToolbarItem
        ref={ref}
        render={Component}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
ToolbarButton.displayName = "ToolbarButton";

export const ToolbarGroup = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
});
ToolbarGroup.displayName = "ToolbarGroup";

export const ToolbarSeparator = React.forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <Ariakit.ToolbarSeparator
        ref={ref}
        className={cn("mx-1 h-6 w-px bg-border", className)}
        {...props}
      />
    );
  },
);
ToolbarSeparator.displayName = "ToolbarSeparator";
