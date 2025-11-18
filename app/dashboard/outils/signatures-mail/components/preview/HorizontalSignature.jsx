/**
 * Signature horizontal - VERSION REFACTORISÉE
 * Utilise les mêmes composants modulaires que HorizontalSignature
 */

"use client";

import React from "react";
import ProfileImage from "../signature-parts/ProfileImage";
import PersonalInfo from "../signature-parts/PersonalInfo";
import ContactInfo from "../signature-parts/ContactInfo";
import VerticalSeparator from "../signature-parts/VerticalSeparator";
import HorizontalSeparator from "../signature-parts/HorizontalSeparator";
import CompanyLogo from "../signature-parts/CompanyLogo";
import SocialNetworks from "../signature-parts/SocialNetworks";
import { getSpacing } from "../../utils/spacing-helper";
import "@/src/styles/signature-text-selection.css";
import "./signature-preview.css";

const HorizontalSignature = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
}) => {
  const spacings = signatureData.spacings ?? {};

  const tableContent = (
    <table
      cellPadding="0"
      cellSpacing="0"
      border="0"
      style={{
        borderCollapse: "collapse",
        width: "auto",
        maxWidth: "600px",
        tableLayout: "auto",
      }}
    >
        <tbody>
          <tr>
            {/* Colonne gauche : Photo + Informations personnelles */}
            <td
              style={{
                verticalAlign: "top",
                paddingRight: `${getSpacing(signatureData, spacings.global, 12)}px`,
              }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                border="0"
                style={{
                  borderCollapse: "collapse",
                  width: "auto",
                }}
              >
                <tbody>
                  {/* Photo de profil */}
                  {signatureData.photo && signatureData.photoVisible !== false && (
                    <tr>
                      <td style={{ paddingBottom: `${getSpacing(signatureData, spacings.photoBottom, 12)}px` }}>
                        <ProfileImage
                          photoSrc={signatureData.photo}
                          size={signatureData.imageSize || 70}
                          shape={signatureData.imageShape || "round"}
                          onImageChange={(imageUrl) =>
                            handleImageChange("photo", imageUrl)
                          }
                          isEditable={true}
                          spacing={0}
                          wrapInTd={false}
                          signatureData={signatureData}
                        />
                      </td>
                    </tr>
                  )}

                  {/* Informations personnelles */}
                  <PersonalInfo
                    fullName={signatureData.fullName}
                    position={signatureData.position}
                    companyName={signatureData.companyName}
                    onFieldChange={handleFieldChange}
                    typography={signatureData.typography || {}}
                    fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
                    fontSize={signatureData.fontSize || {}}
                    colors={signatureData.colors || {}}
                    primaryColor={signatureData.primaryColor || "#171717"}
                    spacings={spacings}
                    signatureData={signatureData}
                    nameAlignment={signatureData.nameAlignment || "left"}
                  />
                </tbody>
              </table>
            </td>

            {/* Séparateur vertical */}
            <VerticalSeparator
              signatureData={signatureData}
              enabled={signatureData.separatorVerticalEnabled}
              color={signatureData.colors?.separatorVertical || "#e0e0e0"}
              leftSpacing={getSpacing(signatureData, spacings.global, 12)}
              rightSpacing={getSpacing(signatureData, spacings.global, 12)}
              minHeight="200px"
            />

            {/* Colonne droite : Informations de contact */}
            <td
              style={{
                verticalAlign: signatureData.contactAlignment || "top",
                paddingLeft: `${getSpacing(signatureData, spacings.global, 12)}px`,
              }}
            >
              <table
                cellPadding="0"
                cellSpacing="0"
                border="0"
                style={{
                  borderCollapse: "collapse",
                  width: "auto",
                }}
              >
                <tbody>
                  <ContactInfo
                    phone={signatureData.phone}
                    mobile={signatureData.mobile}
                    email={signatureData.email}
                    website={signatureData.website}
                    address={signatureData.address}
                    onFieldChange={handleFieldChange}
                    validators={{
                      validatePhone,
                      validateEmail,
                      validateUrl,
                    }}
                    typography={signatureData.typography || {}}
                    fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
                    fontSize={signatureData.fontSize || {}}
                    colors={signatureData.colors || {}}
                    primaryColor={signatureData.primaryColor || "#171717"}
                    spacings={spacings}
                    signatureData={signatureData}
                    iconSize={signatureData.iconSize || 16}
                    showIcons={{
                      phone: signatureData.showPhoneIcon ?? true,
                      mobile: signatureData.showMobileIcon ?? true,
                      email: signatureData.showEmailIcon ?? true,
                      website: signatureData.showWebsiteIcon ?? true,
                      address: signatureData.showAddressIcon ?? true,
                    }}
                  />
                </tbody>
              </table>
            </td>
          </tr>

          {/* Séparateur horizontal (en bas, sur toute la largeur) */}
          <HorizontalSeparator
            enabled={signatureData.separatorHorizontalEnabled}
            color={signatureData.colors?.separatorHorizontal || "#e0e0e0"}
            width={signatureData.separatorHorizontalWidth || 1}
            topSpacing={getSpacing(signatureData, spacings.separatorTop, 8)}
            bottomSpacing={getSpacing(signatureData, spacings.separatorBottom, 8)}
            radius={0}
            colSpan={signatureData.separatorVerticalEnabled ? 5 : 2}
            signatureData={signatureData}
          />

          {/* Logo entreprise (en bas, sur toute la largeur) */}
          {logoSrc && signatureData.logoVisible !== false && (
            <CompanyLogo
              logoSrc={logoSrc}
              size={signatureData.logoSize || 60}
              spacing={getSpacing(signatureData, spacings.logoBottom, 12)}
              alignment="left"
              signatureData={signatureData}
            />
          )}

          {/* Réseaux sociaux (en bas, sur toute la largeur) */}
          <SocialNetworks
            socialNetworks={signatureData.socialNetworks || {}}
            customSocialIcons={signatureData.customSocialIcons || {}}
            size={signatureData.socialSize || 24}
            globalColor={signatureData.socialGlobalColor}
            socialColors={signatureData.socialColors || {}}
            spacing={getSpacing(signatureData, spacings.logoToSocial, 15)}
            iconSpacing={8}
            colSpan={signatureData.separatorVerticalEnabled ? 5 : 2}
            signatureData={signatureData}
          />
        </tbody>
      </table>
  );

  return (
    <div
      className="signature-preview-container"
      style={{
        fontFamily: signatureData.fontFamily || "Arial, sans-serif",
        width: "auto",
        maxWidth: "600px",
      }}
    >
      {tableContent}
    </div>
  );
};

export default HorizontalSignature;
