"use client";

import React from "react";

/**
 * SpacerWidget - Empty space widget for layout control
 */
export default function SpacerWidget({ props, isSelected }) {
  const spacerStyle = {
    width: props.width || '100%',
    height: `${props.height || 16}px`,
    display: 'block',
  };

  return (
    <div
      style={spacerStyle}
      className={isSelected ? "bg-blue-50/50 border border-dashed border-blue-300" : ""}
    />
  );
}
