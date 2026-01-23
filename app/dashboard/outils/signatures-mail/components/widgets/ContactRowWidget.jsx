"use client";

import React, { useState, useRef, useEffect } from "react";

// Cloudflare icon base URL
const CLOUDFLARE_ICONS_BASE = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/icons";

// Field to icon mapping
const FIELD_ICONS = {
  phone: "phone",
  mobile: "smartphone",
  email: "mail",
  website: "globe",
  address: "map-pin",
};

// Get icon URL
const getIconUrl = (field) => {
  const iconName = FIELD_ICONS[field] || "info";
  return `${CLOUDFLARE_ICONS_BASE}/${iconName}.png`;
};

/**
 * ContactRowWidget - Single contact info row (phone, email, website, etc.)
 */
export default function ContactRowWidget({
  props,
  signatureData,
  onUpdate,
  onFieldChange,
  isSelected,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState("");
  const inputRef = useRef(null);

  const field = props.field || "phone";
  const showIcon = props.showIcon !== false;
  const iconSize = props.iconSize || 14;
  const fontSize = props.fontSize || 12;
  const color = props.color || "#666666";
  const prefix = props.prefix || "";

  // Get the actual value from signatureData
  const getValue = () => {
    if (signatureData && signatureData[field]) {
      return signatureData[field];
    }
    return "";
  };

  useEffect(() => {
    setLocalValue(getValue());
  }, [field, signatureData]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (onFieldChange) {
      onFieldChange(field, localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setLocalValue(getValue());
      setIsEditing(false);
    }
  };

  const value = getValue();

  // Don't render if no value and not editing
  if (!value && !isEditing && !isSelected) {
    return null;
  }

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const iconStyle = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    objectFit: "contain",
    flexShrink: 0,
  };

  const textStyle = {
    fontFamily: props.fontFamily || "Arial, sans-serif",
    fontSize: `${fontSize}px`,
    color: color,
    lineHeight: 1.4,
    margin: 0,
    padding: 0,
  };

  // Render link if it's email or website
  const renderContent = () => {
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
            minWidth: "100px",
          }}
        />
      );
    }

    const displayValue = prefix ? `${prefix} ${value}` : value;

    if (field === "email" && value) {
      return (
        <a
          href={`mailto:${value}`}
          style={{ ...textStyle, textDecoration: "none" }}
          onDoubleClick={handleDoubleClick}
          className="cursor-text hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors rounded px-0.5 -mx-0.5"
        >
          {displayValue}
        </a>
      );
    }

    if (field === "website" && value) {
      const url = value.startsWith("http") ? value : `https://${value}`;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...textStyle, textDecoration: "none" }}
          onDoubleClick={handleDoubleClick}
          className="cursor-text hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors rounded px-0.5 -mx-0.5"
        >
          {displayValue}
        </a>
      );
    }

    if (field === "phone" || field === "mobile") {
      const tel = value.replace(/\s+/g, "");
      return (
        <a
          href={`tel:${tel}`}
          style={{ ...textStyle, textDecoration: "none" }}
          onDoubleClick={handleDoubleClick}
          className="cursor-text hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors rounded px-0.5 -mx-0.5"
        >
          {displayValue}
        </a>
      );
    }

    return (
      <span
        style={textStyle}
        onDoubleClick={handleDoubleClick}
        className="cursor-text hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors rounded px-0.5 -mx-0.5"
      >
        {displayValue || "Double-cliquez pour modifier"}
      </span>
    );
  };

  return (
    <div style={containerStyle}>
      {showIcon && (
        <img
          src={getIconUrl(field)}
          alt={field}
          style={iconStyle}
          onError={(e) => {
            // Fallback to a simple colored square if icon fails
            e.target.style.display = "none";
          }}
        />
      )}
      {renderContent()}
    </div>
  );
}
