import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/src/lib/utils";

const buttonVariants = cva(
  "appearance-none relative inline-flex shrink-0 items-center justify-center cursor-pointer border-none outline-none no-underline transition-[background-color,color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#1a1a1a] hover:bg-[#333] active:bg-[#111] text-white [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.1),0_2px_4px_-2px_rgba(0,0,0,0.12),0_3px_6px_-2px_rgba(0,0,0,0.08)]",
        primary:
          "bg-[#5A50FF] hover:bg-[#4840D9] active:bg-[#3F37B3] text-white [box-shadow:inset_0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(90,80,255,0.12),0_3px_6px_-2px_rgba(90,80,255,0.08)]",
        danger:
          "bg-[#E5484D] hover:bg-[#CD2B31] active:bg-[#AA2429] text-white [box-shadow:inset_0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(229,72,77,0.12),0_3px_6px_-2px_rgba(229,72,77,0.08)]",
        destructive:
          "bg-[#E5484D] hover:bg-[#CD2B31] active:bg-[#AA2429] text-white [box-shadow:inset_0_0_0_1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(229,72,77,0.12),0_3px_6px_-2px_rgba(229,72,77,0.08)]",
        secondary:
          "bg-white hover:bg-[#f5f5f5] active:bg-[#ebebeb] text-[#242529] [box-shadow:rgba(255,255,255,0)_0_0_0_1px_inset,rgba(28,40,64,0.18)_0_0_2px_0,rgba(24,41,75,0.04)_0_1px_3px_0] dark:bg-[#1a1a1a] dark:hover:bg-[#262626] dark:active:bg-[#333] dark:text-white",
        outline:
          "bg-transparent hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.06)] text-[#242529] [box-shadow:rgba(255,255,255,0)_0_0_0_1px_inset,rgba(28,40,64,0.18)_0_0_2px_0,rgba(24,41,75,0.04)_0_1px_3px_0] dark:bg-[#171717] dark:text-white dark:hover:bg-[#222] dark:active:bg-[#2a2a2a] dark:[box-shadow:rgba(255,255,255,0.08)_0_0_0_1px_inset,rgba(255,255,255,0.1)_0_0_2px_0,rgba(0,0,0,0.2)_0_1px_3px_0]",
        ghost:
          "bg-transparent hover:bg-[rgba(0,0,0,0.04)] active:bg-[rgba(0,0,0,0.06)] text-[#242529] dark:text-white dark:hover:bg-[rgba(255,255,255,0.06)] dark:active:bg-[rgba(255,255,255,0.08)]",
        filter:
          "bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#efefef] text-[rgba(0,0,0,0.55)] ![outline:1px_dashed_rgba(0,0,0,0.2)] [outline-offset:-1px] dark:bg-[#1a1a1a] dark:hover:bg-[#262626] dark:active:bg-[#333] dark:text-[rgba(255,255,255,0.55)] dark:![outline-color:rgba(255,255,255,0.2)]",
        link: "bg-transparent text-[#5A50FF] underline-offset-4 hover:underline dark:text-[#8b7fff]",
      },
      size: {
        default: "h-8 gap-1.5 py-1.5 px-2.5 rounded-[9px] text-sm leading-5 font-medium tracking-tight",
        sm: "h-8 gap-1.5 py-1.5 px-2.5 rounded-[9px] text-sm leading-5 font-medium tracking-tight",
        lg: "gap-2 py-[7px] pr-3 pl-2.5 rounded-lg text-sm leading-5 font-medium tracking-tight",
        md: "h-8 gap-1.5 py-1.5 px-2.5 rounded-[9px] text-sm leading-5 font-medium tracking-tight",
        icon: "size-[30px] rounded-lg justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
