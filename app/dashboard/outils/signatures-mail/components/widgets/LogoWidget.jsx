"use client";

import React, { useRef } from "react";
import { Building2 } from "lucide-react";

/**
 * LogoWidget - Company logo widget
 */
export default function LogoWidget({
  props,
  signatureData,
  onUpdate,
  onImageUpload,
  isSelected,
}) {
  const fileInputRef = useRef(null);

  // Get the actual logo source from either props.src or linked field
  const getSrc = () => {
    if (props.field && signatureData) {
      return signatureData[props.field] || props.src;
    }
    return props.src;
  };

  const src = getSrc();

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSelected) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      await onImageUpload(props.field || 'logo', file);
    }
  };

  const logoWidth = props.width || props.maxWidth || 150;
  const logoStyle = {
    width: `${logoWidth}px`,
    height: 'auto',
    objectFit: props.objectFit || 'contain',
    display: 'block',
  };

  const placeholderStyle = {
    width: '100px',
    height: '40px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #d1d5db',
    borderRadius: '4px',
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {src ? (
        <img
          src={src}
          alt={props.alt || "Logo"}
          style={logoStyle}
          onClick={handleClick}
          className={isSelected ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
        />
      ) : (
        <div
          style={placeholderStyle}
          onClick={handleClick}
          className="cursor-pointer hover:bg-neutral-100 transition-colors"
        >
          <Building2 className="w-5 h-5 text-neutral-400" />
        </div>
      )}
    </div>
  );
}
