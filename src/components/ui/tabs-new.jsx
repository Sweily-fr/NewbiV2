"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/src/lib/utils";

// ─── Root ───

function TabsNew({ className, ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs-new"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

// ─── List ───
// Wraps TabsList inside a bordered container with the #EEEFF1 bottom border.

function TabsNewList({ className, children, ...props }) {
  return (
    <div className="flex-shrink-0 border-b border-[#EEEFF1] dark:border-[#232323]">
      <TabsPrimitive.List
        data-slot="tabs-new-list"
        className={cn(
          "h-auto rounded-none bg-transparent p-0 pb-2 w-full inline-flex items-center justify-start gap-0.5 px-4 sm:px-6",
          className
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.List>
    </div>
  );
}

// ─── Trigger ───
// Encapsulates the full Attio-style tab trigger with:
// - rounded pill with inset border on hover/active
// - bottom active indicator (::after pseudo-element)
// - faux-bold via text-shadow on active state

const tabTriggerBase =
  "relative rounded-md py-1.5 px-3 text-sm font-normal cursor-pointer gap-1.5 bg-transparent shadow-none text-[#606164] dark:text-muted-foreground hover:shadow-[inset_0_0_0_1px_#EEEFF1] dark:hover:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:text-[#242529] dark:data-[state=active]:text-foreground after:absolute after:inset-x-1 after:-bottom-[9px] after:h-px after:rounded-full data-[state=active]:after:bg-[#242529] dark:data-[state=active]:after:bg-foreground data-[state=active]:bg-[#fbfbfb] dark:data-[state=active]:bg-[#1a1a1a] data-[state=active]:shadow-[inset_0_0_0_1px_rgb(238,239,241)] dark:data-[state=active]:shadow-[inset_0_0_0_1px_#232323] data-[state=active]:[text-shadow:0.015em_0_currentColor,-0.015em_0_currentColor] inline-flex items-center justify-center whitespace-nowrap border border-transparent transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

function TabsNewTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-new-trigger"
      className={cn(tabTriggerBase, className)}
      {...props}
    />
  );
}

// ─── Separator ───
// Vertical divider between tab groups (like in client-detail-tabs).

function TabsNewSeparator({ className, ...props }) {
  return (
    <div
      data-slot="tabs-new-separator"
      className={cn(
        "w-px h-5 bg-[#EEEFF1] dark:bg-[#232323] mx-1 self-center flex-shrink-0",
        className
      )}
      {...props}
    />
  );
}

// ─── Content ───

function TabsNewContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-new-content"
      className={cn(
        "flex-1 outline-none",
        "data-[state=inactive]:hidden",
        className
      )}
      {...props}
    />
  );
}

export {
  TabsNew,
  TabsNewList,
  TabsNewTrigger,
  TabsNewSeparator,
  TabsNewContent,
};
