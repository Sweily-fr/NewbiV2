import React, { useState, useEffect } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export const QuantityInput = React.forwardRef(
  ({ value, onChange, onBlur, disabled = false, min = 0.5, max, name, step = 0.5, ...props }, ref) => {
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
      // Arrondir à 2 décimales pour éviter les problèmes de précision
      const roundedValue = Math.round(newValue * 100) / 100;
      setDisplayValue(roundedValue.toString());
      if (onChange) {
        onChange({ target: { name, value: roundedValue.toString() } });
      }
    };

    const handleIncrement = () => {
      const current = parseFloat(displayValue) || 0.5;
      const newValue = max ? Math.min(max, current + step) : current + step;
      // Arrondir à 2 décimales pour éviter les problèmes de précision
      const roundedValue = Math.round(newValue * 100) / 100;
      setDisplayValue(roundedValue.toString());
      if (onChange) {
        onChange({ target: { name, value: roundedValue.toString() } });
      }
    };

    const handleInputChange = (e) => {
      const inputValue = e.target.value;
      // Accepter les nombres décimaux avec point ou virgule
      if (inputValue === '' || /^\d*[.,]?\d*$/.test(inputValue)) {
        // Remplacer la virgule par un point pour la cohérence
        const normalizedValue = inputValue.replace(',', '.');
        const numValue = normalizedValue === '' ? 0.5 : parseFloat(normalizedValue);
        // Minimum 0.5
        if (numValue >= 0.5 || inputValue === '' || normalizedValue.endsWith('.')) {
          setDisplayValue(normalizedValue === '' ? '0.5' : normalizedValue);
          if (onChange && normalizedValue !== '' && !normalizedValue.endsWith('.')) {
            onChange({ target: { name, value: normalizedValue === '' ? '0.5' : normalizedValue } });
          }
        }
      }
    };

    return (
      <div className="relative inline-flex h-10 w-full items-center overflow-hidden rounded-md border border-input text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none disabled:opacity-50 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
        <Button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (parseFloat(displayValue) || min) <= min}
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
