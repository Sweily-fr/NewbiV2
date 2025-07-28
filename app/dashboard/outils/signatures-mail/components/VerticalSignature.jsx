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
  validateUrl 
}) => {
  return (
    <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', maxWidth: '500px', fontFamily: 'Arial, sans-serif' }}>
      <tbody>
        <tr>
          {/* Colonne de gauche : Logo, Nom, Profession, Entreprise */}
          <td style={{ width: '200px', paddingRight: '20px', verticalAlign: 'top' }}>
            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {/* Logo */}
                <tr>
                  <td style={{ paddingBottom: '12px', textAlign: signatureData.nameAlignment || 'left' }}>
                    <ImageDropZone
                      currentImage={signatureData.photo}
                      onImageChange={(imageUrl) =>
                        handleImageChange("photo", imageUrl)
                      }
                      placeholder="Photo de profil"
                      size="md"
                      type="profile"
                      style={{ width: '80px', height: '80px', borderRadius: '50%' }}
                    />
                  </td>
                </tr>
                
                {/* Prénom et Nom */}
                <tr>
                  <td style={{ 
                    paddingBottom: '8px',
                    textAlign: signatureData.nameAlignment || 'left'
                  }}>
                    <div style={{ 
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: signatureData.primaryColor || '#2563eb',
                      lineHeight: '1.2'
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
                      paddingBottom: '8px',
                      textAlign: signatureData.nameAlignment || 'left'
                    }}>
                      <div style={{ 
                        fontSize: '14px',
                        color: 'rgb(102,102,102)'
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
                
                {/* Nom de l'entreprise */}
                <tr>
                  <td style={{ 
                    paddingBottom: '8px',
                    textAlign: signatureData.nameAlignment || 'left'
                  }}>
                    <div style={{ 
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: signatureData.primaryColor || '#2563eb'
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
              </tbody>
            </table>
          </td>
          
          {/* Colonne de droite : Contacts */}
          <td style={{ verticalAlign: 'top' }}>
            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {/* Téléphone fixe */}
                {signatureData.phone && (
                  <tr>
                    <td style={{ paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'rgb(102,102,102)' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        <InlineEdit
                          value={signatureData.phone}
                          onChange={(value) => handleFieldChange("phone", value)}
                          placeholder="Téléphone fixe"
                          validation={validatePhone}
                          displayClassName="text-xs text-gray-600"
                          inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Téléphone mobile */}
                {signatureData.mobile && (
                  <tr>
                    <td style={{ paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'rgb(102,102,102)' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        <InlineEdit
                          value={signatureData.mobile}
                          onChange={(value) => handleFieldChange("mobile", value)}
                          placeholder="Téléphone mobile"
                          validation={validatePhone}
                          displayClassName="text-xs text-gray-600"
                          inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Email */}
                {signatureData.email && (
                  <tr>
                    <td style={{ paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'rgb(102,102,102)' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        <InlineEdit
                          value={signatureData.email}
                          onChange={(value) => handleFieldChange("email", value)}
                          placeholder="adresse@email.com"
                          validation={validateEmail}
                          displayClassName="text-xs text-gray-600"
                          inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Site web */}
                {signatureData.website && (
                  <tr>
                    <td style={{ paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'rgb(102,102,102)' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        <InlineEdit
                          value={signatureData.website}
                          onChange={(value) => handleFieldChange("website", value)}
                          placeholder="www.monsite.com"
                          validation={validateUrl}
                          displayClassName="text-xs text-gray-600"
                          inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
                        />
                      </div>
                    </td>
                  </tr>
                )}
                
                {/* Adresse */}
                {signatureData.address && (
                  <tr>
                    <td style={{ paddingBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', fontSize: '12px', color: 'rgb(102,102,102)' }}>
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
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default VerticalSignature;
