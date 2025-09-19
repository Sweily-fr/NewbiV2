"use client";

import { useId, useState, useEffect } from "react";
import { CheckIcon, MinusIcon } from "lucide-react";

import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";

const items = [
  { value: "light", label: "Claire", image: "/theme-light.svg" },
  { value: "dark", label: "Sombre", image: "/theme-dark.svg" },
  { value: "system", label: "Système", image: "/theme-system.svg" },
];

export default function DarkModeComponent() {
  const id = useId();
  const [theme, setTheme] = useState("light");

  // Charger le thème depuis localStorage au montage du composant
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("vite-ui-theme") || "light";
      setTheme(storedTheme);
    }
  }, []);

  // Fonction pour changer le thème
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("vite-ui-theme", newTheme);
      
      // Appliquer le thème immédiatement
      const root = document.documentElement;
      
      if (newTheme === "dark") {
        root.classList.add("dark");
      } else if (newTheme === "light") {
        root.classList.remove("dark");
      } else if (newTheme === "system") {
        // Pour le mode système, vérifier la préférence du système
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (systemPrefersDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
      
      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new Event("storage"));
    }
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-foreground text-sm leading-none font-medium">
        Apparence
      </legend>
      <RadioGroup className="flex gap-3" value={theme} onValueChange={handleThemeChange}>
        {items.map((item) => (
          <label key={`${id}-${item.value}`}>
            <RadioGroupItem
              id={`${id}-${item.value}`}
              value={item.value}
              className="peer sr-only after:absolute after:inset-0"
            />
            <img
              src={item.image}
              alt={item.label}
              width={88}
              height={70}
              className="border-input peer-focus-visible:ring-ring/50 peer-data-[state=checked]:border-ring peer-data-[state=checked]:bg-accent relative cursor-pointer overflow-hidden rounded-md border shadow-xs transition-[color,box-shadow] outline-none peer-focus-visible:ring-[3px] peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50"
            />
            <span className="group peer-data-[state=unchecked]:text-muted-foreground/70 mt-2 flex items-center gap-1">
              <CheckIcon
                size={16}
                className="group-peer-data-[state=unchecked]:hidden"
                aria-hidden="true"
              />
              <MinusIcon
                size={16}
                className="group-peer-data-[state=checked]:hidden"
                aria-hidden="true"
              />
              <span className="text-xs font-medium">{item.label}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
