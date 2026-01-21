"use client";

import React, { useState, useRef, useEffect } from "react";

/**
 * TextWidget - Editable text block widget
 * Supports inline editing with double-click (Framer-style)
 */
export default function TextWidget({
  props,
  signatureData,
  onUpdate,
  onFieldChange,
  isSelected,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState("");
  const inputRef = useRef(null);

  // Get the actual content from either props.content or linked field
  const getContent = () => {
    if (props.field && signatureData) {
      return signatureData[props.field] || props.content || "";
    }
    return props.content || "";
  };

  useEffect(() => {
    setLocalValue(getContent());
  }, [props.field, props.content, signatureData]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (props.editable !== false) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (props.field && onFieldChange) {
      onFieldChange(props.field, localValue);
    } else if (onUpdate) {
      onUpdate({ content: localValue });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalValue(getContent());
      setIsEditing(false);
    }
  };

  const textStyle = {
    fontFamily: props.fontFamily || "Arial, sans-serif",
    fontSize: `${props.fontSize || 14}px`,
    fontWeight: props.fontWeight || "400",
    color: props.color || "#171717",
    textAlign: props.textAlign || "left",
    lineHeight: props.lineHeight || 1.4,
    margin: 0,
    padding: 0,
    display: "block",
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          ...textStyle,
          border: "none",
          outline: "none",
          background: "transparent",
          width: "100%",
          minWidth: "50px",
        }}
        className="focus:ring-0"
      />
    );
  }

  return (
    <span
      onDoubleClick={handleDoubleClick}
      style={textStyle}
      className={props.editable !== false ? "cursor-text hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors rounded px-0.5 -mx-0.5" : ""}
    >
      {getContent() || (props.editable !== false ? "Double-cliquez pour modifier" : "")}
    </span>
  );
}
