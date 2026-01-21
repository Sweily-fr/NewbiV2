"use client";

import * as React from "react";
import { ChevronRightIcon } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/src/lib/utils";

const TreeContext = React.createContext({
  currentItem: undefined,
  indent: 16,
  tree: undefined,
});

function useTreeContext() {
  return React.useContext(TreeContext);
}

function Tree({ indent = 16, tree, className, ...props }) {
  const containerProps =
    tree && typeof tree.getContainerProps === "function"
      ? tree.getContainerProps()
      : {};
  const mergedProps = { ...props, ...containerProps };

  const { style: propStyle, ...otherProps } = mergedProps;

  const mergedStyle = {
    ...propStyle,
    "--tree-indent": `${indent}px`,
  };

  return (
    <TreeContext.Provider value={{ indent, tree }}>
      <div
        className={cn("flex flex-col", className)}
        data-slot="tree"
        style={mergedStyle}
        {...otherProps}
      />
    </TreeContext.Provider>
  );
}

function TreeItem({ item, className, asChild, children, ...props }) {
  const { indent } = useTreeContext();

  const itemProps = typeof item.getProps === "function" ? item.getProps() : {};
  const mergedProps = { ...props, ...itemProps };

  const { style: propStyle, ...otherProps } = mergedProps;

  const mergedStyle = {
    ...propStyle,
    "--tree-padding": `${item.getItemMeta().level * indent}px`,
  };

  const Comp = asChild ? Slot : "button";

  const isDragTarget =
    typeof item.isDragTarget === "function" ? item.isDragTarget() : false;

  return (
    <TreeContext.Provider value={{ currentItem: item, indent }}>
      <Comp
        aria-expanded={item.isExpanded()}
        className={cn(
          "z-10 w-full text-left select-none ps-[var(--tree-padding)] outline-none focus:z-20",
          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          "transition-[padding,opacity] duration-150 ease-out",
          className
        )}
        data-drag-target={isDragTarget || undefined}
        data-focus={
          typeof item.isFocused === "function"
            ? item.isFocused() || false
            : undefined
        }
        data-folder={
          typeof item.isFolder === "function"
            ? item.isFolder() || false
            : undefined
        }
        data-selected={
          typeof item.isSelected === "function"
            ? item.isSelected() || false
            : undefined
        }
        data-slot="tree-item"
        style={mergedStyle}
        {...otherProps}
      >
        {children}
      </Comp>
    </TreeContext.Provider>
  );
}

function TreeItemLabel({ item: propItem, children, className, ...props }) {
  const { currentItem } = useTreeContext();
  const item = propItem || currentItem;

  if (!item) {
    console.warn("TreeItemLabel: No item provided via props or context");
    return null;
  }

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1 text-sm",
        "transition-colors duration-100 ease-out",
        "hover:bg-accent/50",
        "[[data-drag-target=true]_&]:bg-accent/70",
        "[[data-selected=true]_&]:bg-accent [[data-selected=true]_&]:text-accent-foreground",
        "[&:not([data-folder=true])]:ps-5",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="tree-item-label"
      {...props}
    >
      {item.isFolder() && (
        <ChevronRightIcon
          className={cn(
            "size-3 text-muted-foreground/60 transition-transform duration-100",
            "[[aria-expanded=true]_&]:rotate-90"
          )}
        />
      )}
      {children ||
        (typeof item.getItemName === "function" ? item.getItemName() : null)}
    </span>
  );
}

function TreeDragLine({ className, ...props }) {
  // Hide drag line completely for a cleaner look
  // Since we use folder highlighting instead
  return null;
}

export { Tree, TreeItem, TreeItemLabel, TreeDragLine, useTreeContext };
