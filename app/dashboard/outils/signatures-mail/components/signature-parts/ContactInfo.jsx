/**
 * Informations de contact pour les signatures
 * Affiche et permet d'éditer téléphone, mobile, email, site web et adresse
 */

"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { getTypographyStyles } from "../../utils/typography-styles";
import { getSpacing } from "../../utils/spacing-helper";
import { getIndividualPaddingStyles } from "../../utils/padding-helper";

// Constante pour l'espacement entre icône et texte
const ICON_TEXT_SPACING = 8;

const ContactInfo = ({
  phone,
  mobile,
  email,
  website,
  address,
  onFieldChange,
  validators = {},
  typography = {},
  fontFamily = "Arial, sans-serif",
  fontSize = {},
  colors = {},
  primaryColor = "#171717",
  spacings = {},
  signatureData = {},
  iconSize = 16, // Taille des icônes configurable
  showIcons = {
    phone: true,
    mobile: true,
    email: true,
    website: true,
    address: true,
  },
  centered = false, // Mode centré pour signature verticale
  inlinePhoneWebsite = false, // Mode inline : téléphone et site web sur la même ligne
  showTextPrefix = false, // Affiche "T." pour téléphone sans icône
}) => {
  // Icônes hébergées sur Cloudflare (compatibles Gmail)
  const smartphoneIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png"; // Téléphone fixe
  const phoneIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png"; // Mobile
  const emailIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png";
  const websiteIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png";
  const addressIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png";

  const renderContactRow = (icon, value, field, placeholder, validation, spacing, textPrefix = null) => {
    if (!value) return null;

    // Déterminer le préfixe à afficher
    const prefix = showTextPrefix && !showIcons[field] && textPrefix ? textPrefix : null;

    return (
      <tr>
        <td
          colSpan="2"
          style={{
            // Padding détaillé ou espacement par défaut
            ...(signatureData.detailedSpacing
              ? getIndividualPaddingStyles(signatureData, field, { bottom: spacing ?? 6 })
              : { paddingBottom: `${spacing ?? 6}px` }),
            textAlign: centered ? "center" : "left",
          }}
        >
          <table
            cellPadding="0"
            cellSpacing="0"
            border="0"
            style={{
              borderCollapse: "collapse",
              margin: centered ? "0 auto" : "0",
            }}
          >
            <tbody>
              <tr>
                {showIcons[field] && (
                  <td
                    style={{
                      paddingRight: `${ICON_TEXT_SPACING}px`,
                      verticalAlign: field === "address" ? "top" : "middle",
                    }}
                  >
                    <img
                      src={icon}
                      alt={placeholder}
                      width={iconSize}
                      height={iconSize}
                      style={{
                        width: `${iconSize}px`,
                        height: `${iconSize}px`,
                        display: "block",
                        marginTop: field === "address" ? "1px" : "0",
                      }}
                    />
                  </td>
                )}
                <td
                  style={{
                    ...getTypographyStyles(typography[field], {
                      fontFamily: fontFamily,
                      fontSize: fontSize.contact || 12,
                      color: colors.contact || "rgb(102,102,102)",
                    }),
                    verticalAlign: field === "address" ? "top" : "middle",
                  }}
                >
                  {prefix && (
                    <span
                      style={{
                        color:
                          typography[field]?.color ||
                          colors.contact ||
                          "rgb(102,102,102)",
                        fontSize: `${typography[field]?.fontSize || fontSize.contact || 12}px`,
                        fontFamily:
                          typography[field]?.fontFamily || fontFamily,
                      }}
                    >
                      {prefix}
                    </span>
                  )}
                  <InlineEdit
                    value={value}
                    onChange={(val) => onFieldChange(field, val)}
                    placeholder={placeholder}
                    validation={validation}
                    displayClassName="border-0 shadow-none p-0 h-auto"
                    inputClassName="border-0 shadow-none p-0 h-auto"
                    multiline={field === "address"}
                    style={{
                      color:
                        typography[field]?.color ||
                        colors.contact ||
                        "rgb(102,102,102)",
                      fontSize: `${typography[field]?.fontSize || fontSize.contact || 12}px`,
                      fontFamily:
                        typography[field]?.fontFamily || fontFamily,
                      fontWeight: typography[field]?.fontWeight || "normal",
                      fontStyle: typography[field]?.fontStyle || "normal",
                      textDecoration: typography[field]?.textDecoration || "none",
                      ...(field === "address" && { whiteSpace: "pre-wrap" }),
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    );
  };

  // Mode inline : téléphone et site web sur la même ligne
  if (inlinePhoneWebsite) {
    return (
      <tr>
        <td
          colSpan="2"
          style={{
            paddingTop: "4px",
            fontSize: `${typography.phone?.fontSize || fontSize.contact || 11}px`,
            color: typography.phone?.color || colors.contact || "#666666",
            fontFamily: typography.phone?.fontFamily || fontFamily,
            textAlign: centered ? "center" : "left",
          }}
        >
          {phone && (
            <>
              <span>T. </span>
              <InlineEdit
                value={phone}
                onChange={(val) => onFieldChange("phone", val)}
                placeholder="Téléphone"
                validation={validators.validatePhone}
                displayClassName="border-0 shadow-none p-0 h-auto"
                inputClassName="border-0 shadow-none p-0 h-auto"
                style={{
                  display: "inline",
                  width: "auto",
                  minWidth: "0",
                  height: "auto",
                  color: typography.phone?.color || colors.contact || "#666666",
                  fontSize: `${typography.phone?.fontSize || fontSize.contact || 11}px`,
                  fontFamily: typography.phone?.fontFamily || fontFamily,
                  fontWeight: typography.phone?.fontWeight || "normal",
                  fontStyle: typography.phone?.fontStyle || "normal",
                }}
              />
            </>
          )}
          {phone && website && " "}
          {website && (
            <span style={{ color: primaryColor }}>
              <InlineEdit
                value={website}
                onChange={(val) => onFieldChange("website", val)}
                placeholder="Site web"
                validation={validators.validateUrl}
                displayClassName="border-0 shadow-none p-0 h-auto"
                inputClassName="border-0 shadow-none p-0 h-auto"
                style={{
                  display: "inline",
                  width: "auto",
                  minWidth: "0",
                  height: "auto",
                  color: primaryColor,
                  fontSize: `${typography.website?.fontSize || fontSize.contact || 11}px`,
                  fontFamily: typography.website?.fontFamily || fontFamily,
                  fontWeight: typography.website?.fontWeight || "normal",
                  fontStyle: typography.website?.fontStyle || "normal",
                }}
              />
            </span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <>
      {/* Téléphone */}
      {renderContactRow(
        smartphoneIcon,
        phone,
        "phone",
        "Numéro de téléphone",
        validators.validatePhone,
        getSpacing(signatureData, spacings.phoneToMobile, 8),
        "T. "
      )}

      {/* Mobile */}
      {renderContactRow(
        phoneIcon,
        mobile,
        "mobile",
        "Numéro de mobile",
        validators.validatePhone,
        getSpacing(signatureData, spacings.mobileToEmail, 8),
        "M. "
      )}

      {/* Email */}
      {renderContactRow(
        emailIcon,
        email,
        "email",
        "Adresse email",
        validators.validateEmail,
        getSpacing(signatureData, spacings.emailToWebsite, 8)
      )}

      {/* Site web */}
      {renderContactRow(
        websiteIcon,
        website,
        "website",
        "Site web",
        validators.validateUrl,
        getSpacing(signatureData, spacings.websiteToAddress, 8)
      )}

      {/* Adresse */}
      {renderContactRow(
        addressIcon,
        address,
        "address",
        "Adresse postale",
        null,
        getSpacing(signatureData, spacings.contactBottom, 8)
      )}
    </>
  );
};

export default ContactInfo;
