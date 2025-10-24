import React from "react";
import { SelectNative } from "@/src/components/ui/select-native";

export const SelectNativeWrapper = React.forwardRef(
  ({ children, ...props }, ref) => {
    return (
      <SelectNative ref={ref} {...props}>
        {children}
      </SelectNative>
    );
  }
);

SelectNativeWrapper.displayName = "SelectNativeWrapper";
