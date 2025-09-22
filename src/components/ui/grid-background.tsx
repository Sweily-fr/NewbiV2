"use client"

import * as React from "react"

export function GridBackground({ className = "" }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
    >
      {/* Grille de base */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
      />
      {/* Gradient de masquage pour effet de fondu */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to right, rgba(249, 250, 251, 1) 0%, rgba(249, 250, 251, 0.7) 30%, rgba(249, 250, 251, 0.3) 60%, rgba(249, 250, 251, 0) 100%)`,
        }}
      />
    </div>
  )
}