"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";

const TemplateShah = ({ 
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
      maxWidth: '480px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff'
    }}>
      <tbody>
        <tr>
          {/* Informations à gauche */}
          <td style={{ 
            verticalAlign: 'top', 
            paddingRight: '25px',
            paddingBottom: '15px',
            width: '300px'
          }}>
            {/* Nom complet */}
            <div style={{ 
              fontSize: '26px', 
              fontWeight: 'bold', 
              color: '#1a1a1a',
              lineHeight: '1.1',
              marginBottom: '6px',
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
                displayClassName="font-bold text-gray-900"
                inputClassName="font-bold text-gray-900 border-0 shadow-none p-1 text-2xl"
              />
            </div>
            
            {/* Titre/Position */}
            <div style={{ 
              fontSize: '15px', 
              color: '#666666',
              lineHeight: '1.4',
              marginBottom: '18px',
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
                <span style={{ color: '#666666' }}> at </span>
              )}
              <InlineEdit
                value={signatureData.company}
                onChange={(value) => handleFieldChange("company", value)}
                placeholder="Entreprise"
                displayClassName="text-gray-600 font-medium"
                inputClassName="text-gray-600 border-0 shadow-none p-1"
              />
            </div>
            
            {/* Informations de contact */}
            <div style={{ fontSize: '14px', lineHeight: '1.7', marginBottom: '20px' }}>
              {/* Email */}
              {signatureData.email && (
                <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#666666', marginRight: '8px', fontSize: '13px' }}>📧</span>
                  <InlineEdit
                    value={signatureData.email}
                    onChange={(value) => handleFieldChange("email", value)}
                    placeholder="email@exemple.com"
                    validation={validateEmail}
                    displayClassName="text-gray-700 hover:text-blue-600"
                    inputClassName="text-gray-700 border-0 shadow-none p-1"
                  />
                </div>
              )}
              
              {/* Téléphone */}
              {signatureData.phone && (
                <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#666666', marginRight: '8px', fontSize: '13px' }}>📱</span>
                  <InlineEdit
                    value={signatureData.phone}
                    onChange={(value) => handleFieldChange("phone", value)}
                    placeholder="Téléphone"
                    validation={validatePhone}
                    displayClassName="text-gray-700"
                    inputClassName="text-gray-700 border-0 shadow-none p-1"
                  />
                </div>
              )}
              
              {/* Site web */}
              {signatureData.website && (
                <div style={{ marginBottom: '5px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#666666', marginRight: '8px', fontSize: '13px' }}>🌍</span>
                  <InlineEdit
                    value={signatureData.website}
                    onChange={(value) => handleFieldChange("website", value)}
                    placeholder="www.exemple.com"
                    validation={validateUrl}
                    displayClassName="text-gray-700 hover:text-blue-600"
                    inputClassName="text-gray-700 border-0 shadow-none p-1"
                  />
                </div>
              )}
            </div>
            
            {/* Icônes sociales bleues alignées */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {/* LinkedIn */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#0077b5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>in</span>
              </div>
              
              {/* Twitter */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#0077b5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>🐦</span>
              </div>
              
              {/* Facebook */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#0077b5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>f</span>
              </div>
              
              {/* Instagram */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#0077b5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <span style={{ color: 'white', fontSize: '14px' }}>📷</span>
              </div>
            </div>
          </td>
          
          {/* Photo de profil carrée à droite */}
          <td style={{ 
            width: '130px', 
            verticalAlign: 'top',
            paddingBottom: '15px',
            textAlign: 'center'
          }}>
            {signatureData.photo ? (
              <div 
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '8px',
                  backgroundImage: `url('${signatureData.photo}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  display: 'inline-block',
                  cursor: 'pointer',
                  border: '2px solid #f0f0f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
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
                size="lg"
                type="profile"
                style={{ 
                  width: '120px',
                  height: '120px',
                  borderRadius: '8px',
                  border: '2px solid #f0f0f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
              />
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default TemplateShah;
