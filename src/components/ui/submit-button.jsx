"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./button";
import { LoaderCircle } from "lucide-react";

const SubmitButton = (props) => {
  const { pending } = useFormStatus();
  const { children, isLoading, ...rest } = props;

  // Utiliser soit isLoading (pour react-hook-form) soit pending (pour React Server Actions)
  const loading = isLoading || pending;

  return (
    <Button {...rest} disabled={props.disabled || loading} className={`${props.className || ""} relative`}>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="h-4 w-4 animate-spin" />
        </span>
      )}
      <span className={loading ? "invisible" : ""}>
        {children}
      </span>
    </Button>
  );
};

export { SubmitButton };
