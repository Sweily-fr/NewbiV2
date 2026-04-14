"use client";

import { useId } from "react";
import { CheckIcon, MinusIcon } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { useTheme } from "@/src/components/theme-provider";

const items = [
  { value: "off", label: "Standard", description: "Vert et rouge" },
  { value: "on", label: "Daltonien", description: "Bleu et noir" },
];

export default function ColorblindModeComponent() {
  const id = useId();
  const { colorblindMode, setColorblindMode } = useTheme();
  const value = colorblindMode ? "on" : "off";

  const handleChange = (next) => {
    setColorblindMode(next === "on");
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-foreground text-sm leading-none font-medium">
        Mode daltonien
      </legend>
      <p className="text-xs text-muted-foreground">
        Applique uniquement aux graphiques de la plateforme.
      </p>
      <RadioGroup
        className="flex gap-3"
        value={value}
        onValueChange={handleChange}
      >
        {items.map((item) => (
          <label
            key={`${id}-${item.value}`}
            className="border-input peer-focus-visible:ring-ring/50 relative flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 shadow-xs transition-[color,box-shadow] has-[[data-state=checked]]:border-ring has-[[data-state=checked]]:bg-accent"
          >
            <RadioGroupItem
              id={`${id}-${item.value}`}
              value={item.value}
              className="peer sr-only after:absolute after:inset-0"
            />
            <span className="flex items-center gap-2">
              <span className="flex h-4 w-4 items-center justify-center">
                <CheckIcon
                  size={14}
                  className={value === item.value ? "" : "hidden"}
                  aria-hidden="true"
                />
                <MinusIcon
                  size={14}
                  className={value === item.value ? "hidden" : ""}
                  aria-hidden="true"
                />
              </span>
              <span className="flex flex-col">
                <span className="text-xs font-medium">{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
