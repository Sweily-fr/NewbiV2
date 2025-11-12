/**
 * Informations de contact pour les signatures
 * Affiche et permet d'éditer téléphone, mobile, email, site web et adresse
 */

"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { getTypographyStyles } from "../../utils/typography-styles";
import { getSpacing } from "../../utils/spacing-helper";

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
}) => {
  // Icônes hébergées sur Cloudflare (compatibles Gmail)
  const smartphoneIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/smartphone.png"; // Téléphone fixe
  const phoneIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/phone.png"; // Mobile
  const emailIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/mail.png";
  const websiteIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/globe.png";
  const addressIcon = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/info/map-pin.png";

  const renderContactRow = (icon, value, field, placeholder, validation, spacing) => {
    if (!value) return null;

    return (
      <tr>
        <td
          colSpan="2"
          style={{
            paddingBottom: `${spacing ?? 8}px`,
          }}
        >
          <table
            cellPadding="0"
            cellSpacing="0"
            border="0"
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              <tr>
                {showIcons[field] && (
                  <td
                    style={{
                      paddingRight: "8px",
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

  return (
    <>
      {/* Téléphone */}
      {renderContactRow(
        smartphoneIcon,
        phone,
        "phone",
        "Numéro de téléphone",
        validators.validatePhone,
        getSpacing(signatureData, spacings.phoneToMobile, 8)
      )}

      {/* Mobile */}
      {renderContactRow(
        phoneIcon,
        mobile,
        "mobile",
        "Numéro de mobile",
        validators.validatePhone,
        getSpacing(signatureData, spacings.mobileToEmail, 8)
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
