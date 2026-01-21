"use client";

import React from "react";

/**
 * SeparatorWidget - Horizontal or vertical divider line
 */
export default function SeparatorWidget({ props, isSelected }) {
  const isHorizontal = props.orientation !== 'vertical';

  const separatorStyle = isHorizontal
    ? {
        width: props.length || '100%',
        height: `${props.thickness || 1}px`,
        backgroundColor: props.color || '#e0e0e0',
        borderRadius: `${props.borderRadius || 0}px`,
        display: 'block',
      }
    : {
        width: `${props.thickness || 1}px`,
        height: props.length || '50px',
        backgroundColor: props.color || '#e0e0e0',
        borderRadius: `${props.borderRadius || 0}px`,
        display: 'block',
        minHeight: '30px',
      };

  return (
    <div
      style={separatorStyle}
      className={isSelected ? "ring-1 ring-blue-300" : ""}
    />
  );
}
