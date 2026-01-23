"use client";

import { useId, useMemo, useState, forwardRef } from "react";
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

export const PasswordStrengthInput = forwardRef(
  ({ label = "Mot de passe", value, onChange, error, ...props }, ref) => {
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
        <Label
          htmlFor={id}
          className="text-sm font-medium text-foreground dark:text-foreground"
        >
          {label}
        </Label>
        <div className="relative mt-2">
          <Input
            ref={ref}
            id={id}
            className="pe-9"
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

        {/* Password strength indicator */}
        <div
          className="bg-border mt-3 mb-4 h-1 w-full overflow-hidden rounded-full"
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

        {/* Password strength description */}
        <p
          id={`${id}-description`}
          className="text-foreground mb-2 text-sm font-medium"
        >
          {getStrengthText(strengthScore)}. Doit contenir :
        </p>

        {/* Password requirements list */}
        <ul
          className="grid grid-cols-2 gap-x-4 gap-y-1.5"
          aria-label="Exigences du mot de passe"
        >
          {strength.map((req, index) => (
            <li key={index} className="flex items-center gap-2">
              {req.met ? (
                <CheckIcon
                  size={16}
                  className="text-[#5a50ff]"
                  aria-hidden="true"
                />
              ) : (
                <XIcon
                  size={16}
                  className="text-muted-foreground/80"
                  aria-hidden="true"
                />
              )}
              <span
                className={`text-xs ${req.met ? "text-[#5a50ff]" : "text-muted-foreground"}`}
              >
                {req.text}
                <span className="sr-only">
                  {req.met ? " - Exigence remplie" : " - Exigence non remplie"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

PasswordStrengthInput.displayName = "PasswordStrengthInput";
