import * as React from "react";
import { useState, useId, useEffect } from "react";
import { cva } from "class-variance-authority";
import {
  EyeIcon,
  EyeOffIcon,
  PhoneIcon,
  AtSignIcon,
  LoaderCircle,
  SearchIcon,
} from "lucide-react";

import { cn } from "@/src/lib/utils";
import { Label } from "@/src/components/ui/label";

const inputVariants = cva(
  "outline-none bg-transparent m-0 flex w-full tracking-[-0.01em] font-medium text-[#242529] placeholder:text-[rgba(0,0,0,0.35)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:placeholder:text-[rgba(255,255,255,0.35)]",
  {
    variants: {
      variant: {
        default:
          "border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] h-8 rounded-[9px] px-2.5 transition-[border] duration-[80ms] ease-in-out",
        ghost: "border-none p-0 flex-1 h-full",
      },
      size: {
        default: "text-sm leading-5",
        sm: "text-xs leading-4",
        lg: "text-base leading-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Input = React.forwardRef(
  ({ className, variant, size, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(inputVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

function InputPassword({ className, label, placeholder, ...props }) {
  const id = useId();
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible((prevState) => !prevState);

  return (
    <div className="*:not-first:mt-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          className={cn("pe-9", className)}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          {...props}
        />
        <button
          className="text-[rgba(0,0,0,0.35)] hover:text-[#242529] dark:text-[rgba(255,255,255,0.35)] dark:hover:text-white absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-[9px] transition-colors outline-none focus:z-10 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          onClick={toggleVisibility}
          aria-label={
            isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={isVisible}
          aria-controls={id}
        >
          {isVisible ? (
            <EyeOffIcon size={16} aria-hidden="true" />
          ) : (
            <EyeIcon size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

function InputEmail({ className, label, placeholder, ...props }) {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          className={cn("peer ps-9", className)}
          placeholder={placeholder}
          type="email"
          {...props}
        />
        <div className="text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          <AtSignIcon size={16} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function InputPhone({
  className,
  label,
  placeholder = "Numéro de téléphone",
  ...props
}) {
  const id = useId();

  return (
    <div className="*:not-first:mt-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          className={cn("peer ps-9", className)}
          placeholder={placeholder}
          type="tel"
          {...props}
        />
        <div className="text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          <PhoneIcon size={16} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function InputEndAddOn({ className, label, placeholder, ...props }) {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex">
        <span className="border border-[#e6e7ea] dark:border-[#2E2E32] bg-transparent text-[#242529] dark:text-white -z-10 inline-flex items-center rounded-s-[9px] border-e-0 px-3 text-sm font-medium">
          https://
        </span>
        <Input
          id={id}
          className={cn("rounded-s-none border-s-0", className)}
          placeholder={placeholder}
          type="text"
          {...props}
        />
      </div>
    </div>
  );
}

function InputLoader({ className, label, placeholder, ...props }) {
  const id = useId();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (inputValue) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
    setIsLoading(false);
  }, [inputValue]);

  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          className={cn("peer ps-9", className)}
          placeholder={placeholder}
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div className="text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          {isLoading ? (
            <LoaderCircle
              className="animate-spin"
              size={16}
              role="status"
              aria-label="Loading..."
            />
          ) : (
            <SearchIcon size={16} aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  );
}

export {
  Input,
  InputPassword,
  InputEmail,
  InputPhone,
  InputEndAddOn,
  InputLoader,
  inputVariants,
};
