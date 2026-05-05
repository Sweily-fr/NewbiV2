"use client";

import { useId, useMemo, useState, forwardRef } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

export const PasswordStrengthInput = forwardRef(
  (
    { label = "Mot de passe", value, onChange, error, className, ...props },
    ref,
  ) => {
    const id = useId();
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => setIsVisible((prevState) => !prevState);

    const checkStrength = (pass) => {
      const requirements = [
        { regex: /.{8,}/, text: "Au moins 8 caractères" },
        { regex: /[0-9]/, text: "Au moins 1 chiffre" },
        { regex: /[a-z]/, text: "Au moins 1 minuscule" },
        { regex: /[A-Z]/, text: "Au moins 1 majuscule" },
      ];

      return requirements.map((req) => ({
        met: req.regex.test(pass),
        text: req.text,
      }));
    };

    const strength = checkStrength(value || "");

    const strengthScore = useMemo(() => {
      return strength.filter((req) => req.met).length;
    }, [strength]);

    const getStrengthColor = (score) => {
      if (score === 0) return "bg-border";
      if (score <= 1) return "bg-red-500";
      if (score <= 2) return "bg-orange-500";
      if (score === 3) return "bg-amber-500";
      return "bg-[#5a50ff]";
    };

    const getStrengthText = (score) => {
      if (score === 0) return "Entrez un mot de passe";
      if (score <= 2) return "Mot de passe faible";
      if (score === 3) return "Mot de passe moyen";
      return "Mot de passe fort";
    };

    return (
      <div>
        {/* Password input field with toggle visibility button */}
        {label && (
          <Label
            htmlFor={id}
            className="text-sm font-medium text-foreground dark:text-foreground"
          >
            {label}
          </Label>
        )}
        <div className={label ? "relative mt-2" : "relative"}>
          <Input
            ref={ref}
            id={id}
            className={`pe-9 ${className || ""}`}
            placeholder="Saisissez votre mot de passe"
            type={isVisible ? "text" : "password"}
            value={value}
            onChange={onChange}
            aria-describedby={`${id}-description`}
            {...props}
          />
          <button
            className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={toggleVisibility}
            aria-label={
              isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"
            }
            aria-pressed={isVisible}
            aria-controls="password"
          >
            {isVisible ? (
              <EyeOffIcon size={16} aria-hidden="true" />
            ) : (
              <EyeIcon size={16} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Error message */}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

        {/* Password strength indicator — only shown when typing */}
        {value && (
          <div
            className="bg-border mt-3 mb-2 h-1 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={strengthScore}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-label="Force du mot de passe"
          >
            <div
              className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-500 ease-out`}
              style={{ width: `${(strengthScore / 4) * 100}%` }}
            ></div>
          </div>
        )}

        {/* Password requirements — inline, minimal */}
        {value && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {strength.map((req, index) => (
              <span
                key={index}
                className={`text-[11px] transition-colors ${
                  req.met
                    ? "text-muted-foreground/40 line-through"
                    : "text-muted-foreground"
                }`}
              >
                {req.text}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  },
);

PasswordStrengthInput.displayName = "PasswordStrengthInput";
