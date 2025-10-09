"use client"

import * as React from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/src/lib/utils"

const TreeContext = React.createContext(null)

export function Tree({ children, className, indent = 20, tree, ...props }) {
  return (
    <TreeContext.Provider value={{ tree, indent }}>
      <div
        className={cn("relative", className)}
        style={{ "--tree-indent": `${indent}px` }}
        {...props}
      >
        {children}
      </div>
    </TreeContext.Provider>
  )
}

export function TreeItem({ children, item, ...props }) {
  const { tree } = React.useContext(TreeContext)
  const isFolder = item.isFolder()
  const isExpanded = item.isExpanded()
  const level = item.getItemMeta().level

  return (
    <div
      className={cn("relative")}
      style={{ paddingLeft: `${level * (tree?.indent || 20)}px` }}
      {...props}
    >
      {children}
    </div>
  )
}

export function TreeItemLabel({ children, className, ...props }) {
  const { tree } = React.useContext(TreeContext)
  
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 cursor-pointer hover:bg-accent rounded-md transition-colors",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
