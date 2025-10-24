import React, { useState, useEffect } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export const QuantityInput = React.forwardRef(
  ({ value, onChange, onBlur, disabled = false, min = 1, max, name, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState('1');

    useEffect(() => {
      if (value !== undefined && value !== null && value !== '') {
        setDisplayValue(String(value));
      } else {
        setDisplayValue('1');
      }
    }, [value]);

    const currentValue = displayValue !== '' ? parseInt(displayValue) || 1 : 1;

    const handleDecrement = () => {
      const current = parseInt(displayValue) || 1;
      const newValue = Math.max(1, current - 1);
      setDisplayValue(newValue.toString());
      if (onChange) {
        onChange({ target: { name, value: newValue.toString() } });
      }
    };

    const handleIncrement = () => {
      const current = parseInt(displayValue) || 1;
      const newValue = max ? Math.min(max, current + 1) : current + 1;
      setDisplayValue(newValue.toString());
      if (onChange) {
        onChange({ target: { name, value: newValue.toString() } });
      }
    };

    const handleInputChange = (e) => {
      const inputValue = e.target.value;
      // Accepter uniquement les chiffres entiers >= 1
      if (inputValue === '' || /^\d+$/.test(inputValue)) {
        const numValue = inputValue === '' ? 1 : parseInt(inputValue);
        // Minimum 1
        if (numValue >= 1 || inputValue === '') {
          setDisplayValue(inputValue === '' ? '1' : inputValue);
          if (onChange) {
            onChange({ target: { name, value: inputValue === '' ? '1' : inputValue } });
          }
        }
      }
    };

    return (
      <div className="relative inline-flex h-10 w-full items-center overflow-hidden rounded-md border border-input text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none disabled:opacity-50 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <Button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (parseInt(displayValue) || 1) <= 1}
          className="-ms-px flex aspect-square h-[inherit] items-center justify-center rounded-none border border-input bg-background text-sm text-muted-foreground/80 transition-[color,box-shadow] hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          size="sm"
        >
          <MinusIcon size={16} aria-hidden="true" />
        </Button>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          name={name}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={onBlur}
          disabled={disabled}
          className="w-full grow bg-background px-3 py-2 text-center text-foreground tabular-nums border-0 shadow-none focus-visible:ring-0 outline-none text-base"
          style={{ textAlign: 'center' }}
          {...props}
        />
        <Button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (max && (parseInt(displayValue) || 1) >= max)}
          className="-me-px flex aspect-square h-[inherit] items-center justify-center rounded-none border border-input bg-background text-sm text-muted-foreground/80 transition-[color,box-shadow] hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          size="sm"
        >
          <PlusIcon size={16} aria-hidden="true" />
        </Button>
      </div>
    );
  }
);

QuantityInput.displayName = "QuantityInput";
