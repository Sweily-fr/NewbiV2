import React from "react";

export const CurrencyInput = React.forwardRef(
  ({ className, placeholder = "0.00", onChange, ...props }, ref) => {
    const handleChange = (e) => {
      const value = e.target.value;
      let sanitizedValue = value.replace(/,/g, '.');
      sanitizedValue = sanitizedValue.replace(/[^\d.]/g, '');
      const parts = sanitizedValue.split('.');
      if (parts.length > 2) {
        sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts.length === 2 && parts[1].length > 2) {
        sanitizedValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
      e.target.value = sanitizedValue;
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-sm font-medium text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)]">
          €
        </span>
        <input
          ref={ref}
          className={`outline-none bg-transparent m-0 flex w-full tracking-[-0.01em] font-medium text-[#242529] placeholder:text-[rgba(0,0,0,0.35)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-white dark:placeholder:text-[rgba(255,255,255,0.35)] border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] h-8 rounded-[9px] pl-7 pr-12 transition-[border] duration-[80ms] ease-in-out text-sm leading-5 ${className || ""}`}
          placeholder={placeholder}
          type="text"
          inputMode="decimal"
          onChange={handleChange}
          {...props}
        />
        <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-xs font-medium text-[rgba(0,0,0,0.35)] dark:text-[rgba(255,255,255,0.35)]">
          EUR
        </span>
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
