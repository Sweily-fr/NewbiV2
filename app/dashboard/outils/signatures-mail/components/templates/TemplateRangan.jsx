"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";

const TemplateRangan = ({ 
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
      maxWidth: '500px', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff'
    }}>
      <tbody>
        <tr>
          {/* Photo de profil à gauche */}
          <td style={{ 
            width: '110px', 
            paddingRight: '25px', 
            verticalAlign: 'top',
            paddingBottom: '15px'
          }}>
            {signatureData.photo ? (
              <div 
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundImage: `url('${signatureData.photo}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  display: 'block',
                  cursor: 'pointer',
                  border: '4px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '4px solid #fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
            )}
          </td>
          
          {/* Informations à droite */}
          <td style={{ verticalAlign: 'top', paddingBottom: '15px' }}>
            {/* Nom complet */}
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#1a1a1a',
              lineHeight: '1.2',
              marginBottom: '4px',
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
              fontSize: '16px', 
              color: '#666666',
              lineHeight: '1.3',
              marginBottom: '12px',
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
                <br />
              )}
              <InlineEdit
                value={signatureData.company}
                onChange={(value) => handleFieldChange("company", value)}
                placeholder="Entreprise"
                displayClassName="text-gray-600 font-medium"
                inputClassName="text-gray-600 border-0 shadow-none p-1"
              />
            </div>
            
            {/* Informations de contact avec icônes colorées */}
            <div style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '15px' }}>
              {/* Téléphone */}
              {signatureData.phone && (
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#ff6b35',
                    marginRight: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>📞</div>
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
              
              {/* Email */}
              {signatureData.email && (
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#4285f4',
                    marginRight: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>✉</div>
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
              
              {/* Site web */}
              {signatureData.website && (
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#34a853',
                    marginRight: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px'
                  }}>🌐</div>
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
            
            {/* Icônes sociales colorées */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* LinkedIn */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#0077b5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>in</span>
              </div>
              
              {/* Twitter */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#1da1f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <span style={{ color: 'white', fontSize: '12px' }}>🐦</span>
              </div>
              
              {/* Instagram */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <span style={{ color: 'white', fontSize: '12px' }}>📷</span>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default TemplateRangan;
