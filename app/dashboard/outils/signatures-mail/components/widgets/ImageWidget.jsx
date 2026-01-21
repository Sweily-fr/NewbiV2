"use client";

import React, { useRef } from "react";
import { ImagePlus } from "lucide-react";

/**
 * ImageWidget - Profile photo or custom image widget
 */
export default function ImageWidget({
  props,
  signatureData,
  onUpdate,
  onImageUpload,
  isSelected,
}) {
  const fileInputRef = useRef(null);

  // Get the actual image source from either props.src or linked field
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
      await onImageUpload(props.field || 'photo', file);
    }
  };

  const imageStyle = {
    width: `${props.width || 70}px`,
    height: props.height === 'auto' ? 'auto' : `${props.height || 70}px`,
    borderRadius: props.borderRadius || '50%',
    objectFit: props.objectFit || 'cover',
    display: 'block',
  };

  const placeholderStyle = {
    ...imageStyle,
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #d1d5db',
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
          alt={props.alt || "Image"}
          style={imageStyle}
          onClick={handleClick}
          className={isSelected ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
        />
      ) : (
        <div
          style={placeholderStyle}
          onClick={handleClick}
          className="cursor-pointer hover:bg-neutral-100 transition-colors"
        >
          <ImagePlus className="w-6 h-6 text-neutral-400" />
        </div>
      )}
    </div>
  );
}
