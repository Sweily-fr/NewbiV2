"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";

const TemplateObama = ({ 
  signatureData, 
  handleFieldChange, 
  handleImageChange, 
  validatePhone, 
  validateEmail, 
  validateUrl 
}) => {
  return (
    <table cellPadding="0" cellSpacing="0" border="0" style={{ 
      borderCollapse: 'collapse', 
      maxWidth: '450px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff'
    }}>
      <tbody>
        <tr>
          {/* Photo de profil à gauche */}
          <td style={{ 
            width: '100px', 
            paddingRight: '20px', 
            verticalAlign: 'top',
            paddingBottom: '10px'
          }}>
            {signatureData.photo ? (
              <div 
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundImage: `url('${signatureData.photo}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  display: 'block',
                  cursor: 'pointer',
                  border: '3px solid #f0f0f0'
                }}
                onClick={() => {
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
                placeholder="Photo"
                size="md"
                type="profile"
                style={{ 
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  border: '3px solid #f0f0f0'
                }}
              />
            )}
          </td>
          
          {/* Informations à droite */}
          <td style={{ verticalAlign: 'top', paddingBottom: '10px' }}>
            {/* Nom complet */}
            <div style={{ 
              fontSize: '22px', 
              fontWeight: 'bold', 
              color: '#2563eb',
              lineHeight: '1.2',
              marginBottom: '5px',
              fontFamily: 'Arial, sans-serif'
            }}>
              <InlineEdit
                value={`${signatureData.firstName || ''} ${signatureData.lastName || ''}`.trim()}
                onChange={(value) => {
                  const names = value.split(' ');
                  handleFieldChange("firstName", names[0] || '');
                  handleFieldChange("lastName", names.slice(1).join(' ') || '');
                }}
                placeholder="Nom complet"
                displayClassName="font-bold text-blue-600"
                inputClassName="font-bold text-blue-600 border-0 shadow-none p-1 text-xl"
              />
            </div>
            
            {/* Titre/Position */}
            {(signatureData.position || signatureData.company) && (
              <div style={{ 
                fontSize: '14px', 
                color: '#666666',
                lineHeight: '1.3',
                marginBottom: '15px',
                fontFamily: 'Arial, sans-serif'
              }}>
                <InlineEdit
                  value={signatureData.position}
                  onChange={(value) => handleFieldChange("position", value)}
                  placeholder="Titre"
                  displayClassName="text-gray-600"
                  inputClassName="text-gray-600 border-0 shadow-none p-1"
                />
                {signatureData.position && signatureData.company && (
                  <span style={{ color: '#666666' }}> | </span>
                )}
                <InlineEdit
                  value={signatureData.company}
                  onChange={(value) => handleFieldChange("company", value)}
                  placeholder="Entreprise"
                  displayClassName="text-gray-600"
                  inputClassName="text-gray-600 border-0 shadow-none p-1"
                />
              </div>
            )}
            
            {/* Informations de contact */}
            <div style={{ fontSize: '13px', color: '#666666', lineHeight: '1.6' }}>
              {/* Email */}
              {signatureData.email && (
                <div style={{ marginBottom: '3px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#2563eb', marginRight: '8px', fontSize: '14px' }}>✉</span>
                  <InlineEdit
                    value={signatureData.email}
                    onChange={(value) => handleFieldChange("email", value)}
                    placeholder="email@exemple.com"
                    validation={validateEmail}
                    displayClassName="text-gray-600 hover:text-blue-600"
                    inputClassName="text-gray-600 border-0 shadow-none p-1"
                  />
                </div>
              )}
              
              {/* Téléphone */}
              {signatureData.phone && (
                <div style={{ marginBottom: '3px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#2563eb', marginRight: '8px', fontSize: '14px' }}>📞</span>
                  <InlineEdit
                    value={signatureData.phone}
                    onChange={(value) => handleFieldChange("phone", value)}
                    placeholder="Téléphone"
                    validation={validatePhone}
                    displayClassName="text-gray-600"
                    inputClassName="text-gray-600 border-0 shadow-none p-1"
                  />
                </div>
              )}
              
              {/* Site web */}
              {signatureData.website && (
                <div style={{ marginBottom: '3px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#2563eb', marginRight: '8px', fontSize: '14px' }}>🌐</span>
                  <InlineEdit
                    value={signatureData.website}
                    onChange={(value) => handleFieldChange("website", value)}
                    placeholder="www.exemple.com"
                    validation={validateUrl}
                    displayClassName="text-gray-600 hover:text-blue-600"
                    inputClassName="text-gray-600 border-0 shadow-none p-1"
                  />
                </div>
              )}
              
              {/* Adresse */}
              {signatureData.address && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: '#2563eb', marginRight: '8px', fontSize: '14px', marginTop: '2px' }}>📍</span>
                  <InlineEdit
                    value={signatureData.address}
                    onChange={(value) => handleFieldChange("address", value)}
                    placeholder="Adresse"
                    multiline={true}
                    displayClassName="text-gray-600"
                    inputClassName="text-gray-600 border-0 shadow-none p-1 min-h-[2rem] resize-none"
                  />
                </div>
              )}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default TemplateObama;
