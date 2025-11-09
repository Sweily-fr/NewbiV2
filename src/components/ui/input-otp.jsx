import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/src/lib/utils";

/**
 * InputOTP - Composant pour saisir des codes OTP/2FA
 * Optimisé pour les codes à 6 chiffres (TOTP)
 */
export function InputOTP({
  length = 6,
  value = "",
  onChange,
  onComplete,
  disabled = false,
  className,
  autoFocus = true,
  ...props
}) {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (value) {
      const otpArray = value.split("").slice(0, length);
      setOtp([...otpArray, ...Array(length - otpArray.length).fill("")]);
    }
  }, [value, length]);

  // Auto-focus sur le premier input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleChange = (index, newValue) => {
    // Accepter uniquement les chiffres
    if (newValue && !/^\d$/.test(newValue)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);

    // Appeler onChange avec la valeur complète
    const otpString = newOtp.join("");
    onChange?.(otpString);

    // Passer au champ suivant si un chiffre est saisi
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Appeler onComplete si tous les champs sont remplis
    if (newOtp.every((digit) => digit !== "") && onComplete) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace : supprimer et revenir au champ précédent
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      
      if (otp[index]) {
        // Si le champ actuel a une valeur, la supprimer
        newOtp[index] = "";
        setOtp(newOtp);
        onChange?.(newOtp.join(""));
      } else if (index > 0) {
        // Sinon, revenir au champ précédent et le supprimer
        newOtp[index - 1] = "";
        setOtp(newOtp);
        onChange?.(newOtp.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    // Flèche gauche
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    
    // Flèche droite
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const pastedDigits = pastedData.replace(/\D/g, "").slice(0, length);

    if (pastedDigits) {
      const newOtp = pastedDigits.split("");
      // Compléter avec des chaînes vides si nécessaire
      while (newOtp.length < length) {
        newOtp.push("");
      }
      setOtp(newOtp);
      
      const otpString = newOtp.join("");
      onChange?.(otpString);

      // Focus sur le dernier champ rempli ou le premier vide
      const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      // Appeler onComplete si tous les champs sont remplis
      if (newOtp.every((digit) => digit !== "")) {
        onComplete?.(otpString);
      }
    }
  };

  const handleFocus = (index) => {
    // Sélectionner le contenu au focus
    inputRefs.current[index]?.select();
  };

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "h-12 w-12 rounded-md border border-input bg-transparent text-center text-lg font-semibold shadow-xs transition-[color,box-shadow] outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          )}
          aria-label={`Chiffre ${index + 1} sur ${length}`}
        />
      ))}
    </div>
  );
}

/**
 * InputOTPGroup - Wrapper pour grouper visuellement les inputs OTP
 */
export function InputOTPGroup({ children, className }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
}

/**
 * InputOTPSeparator - Séparateur visuel entre les groupes d'inputs
 */
export function InputOTPSeparator() {
  return (
    <div className="flex items-center justify-center">
      <span className="text-muted-foreground text-xl">-</span>
    </div>
  );
}
