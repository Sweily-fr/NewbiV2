/**
 * Composant pour afficher un SVG inline directement
 * Charge le SVG et l'insère comme balise <svg>
 */

"use client";

import React, { useState, useEffect } from "react";

const InlineSVG = ({ src, alt = "", size = 24, className = "" }) => {
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSVG = async () => {
      try {
        setLoading(true);
        console.log(`🔍 Chargement SVG depuis: ${src}`);
        
        const response = await fetch(src, {
          mode: 'cors',
          credentials: 'omit',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch SVG: ${response.statusText}`);
        }
        
        const svgText = await response.text();
        console.log(`✅ SVG chargé avec succès:`, svgText.substring(0, 100));
        
        // Parser le SVG pour extraire le contenu
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        if (svgElement) {
          // Ajouter les attributs de taille
          svgElement.setAttribute('width', size);
          svgElement.setAttribute('height', size);
          svgElement.style.display = 'block';
          
          setSvgContent(svgElement.outerHTML);
          setError(null);
        } else {
          throw new Error('No SVG element found');
        }
      } catch (err) {
        console.error(`❌ Erreur chargement SVG ${src}:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (src) {
      fetchSVG();
    }
  }, [src, size]);

  if (loading) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "#f3f4f6",
          borderRadius: "2px",
          display: "inline-block",
        }}
      />
    );
  }

  if (error) {
    console.error(`❌ Erreur SVG ${src}:`, error);
    // Fallback sur <img> si le fetch échoue
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          display: "block",
          border: "none",
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-block",
        lineHeight: 0,
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      title={alt}
    />
  );
};

export default InlineSVG;
