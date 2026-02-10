"use client";

import React, { useState, useRef, useEffect } from "react";
import { GripVertical } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ELEMENT_TYPES } from "../../utils/block-registry";
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Smartphone,
} from "lucide-react";

// Cloudflare R2 base URL for social icons
const CLOUDFLARE_SOCIAL_BASE = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social";

// Function to get social icon URL from Cloudflare
const getSocialIconUrl = (platform, color = "black") => {
  const cloudflareplatform = platform === "x" ? "twitter" : platform;
  return `${CLOUDFLARE_SOCIAL_BASE}/${cloudflareplatform}/${cloudflareplatform}-${color}.png`;
};

// Function to convert hex color to color name for Cloudflare
const getColorName = (colorInput) => {
  if (!colorInput) return "black";
  const color = colorInput.toLowerCase().trim();
  const validColorNames = ["blue", "pink", "purple", "black", "red", "green", "yellow", "orange", "indigo", "sky"];
  if (validColorNames.includes(color)) return color;

  const hexColor = color.replace("#", "");
  const colorMap = {
    "0077b5": "blue", "1877f2": "blue", "e4405f": "pink", "833ab4": "purple",
    "000000": "black", "1da1f2": "blue", "ff0000": "red", "333333": "black",
  };
  return colorMap[hexColor] || "black";
};

/**
 * BlockElement - Individual element within a block
 * Features:
 * - Sortable within parent block
 * - Click to select
 * - Inline editing for text elements
 * - Renders content based on element type
 */
export default function BlockElement({
  element,
  blockId,
  isSelected,
  onSelect,
  signatureData,
  onFieldChange,
  onUpdateElement,
  isSingleElement = false,
  onMoveElement,
  onReorderElement,
  parentLayout = "vertical",
  draggable: externalDraggable,
  onDragStart: externalOnDragStart,
  onUpdate,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after' | null
  const editableRef = useRef(null);
  const elementRef = useRef(null);

  // Handle element click
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(element.id, blockId);
  };

  // Handle double-click for inline editing
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (isTextEditable(element.type)) {
      setIsEditing(true);
    }
  };

  // Focus on editable when editing starts
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, [isEditing]);

  // Check if element type supports inline editing
  const isTextEditable = (type) => {
    return [
      ELEMENT_TYPES.NAME,
      ELEMENT_TYPES.POSITION,
      ELEMENT_TYPES.COMPANY,
      ELEMENT_TYPES.PHONE,
      ELEMENT_TYPES.MOBILE,
      ELEMENT_TYPES.EMAIL,
      ELEMENT_TYPES.WEBSITE,
      ELEMENT_TYPES.ADDRESS,
      ELEMENT_TYPES.TEXT,
    ].includes(type);
  };

  // Get the field name for signatureData based on element type
  const getFieldName = (type) => {
    const mapping = {
      [ELEMENT_TYPES.NAME]: "fullName",
      [ELEMENT_TYPES.POSITION]: "jobTitle",
      [ELEMENT_TYPES.COMPANY]: "company",
      [ELEMENT_TYPES.PHONE]: "phone",
      [ELEMENT_TYPES.MOBILE]: "mobile",
      [ELEMENT_TYPES.EMAIL]: "email",
      [ELEMENT_TYPES.WEBSITE]: "website",
      [ELEMENT_TYPES.ADDRESS]: "address",
    };
    return mapping[type];
  };

  // Get element value from signatureData
  const getValue = () => {
    const fieldName = getFieldName(element.type);
    if (fieldName && signatureData) {
      return signatureData[fieldName] || "";
    }
    if (element.type === ELEMENT_TYPES.TEXT) {
      return element.props?.content || "";
    }
    return "";
  };

  // Handle blur - save changes
  const handleBlur = (e) => {
    setIsEditing(false);
    const newValue = e.target.innerText.trim();
    const fieldName = getFieldName(element.type);

    if (fieldName && onFieldChange) {
      onFieldChange(fieldName, newValue);
    } else if (element.type === ELEMENT_TYPES.TEXT) {
      onUpdateElement(element.id, { content: newValue });
    }
  };

  // Handle keydown - Enter to save, Escape to cancel
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      editableRef.current?.blur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  // Native drag handlers for moving elements between blocks
  const handleDragStart = (e) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setIsDragging(true);

    // Use external drag start if provided
    if (externalOnDragStart) {
      externalOnDragStart(e);
      return;
    }

    // Store element data for cross-block movement (format: elementId::containerId)
    e.dataTransfer.setData("application/x-element-id", `${element.id}::${blockId}`);
    e.dataTransfer.effectAllowed = "move";

    // Create drag image
    const dragImage = document.createElement("div");
    dragImage.style.cssText = `
      padding: 8px 12px;
      background: white;
      border: 1px solid #5a50ff;
      border-radius: 6px;
      font-size: 12px;
      color: #5a50ff;
      box-shadow: 0 4px 12px rgba(90, 80, 255, 0.2);
      position: absolute;
      top: -1000px;
      left: -1000px;
    `;
    dragImage.textContent = element.type;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 40, 20);
    requestAnimationFrame(() => document.body.removeChild(dragImage));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle drag over for reordering - detect position (before/after)
  const handleDragOver = (e) => {
    const hasElementData = e.dataTransfer.types.includes("application/x-element-id");
    if (hasElementData && elementRef.current) {
      e.preventDefault();
      e.stopPropagation();

      // Calculate if mouse is in the first half or second half of the element
      const rect = elementRef.current.getBoundingClientRect();
      const mouseY = e.clientY;
      const mouseX = e.clientX;

      // Determine position based on element layout context
      // For vertical layouts, use Y position; for horizontal, use X
      const midY = rect.top + rect.height / 2;
      const midX = rect.left + rect.width / 2;

      // Check if the parent flex is horizontal or vertical
      const parent = elementRef.current.parentElement;
      const isHorizontalLayout = parent && window.getComputedStyle(parent).flexDirection === 'row';

      if (isHorizontalLayout) {
        setDropPosition(mouseX < midX ? 'before' : 'after');
      } else {
        setDropPosition(mouseY < midY ? 'before' : 'after');
      }
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropPosition(null);
    }
  };

  const handleDrop = (e) => {
    const elementData = e.dataTransfer.getData("application/x-element-id");

    // Only handle element drops, let other drops bubble up to parent
    if (!elementData) {
      return;
    }

    // Parse the new format: elementId::containerId
    const [draggedElementId, sourceContainerId] = elementData.split("::");

    // If we can't parse the format, let it bubble
    if (!draggedElementId || !sourceContainerId) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const currentDropPosition = dropPosition;
    setDropPosition(null);

    // Don't drop on self
    if (draggedElementId === element.id) return;

    // Same container = reorder, different container = move
    if (sourceContainerId === blockId && onReorderElement) {
      onReorderElement(draggedElementId, element.id, currentDropPosition);
    } else if (sourceContainerId !== blockId && onMoveElement) {
      onMoveElement(draggedElementId, sourceContainerId, blockId);
    }
  };

  // Get icon for contact elements
  const getContactIcon = (type) => {
    const iconClass = "w-4 h-4 flex-shrink-0";
    const iconColor = element.props?.iconColor || "#666666";

    switch (type) {
      case ELEMENT_TYPES.PHONE:
        return <Phone className={iconClass} style={{ color: iconColor }} />;
      case ELEMENT_TYPES.MOBILE:
        return <Smartphone className={iconClass} style={{ color: iconColor }} />;
      case ELEMENT_TYPES.EMAIL:
        return <Mail className={iconClass} style={{ color: iconColor }} />;
      case ELEMENT_TYPES.WEBSITE:
        return <Globe className={iconClass} style={{ color: iconColor }} />;
      case ELEMENT_TYPES.ADDRESS:
        return <MapPin className={iconClass} style={{ color: iconColor }} />;
      default:
        return null;
    }
  };

  // Render element content based on type
  const renderContent = () => {
    const props = element.props || {};

    switch (element.type) {
      case ELEMENT_TYPES.PHOTO:
        const photoSrc = signatureData?.photo || signatureData?.profileImage;
        const imageSize = signatureData?.imageSize || props.width || 60;
        return (
          <div
            className="overflow-hidden bg-neutral-200 flex items-center justify-center"
            style={{
              width: imageSize,
              height: imageSize,
              borderRadius: props.borderRadius || "50%",
            }}
          >
            {photoSrc ? (
              <img
                src={photoSrc}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-neutral-400">Photo</span>
            )}
          </div>
        );

      case ELEMENT_TYPES.NAME:
      case ELEMENT_TYPES.POSITION:
      case ELEMENT_TYPES.COMPANY:
        const textValue = getValue();
        return (
          <div
            ref={isEditing ? editableRef : null}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "outline-none transition-colors",
              isEditing && "px-1 -mx-1 rounded bg-[rgba(90,80,255,0.05)]"
            )}
            style={{
              fontSize: props.fontSize || 14,
              fontFamily: props.fontFamily || "Arial, sans-serif",
              fontWeight: props.fontWeight || "400",
              fontStyle: props.fontStyle || "normal",
              color: props.color || "#171717",
            }}
          >
            {textValue || getPlaceholder(element.type)}
          </div>
        );

      case ELEMENT_TYPES.PHONE:
      case ELEMENT_TYPES.MOBILE:
      case ELEMENT_TYPES.EMAIL:
      case ELEMENT_TYPES.WEBSITE:
      case ELEMENT_TYPES.ADDRESS:
        const contactValue = getValue();
        return (
          <div className="flex items-center gap-2">
            {props.showIcon !== false && getContactIcon(element.type)}
            <div
              ref={isEditing ? editableRef : null}
              contentEditable={isEditing}
              suppressContentEditableWarning
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={cn(
                "outline-none transition-colors",
                isEditing && "px-1 -mx-1 rounded bg-[rgba(90,80,255,0.05)]"
              )}
              style={{
                fontSize: props.fontSize || 12,
                fontFamily: props.fontFamily || "Arial, sans-serif",
                fontWeight: props.fontWeight || "400",
                fontStyle: props.fontStyle || "normal",
                color: props.color || "#666666",
              }}
            >
              {contactValue || getPlaceholder(element.type)}
            </div>
          </div>
        );

      case ELEMENT_TYPES.TEXT:
        const textContent = element.props?.content || "";
        return (
          <div
            ref={isEditing ? editableRef : null}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "outline-none transition-colors",
              isEditing && "px-1 -mx-1 rounded bg-[rgba(90,80,255,0.05)]"
            )}
            style={{
              fontSize: props.fontSize || 14,
              fontFamily: props.fontFamily || "Arial, sans-serif",
              fontWeight: props.fontWeight || "400",
              fontStyle: props.fontStyle || "normal",
              color: props.color || "#171717",
            }}
          >
            {textContent || "Texte"}
          </div>
        );

      case ELEMENT_TYPES.SOCIAL_ICONS:
        const socialNetworks = signatureData?.socialNetworks || {};
        const socialColors = signatureData?.socialColors || {};
        const globalColor = signatureData?.socialGlobalColor || props.color || "black";

        // Liste des réseaux autorisés
        const allowedNetworks = ["facebook", "github", "instagram", "linkedin", "x", "youtube"];

        // Filtrer pour n'afficher que les réseaux configurés (présents dans socialNetworks)
        // Afficher dès qu'ils sont ajoutés, même sans URL valide
        const configuredNetworks = Object.keys(socialNetworks).filter((network) => {
          // Vérifier que le réseau est dans la liste autorisée
          if (!allowedNetworks.includes(network)) return false;

          // Le réseau est configuré s'il existe dans socialNetworks (valeur définie)
          const networkData = socialNetworks[network];
          return networkData !== undefined && networkData !== null;
        });

        // Utiliser les réseaux configurés, ou les défauts si aucun réseau configuré
        const defaultNetworks = ["facebook", "linkedin", "x"];
        const networksToShow = configuredNetworks.length > 0 ? configuredNetworks : defaultNetworks;

        return (
          <div
            className="flex items-center"
            style={{
              gap: props.gap || 8,
              justifyContent: props.alignment === "center" ? "center" : props.alignment === "right" ? "flex-end" : "flex-start",
            }}
          >
            {networksToShow.map((network) => {
              const color = socialColors[network] || globalColor || "black";
              const colorName = getColorName(color);
              return (
                <img
                  key={network}
                  src={getSocialIconUrl(network, colorName)}
                  alt={network}
                  style={{
                    width: props.size || 20,
                    height: props.size || 20,
                    objectFit: "contain",
                  }}
                />
              );
            })}
          </div>
        );

      case ELEMENT_TYPES.LOGO:
        const logoSrc = signatureData?.logo || signatureData?.companyLogo || "/newbiLetter.png";
        const logoWidth = signatureData?.logoSize || props.maxWidth || 100;
        return (
          <div
            className="flex items-center justify-start"
          >
            <img
              src={logoSrc}
              alt="Logo"
              style={{
                width: `${logoWidth}px`,
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
        );

      case ELEMENT_TYPES.SEPARATOR_LINE:
        // Separator adapts automatically to parent layout:
        // - If parent is horizontal → separator is vertical (perpendicular)
        // - If parent is vertical → separator is horizontal (perpendicular)
        const isVerticalSep = parentLayout === "horizontal";
        const separatorThickness = props.thickness || 1;
        return (
          <div
            className="flex-shrink-0"
            style={isVerticalSep ? {
              // Séparateur vertical: largeur fixe, hauteur 100%
              width: separatorThickness,
              minWidth: separatorThickness,
              height: "100%",
              minHeight: "30px",
              backgroundColor: props.color || "#e0e0e0",
            } : {
              // Séparateur horizontal: hauteur fixe, largeur 100%
              width: "100%",
              height: separatorThickness,
              minHeight: separatorThickness,
              backgroundColor: props.color || "#e0e0e0",
            }}
          />
        );

      case ELEMENT_TYPES.SPACER:
        return (
          <div
            style={{
              height: props.height || 16,
              width: "100%",
            }}
          />
        );

      default:
        return <div className="text-xs text-neutral-400">Unknown element</div>;
    }
  };

  // Get placeholder text for empty fields
  const getPlaceholder = (type) => {
    const placeholders = {
      [ELEMENT_TYPES.NAME]: "Prénom Nom",
      [ELEMENT_TYPES.POSITION]: "Poste",
      [ELEMENT_TYPES.COMPANY]: "Entreprise",
      [ELEMENT_TYPES.PHONE]: "+33 1 23 45 67 89",
      [ELEMENT_TYPES.MOBILE]: "+33 6 12 34 56 78",
      [ELEMENT_TYPES.EMAIL]: "email@exemple.com",
      [ELEMENT_TYPES.WEBSITE]: "www.exemple.com",
      [ELEMENT_TYPES.ADDRESS]: "123 Rue Example, Paris",
    };
    return placeholders[type] || "";
  };

  // Check parent layout for drop indicators
  const getParentLayout = () => {
    if (!elementRef.current) return 'vertical';
    const parent = elementRef.current.parentElement;
    if (!parent) return 'vertical';
    return window.getComputedStyle(parent).flexDirection === 'row' ? 'horizontal' : 'vertical';
  };

  // Drop indicator component
  const DropIndicator = ({ position }) => {
    const isHorizontal = getParentLayout() === 'horizontal';

    if (isHorizontal) {
      return (
        <div
          className={cn(
            "absolute top-0 bottom-0 w-px z-20 transition-opacity duration-150",
            position === 'before' ? "-left-1" : "-right-1"
          )}
          style={{ backgroundColor: '#5a50ff' }}
        />
      );
    }

    return (
      <div
        className={cn(
          "absolute left-0 right-0 h-px z-20 transition-opacity duration-150",
          position === 'before' ? "-top-0.5" : "-bottom-0.5"
        )}
        style={{ backgroundColor: '#5a50ff' }}
      />
    );
  };

  // Determine draggable state
  const isDraggable = externalDraggable !== undefined ? externalDraggable && !isEditing : !isEditing;

  // Check if element is a separator - separators need to stretch
  const isSeparator = element.type === ELEMENT_TYPES.SEPARATOR_LINE;
  // For separators: in horizontal parent = vertical separator (needs height stretch)
  // In vertical parent = horizontal separator (needs width stretch)
  const isVerticalSeparator = isSeparator && parentLayout === "horizontal";

  // If single element, show selection on the element itself (not the parent block)
  // Still draggable for moving to other blocks
  if (isSingleElement) {
    return (
      <div
        ref={elementRef}
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group/element relative cursor-grab active:cursor-grabbing transition-transform duration-200",
          isDragging && "opacity-50 scale-95",
          // Séparateur vertical: hauteur 100%, largeur auto
          // Séparateur horizontal: largeur 100%
          isSeparator && (isVerticalSeparator ? "h-full" : "w-full")
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {/* Drop indicators */}
        {dropPosition === 'before' && <DropIndicator position="before" />}
        {dropPosition === 'after' && <DropIndicator position="after" />}

        {/* Visual selection wrapper for single elements */}
        <div
          className={cn(
            "rounded border border-dashed transition-all duration-150",
            dropPosition
              ? "border-[#5a50ff]/30"
              : isSelected
              ? "bg-[rgba(90,80,255,0.04)] border-[#5a50ff]/50"
              : isHovered && !isEditing
              ? "border-neutral-300/70 bg-neutral-50/50"
              : "border-transparent",
            // Séparateur vertical: hauteur 100%, largeur auto (pas de stretch horizontal)
            // Séparateur horizontal: largeur 100%
            isSeparator && (isVerticalSeparator ? "h-full flex items-stretch" : "w-full flex items-stretch")
          )}
        >
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "group/element relative transition-transform duration-200 cursor-pointer",
        isDragging && "opacity-50 scale-95",
        isSelected && "z-10",
        // Séparateur vertical: hauteur 100%, largeur auto
        // Séparateur horizontal: largeur 100%
        isSeparator && (isVerticalSeparator ? "h-full" : "w-full")
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Drop indicators */}
      {dropPosition === 'before' && <DropIndicator position="before" />}
      {dropPosition === 'after' && <DropIndicator position="after" />}

      <div
        className={cn(
          "relative py-1 px-1.5 rounded border border-dashed transition-all duration-150",
          dropPosition
            ? "border-[#5a50ff]/30"
            : isSelected
            ? "bg-[rgba(90,80,255,0.04)] border-[#5a50ff]/50"
            : isHovered && !isEditing
            ? "border-neutral-300/70 bg-neutral-50/50"
            : "border-neutral-200/50",
          // Séparateur vertical: hauteur 100%, pas de stretch horizontal
          // Séparateur horizontal: largeur 100%
          isSeparator && (isVerticalSeparator ? "h-full flex items-stretch p-0" : "w-full flex items-stretch p-0")
        )}
      >
        {/* Element drag handle indicator - positioned closer */}
        {!isEditing && (isSelected || isHovered) && !isSeparator && (
          <div
            className="absolute -left-4 top-1/2 -translate-y-1/2 p-0.5 rounded bg-[#202020] hover:bg-[#303030] cursor-grab active:cursor-grabbing z-10"
            title="Glisser vers un autre bloc"
          >
            <GripVertical className="w-2.5 h-2.5 text-white" />
          </div>
        )}

        {/* Element content */}
        {renderContent()}
      </div>
    </div>
  );
}
