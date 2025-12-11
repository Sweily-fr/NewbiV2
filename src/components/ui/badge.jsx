import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Statuts - style identique au tableau factures (bg-color-50 text-color-600)
        draft:
          "border-transparent bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400",
        pending:
          "border-transparent bg-[#5a50ff]/10 text-[#5a50ff] dark:bg-[#5a50ff]/20 dark:text-[#5a50ff]",
        success:
          "border-transparent bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
        error:
          "border-transparent bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
        warning:
          "border-transparent bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
        info: "border-transparent bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        // Alias pour les transactions
        paid: "border-transparent bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
        completed:
          "border-transparent bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
        cancelled:
          "border-transparent bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
        bank: "border-transparent bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        manual:
          "border-transparent bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
        ocr: "border-transparent bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
