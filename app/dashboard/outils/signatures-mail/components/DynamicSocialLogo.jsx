"use client";

import React, { useState, useEffect } from "react";
import { generateColoredSocialLogo } from "../utils/svgToPng";

/**
 * Composant qui génère dynamiquement des logos sociaux colorés en PNG
 * et les upload sur Cloudflare pour compatibilité Gmail
 */
const DynamicSocialLogo = ({ logoType, color, size = 24 }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateLogo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Générer et uploader l'image PNG colorée
        const url = await generateColoredSocialLogo(logoType, color, size);
        setImageUrl(url);
      } catch (err) {
        console.error(`❌ Erreur génération ${logoType}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generateLogo();
  }, [logoType, color, size]);

  // Pendant le chargement, afficher le SVG inline
  if (loading) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            backgroundColor: color,
            borderRadius: "50%",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
    );
  }

  // En cas d'erreur, fallback vers SVG inline
  if (error || !imageUrl) {
    const SVG_FALLBACKS = {
      facebook: (
        <svg
          width={size}
          height={size}
          viewBox="0 0 50 50"
          style={{ display: "block" }}
        >
          <path
            fill={color}
            d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,19h-2c-2.14,0-3,0.5-3,2 v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z"
          />
        </svg>
      ),
      linkedin: (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{ display: "block" }}
        >
          <path
            fill={color}
            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
          />
        </svg>
      ),
      twitter: (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{ display: "block" }}
        >
          <path
            fill={color}
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
          />
        </svg>
      ),
      instagram: (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          style={{ display: "block" }}
        >
          <path
            fill={color}
            d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
          />
        </svg>
      ),
    };

    return (
      SVG_FALLBACKS[logoType] || (
        <div
          style={{
            width: size,
            height: size,
            backgroundColor: "#e5e7eb",
            borderRadius: "2px",
          }}
        />
      )
    );
  }

  // Afficher l'image PNG générée
  return (
    <img
      src={imageUrl}
      alt={logoType}
      width={size}
      height={size}
      style={{ display: "block" }}
      onError={() => setError("Image load failed")}
    />
  );
};

export default DynamicSocialLogo;
