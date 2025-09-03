"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";

// Fonction utilitaire pour convertir hex en HSL et calculer la rotation de teinte
const hexToHsl = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return [h * 360, s * 100, l * 100];
};

const getColorFilter = (targetColor) => {
  if (!targetColor || targetColor === 'transparent') return 'none';
  
  // Normaliser la couleur cible
  const normalizedColor = targetColor.toLowerCase();
  
  // Pour une approche plus simple et efficace, utiliser directement la couleur
  // Convertir la couleur en filtre CSS compatible
  const rgb = hexToRgb(targetColor);
  if (!rgb) return 'none';
  
  // Calculer les filtres pour approximer la couleur cible
  const brightness = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  const [hue, saturation] = hexToHsl(targetColor);
  
  return `brightness(0) saturate(100%) invert(${brightness > 0.5 ? 0 : 1}) sepia(1) saturate(5) hue-rotate(${hue}deg) brightness(${brightness + 0.5}) contrast(1.2)`;
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const VerticalSignature = ({ 
  signatureData, 
  handleFieldChange, 
  handleImageChange, 
  validatePhone, 
  validateEmail, 
  validateUrl,
  logoSrc 
}) => {
  // Calcul des largeurs de colonnes dynamiques pour la signature verticale
  const photoColumnWidth = signatureData.columnWidths?.photo || 25;
  const contentColumnWidth = signatureData.columnWidths?.content || 75;
  const maxTableWidth = 500;
  const photoWidthPx = Math.round((photoColumnWidth / 100) * maxTableWidth);
  const contentWidthPx = Math.round((contentColumnWidth / 100) * maxTableWidth);

  return (
    <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', maxWidth: '500px', fontFamily: 'Arial, sans-serif', width: '100%' }}>
      <tbody>
        <tr>
          {/* Colonne de gauche : Informations personnelles */}
          <td style={{ width: `${photoWidthPx}px`, paddingRight: '15px', verticalAlign: 'top' }}>
            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {/* Photo */}
                <tr>
                  <td style={{ 
                    paddingBottom: `${signatureData.spacings?.photoBottom || 12}px`,
                    textAlign: signatureData.nameAlignment || 'left'
                  }}>
                      {signatureData.photo ? (
                        <div 
                          style={{
                            width: `${signatureData.imageSize || 80}px`,
                            height: `${signatureData.imageSize || 80}px`,
                            borderRadius: signatureData.imageShape === 'square' ? '8px' : '50%',
                            backgroundImage: `url('${signatureData.photo}')`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            display: 'block',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            // Créer un input file invisible pour changer l'image
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => handleImageChange('photo', e.target.result);
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          title="Cliquer pour changer la photo"
                        />
                      ) : (
                        <ImageDropZone
                          currentImage={signatureData.photo}
                          onImageChange={(imageUrl) => handleImageChange("photo", imageUrl)}
                          placeholder="Photo de profil"
                          size="md"
                          type="profile"
                          style={{ 
                            width: `${signatureData.imageSize || 80}px`,
                            height: `${signatureData.imageSize || 80}px`,
                            borderRadius: signatureData.imageShape === 'square' ? '8px' : '50%'
                          }}
                        />
                      )}
                    </td>
                  </tr>
                
                {/* Prénom et Nom */}
                <tr>
                  <td style={{ 
                    paddingBottom: `${signatureData.spacings?.nameBottom || 8}px`,
                    textAlign: signatureData.nameAlignment || 'left'
                  }}>
                    <div style={{ 
                      fontSize: `${signatureData.fontSize?.name || 16}px`,
                      fontWeight: 'bold',
                      color: signatureData.colors?.name || signatureData.primaryColor || '#2563eb',
                      lineHeight: '1.2',
                      fontFamily: signatureData.fontFamily || 'Arial, sans-serif'
                    }}>
                      <InlineEdit
                        value={signatureData.firstName}
                        onChange={(value) => handleFieldChange("firstName", value)}
                        placeholder="Prénom"
                        displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                        inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none h-auto w-auto min-w-0"
                        className="!p-0 !m-0 !rounded-none inline-block w-auto"
                        style={{ width: 'auto', minWidth: '0' }}
                      />
                      <span style={{ marginLeft: `${signatureData.nameSpacing || 4}px` }}>
                        <InlineEdit
                          value={signatureData.lastName}
                          onChange={(value) => handleFieldChange("lastName", value)}
                          placeholder="Nom"
                          displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                          inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none h-auto w-auto min-w-0"
                          className="!p-0 !m-0 !rounded-none inline-block w-auto"
                          style={{ width: 'auto', minWidth: '0' }}
                        />
                      </span>
                    </div>
                  </td>
                </tr>
                
                {/* Profession */}
                {signatureData.position && (
                  <tr>
                    <td style={{ 
                      paddingBottom: `${signatureData.spacings?.positionBottom || 8}px`,
                      textAlign: signatureData.nameAlignment || 'left'
                    }}>
                      <div style={{ 
                        fontSize: `${signatureData.fontSize?.position || 14}px`,
                        color: signatureData.colors?.position || '#666666',
                        fontFamily: signatureData.fontFamily || 'Arial, sans-serif'
                      }}>
                        <InlineEdit
                          value={signatureData.position}
                          onChange={(value) => handleFieldChange("position", value)}
                          placeholder="Votre poste"
                          displayClassName="text-sm"
                          inputClassName="text-sm border-0 shadow-none p-1 h-auto"
                          style={{
                            color: signatureData.colors?.position || '#666666',
                            fontSize: `${signatureData.fontSize?.position || 14}px`
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Nom entreprise */}
                {signatureData.companyName && (
                  <tr>
                    <td style={{ 
                      paddingBottom: `${signatureData.spacings?.companyBottom || 12}px`,
                      textAlign: signatureData.nameAlignment || 'left'
                    }}>
                      <div style={{ 
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: signatureData.colors?.company || signatureData.primaryColor || '#2563eb'
                      }}>
                        <InlineEdit
                          value={signatureData.companyName}
                          onChange={(value) => handleFieldChange("companyName", value)}
                          placeholder="Nom entreprise"
                          displayClassName="text-blue-600 font-semibold text-sm"
                          inputClassName="text-blue-600 font-semibold text-sm border-0 shadow-none p-1 h-auto"
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>

          {/* Séparateur vertical - Gmail compatible */}
          <td style={{ width: `${signatureData.separatorVerticalWidth || 1}px`, backgroundColor: signatureData.colors?.separatorVertical || '#e0e0e0', padding: '0', fontSize: '1px', lineHeight: '1px' }}>
            &nbsp;
          </td>

          {/* Colonne de droite : Informations de contact */}
          <td style={{ paddingLeft: '15px', verticalAlign: 'top', width: `${contentWidthPx}px` }}>
            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {/* Téléphone */}
                {signatureData.phone && (
                  <tr>
                    <td style={{ paddingBottom: signatureData.mobile ? `${signatureData.spacings?.phoneToMobile || 4}px` : `${signatureData.spacings?.contactBottom || 6}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: `${signatureData.fontSize?.contact || 12}px`, color: signatureData.colors?.contact || 'rgb(102,102,102)', fontFamily: signatureData.fontFamily || 'Arial, sans-serif' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        <InlineEdit
                          value={signatureData.phone}
                          onChange={(value) => handleFieldChange("phone", value)}
                          placeholder="Téléphone fixe"
                          validation={validatePhone}
                          displayClassName="text-xs"
                          inputClassName="text-xs border-0 shadow-none p-1 h-auto"
                          style={{ color: signatureData.colors?.contact || 'rgb(102,102,102)' }}
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Mobile */}
                {signatureData.mobile && (
                  <tr>
                    <td style={{ paddingBottom: signatureData.email ? `${signatureData.spacings?.mobileToEmail || 4}px` : `${signatureData.spacings?.contactBottom || 6}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: `${signatureData.fontSize?.contact || 12}px`, color: signatureData.colors?.contact || 'rgb(102,102,102)', fontFamily: signatureData.fontFamily || 'Arial, sans-serif' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        <InlineEdit
                          value={signatureData.mobile}
                          onChange={(value) => handleFieldChange("mobile", value)}
                          placeholder="Téléphone mobile"
                          validation={validatePhone}
                          displayClassName="text-xs"
                          inputClassName="text-xs border-0 shadow-none p-1 h-auto"
                          style={{ color: signatureData.colors?.contact || 'rgb(102,102,102)' }}
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Email */}
                {signatureData.email && (
                  <tr>
                    <td style={{ paddingBottom: signatureData.website ? `${signatureData.spacings?.emailToWebsite || 4}px` : `${signatureData.spacings?.contactBottom || 6}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: `${signatureData.fontSize?.contact || 12}px`, color: signatureData.colors?.contact || 'rgb(102,102,102)', fontFamily: signatureData.fontFamily || 'Arial, sans-serif' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        <InlineEdit
                          value={signatureData.email}
                          onChange={(value) => handleFieldChange("email", value)}
                          placeholder="adresse@email.com"
                          validation={validateEmail}
                          displayClassName="text-xs"
                          inputClassName="text-xs border-0 shadow-none p-1 h-auto"
                          style={{ color: signatureData.colors?.contact || 'rgb(102,102,102)' }}
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Site web */}
                {signatureData.website && (
                  <tr>
                    <td style={{ paddingBottom: signatureData.address ? `${signatureData.spacings?.websiteToAddress || 4}px` : `${signatureData.spacings?.contactBottom || 6}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: `${signatureData.fontSize?.contact || 12}px`, color: signatureData.colors?.contact || 'rgb(102,102,102)', fontFamily: signatureData.fontFamily || 'Arial, sans-serif' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        <InlineEdit
                          value={signatureData.website}
                          onChange={(value) => handleFieldChange("website", value)}
                          placeholder="www.monsite.com"
                          validation={validateUrl}
                          displayClassName="text-xs"
                          inputClassName="text-xs border-0 shadow-none p-1 h-auto"
                          style={{ color: signatureData.colors?.contact || 'rgb(102,102,102)' }}
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Adresse */}
                {signatureData.address && (
                  <tr>
                    <td style={{ paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', fontSize: `${signatureData.fontSize?.contact || 12}px`, color: signatureData.colors?.contact || 'rgb(102,102,102)', fontFamily: signatureData.fontFamily || 'Arial, sans-serif' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px', marginTop: '1px' }} />
                        <InlineEdit
                          value={signatureData.address}
                          onChange={(value) => handleFieldChange("address", value)}
                          placeholder="Adresse complète"
                          multiline={true}
                          displayClassName="text-xs text-gray-600"
                          inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 min-h-[2rem] resize-none"
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Séparateur horizontal - après tous les contacts */}
                <tr>
                  <td style={{ 
                    paddingTop: `${signatureData.spacings?.separatorTop || 12}px`, 
                    paddingBottom: `${signatureData.spacings?.separatorBottom || 12}px` 
                  }}>
                    <hr style={{
                      border: 'none',
                      borderTop: `${signatureData.separatorHorizontalWidth || 1}px solid ${signatureData.colors?.separatorHorizontal || '#e0e0e0'}`,
                      margin: '0',
                      width: '100%'
                    }} />
                  </td>
                </tr>
                
                {/* Logo entreprise après le séparateur */}
                <tr>
                  <td style={{ 
                    paddingTop: `${signatureData.spacings?.logoBottom || 12}px`,
                    textAlign: 'center' 
                  }}>
                    {logoSrc ? (
                      <img 
                        src={logoSrc} 
                        alt="Logo entreprise" 
                        style={{
                          width: `${signatureData.logoSize || 60}px`,
                          height: 'auto',
                          maxHeight: `${signatureData.logoSize || 60}px`,
                          objectFit: 'contain',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => handleImageChange('logo', e.target.result);
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                        title="Cliquer pour changer le logo"
                      />
                    ) : (
                      <ImageDropZone
                        currentImage={signatureData.logo}
                        onImageChange={(imageUrl) => handleImageChange("logo", imageUrl)}
                        placeholder="Logo entreprise"
                        size="sm"
                        type="logo"
                        style={{ 
                          width: `${signatureData.logoSize || 60}px`,
                          height: `${signatureData.logoSize || 60}px`
                        }}
                      />
                    )}
                  </td>
                </tr>

              </tbody>
            </table>
          </td>
        </tr>
        
        {/* Logos sociaux */}
        {(signatureData.socialLinks?.linkedin || signatureData.socialLinks?.facebook || signatureData.socialLinks?.twitter || signatureData.socialLinks?.instagram) && (
          <tr>
            <td style={{ 
              paddingTop: `${signatureData.spacings?.socialTop || 15}px`,
              textAlign: 'left' 
            }}>
              <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    {signatureData.socialLinks?.linkedin && (
                      <td style={{ paddingRight: '8px' }}>
                        <a href={signatureData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: signatureData.socialBackground?.enabled ? (signatureData.socialBackground?.color || '#f3f4f6') : 'transparent',
                            borderRadius: signatureData.socialBackground?.enabled && signatureData.socialBackground?.shape === 'round' ? '50%' : '4px',
                            padding: signatureData.socialBackground?.enabled ? '6px' : '0'
                          }}>
                            <img 
                              src={`https://img.icons8.com/color/${signatureData.socialSize || 24}/linkedin.png`}
                              alt="LinkedIn" 
                              width={signatureData.socialSize || 24} 
                              height={signatureData.socialSize || 24} 
                              style={{ 
                                display: 'block',
                                filter: signatureData.colors?.social ? getColorFilter(signatureData.colors.social) : 'none'
                              }} 
                            />
                          </div>
                        </a>
                      </td>
                    )}
                    
                    {signatureData.socialLinks?.facebook && (
                      <td style={{ paddingRight: '8px' }}>
                        <a href={signatureData.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: signatureData.socialBackground?.enabled ? (signatureData.socialBackground?.color || '#f3f4f6') : 'transparent',
                            borderRadius: signatureData.socialBackground?.enabled && signatureData.socialBackground?.shape === 'round' ? '50%' : '4px',
                            padding: signatureData.socialBackground?.enabled ? '6px' : '0'
                          }}>
                            <svg 
                              width={signatureData.socialSize || 24} 
                              height={signatureData.socialSize || 24} 
                              viewBox="0 0 50 50" 
                              style={{ display: 'block' }}
                            >
                              <path 
                                fill={signatureData.colors?.social || '#1877F2'} 
                                d="M41,4H9C6.24,4,4,6.24,4,9v32c0,2.76,2.24,5,5,5h32c2.76,0,5-2.24,5-5V9C46,6.24,43.76,4,41,4z M37,19h-2c-2.14,0-3,0.5-3,2 v3h5l-1,5h-4v15h-5V29h-4v-5h4v-3c0-4,2-7,6-7c2.9,0,4,1,4,1V19z"
                              />
                            </svg>
                          </div>
                        </a>
                      </td>
                    )}
                    
                    {signatureData.socialLinks?.twitter && (
                      <td style={{ paddingRight: '8px' }}>
                        <a href={signatureData.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: signatureData.socialBackground?.enabled ? (signatureData.socialBackground?.color || '#f3f4f6') : 'transparent',
                            borderRadius: signatureData.socialBackground?.enabled && signatureData.socialBackground?.shape === 'round' ? '50%' : '4px',
                            padding: signatureData.socialBackground?.enabled ? '6px' : '0'
                          }}>
                            <img 
                              src={`https://img.icons8.com/color/${signatureData.socialSize || 24}/x.png`}
                              alt="X (Twitter)" 
                              width={signatureData.socialSize || 24} 
                              height={signatureData.socialSize || 24} 
                              style={{ 
                                display: 'block',
                                filter: signatureData.colors?.social ? getColorFilter(signatureData.colors.social) : 'none'
                              }} 
                            />
                          </div>
                        </a>
                      </td>
                    )}
                    
                    {signatureData.socialLinks?.instagram && (
                      <td>
                        <a href={signatureData.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                          <div style={{
                            display: 'inline-block',
                            backgroundColor: signatureData.socialBackground?.enabled ? (signatureData.socialBackground?.color || '#f3f4f6') : 'transparent',
                            borderRadius: signatureData.socialBackground?.enabled && signatureData.socialBackground?.shape === 'round' ? '50%' : '4px',
                            padding: signatureData.socialBackground?.enabled ? '6px' : '0'
                          }}>
                            <img 
                              src={`https://img.icons8.com/fluency/${signatureData.socialSize || 24}/instagram-new.png`}
                              alt="Instagram" 
                              width={signatureData.socialSize || 24} 
                              height={signatureData.socialSize || 24} 
                              style={{ 
                                display: 'block',
                                filter: signatureData.colors?.social ? getColorFilter(signatureData.colors.social) : 'none'
                              }} 
                            />
                          </div>
                        </a>
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        )}

      </tbody>
    </table>
  );
};

export default VerticalSignature;
