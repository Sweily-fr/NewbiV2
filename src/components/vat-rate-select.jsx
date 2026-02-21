"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { VAT_RATE_GROUPS, ALL_PREDEFINED_RATES } from "@/src/constants/vat-rates";

function isCustomRate(value) {
  if (value == null || value === "") return false;
  return !ALL_PREDEFINED_RATES.includes(String(value));
}

export function VatRateSelect({ value, onChange, disabled, className }) {
  const strValue = value != null ? String(value) : "20";
  const [isCustom, setIsCustom] = useState(() => isCustomRate(strValue));
  const [customValue, setCustomValue] = useState(() =>
    isCustomRate(strValue) ? strValue : ""
  );

  // Sync when value changes externally (e.g. loading an existing invoice)
  useEffect(() => {
    const custom = isCustomRate(strValue);
    setIsCustom(custom);
    if (custom) {
      setCustomValue(strValue);
    }
  }, [strValue]);

  const handleSelectChange = (selected) => {
    if (selected === "custom") {
      setIsCustom(true);
      setCustomValue("");
      // Don't call onChange yet — wait for user to type a value
    } else {
      setIsCustom(false);
      setCustomValue("");
      onChange(parseFloat(selected));
    }
  };

  const handleCustomInputChange = (e) => {
    const raw = e.target.value;
    setCustomValue(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      onChange(parsed);
    }
  };

  if (isCustom) {
    return (
      <div className="flex gap-1.5">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          placeholder="Taux %"
          value={customValue}
          onChange={handleCustomInputChange}
          disabled={disabled}
          className={className}
        />
        <button
          type="button"
          onClick={() => {
            setIsCustom(false);
            setCustomValue("");
            onChange(20);
          }}
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap px-1"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <Select
      value={strValue}
      onValueChange={handleSelectChange}
      disabled={disabled}
    >
      <SelectTrigger className={className || "w-full"}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {VAT_RATE_GROUPS.map((group) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.rates.map((rate) => (
              <SelectItem key={`${group.label}-${rate.value}`} value={rate.value}>
                {rate.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        <SelectSeparator />
        <SelectItem value="custom">Personnalisé…</SelectItem>
      </SelectContent>
    </Select>
  );
}
