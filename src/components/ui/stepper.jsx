"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

const StepperContext = React.createContext({
  value: 1,
  onValueChange: () => {},
});

const Stepper = React.forwardRef(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    return (
      <StepperContext.Provider value={{ value, onValueChange }}>
        <div ref={ref} className={cn("flex w-full", className)} {...props}>
          {children}
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = "Stepper";

const StepperItem = React.forwardRef(
  ({ className, step, children, ...props }, ref) => {
    const { value } = React.useContext(StepperContext);
    const state =
      value > step ? "complete" : value === step ? "active" : "inactive";

    return (
      <div
        ref={ref}
        data-state={state}
        data-step={step}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
StepperItem.displayName = "StepperItem";

const StepperTrigger = React.forwardRef(
  ({ className, asChild, children, ...props }, ref) => {
    if (asChild) {
      return React.cloneElement(children, {
        ref,
        className: cn(className, children.props.className),
        ...props,
      });
    }

    return (
      <div ref={ref} className={cn(className)} {...props}>
        {children}
      </div>
    );
  }
);
StepperTrigger.displayName = "StepperTrigger";

const StepperIndicator = React.forwardRef(
  ({ className, asChild, children, ...props }, ref) => {
    if (asChild) {
      return React.cloneElement(children, {
        ref,
        className: cn(className, children.props.className),
        ...props,
      });
    }

    return (
      <div ref={ref} className={cn(className)} {...props}>
        {children}
      </div>
    );
  }
);
StepperIndicator.displayName = "StepperIndicator";

export { Stepper, StepperItem, StepperTrigger, StepperIndicator };
