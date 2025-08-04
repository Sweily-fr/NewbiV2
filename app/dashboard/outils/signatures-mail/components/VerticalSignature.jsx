"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";

const VerticalSignature = ({ 
  signatureData, 
  handleFieldChange, 
  handleImageChange, 
  validatePhone, 
  validateEmail, 
  validateUrl,
  logoSrc 
}) => {
  return (
    <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', maxWidth: '500px', fontFamily: 'Arial, sans-serif' }}>
      <tbody>
        <tr>
          {/* Colonne de gauche : Informations personnelles */}
          <td style={{ width: '200px', paddingRight: '15px', verticalAlign: 'top' }}>
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
                        color: signatureData.colors?.position || 'rgb(102,102,102)',
                        fontFamily: signatureData.fontFamily || 'Arial, sans-serif'
                      }}>
                        <InlineEdit
                          value={signatureData.position}
                          onChange={(value) => handleFieldChange("position", value)}
                          placeholder="Votre poste"
                          displayClassName="text-gray-600 text-sm"
                          inputClassName="text-gray-600 text-sm border-0 shadow-none p-1 h-auto"
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
          <td style={{ paddingLeft: '15px', verticalAlign: 'top', width: '200px' }}>
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

      </tbody>
    </table>
  );
};

export default VerticalSignature;
