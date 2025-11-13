import React from "react";
import { Input } from "@/src/components/ui/input";

export const CurrencyInput = React.forwardRef(
  ({ className, placeholder = "0.00", onChange, ...props }, ref) => {
    // Fonction pour valider et formater l'entrée (uniquement chiffres et décimales)
    const handleChange = (e) => {
      const value = e.target.value;
      
      // Autoriser uniquement les chiffres, un point décimal et les virgules
      // Remplacer les virgules par des points pour la cohérence
      let sanitizedValue = value.replace(/,/g, '.');
      
      // Supprimer tous les caractères non numériques sauf le point
      sanitizedValue = sanitizedValue.replace(/[^\d.]/g, '');
      
      // Autoriser un seul point décimal
      const parts = sanitizedValue.split('.');
      if (parts.length > 2) {
        sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limiter à 2 décimales maximum
      if (parts.length === 2 && parts[1].length > 2) {
        sanitizedValue = parts[0] + '.' + parts[1].substring(0, 2);
      }
      
      // Mettre à jour la valeur de l'input
      e.target.value = sanitizedValue;
      
      // Appeler le onChange original si fourni
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="relative flex rounded-md shadow-xs">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-sm text-muted-foreground">
          €
        </span>
        <Input
          ref={ref}
          className={`-me-px rounded-e-none ps-6 shadow-none ${className || ""}`}
          placeholder={placeholder}
          type="text"
          inputMode="decimal"
          onChange={handleChange}
          {...props}
        />
        <span className="-z-10 inline-flex items-center rounded-e-md border border-input bg-background px-3 text-sm text-muted-foreground">
          EUR
        </span>
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
