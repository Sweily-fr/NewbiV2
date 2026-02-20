"use client";

import React, { useState, useRef } from "react";
import { Pipette, Palette } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

// Convertir n'importe quelle couleur en HEX
const toHex = (color) => {
  if (!color) return "#000000";

  // Si déjà en HEX
  if (color.startsWith("#")) {
    return color.length === 7 ? color.toUpperCase() : "#000000";
  }

  // Si en HSL
  if (color.startsWith("hsl")) {
    const match = color.match(
      /hsl\((\d+\.?\d*),\s*(\d+\.?\d*)%,\s*(\d+\.?\d*)%\)/,
    );
    if (match) {
      const h = parseFloat(match[1]) / 360;
      const s = parseFloat(match[2]) / 100;
      const l = parseFloat(match[3]) / 100;

      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      const r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
      const g = Math.round(hue2rgb(p, q, h) * 255);
      const b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);

      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
    }
  }

  return "#000000";
};

// Extraire la teinte (hue) d'une couleur HEX
const hexToHue = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return 0;

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return Math.round(h * 360);
};

export function ColorPicker({
  color,
  onChange,
  className = "",
  align = "center",
  side = "bottom",
  sideOffset = 0,
  sideOffsetVw,
}) {
  // Convertir HEX en HSV pour initialisation
  const getInitialHsv = (hexColor) => {
    const hex = toHex(hexColor);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 50, v: 100 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: s * 100,
      v: v * 100,
    };
  };

  const initialHsv = getInitialHsv(color);

  const [currentColor, setCurrentColor] = useState(() => toHex(color));
  const [hexInput, setHexInput] = useState(() => toHex(color));
  const [isOpen, setIsOpen] = useState(false);
  const [hue, setHue] = useState(initialHsv.h);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({
    x: initialHsv.s,
    y: 100 - initialHsv.v,
  });
  const [colorFormat, setColorFormat] = useState("HEX"); // HEX, RGB, HSL
  const colorInputRef = useRef(null);
  const pickerRef = useRef(null);
  const isExternalSync = useRef(false);

  // Gérer le changement de couleur depuis l'input natif
  const handleNativeColorChange = (e) => {
    const newColor = e.target.value.toUpperCase();
    setCurrentColor(newColor);
    setHexInput(newColor);
    onChange(newColor);
  };

  // Convertir HEX en RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  // Convertir HEX en HSL
  const hexToHsl = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm:
          h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
          break;
        case gNorm:
          h = ((bNorm - rNorm) / d + 2) / 6;
          break;
        case bNorm:
          h = ((rNorm - gNorm) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  // Obtenir la valeur formatée selon le format actuel
  const getFormattedColor = () => {
    if (colorFormat === "HEX") {
      return currentColor;
    } else if (colorFormat === "RGB") {
      const { r, g, b } = hexToRgb(currentColor);
      return `${r}, ${g}, ${b}`;
    } else if (colorFormat === "HSL") {
      const { h, s, l } = hexToHsl(currentColor);
      return `${h}°, ${s}%, ${l}%`;
    }
    return currentColor;
  };

  // Convertir HEX en HSV pour mettre à jour le picker
  const hexToHsv = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, v: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    if (max !== min) {
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: s * 100,
      v: v * 100,
    };
  };

  // Gérer l'input texte selon le format
  const handleColorInputChange = (e) => {
    const value = e.target.value;
    setHexInput(value);

    if (colorFormat === "HEX") {
      let hex = value.toUpperCase();
      if (!hex.startsWith("#")) hex = "#" + hex;
      hex = "#" + hex.slice(1).replace(/[^0-9A-F]/g, "");
      hex = hex.slice(0, 7);

      if (/^#[0-9A-F]{6}$/.test(hex)) {
        setCurrentColor(hex);
        onChange(hex);

        // Mettre à jour le bloc de couleur et le curseur
        const hsv = hexToHsv(hex);
        setHue(hsv.h);
        setCursorPosition({ x: hsv.s, y: 100 - hsv.v });
      }
    } else if (colorFormat === "RGB") {
      const match = value.match(/(\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const r = Math.min(255, parseInt(match[1]));
        const g = Math.min(255, parseInt(match[2]));
        const b = Math.min(255, parseInt(match[3]));
        const hex =
          `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
        setCurrentColor(hex);
        onChange(hex);

        // Mettre à jour le bloc de couleur et le curseur
        const hsv = hexToHsv(hex);
        setHue(hsv.h);
        setCursorPosition({ x: hsv.s, y: 100 - hsv.v });
      }
    } else if (colorFormat === "HSL") {
      const match = value.match(/(\d+)°?,\s*(\d+)%?,\s*(\d+)%?/);
      if (match) {
        const h = parseInt(match[1]) % 360;
        const s = Math.min(100, parseInt(match[2]));
        const l = Math.min(100, parseInt(match[3]));
        // Conversion HSL vers RGB puis HEX (réutiliser la logique existante)
        const hNorm = h / 360;
        const sNorm = s / 100;
        const lNorm = l / 100;

        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };

        const q =
          lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
        const p = 2 * lNorm - q;
        const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
        const g = Math.round(hue2rgb(p, q, hNorm) * 255);
        const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

        const hex =
          `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
        setCurrentColor(hex);
        onChange(hex);

        // Mettre à jour le bloc de couleur et le curseur
        const hsv = hexToHsv(hex);
        setHue(hsv.h);
        setCursorPosition({ x: hsv.s, y: 100 - hsv.v });
      }
    }
  };

  // Basculer entre les formats
  const toggleColorFormat = () => {
    const formats = ["HEX", "RGB", "HSL"];
    const currentIndex = formats.indexOf(colorFormat);
    const nextFormat = formats[(currentIndex + 1) % formats.length];
    setColorFormat(nextFormat);

    // Mettre à jour hexInput avec le nouveau format
    if (nextFormat === "HEX") {
      setHexInput(currentColor);
    } else if (nextFormat === "RGB") {
      const { r, g, b } = hexToRgb(currentColor);
      setHexInput(`${r}, ${g}, ${b}`);
    } else if (nextFormat === "HSL") {
      const { h, s, l } = hexToHsl(currentColor);
      setHexInput(`${h}°, ${s}%, ${l}%`);
    }
  };

  // Synchroniser l'état interne quand la prop color change (ex: chargement depuis la BDD)
  React.useEffect(() => {
    const newHex = toHex(color);
    if (newHex !== currentColor) {
      isExternalSync.current = true;
      setCurrentColor(newHex);
      setHexInput(newHex);
      const hsv = getInitialHsv(newHex);
      setHue(hsv.h);
      setCursorPosition({ x: hsv.s, y: 100 - hsv.v });
    }
  }, [color]);

  // Synchroniser hexInput quand currentColor change (depuis le picker ou le slider)
  React.useEffect(() => {
    if (colorFormat === "HEX") {
      setHexInput(currentColor);
    } else if (colorFormat === "RGB") {
      const { r, g, b } = hexToRgb(currentColor);
      setHexInput(`${r}, ${g}, ${b}`);
    } else if (colorFormat === "HSL") {
      const { h, s, l } = hexToHsl(currentColor);
      setHexInput(`${h}°, ${s}%, ${l}%`);
    }
  }, [currentColor, colorFormat]);

  // EyeDropper API
  const handleEyeDropper = async () => {
    if (!window.EyeDropper) {
      alert(
        "L'outil pipette n'est pas supporté par votre navigateur. Essayez Chrome ou Edge.",
      );
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const hexColor = result.sRGBHex.toUpperCase();
      setCurrentColor(hexColor);
      setHexInput(hexColor);
      onChange(hexColor);
    } catch (error) {
      // Utilisateur a annulé
    }
  };

  // Ouvrir le picker natif
  const handleOpenNativePicker = () => {
    colorInputRef.current?.click();
  };

  // Convertir HSV en RGB
  const hsvToRgb = (h, s, v) => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0,
      g = 0,
      b = 0;

    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (h >= 300 && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  };

  // Gérer le drag sur le bloc de couleur
  const handlePickerMouseDown = (e) => {
    setIsDragging(true);
    updateColorFromPicker(e);
  };

  const updateColorFromPicker = (e) => {
    if (!pickerRef.current) return;

    const rect = pickerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    // Mettre à jour la position du curseur en pourcentage
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    setCursorPosition({ x: xPercent, y: yPercent });

    // Calculer saturation (0-1) et value (0-1) depuis la position
    const saturation = x / rect.width;
    const value = 1 - y / rect.height;

    // Convertir HSV en RGB
    const [r, g, b] = hsvToRgb(hue, saturation, value);

    // Convertir en HEX
    const hex =
      `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();

    setCurrentColor(hex);
    setHexInput(hex);
    onChange(hex);
  };

  const handlePickerMouseMove = (e) => {
    if (isDragging) {
      updateColorFromPicker(e);
    }
  };

  const handlePickerMouseUp = () => {
    setIsDragging(false);
  };

  // Attacher les événements globaux pour le drag
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handlePickerMouseMove);
      document.addEventListener("mouseup", handlePickerMouseUp);
      return () => {
        document.removeEventListener("mousemove", handlePickerMouseMove);
        document.removeEventListener("mouseup", handlePickerMouseUp);
      };
    }
  }, [isDragging, hue]);

  // Recalculer la couleur quand la teinte change (seulement par interaction utilisateur)
  React.useEffect(() => {
    // Ne pas recalculer si le changement vient d'une sync externe (prop color)
    // pour éviter les dérives d'arrondi HSV -> HEX
    if (isExternalSync.current) {
      isExternalSync.current = false;
      return;
    }

    // Calculer saturation et value depuis la position actuelle du curseur
    const saturation = cursorPosition.x / 100;
    const value = 1 - cursorPosition.y / 100;

    // Convertir HSV en RGB
    const [r, g, b] = hsvToRgb(hue, saturation, value);

    // Convertir en HEX
    const hex =
      `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();

    setCurrentColor(hex);
    setHexInput(hex);
    onChange(hex);
  }, [hue]);

  const colorPresets = [
    "#1d1d1b",
    "#FFFFFF",
    "#FF3B30",
    "#FF9500",
    "#FFCC00",
    "#4CD964",
    "#5AC8FA",
    "#007AFF",
    "#5856D6",
    "#FF2D55",
    "#8E8E93",
    "#E5E5EA",
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`h-8 px-2 justify-start gap-2 ${className}`}
        >
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
          <span className="text-xs font-mono">{currentColor.slice(1)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-4 rounded-xl"
        align={align}
        side={side}
        sideOffset={sideOffset}
        style={
          sideOffsetVw ? { transform: `translateX(${sideOffsetVw}vw)` } : {}
        }
      >
        <div className="space-y-4">
          {/* Input natif caché */}
          <input
            ref={colorInputRef}
            type="color"
            value={currentColor}
            onChange={handleNativeColorChange}
            className="sr-only"
          />

          {/* Bloc de sélection de couleur avec curseur */}
          <div
            ref={pickerRef}
            className="w-full h-48 rounded-lg cursor-crosshair relative select-none overflow-hidden"
            onMouseDown={handlePickerMouseDown}
            style={{
              backgroundColor: `hsl(${hue}, 100%, 50%)`,
            }}
          >
            {/* Gradient blanc à transparent (saturation) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to right, #fff, transparent)",
              }}
            />
            {/* Gradient transparent à noir (value/brightness) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(to bottom, transparent, #000)",
              }}
            />
            {/* Curseur */}
            <div
              className="w-5 h-5 rounded-full border-2 border-white shadow-lg absolute pointer-events-none"
              style={{
                left: `${cursorPosition.x}%`,
                top: `${cursorPosition.y}%`,
                transform: "translate(-50%, -50%)",
                backgroundColor: currentColor,
                boxShadow:
                  "0 0 0 1px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)",
              }}
            />
          </div>

          {/* Slider de teinte */}
          <input
            type="range"
            min="0"
            max="360"
            value={hue}
            onChange={(e) => setHue(Number(e.target.value))}
            className="w-full h-3 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, 
                hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), 
                hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%)
              )`,
            }}
          />

          {/* Input et boutons */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 px-3 font-mono text-xs"
                onClick={toggleColorFormat}
                title="Changer le format"
              >
                {colorFormat}
              </Button>
              <Input
                type="text"
                value={hexInput}
                onChange={handleColorInputChange}
                className="flex-1 h-9 px-3 font-mono text-sm"
                placeholder={
                  colorFormat === "HEX"
                    ? "#000000"
                    : colorFormat === "RGB"
                      ? "255, 255, 255"
                      : "0°, 0%, 0%"
                }
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleEyeDropper}
                title="Capturer une couleur"
              >
                <Pipette className="h-4 w-4" />
              </Button>
              <div
                className="w-9 h-9 rounded border-2 border-gray-300"
                style={{ backgroundColor: currentColor }}
              />
            </div>
          </div>

          {/* Couleurs prédéfinies */}
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">
              Couleurs rapides
            </p>
            <div className="grid grid-cols-6 gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset}
                  className="w-full aspect-square rounded border-2 border-gray-300 hover:border-gray-400 hover:scale-105 transition-all"
                  style={{ backgroundColor: preset }}
                  onClick={() => {
                    const hsv = hexToHsv(preset);
                    setCurrentColor(preset);
                    setHexInput(preset);
                    setHue(hsv.h);
                    setCursorPosition({ x: hsv.s, y: 100 - hsv.v });
                    onChange(preset);
                  }}
                  title={preset}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
