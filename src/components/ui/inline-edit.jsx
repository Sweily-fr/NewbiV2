"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * Composant d'édition inline style Framer
 * - Clic simple : sélectionne l'élément (bordure visible)
 * - Double-clic : entre en mode édition
 * - Clic ailleurs : désélectionne
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
  const [state, setState] = useState("normal"); // "normal" | "selected" | "editing"
  const [editValue, setEditValue] = useState(value || "");
  const [error, setError] = useState("");
  const containerRef = useRef(null);
  const editableRef = useRef(null);

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  // Gérer les clics en dehors pour désélectionner
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (state === "editing") {
          handleSave();
        } else if (state === "selected") {
          setState("normal");
        }
      }
    };

    if (state !== "normal") {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [state]);

  // Focus sur l'élément éditable quand on entre en mode édition
  useEffect(() => {
    if (state === "editing" && editableRef.current) {
      editableRef.current.focus();
      // Sélectionner tout le texte
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [state]);

  const handleClick = (e) => {
    if (disabled) return;
    e.stopPropagation();

    if (state === "normal") {
      setState("selected");
    }
  };

  const handleDoubleClick = (e) => {
    if (disabled) return;
    e.stopPropagation();

    setState("editing");
    setEditValue(value || "");
    setError("");
  };

  const handleSave = useCallback(() => {
    const newValue = editableRef.current?.innerText || editValue;

    // Validation
    if (validation) {
      const validationResult = validation(newValue);
      if (validationResult !== true) {
        setError(validationResult);
        return;
      }
    }

    onChange(newValue);
    setState("normal");
    setError("");
    onSave?.(newValue);
  }, [editValue, onChange, onSave, validation]);

  const handleCancel = () => {
    setEditValue(value || "");
    setState("normal");
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

  const handleInput = (e) => {
    setEditValue(e.target.innerText);
  };

  const displayValue = value || placeholder;
  const isEmpty = !value || value.trim() === "";

  // Styles selon l'état
  const getContainerStyle = () => {
    const baseStyle = {
      display: "inline-block",
      position: "relative",
      cursor: disabled ? "not-allowed" : "pointer",
      ...style,
    };

    switch (state) {
      case "selected":
        return {
          ...baseStyle,
          outline: "1px solid #5b4fff",
        };
      case "editing":
        return {
          ...baseStyle,
          outline: "1px solid #5b4fff",
        };
      default:
        return baseStyle;
    }
  };

  return (
    <span
      ref={containerRef}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`
        ${className}
        ${displayClassName}
        ${isEmpty && state !== "editing" ? "text-gray-400 italic" : ""}
        ${disabled ? "opacity-50" : ""}
        ${state === "normal" ? "hover:outline hover:outline-1 hover:outline-[#5b4fff]" : ""}
      `}
      style={getContainerStyle()}
      title={disabled ? "" : state === "normal" ? "Cliquez pour sélectionner" : state === "selected" ? "Double-cliquez pour éditer" : ""}
    >
      {state === "editing" ? (
        <>
          <span
            ref={editableRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            style={{
              outline: "none",
              minWidth: "20px",
              display: "inline-block",
              ...style,
            }}
          >
            {editValue}
          </span>
          {error && (
            <span
              style={{
                position: "absolute",
                top: "100%",
                left: "0",
                marginTop: "4px",
                fontSize: "11px",
                color: "#ef4444",
                whiteSpace: "nowrap",
              }}
            >
              {error}
            </span>
          )}
        </>
      ) : (
        <span style={{ ...style }}>{displayValue}</span>
      )}
    </span>
  );
}

export default InlineEdit;
