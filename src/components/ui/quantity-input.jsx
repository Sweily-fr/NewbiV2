import React, { useState, useEffect } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";

export const QuantityInput = React.forwardRef(
  ({ value, onChange, onBlur, disabled = false, min = 0.5, max, name, step = 0.5, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('0.5');

    useEffect(() => {
      if (value !== undefined && value !== null && value !== '') {
        setDisplayValue(String(value));
      } else {
        setDisplayValue('0.5');
      }
    }, [value]);

    const currentValue = displayValue !== '' ? parseFloat(displayValue) || 0.5 : 0.5;

    const handleDecrement = () => {
      const current = parseFloat(displayValue) || 0.5;
      const newValue = Math.max(0.5, current - step);
      const roundedValue = Math.round(newValue * 100) / 100;
      setDisplayValue(roundedValue.toString());
      if (onChange) {
        onChange({ target: { name, value: roundedValue.toString() } });
      }
    };

    const handleIncrement = () => {
      const current = parseFloat(displayValue) || 0.5;
      const newValue = max ? Math.min(max, current + step) : current + step;
      const roundedValue = Math.round(newValue * 100) / 100;
      setDisplayValue(roundedValue.toString());
      if (onChange) {
        onChange({ target: { name, value: roundedValue.toString() } });
      }
    };

    const handleInputChange = (e) => {
      const inputValue = e.target.value;
      if (inputValue === '' || /^\d*[.,]?\d*$/.test(inputValue)) {
        const normalizedValue = inputValue.replace(',', '.');
        const numValue = normalizedValue === '' ? 0.5 : parseFloat(normalizedValue);
        if (numValue >= 0.5 || inputValue === '' || normalizedValue.endsWith('.')) {
          setDisplayValue(normalizedValue === '' ? '0.5' : normalizedValue);
          if (onChange && normalizedValue !== '' && !normalizedValue.endsWith('.')) {
            onChange({ target: { name, value: normalizedValue === '' ? '0.5' : normalizedValue } });
          }
        }
      }
    };

    return (
      <div className={`relative inline-flex h-8 w-full items-center overflow-hidden rounded-[9px] border border-[#e6e7ea] hover:border-[#D1D3D8] dark:border-[#2E2E32] dark:hover:border-[#44444A] text-sm whitespace-nowrap transition-[border] duration-[80ms] ease-in-out ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className || ''}`}>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (parseFloat(displayValue) || min) <= min}
          className="flex aspect-square h-full items-center justify-center border-r border-[#e6e7ea] dark:border-[#2E2E32] bg-transparent text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)] transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[#242529] dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
        >
          <MinusIcon size={14} aria-hidden="true" />
        </button>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          name={name}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={onBlur}
          disabled={disabled}
          className="w-full grow bg-transparent px-2 py-1 text-center text-[#242529] dark:text-white tabular-nums font-medium tracking-[-0.01em] text-sm leading-5 outline-none"
          {...props}
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max && (parseInt(displayValue) || 1) >= max)}
          className="flex aspect-square h-full items-center justify-center border-l border-[#e6e7ea] dark:border-[#2E2E32] bg-transparent text-[rgba(0,0,0,0.45)] dark:text-[rgba(255,255,255,0.45)] transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[#242529] dark:hover:bg-[rgba(255,255,255,0.06)] dark:hover:text-white disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
        >
          <PlusIcon size={14} aria-hidden="true" />
        </button>
      </div>
    );
  }
);

QuantityInput.displayName = "QuantityInput";
