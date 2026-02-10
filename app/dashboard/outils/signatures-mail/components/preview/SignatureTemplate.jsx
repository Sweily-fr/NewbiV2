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

const PRIMARY_COLOR = "#5A50FF";
const SOCIAL_BG_COLOR = "#202020";

// Helper function to check if an element should be shown
const shouldShowElement = (elementId, signatureData) => {
  const hiddenElements = signatureData?.hiddenElements || [];
  return !hiddenElements.includes(elementId);
};

const SignatureTemplate = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
  templateId: templateIdProp,
}) => {
  // Utiliser le templateId passé en prop en priorité, sinon celui de signatureData
  const templateId = templateIdProp || signatureData.templateId || "template1";
  const spacings = signatureData.spacings ?? {};

  // Debug: afficher le templateId reçu
  console.log(
    " [SignatureTemplate] templateId utilisé:",
    templateId,
    "prop:",
    templateIdProp,
    "signatureData:",
    signatureData.templateId,
  );

  // Props communs pour les composants
  const commonProps = {
    signatureData,
    handleFieldChange,
    handleImageChange,
    validatePhone,
    validateEmail,
    validateUrl,
    logoSrc,
    spacings,
  };

  // Rendu selon le template
  switch (templateId) {
    case "template1":
      return <Template1 {...commonProps} />;
    case "template2":
      return <Template2 {...commonProps} />;
    case "template3":
      return <Template3 {...commonProps} />;
    case "template4":
      return <Template4 {...commonProps} />;
    case "template5":
      return <Template5 {...commonProps} />;
    case "template6":
      return <Template6 {...commonProps} />;
    case "template7":
      return <Template7 {...commonProps} />;
    case "template8":
      return <Template8 {...commonProps} />;
    default:
      return <Template1 {...commonProps} />;
  }
};

// Template 1: Logo + icônes sociales à gauche, séparateur vertical, nom + poste + téléphone + site web à droite
const Template1 = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
  spacings,
}) => {
  const showLogo = shouldShowElement("logo", signatureData);
  const showSocial = shouldShowElement("social", signatureData);
  const showSeparator = shouldShowElement("separator", signatureData);
  const showFullName = shouldShowElement("fullName", signatureData);
  const showPosition = shouldShowElement("position", signatureData);
  const showContact = shouldShowElement("contact", signatureData);

  // Check if left column has any visible content
  const hasLeftContent = showLogo || showSocial;

  return (
    <div
      className="signature-preview-container"
      style={{ fontFamily: signatureData.fontFamily || "Arial, sans-serif" }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            {/* Colonne gauche: Logo + icônes sociales */}
            {hasLeftContent && (
              <td style={{ verticalAlign: "middle", paddingRight: "12px" }}>
                <table cellPadding="0" cellSpacing="0" border="0">
                  <tbody>
                    {/* Logo - affiche newbiLetter.png si pas de logo entreprise */}
                    {showLogo && (
                      <tr>
                        <td style={{ paddingBottom: showSocial ? "8px" : "0", textAlign: "center" }}>
                          <img
                            src={logoSrc || "/newbiLetter.png"}
                            alt="Logo"
                            style={{
                              width: `${signatureData.logoSize || 32}px`, height: "auto",
                              objectFit: "contain",
                            }}
                          />
                        </td>
                      </tr>
                    )}
                    {/* Icônes sociales - affiche 3 icônes par défaut */}
                    {showSocial && (
                      <tr>
                        <td style={{ textAlign: "center" }}>
                          <SocialIconsInline
                            signatureData={signatureData}
                            size={20}
                            centered
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            )}
            {/* Séparateur vertical */}
            {showSeparator && hasLeftContent && (
              <VerticalSeparator
                signatureData={signatureData}
                enabled={true}
                color={signatureData.colors?.separatorVertical || "#e0e0e0"}
                width={signatureData.separatorVerticalWidth || 1}
                leftSpacing={8}
                rightSpacing={12}
                minHeight="70px"
              />
            )}
            {/* Colonne droite: Infos */}
            <td style={{ verticalAlign: "middle" }}>
              <table cellPadding="0" cellSpacing="0" border="0">
                <tbody>
                  {/* Nom */}
                  {showFullName && (
                    <PersonalInfo
                      fullName={signatureData.fullName}
                      position={null}
                      companyName={null}
                      onFieldChange={handleFieldChange}
                      typography={signatureData.typography || {}}
                      fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
                      fontSize={signatureData.fontSize || {}}
                      colors={signatureData.colors || {}}
                      primaryColor={signatureData.primaryColor || "#171717"}
                      spacings={spacings}
                      signatureData={signatureData}
                      nameAlignment="left"
                      showOnlyName={true}
                    />
                  )}
                  {/* Poste */}
                  {showPosition && signatureData.position && (
                    <PersonalInfo
                      fullName={null}
                      position={signatureData.position}
                      companyName={null}
                      onFieldChange={handleFieldChange}
                      typography={signatureData.typography || {}}
                      fontFamily={
                        signatureData.fontFamily || "Arial, sans-serif"
                      }
                      fontSize={signatureData.fontSize || {}}
                      colors={signatureData.colors || {}}
                      primaryColor={signatureData.primaryColor || "#171717"}
                      spacings={spacings}
                      signatureData={signatureData}
                      nameAlignment="left"
                      showOnlyPosition={true}
                    />
                  )}
                  {/* Contact */}
                  {showContact && (
                    <ContactInfo
                      phone={signatureData.phone}
                      mobile={null}
                      email={null}
                      website={signatureData.website}
                      address={null}
                      onFieldChange={handleFieldChange}
                      validators={{ validatePhone, validateEmail, validateUrl }}
                      typography={signatureData.typography || {}}
                      fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
                      fontSize={signatureData.fontSize || {}}
                      colors={signatureData.colors || {}}
                      primaryColor={signatureData.primaryColor || "#171717"}
                      spacings={spacings}
                      signatureData={signatureData}
                      iconSize={signatureData.iconSize || 16}
                      showIcons={{
                        phone: false,
                        mobile: false,
                        email: false,
                        website: false,
                        address: false,
                      }}
                    />
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Template 2: Logo en haut, nom + titre sur même ligne, téléphone + site web, icônes sociales en bas
const Template2 = ({
  signatureData,
  handleFieldChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
  spacings,
}) => {
  const showLogo = shouldShowElement("logo", signatureData);
  const showSocial = shouldShowElement("social", signatureData);
  const showFullName = shouldShowElement("fullName", signatureData);
  const showPosition = shouldShowElement("position", signatureData);
  const showContact = shouldShowElement("contact", signatureData);

  return (
    <div
      className="signature-preview-container"
      style={{ fontFamily: signatureData.fontFamily || "Arial, sans-serif" }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          {/* Logo en haut */}
          {showLogo && (
            <tr>
              <td style={{ paddingBottom: "8px" }}>
                <img
                  src={logoSrc || "/newbiLetter.png"}
                  alt="Logo"
                  style={{
                    width: `${signatureData.logoSize || 32}px`, height: "auto",
                    objectFit: "contain",
                  }}
                />
              </td>
            </tr>
          )}
          {/* Nom + Titre sur la même ligne */}
          {(showFullName || showPosition) && (
            <PersonalInfo
              fullName={showFullName ? signatureData.fullName : null}
              position={showPosition ? signatureData.position : null}
              companyName={null}
              onFieldChange={handleFieldChange}
              typography={signatureData.typography || {}}
              fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
              fontSize={signatureData.fontSize || {}}
              colors={signatureData.colors || {}}
              primaryColor={signatureData.primaryColor || "#171717"}
              spacings={spacings}
              signatureData={signatureData}
              nameAlignment="left"
              inlineNamePosition={true}
            />
          )}
          {/* Téléphone + Site web sur la même ligne */}
          {showContact && (
            <ContactInfo
              phone={signatureData.phone}
              mobile={null}
              email={null}
              website={signatureData.website}
              address={null}
              onFieldChange={handleFieldChange}
              validators={{ validatePhone, validateEmail, validateUrl }}
              typography={signatureData.typography || {}}
              fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
              fontSize={signatureData.fontSize || {}}
              colors={signatureData.colors || {}}
              primaryColor={signatureData.primaryColor || PRIMARY_COLOR}
              spacings={spacings}
              signatureData={signatureData}
              iconSize={signatureData.iconSize || 16}
              showIcons={{
                phone: false,
                mobile: false,
                email: false,
                website: false,
                address: false,
              }}
              inlinePhoneWebsite={true}
            />
          )}
          {/* Icônes sociales en bas */}
          {showSocial && (
            <tr>
              <td style={{ paddingTop: "10px" }}>
                <SocialIconsInline signatureData={signatureData} />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Template 3: Logo à gauche avec infos, avatar à droite avec icônes sociales
const Template3 = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  validatePhone,
  validateEmail,
  validateUrl,
  logoSrc,
  spacings,
}) => {
  const showLogo = shouldShowElement("logo", signatureData);
  const showSocial = shouldShowElement("social", signatureData);
  const showPhoto = shouldShowElement("photo", signatureData);
  const showFullName = shouldShowElement("fullName", signatureData);
  const showPosition = shouldShowElement("position", signatureData);
  const showContact = shouldShowElement("contact", signatureData);

  const hasRightContent = showPhoto || showSocial;

  return (
    <div
      className="signature-preview-container"
      style={{ fontFamily: signatureData.fontFamily || "Arial, sans-serif" }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ borderCollapse: "collapse", width: "100%" }}
      >
        <tbody>
          <tr>
            {/* Colonne gauche : Logo + Informations */}
            <td style={{ verticalAlign: "top", paddingRight: hasRightContent ? "40px" : "0" }}>
              <table cellPadding="0" cellSpacing="0" border="0">
                <tbody>
                  {/* Logo */}
                  {showLogo && (
                    <tr>
                      <td style={{ paddingBottom: "6px" }}>
                        <img
                          src={logoSrc || "/newbiLetter.png"}
                          alt="Logo"
                          style={{
                            width: `${signatureData.logoSize || 32}px`, height: "auto",
                            objectFit: "contain",
                          }}
                        />
                      </td>
                    </tr>
                  )}
                  {/* Nom + Poste (éditable) */}
                  {(showFullName || showPosition) && (
                    <PersonalInfo
                      fullName={showFullName ? signatureData.fullName : null}
                      position={showPosition ? signatureData.position : null}
                      companyName={null}
                      onFieldChange={handleFieldChange}
                      typography={signatureData.typography || {}}
                      fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
                      fontSize={signatureData.fontSize || {}}
                      colors={{
                        ...signatureData.colors,
                        position: signatureData.colors?.position || PRIMARY_COLOR,
                      }}
                      primaryColor={signatureData.primaryColor || PRIMARY_COLOR}
                      spacings={spacings}
                      signatureData={signatureData}
                      nameAlignment="left"
                      inlineNamePosition={true}
                    />
                  )}
                  {/* Téléphone (éditable) */}
                  {showContact && (
                    <ContactInfo
                      phone={signatureData.phone}
                      mobile={null}
                      email={null}
                      website={signatureData.website}
                      address={null}
                      onFieldChange={handleFieldChange}
                      validators={{ validatePhone, validateEmail, validateUrl }}
                      typography={signatureData.typography || {}}
                      fontFamily={signatureData.fontFamily || "Arial, sans-serif"}
                      fontSize={signatureData.fontSize || {}}
                      colors={signatureData.colors || {}}
                      primaryColor={signatureData.primaryColor || PRIMARY_COLOR}
                      spacings={spacings}
                      signatureData={signatureData}
                      iconSize={signatureData.iconSize || 16}
                      showIcons={{
                        phone: false,
                        mobile: false,
                        email: false,
                        website: false,
                        address: false,
                      }}
                      showTextPrefix={true}
                    />
                  )}
                </tbody>
              </table>
            </td>
            {/* Colonne droite : Avatar + icônes sociales */}
            {hasRightContent && (
              <td style={{ verticalAlign: "top" }}>
                <table cellPadding="0" cellSpacing="0" border="0">
                  <tbody>
                    {showPhoto && (
                      <tr>
                        <td style={{ textAlign: "center" }}>
                          {signatureData.photo ? (
                            <img
                              src={signatureData.photo}
                              alt="Photo"
                              style={{
                                width: `${signatureData.imageSize || 60}px`,
                                height: `${signatureData.imageSize || 60}px`,
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: `${signatureData.imageSize || 60}px`,
                                height: `${signatureData.imageSize || 60}px`,
                                borderRadius: "50%",
                                backgroundColor: "#e0e0e0",
                              }}
                            />
                          )}
                        </td>
                      </tr>
                    )}
                    {showSocial && (
                      <tr>
                        <td style={{ paddingTop: showPhoto ? "8px" : "0", textAlign: "center" }}>
                          <SocialIconsInline
                            signatureData={signatureData}
                            size={16}
                            centered
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            )}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Template 4: Photo ronde à gauche avec icônes sociales, séparateur vertical, nom + poste + téléphone à droite, logo + site web en bas
const Template4 = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  logoSrc,
  spacings,
}) => {
  return (
    <div
      className="signature-preview-container"
      style={{ fontFamily: signatureData.fontFamily || "Arial, sans-serif" }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            {/* Photo + icônes sociales */}
            <td style={{ verticalAlign: "top", paddingRight: "12px" }}>
              <table cellPadding="0" cellSpacing="0" border="0">
                <tbody>
                  <tr>
                    <td style={{ textAlign: "center" }}>
                      {signatureData.photo ? (
                        <img
                          src={signatureData.photo}
                          alt="Photo"
                          style={{
                            width: `${signatureData.imageSize || 60}px`,
                            height: `${signatureData.imageSize || 60}px`,
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: `${signatureData.imageSize || 60}px`,
                            height: `${signatureData.imageSize || 60}px`,
                            borderRadius: "50%",
                            backgroundColor: "#e0e0e0",
                          }}
                        />
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: "8px", textAlign: "center" }}>
                      <SocialIconsInline
                        signatureData={signatureData}
                        size={16}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            {/* Séparateur vertical */}
            <td style={{ verticalAlign: "top", paddingRight: "12px" }}>
              <div
                style={{
                  width: "1px",
                  height: "70px",
                  backgroundColor:
                    signatureData.colors?.separatorVertical || "#e0e0e0",
                }}
              />
            </td>
            {/* Infos */}
            <td style={{ verticalAlign: "top" }}>
              <table cellPadding="0" cellSpacing="0" border="0">
                <tbody>
                  <tr>
                    <td>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#171717",
                        }}
                      >
                        {signatureData.fullName || "Paige Jenkins"}
                      </span>{" "}
                      <span style={{ fontSize: "12px", color: PRIMARY_COLOR }}>
                        {signatureData.position ||
                          "Customer Service Representative"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "4px",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      T. {signatureData.phone || "8006427676"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "2px",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      -
                    </td>
                  </tr>
                  <tr>
                    <td style={{ paddingTop: "8px" }}>
                      {logoSrc && (
                        <img
                          src={logoSrc}
                          alt="Logo"
                          style={{
                            height: "20px",
                            objectFit: "contain",
                            marginRight: "8px",
                            verticalAlign: "middle",
                          }}
                        />
                      )}
                      <span style={{ fontSize: "10px", color: "#999" }}>|</span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: PRIMARY_COLOR,
                          marginLeft: "8px",
                        }}
                      >
                        {signatureData.website || "www.letsignit.com"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Template 5: Photo + infos, séparateur horizontal, logo + site + icônes sociales
const Template5 = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  logoSrc,
  spacings,
}) => {
  return (
    <div
      className="signature-preview-container"
      style={{ fontFamily: signatureData.fontFamily || "Arial, sans-serif" }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            {/* Photo */}
            <td style={{ verticalAlign: "middle", paddingRight: "12px" }}>
              {signatureData.photo ? (
                <img
                  src={signatureData.photo}
                  alt="Photo"
                  style={{
                    width: `${signatureData.imageSize || 50}px`,
                    height: `${signatureData.imageSize || 50}px`,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: `${signatureData.imageSize || 50}px`,
                    height: `${signatureData.imageSize || 50}px`,
                    borderRadius: "50%",
                    backgroundColor: "#e0e0e0",
                  }}
                />
              )}
            </td>
            {/* Infos */}
            <td style={{ verticalAlign: "middle" }}>
              <table cellPadding="0" cellSpacing="0" border="0">
                <tbody>
                  <tr>
                    <td>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          color: "#171717",
                        }}
                      >
                        {signatureData.fullName || "Paige Jenkins"}
                      </span>{" "}
                      <span style={{ fontSize: "12px", color: PRIMARY_COLOR }}>
                        {signatureData.position ||
                          "Customer Service Representative"}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "4px",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      T. {signatureData.phone || "8006427676"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          {/* Séparateur */}
          <tr>
            <td
              colSpan="2"
              style={{ paddingTop: "10px", paddingBottom: "10px" }}
            >
              <div
                style={{
                  width: "100%",
                  height: "1px",
                  backgroundColor: "#e0e0e0",
                }}
              />
            </td>
          </tr>
          {/* Logo + site + icônes */}
          <tr>
            <td colSpan="2">
              <table
                cellPadding="0"
                cellSpacing="0"
                border="0"
                style={{ width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td>
                      {logoSrc && (
                        <img
                          src={logoSrc}
                          alt="Logo"
                          style={{ height: "25px", objectFit: "contain" }}
                        />
                      )}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      {signatureData.website || "www.letsignit.com"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <SocialIconsInline signatureData={signatureData} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Template 6: Logo centré, nom + poste + téléphone + site centrés, icônes sociales centrées
const Template6 = ({ signatureData, handleFieldChange, logoSrc, spacings }) => {
  return (
    <div
      className="signature-preview-container"
      style={{
        fontFamily: signatureData.fontFamily || "Arial, sans-serif",
        textAlign: "center",
      }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ borderCollapse: "collapse", margin: "0 auto" }}
      >
        <tbody>
          {/* Logo */}
          <tr>
            <td style={{ paddingBottom: "10px", textAlign: "center" }}>
              {logoSrc && (
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{
                    width: `${signatureData.logoSize || 32}px`, height: "auto",
                    objectFit: "contain",
                  }}
                />
              )}
            </td>
          </tr>
          {/* Nom */}
          <tr>
            <td
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: PRIMARY_COLOR,
                textAlign: "center",
              }}
            >
              {signatureData.fullName || "Paige Jenkins"}
            </td>
          </tr>
          {/* Poste */}
          <tr>
            <td
              style={{
                paddingTop: "2px",
                fontSize: "12px",
                color: PRIMARY_COLOR,
                textAlign: "center",
              }}
            >
              {signatureData.position || "Customer Service Representative"}
            </td>
          </tr>
          {/* Téléphone */}
          <tr>
            <td
              style={{
                paddingTop: "4px",
                fontSize: "11px",
                color: "#666666",
                textAlign: "center",
              }}
            >
              T. {signatureData.phone || "8006427676"}
            </td>
          </tr>
          {/* Site */}
          <tr>
            <td
              style={{
                paddingTop: "2px",
                fontSize: "11px",
                color: "#666666",
                textAlign: "center",
              }}
            >
              {signatureData.website || "www.letsignit.com"}
            </td>
          </tr>
          {/* Icônes sociales */}
          <tr>
            <td style={{ paddingTop: "12px", textAlign: "center" }}>
              <SocialIconsInline signatureData={signatureData} centered />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Template 7: Photo + nom + poste + contacts multiples, email + site + icônes en bas
const Template7 = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  logoSrc,
  spacings,
}) => {
  return (
    <div
      className="signature-preview-container"
      style={{ fontFamily: signatureData.fontFamily || "Arial, sans-serif" }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            {/* Photo */}
            <td style={{ verticalAlign: "top", paddingRight: "12px" }}>
              {signatureData.photo ? (
                <img
                  src={signatureData.photo}
                  alt="Photo"
                  style={{
                    width: `${signatureData.imageSize || 50}px`,
                    height: `${signatureData.imageSize || 50}px`,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: `${signatureData.imageSize || 50}px`,
                    height: `${signatureData.imageSize || 50}px`,
                    borderRadius: "50%",
                    backgroundColor: "#e0e0e0",
                  }}
                />
              )}
            </td>
            {/* Infos */}
            <td style={{ verticalAlign: "top" }}>
              <table cellPadding="0" cellSpacing="0" border="0">
                <tbody>
                  <tr>
                    <td
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {signatureData.fullName || "Paige Jenkins"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "2px",
                        fontSize: "12px",
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {signatureData.position ||
                        "Customer Service Representative"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "4px",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      M. {signatureData.mobile || "425-882-1032"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "2px",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      T. {signatureData.phone || "8006427676"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          {/* Ligne du bas */}
          <tr>
            <td colSpan="2" style={{ paddingTop: "10px" }}>
              <table
                cellPadding="0"
                cellSpacing="0"
                border="0"
                style={{ width: "100%" }}
              >
                <tbody>
                  <tr>
                    <td style={{ fontSize: "10px", color: "#999999" }}>
                      {signatureData.email || "admin@example.com"} •{" "}
                      {signatureData.website || "www.letsignit.com"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <SocialIconsInline signatureData={signatureData} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Template 8: Photo + séparateur vertical coloré + infos, logo à droite
const Template8 = ({
  signatureData,
  handleFieldChange,
  handleImageChange,
  logoSrc,
  spacings,
}) => {
  return (
    <div
      className="signature-preview-container"
      style={{ fontFamily: signatureData.fontFamily || "Arial, sans-serif" }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        border="0"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            {/* Photo */}
            <td style={{ verticalAlign: "middle", paddingRight: "12px" }}>
              {signatureData.photo ? (
                <img
                  src={signatureData.photo}
                  alt="Photo"
                  style={{
                    width: `${signatureData.imageSize || 50}px`,
                    height: `${signatureData.imageSize || 50}px`,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: `${signatureData.imageSize || 50}px`,
                    height: `${signatureData.imageSize || 50}px`,
                    borderRadius: "50%",
                    backgroundColor: "#e0e0e0",
                  }}
                />
              )}
            </td>
            {/* Séparateur vertical coloré */}
            <td style={{ verticalAlign: "middle", paddingRight: "12px" }}>
              <div
                style={{
                  width: "2px",
                  height: "60px",
                  backgroundColor: PRIMARY_COLOR,
                }}
              />
            </td>
            {/* Infos */}
            <td style={{ verticalAlign: "middle" }}>
              <table cellPadding="0" cellSpacing="0" border="0">
                <tbody>
                  <tr>
                    <td
                      style={{
                        fontSize: "14px",
                        fontWeight: "bold",
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {signatureData.fullName || "Paige Jenkins"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "2px",
                        fontSize: "12px",
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {signatureData.position ||
                        "Customer Service Representative"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "4px",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      T. {signatureData.phone || "8006427676"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        paddingTop: "2px",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      {signatureData.website || "www.letsignit.com"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            {/* Logo */}
            <td style={{ verticalAlign: "middle", paddingLeft: "20px" }}>
              {logoSrc && (
                <img
                  src={logoSrc}
                  alt="Logo"
                  style={{
                    width: `${signatureData.logoSize || 32}px`, height: "auto",
                    objectFit: "contain",
                  }}
                />
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// Base URL Cloudflare pour les icônes sociales
const CLOUDFLARE_SOCIAL_BASE = "https://pub-f5ac1d55852142ab931dc75bdc939d68.r2.dev/social";

// Fonction pour obtenir l'URL de l'icône sociale depuis Cloudflare
const getSocialIconUrl = (platform, color = "black") => {
  // Mapper x vers twitter pour Cloudflare
  const cloudflareplatform = platform === "x" ? "twitter" : platform;
  return `${CLOUDFLARE_SOCIAL_BASE}/${cloudflareplatform}/${cloudflareplatform}-${color}.png`;
};

// Composant pour les icônes sociales inline
const SocialIconsInline = ({ signatureData, size = 20, centered = false }) => {
  const socialNetworks = signatureData.socialNetworks || {};
  const socialColors = signatureData.socialColors || {};
  const globalColor = signatureData.socialGlobalColor;
  const hasNetworks = Object.keys(socialNetworks).length > 0;

  // Réseaux par défaut si aucun n'est défini
  const defaultNetworks = ["facebook", "linkedin", "x"];
  const networksToShow = hasNetworks
    ? Object.keys(socialNetworks)
    : defaultNetworks;

  // Fonction pour convertir hex en nom de couleur Cloudflare
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

  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        justifyContent: centered ? "center" : "flex-start",
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
              width: `${size}px`,
              height: `${size}px`,
              objectFit: "contain",
            }}
          />
        );
      })}
    </div>
  );
};

export default SignatureTemplate;
