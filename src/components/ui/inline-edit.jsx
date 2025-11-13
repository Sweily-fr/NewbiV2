"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";

/**
 * Composant d'édition inline pour les champs de texte
 * Permet de cliquer sur un texte pour l'éditer directement
 */
export function InlineEdit({
  value,
  onChange,
  placeholder = "Cliquez pour éditer",
  className = "",
  multiline = false,
  displayClassName = "",
  inputClassName = "",
  onSave,
  onCancel,
  disabled = false,
  maxLength,
  validation,
  style = {},
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [error, setError] = useState("");
  const [inputWidth, setInputWidth] = useState("auto");
  const inputRef = useRef(null);
  const measureRef = useRef(null);
  const displayRef = useRef(null);

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  // Fonction pour calculer la largeur exacte du texte affiché
  const calculateTextWidth = (text) => {
    if (measureRef.current && displayRef.current) {
      // Copier exactement les styles du texte affiché
      const computedStyle = window.getComputedStyle(displayRef.current);
      measureRef.current.style.fontSize = computedStyle.fontSize;
      measureRef.current.style.fontFamily = computedStyle.fontFamily;
      measureRef.current.style.fontWeight = computedStyle.fontWeight;
      measureRef.current.style.letterSpacing = computedStyle.letterSpacing;
      measureRef.current.style.textTransform = computedStyle.textTransform;

      // Utiliser le texte exact ou le placeholder
      const textToMeasure = text || placeholder;
      measureRef.current.textContent = textToMeasure;

      // Obtenir les dimensions exactes du texte affiché
      const rect = displayRef.current.getBoundingClientRect();
      return Math.max(rect.width, 30) + "px";
    }
    return "auto";
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Effet séparé pour mettre à jour la largeur en temps réel
  useEffect(() => {
    if (isEditing && measureRef.current) {
      setInputWidth(calculateTextWidth(editValue));
    }
  }, [isEditing, editValue]);

  const handleStartEdit = () => {
    if (disabled) return;

    // Pré-calculer la largeur exacte avant d'entrer en mode édition
    // pour garantir zéro décalage visuel
    const initialWidth = calculateTextWidth(value || "");
    setInputWidth(initialWidth);

    setIsEditing(true);
    setEditValue(value || "");
    setError("");
  };

  const handleSave = () => {
    // Validation
    if (validation) {
      const validationResult = validation(editValue);
      if (validationResult !== true) {
        setError(validationResult);
        return;
      }
    }

    onChange(editValue);
    setIsEditing(false);
    setError("");
    onSave?.(editValue);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
    setError("");
    onCancel?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    } else if (e.key === "Enter" && e.ctrlKey && multiline) {
      handleSave();
    }
  };

  const handleBlur = () => {
    // Petit délai pour permettre aux boutons d'être cliqués
    setTimeout(() => {
      if (isEditing) {
        handleSave();
      }
    }, 150);
  };

  const displayValue = value || placeholder;
  const isEmpty = !value || value.trim() === "";

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input;

    return (
      <span
        style={{
          display: "inline-block",
          verticalAlign: "baseline",
          position: "relative",
        }}
      >
        {/* Élément invisible pour mesurer la largeur du texte */}
        <span
          ref={measureRef}
          style={{
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "pre",
            fontSize: "inherit",
            fontFamily: "inherit",
            fontWeight: "inherit",
            letterSpacing: "inherit",
            textTransform: "inherit",
            padding: "0",
            border: "0",
            margin: "0",
            overflow: "hidden",
            top: "-9999px",
          }}
        >
          {editValue || placeholder}
        </span>
        <InputComponent
          ref={inputRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`${inputClassName} ${error ? "border-red-500 shadow-red-100" : "border-blue-200 shadow-blue-50"} 
            transition-all duration-200 ease-in-out
            focus:border-blue-400 focus:shadow-blue-100 focus:shadow-md
            hover:border-blue-300 hover:shadow-blue-50 hover:shadow-sm
            bg-white/80 backdrop-blur-sm
            rounded-md px-2 py-1
            selection:bg-[#5b4fff]/50 selection:bg-[#5b4fff]/90`}
          style={{
            width: inputWidth,
            minWidth: "60px",
            fontSize: style.fontSize || "inherit",
            fontFamily: style.fontFamily || "inherit",
            fontWeight: style.fontWeight || "inherit",
            color: style.color || "inherit",
            lineHeight: "inherit",
            verticalAlign: "baseline",
            display: "inline-block",
            outline: "none",
            border: "1px solid",
            fontStyle: style.fontStyle || "inherit",
            textDecoration: style.textDecoration || "inherit",
          }}
          maxLength={maxLength}
          rows={multiline ? 3 : undefined}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-500">
            {error}
          </div>
        )}
      </span>
    );
  }

  return (
    <div
      ref={displayRef}
      onClick={handleStartEdit}
      className={`
        ${className} 
        ${displayClassName}
        ${isEmpty ? "text-gray-400 italic" : ""}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
      `}
      style={{
        margin: "0",
        padding: "2px 4px",
        border: "none",
        outline: "none",
        background: "transparent",
        borderRadius: "4px",
        transition: "all 0.15s ease-in-out",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isEditing) {
          e.target.style.backgroundColor = "rgba(91, 79, 255, 0.15)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isEditing) {
          e.target.style.backgroundColor = "transparent";
        }
      }}
      title={disabled ? "" : "Cliquez pour éditer"}
    >
      {displayValue}
    </div>
  );
}

export default InlineEdit;
