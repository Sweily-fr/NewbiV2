import * as React from "react";
import { cva } from "class-variance-authority";

import { cn } from "@/src/lib/utils";

const textareaNewVariants = cva(
  "outline-none bg-transparent m-0 flex w-full tracking-[-0.01em] font-medium text-[#242529] placeholder:text-[rgba(0,0,0,0.35)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:placeholder:text-[rgba(255,255,255,0.35)] resize-y",
  {
    variants: {
      variant: {
        default:
          "border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] rounded-[9px] px-2.5 py-2 transition-[border] duration-[80ms] ease-in-out",
      },
      size: {
        default: "text-sm leading-5 min-h-[80px]",
        sm: "text-xs leading-4 min-h-[60px]",
        lg: "text-base leading-6 min-h-[100px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const TextareaNew = React.forwardRef(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea-new"
        className={cn(textareaNewVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
TextareaNew.displayName = "TextareaNew";

export { TextareaNew, textareaNewVariants };
