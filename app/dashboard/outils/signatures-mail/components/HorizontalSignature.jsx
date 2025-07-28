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
  validateUrl 
}) => {
  return (
    <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', maxWidth: '500px', fontFamily: 'Arial, sans-serif' }}>
      <tbody>
        <tr>
          {/* Photo de profil à gauche */}
          <td style={{ width: '80px', paddingRight: '16px', verticalAlign: 'top' }}>
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
          
          {/* Informations empilées verticalement à droite */}
          <td style={{ verticalAlign: 'top' }}>
            <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', tableLayout: 'auto', width: 'auto' }}>
              <tbody>
                {/* Nom séparé en 2 cellules avec espacement contrôlé */}
                <tr>
                  <td colSpan="2" style={{ 
                    textAlign: signatureData.nameAlignment || 'left',
                    paddingBottom: '2px'
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
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: signatureData.primaryColor || '#2563eb',
                            lineHeight: '1.2',
                            paddingRight: `${signatureData.nameSpacing || 4}px`,
                            whiteSpace: 'nowrap'
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
                          </td>
                          <td style={{ 
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: signatureData.primaryColor || '#2563eb',
                            lineHeight: '1.2',
                            whiteSpace: 'nowrap'
                          }}>
                            <InlineEdit
                              value={signatureData.lastName}
                              onChange={(value) => handleFieldChange("lastName", value)}
                              placeholder="Nom"
                              displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                              inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none h-auto w-auto min-w-0"
                              className="!p-0 !m-0 !rounded-none inline-block w-auto"
                              style={{ width: 'auto', minWidth: '0' }}
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
                     color: 'rgb(102,102,102)',
                     paddingTop: '2px',
                     paddingBottom: '4px'
                   }}>
                     <InlineEdit
                       value={signatureData.position}
                       onChange={(value) => handleFieldChange("position", value)}
                       placeholder="Votre poste"
                       displayClassName="text-gray-600 text-sm"
                       inputClassName="text-gray-600 text-sm border-0 shadow-none p-1 h-auto"
                     />
                   </td>
                 </tr>
               )}
               
               {/* Informations de contact avec icônes images */}
               {signatureData.phone && (
                 <tr>
                   <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '1px' }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '8px', verticalAlign: 'middle', width: '14px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Téléphone" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block' }} />
                           </td>
                           <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'middle' }}>
                             <InlineEdit
                               value={signatureData.phone}
                               onChange={(value) => handleFieldChange("phone", value)}
                               placeholder="Numéro de téléphone"
                               validation={validatePhone}
                               displayClassName="text-xs text-gray-600"
                               inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
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
                   <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '1px' }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '8px', verticalAlign: 'middle', width: '14px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/126/126509.png" alt="Mobile" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block' }} />
                           </td>
                           <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'middle' }}>
                             <InlineEdit
                               value={signatureData.mobile}
                               onChange={(value) => handleFieldChange("mobile", value)}
                               placeholder="Téléphone mobile"
                               validation={validatePhone}
                               displayClassName="text-xs text-gray-600"
                               inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
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
                   <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '1px' }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '8px', verticalAlign: 'middle', width: '14px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/542/542689.png" alt="Email" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block' }} />
                           </td>
                           <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'middle' }}>
                             <InlineEdit
                               value={signatureData.email}
                               onChange={(value) => handleFieldChange("email", value)}
                               placeholder="adresse@email.com"
                               validation={validateEmail}
                               displayClassName="text-xs text-gray-600"
                               inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
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
                   <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '1px' }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '8px', verticalAlign: 'middle', width: '14px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" alt="Site web" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block' }} />
                           </td>
                           <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'middle' }}>
                             <InlineEdit
                               value={signatureData.website}
                               onChange={(value) => handleFieldChange("website", value)}
                               placeholder="www.monsite.com"
                               validation={validateUrl}
                               displayClassName="text-xs text-gray-600"
                               inputClassName="text-xs text-gray-600 border-0 shadow-none p-1 h-auto"
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
                   <td colSpan="2" style={{ paddingTop: '1px', paddingBottom: '4px' }}>
                     <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                       <tbody>
                         <tr>
                           <td style={{ paddingRight: '8px', verticalAlign: 'top', width: '14px' }}>
                             <img src="https://cdn-icons-png.flaticon.com/512/684/684908.png" alt="Adresse" width="12" height="12" style={{ width: '12px', height: '12px', display: 'block', marginTop: '1px' }} />
                           </td>
                           <td style={{ fontSize: '12px', color: 'rgb(102,102,102)', verticalAlign: 'top' }}>
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
               
               {/* Logo/Nom entreprise */}
               <tr>
                 <td colSpan="2" style={{ paddingTop: '6px', borderTop: '1px solid #e0e0e0' }}>
                   <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse' }}>
                     <tbody>
                       <tr>
                         <td style={{ paddingTop: '8px', paddingRight: '8px' }}>
                           <ImageDropZone
                             currentImage={signatureData.companyLogo}
                             onImageChange={(imageUrl) =>
                               handleImageChange("companyLogo", imageUrl)
                             }
                             placeholder="Logo entreprise"
                             size="xs"
                             type="logo"
                             style={{ height: '30px', maxWidth: '100px', width: 'auto' }}
                           />
                         </td>
                         <td style={{ 
                           fontSize: '14px',
                           fontWeight: 'bold',
                           color: signatureData.primaryColor || '#2563eb',
                           paddingTop: '8px',
                           verticalAlign: 'middle'
                         }}>
                           <InlineEdit
                             value={signatureData.companyName}
                             onChange={(value) =>
                               handleFieldChange("companyName", value)
                             }
                             placeholder="Nom entreprise"
                             displayClassName="text-blue-600 font-semibold text-sm"
                             inputClassName="text-blue-600 font-semibold text-sm border-0 shadow-none p-1 h-auto"
                           />
                         </td>
                       </tr>
                     </tbody>
                   </table>
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

export default HorizontalSignature;
