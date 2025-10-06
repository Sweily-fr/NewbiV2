import { useId } from "react"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { cn } from "@/src/lib/utils"

interface InputWithErrorProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  containerClassName?: string
}

export function InputWithError({
  label,
  error,
  helperText,
  containerClassName,
  className,
  ...props
}: InputWithErrorProps) {
  const id = useId()
  const inputId = props.id || id
  const hasError = !!error

  return (
    <div className={cn("space-y-2", containerClassName)}>
      {label && (
        <Label htmlFor={inputId} className={cn(hasError && "text-destructive")}>
          {label}
        </Label>
      )}
      <Input
        id={inputId}
        className={cn("peer", hasError && "border-destructive focus-visible:ring-destructive", className)}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {hasError && (
        <p
          id={`${inputId}-error`}
          className="text-destructive text-xs font-medium"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      {!hasError && helperText && (
        <p
          id={`${inputId}-helper`}
          className="text-muted-foreground text-xs"
        >
          {helperText}
        </p>
      )}
    </div>
  )
}
