"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/src/lib/utils";

const TreeContext = React.createContext({
  currentItem: undefined,
  indent: 20,
  tree: undefined,
});

function useTreeContext() {
  return React.useContext(TreeContext);
}

function Tree({ indent = 20, tree, className, ...props }) {
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

  return (
    <TreeContext.Provider value={{ currentItem: item, indent }}>
      <Comp
        aria-expanded={item.isExpanded()}
        className={cn(
          "z-10 w-full text-left select-none ps-[var(--tree-padding)] pb-0.5 outline-none focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
          className
        )}
        data-drag-target={
          typeof item.isDragTarget === "function"
            ? item.isDragTarget() || false
            : undefined
        }
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
        data-search-match={
          typeof item.isMatchingSearch === "function"
            ? item.isMatchingSearch() || false
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
        "flex items-center gap-1 rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent overflow-hidden",
        "[[data-drag-target=true]_&]:bg-accent",
        "[[data-search-match=true]_&]:bg-blue-400/20",
        "[[data-selected=true]_&]:bg-accent [[data-selected=true]_&]:text-accent-foreground",
        "[[data-focus-visible]_&]:ring-[3px] [[data-focus-visible]_&]:ring-ring/50",
        "[&:not([data-folder=true])]:ps-7",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="tree-item-label"
      {...props}
    >
      {item.isFolder() && (
        <ChevronDownIcon className="size-4 text-muted-foreground [[aria-expanded=false]_&]:-rotate-90 transition-transform" />
      )}
      {children ||
        (typeof item.getItemName === "function" ? item.getItemName() : null)}
    </span>
  );
}

function TreeDragLine({ className, ...props }) {
  const { tree } = useTreeContext();

  if (!tree || typeof tree.getDragLineStyle !== "function") {
    console.warn(
      "TreeDragLine: No tree provided via context or tree does not have getDragLineStyle method"
    );
    return null;
  }

  const dragLine = tree.getDragLineStyle();
  return (
    <div
      className={cn(
        "-mt-px absolute z-30 h-0.5 w-[unset] bg-primary",
        "before:absolute before:-top-[3px] before:left-0 before:size-2 before:rounded-full before:border-2 before:border-primary before:bg-background",
        className
      )}
      style={dragLine}
      {...props}
    />
  );
}

export { Tree, TreeItem, TreeItemLabel, TreeDragLine, useTreeContext };
