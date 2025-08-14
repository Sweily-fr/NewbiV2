"use client";

import React from "react";
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";

const HorizontalSignature = ({ 
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
          {/* Photo de profil à gauche */}
          <td style={{ width: '80px', paddingRight: `${signatureData.spacings?.photoBottom || 16}px`, verticalAlign: 'top' }}>
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
          
          {/* Informations empilées verticalement à droite */}
          <td style={{ verticalAlign: 'top' }}>
            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', tableLayout: 'auto', width: 'auto' }}>
              <tbody>
                {/* Nom séparé en 2 cellules avec espacement contrôlé */}
                <tr>
                  <td colSpan="2" style={{ 
                    textAlign: signatureData.nameAlignment || 'left',
                    paddingBottom: `${signatureData.spacings?.nameBottom || 2}px`
                  }}>
                    <table cellPadding="0" cellSpacing="0" border="0" style={{ 
                      borderCollapse: 'collapse',
                      margin: signatureData.nameAlignment === 'center' ? '0 auto' : 
                              signatureData.nameAlignment === 'right' ? '0 0 0 auto' : 
                              '0 auto 0 0'
                    }}>
                      <tbody>
                        <tr>
                          <td style={{ 
                            fontSize: `${signatureData.fontSize?.name || 16}px`,
                            fontWeight: 'bold',
                            color: signatureData.colors?.name || signatureData.primaryColor || '#2563eb',
                            lineHeight: '1.2',
                            paddingRight: `${signatureData.nameSpacing || 4}px`,
                            whiteSpace: 'nowrap',
                            fontFamily: signatureData.fontFamily || 'Arial, sans-serif'
                          }}>
                            <InlineEdit
                              value={signatureData.firstName}
                              onChange={(value) => handleFieldChange("firstName", value)}
                              placeholder="Prénom"
                              displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                              inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none !h-[1em] w-auto min-w-0 !leading-none"
                              className="!p-0 !m-0 !rounded-none inline-block w-auto"
                              style={{ width: 'auto', minWidth: '0', height: '1em', lineHeight: '1em' }}
                            />
                            {signatureData.firstName && signatureData.lastName && (
                              <span style={{ margin: '0 4px' }}> </span>
                            )}
                            <InlineEdit
                              value={signatureData.lastName}
                              onChange={(value) => handleFieldChange("lastName", value)}
                              placeholder="Nom"
                              displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                              inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none !h-[1em] w-auto min-w-0 !leading-none"
                              className="!p-0 !m-0 !rounded-none inline-block w-auto"
                              style={{ width: 'auto', minWidth: '0', height: '1em', lineHeight: '1em' }}
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
               
               {/* Titre sur toute la largeur */}
               {signatureData.position && (
                 <tr>
                   <td colSpan="2" style={{ 
                     fontSize: '14px',
                     color: signatureData.colors?.position || '#666666',
                     paddingTop: '2px',
                     paddingBottom: `${signatureData.spacings?.positionBottom || 4}px`
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
                   </td>
                 </tr>
               )}
               
               {/* Entreprise */}
                {signatureData.company && (
                  <tr>
                    <td colSpan="2" style={{ 
                      fontSize: `${signatureData.fontSize?.company || 14}px`,
                      color: signatureData.colors?.company || '#2563eb',
                      paddingTop: '2px',
                      paddingBottom: `${signatureData.spacings?.companyBottom || 8}px`
                    }}>
                      <InlineEdit
                        value={signatureData.company}
                        onChange={(value) => handleFieldChange("company", value)}
                        placeholder="Nom de l'entreprise"
                        displayClassName="text-sm"
                        inputClassName="text-sm border-0 shadow-none p-1 h-auto"
                        style={{
                          color: signatureData.colors?.company || '#2563eb',
                          fontSize: `${signatureData.fontSize?.company || 14}px`
                        }}
                      />
                    </td>
                  </tr>
                )}
                
                {/* Informations de contact avec icônes images */}
               {signatureData.phone && (
                 <tr>
                   <td colSpan="2" style={{ paddingTop: '4px', paddingBottom: `${signatureData.spacings?.phoneToMobile || 4}px` }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '10px', verticalAlign: 'middle', width: '20px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="16" height="16" style={{ width: '16px !important', height: '16px !important', display: 'block', minWidth: '16px' }} />
                           </td>
                           <td style={{ 
                             fontSize: '12px', 
                             color: signatureData.colors?.contact || 'rgb(102,102,102)', 
                             verticalAlign: 'middle' 
                           }}>
                             <InlineEdit
                               value={signatureData.phone}
                               onChange={(value) => handleFieldChange("phone", value)}
                               placeholder="Numéro de téléphone"
                               validation={validatePhone}
                               displayClassName="text-xs"
                               inputClassName="text-xs border-0 shadow-none p-1 h-auto"
                               style={{ color: signatureData.colors?.contact || 'rgb(102,102,102)' }}
                             />
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </td>
                 </tr>
               )}
               
               {signatureData.mobile && (
                 <tr>
                   <td colSpan="2" style={{ paddingTop: '4px', paddingBottom: `${signatureData.spacings?.mobileToEmail || 4}px` }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '10px', verticalAlign: 'middle', width: '20px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="16" height="16" style={{ width: '16px !important', height: '16px !important', display: 'block', minWidth: '16px' }} />
                           </td>
                           <td style={{ 
                             fontSize: '12px', 
                             color: signatureData.colors?.contact || 'rgb(102,102,102)', 
                             verticalAlign: 'middle' 
                           }}>
                             <InlineEdit
                               value={signatureData.mobile}
                               onChange={(value) => handleFieldChange("mobile", value)}
                               placeholder="Téléphone mobile"
                               validation={validatePhone}
                               displayClassName="text-xs"
                               inputClassName="text-xs border-0 shadow-none p-1 h-auto"
                               style={{ color: signatureData.colors?.contact || 'rgb(102,102,102)' }}
                             />
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </td>
                 </tr>
               )}
               
               {signatureData.email && (
                 <tr>
                   <td colSpan="2" style={{ paddingTop: '4px', paddingBottom: `${signatureData.spacings?.emailToWebsite || 4}px` }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '10px', verticalAlign: 'middle', width: '20px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="16" height="16" style={{ width: '16px !important', height: '16px !important', display: 'block', minWidth: '16px' }} />
                           </td>
                           <td style={{ 
                             fontSize: '12px', 
                             color: signatureData.colors?.contact || 'rgb(102,102,102)', 
                             verticalAlign: 'middle' 
                           }}>
                             <InlineEdit
                               value={signatureData.email}
                               onChange={(value) => handleFieldChange("email", value)}
                               placeholder="adresse@email.com"
                               validation={validateEmail}
                               displayClassName="text-xs"
                               inputClassName="text-xs border-0 shadow-none p-1 h-auto"
                               style={{ color: signatureData.colors?.contact || 'rgb(102,102,102)' }}
                             />
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </td>
                 </tr>
               )}
               
               {signatureData.website && (
                 <tr>
                   <td colSpan="2" style={{ paddingTop: '4px', paddingBottom: `${signatureData.spacings?.websiteToAddress || 4}px` }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '10px', verticalAlign: 'middle', width: '20px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="16" height="16" style={{ width: '16px !important', height: '16px !important', display: 'block', minWidth: '16px' }} />
                           </td>
                           <td style={{ 
                             fontSize: '12px', 
                             color: signatureData.colors?.contact || 'rgb(102,102,102)', 
                             verticalAlign: 'middle' 
                           }}>
                             <InlineEdit
                               value={signatureData.website}
                               onChange={(value) => handleFieldChange("website", value)}
                               placeholder="www.monsite.com"
                               validation={validateUrl}
                               displayClassName="text-xs"
                               inputClassName="text-xs border-0 shadow-none p-1 h-auto"
                               style={{ color: signatureData.colors?.contact || 'rgb(102,102,102)' }}
                             />
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </td>
                 </tr>
               )}
               
               {signatureData.address && (
                  <tr>
                    <td colSpan="2" style={{ paddingTop: '4px', paddingBottom: `${signatureData.spacings?.contactBottom || 8}px` }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '10px', verticalAlign: 'top', width: '20px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="16" height="16" style={{ width: '16px !important', height: '16px !important', display: 'block', marginTop: '2px', minWidth: '16px' }} />
                           </td>
                           <td style={{ 
                             fontSize: '12px', 
                             color: signatureData.colors?.contact || 'rgb(102,102,102)', 
                             verticalAlign: 'top' 
                           }}>
                             <InlineEdit
                               value={signatureData.address}
                               onChange={(value) => handleFieldChange("address", value)}
                               placeholder="Adresse complète"
                               multiline={true}
                               displayClassName="text-xs text-gray-600"
                               inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 min-h-[2rem] resize-none"
                             />
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </td>
                 </tr>
               )}
               

              </tbody>
            </table>
          </td>
        </tr>
        
        {/* Séparateur horizontal */}
        <tr>
          <td colSpan="2" style={{ 
            paddingTop: `${signatureData.spacings?.separatorTop || 12}px`, 
            paddingBottom: `${signatureData.spacings?.separatorBottom || 12}px` 
          }}>
            <hr style={{
              border: 'none',
              borderTop: `${signatureData.separatorHorizontalWidth || 1}px solid #e0e0e0`,
              margin: '0',
              width: '100%'
            }} />
          </td>
        </tr>
        
        {/* Logo entreprise après le séparateur */}
        <tr>
          <td colSpan="2" style={{ 
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
        
        {/* Logos sociaux */}
        {(signatureData.socialLinks?.linkedin || signatureData.socialLinks?.facebook || signatureData.socialLinks?.twitter || signatureData.socialLinks?.instagram) && (
          <tr>
            <td colSpan="2" style={{ 
              paddingTop: `${signatureData.spacings?.socialTop || 15}px`,
              textAlign: 'center' 
            }}>
              <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
                <tbody>
                  <tr>
                    {signatureData.socialLinks?.linkedin && (
                      <td style={{ paddingRight: '8px' }}>
                        <a href={signatureData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block' }}>
                            <path fill={signatureData.colors?.social || '#0077B5'} d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      </td>
                    )}
                    
                    {signatureData.socialLinks?.facebook && (
                      <td style={{ paddingRight: '8px' }}>
                        <a href={signatureData.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                          <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block' }}>
                            <path fill={signatureData.colors?.social || '#1877F2'} d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        </a>
                      </td>
                    )}
                    
                    {signatureData.socialLinks?.twitter && (
                      <td style={{ paddingRight: '8px' }}>
                        <a href={signatureData.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block' }}>
                            <path fill={signatureData.colors?.social || '#1DA1F2'} d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        </a>
                      </td>
                    )}
                    
                    {signatureData.socialLinks?.instagram && (
                      <td>
                        <a href={signatureData.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                          <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block' }}>
                            <path fill={signatureData.colors?.social || '#E4405F'} d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
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

export default HorizontalSignature;
