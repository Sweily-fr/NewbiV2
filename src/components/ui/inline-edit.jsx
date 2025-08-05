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
      return Math.max(rect.width, 30) + 'px';
    }
    return 'auto';
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
      <span style={{ 
        display: 'inline-block',
        verticalAlign: 'baseline',
        position: 'relative'
      }}>
        {/* Élément invisible pour mesurer la largeur du texte */}
        <span
          ref={measureRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'pre',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            letterSpacing: 'inherit',
            textTransform: 'inherit',
            padding: '0',
            border: '0',
            margin: '0',
            overflow: 'hidden',
            top: '-9999px'
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
          className={`${inputClassName} ${error ? "border-red-500" : ""}`}
          style={{ 
            width: inputWidth, 
            minWidth: '60px',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit',
            lineHeight: 'inherit',
            verticalAlign: 'baseline',
            display: 'inline-block'
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
        margin: '0',
        padding: '0',
        border: 'none',
        outline: 'none',
        background: 'transparent'
      }}
      title={disabled ? "" : "Cliquez pour éditer"}
    >
      {displayValue}
    </div>
  );
}

export default InlineEdit;
