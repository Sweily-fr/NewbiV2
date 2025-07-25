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
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [error, setError] = useState("");
  const [inputWidth, setInputWidth] = useState('auto');
  const inputRef = useRef(null);
  const measureRef = useRef(null);

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Effet séparé pour mettre à jour la largeur en temps réel
  useEffect(() => {
    if (isEditing && measureRef.current) {
      const textWidth = measureRef.current.scrollWidth;
      setInputWidth(Math.max(textWidth + 20, 60) + 'px'); // +20px pour le padding et la marge, minimum 60px
    }
  }, [isEditing, editValue]);

  const handleStartEdit = () => {
    if (disabled) return;
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
      <div className="relative">
        {/* Élément invisible pour mesurer la largeur du texte */}
        <span
          ref={measureRef}
          className={inputClassName}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'pre',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            letterSpacing: 'inherit',
            padding: '0'
          }}
        >
          {editValue || placeholder}
        </span>
        <InputComponent
          ref={inputRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            // Mettre à jour la largeur immédiatement après le changement
            setTimeout(() => {
              if (measureRef.current) {
                const textWidth = measureRef.current.scrollWidth;
                setInputWidth(Math.max(textWidth + 20, 60) + 'px');
              }
            }, 0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`${inputClassName} ${error ? "border-red-500" : ""}`}
          style={{ width: inputWidth, minWidth: '60px' }}
          maxLength={maxLength}
          rows={multiline ? 3 : undefined}
        />
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-500">
            {error}
          </div>
        )}
        {multiline && (
          <div className="absolute top-full left-0 mt-1 text-xs text-gray-500">
            Ctrl+Entrée pour sauvegarder, Échap pour annuler
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleStartEdit}
      className={`
        ${className} 
        ${displayClassName}
        ${isEmpty ? "text-gray-400 italic" : ""}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50 hover:outline hover:outline-1 hover:outline-gray-300 rounded px-1 -mx-1 transition-all duration-150"}
      `}
      title={disabled ? "" : "Cliquez pour éditer"}
    >
      {displayValue}
    </div>
  );
}

export default InlineEdit;
