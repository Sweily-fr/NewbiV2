"use client";

import React from "react";

// Base URL for Cloudflare social icons
const CLOUDFLARE_SOCIAL_BASE = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social";

// Get social icon URL from Cloudflare
const getSocialIconUrl = (platform, color = "black") => {
  const cloudflareplatform = platform === "x" ? "twitter" : platform;
  return `${CLOUDFLARE_SOCIAL_BASE}/${cloudflareplatform}/${cloudflareplatform}-${color}.png`;
};

// Valid color names for Cloudflare icons
const validColors = ["blue", "pink", "purple", "black", "red", "green", "yellow", "orange", "indigo", "sky"];

// Convert hex to color name
const getColorName = (colorInput) => {
  if (!colorInput) return "black";
  const color = colorInput.toLowerCase().trim();
  if (validColors.includes(color)) return color;

  const hexColor = color.replace("#", "");
  const colorMap = {
    "0077b5": "blue",
    "1877f2": "blue",
    "e4405f": "pink",
    "833ab4": "purple",
    "000000": "black",
    "1da1f2": "blue",
    "ff0000": "red",
    "333333": "black",
  };
  return colorMap[hexColor] || "black";
};

/**
 * SocialIconsWidget - Social media icons group
 */
export default function SocialIconsWidget({ props, signatureData, isSelected }) {
  // Get icons from props or use defaults
  const icons = props.icons || ["facebook", "linkedin", "x"];
  const size = props.size || 20;
  const gap = props.gap || 8;
  const color = getColorName(props.color);
  const alignment = props.alignment || "left";

  // Get social networks from signatureData if available
  const getSocialNetworks = () => {
    if (signatureData?.socialNetworks) {
      return Object.keys(signatureData.socialNetworks).filter(
        (key) => signatureData.socialNetworks[key]
      );
    }
    return icons;
  };

  const networksToShow = getSocialNetworks().length > 0 ? getSocialNetworks() : icons;

  const containerStyle = {
    display: "flex",
    gap: `${gap}px`,
    justifyContent:
      alignment === "center"
        ? "center"
        : alignment === "right"
        ? "flex-end"
        : "flex-start",
    flexWrap: "wrap",
  };

  const iconStyle = {
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "contain",
    display: "block",
  };

  return (
    <div style={containerStyle} className={isSelected ? "p-1 -m-1 rounded" : ""}>
      {networksToShow.map((network) => (
        <img
          key={network}
          src={getSocialIconUrl(network, color)}
          alt={network}
          style={iconStyle}
        />
      ))}
    </div>
  );
}
