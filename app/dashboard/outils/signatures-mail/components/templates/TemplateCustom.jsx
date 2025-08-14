"use client";

import React from 'react';
import { cn } from '@/src/lib/utils';
import { InlineEdit } from "@/src/components/ui/inline-edit";
import { ImageDropZone } from "@/src/components/ui/image-drop-zone";

const TemplateCustom = ({ 
  signatureData, 
  handleFieldChange, 
  handleImageChange, 
  validatePhone, 
  validateEmail, 
  validateUrl,
  logoSrc,
  isPreview = false,
  className = "" 
}) => {
  // Si pas de customLayout, on affiche une signature par défaut simple comme horizontal
  if (!signatureData.customLayout) {
    return (
      <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', maxWidth: '600px', fontFamily: 'Arial, sans-serif' }}>
        <tbody>
          <tr>
            {/* Photo de profil à gauche */}
            <td style={{ width: '100px', paddingRight: `${signatureData.spacings?.photoBottom || 16}px`, verticalAlign: 'top' }}>
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
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file && handleImageChange) {
                        handleImageChange('photo', file);
                      }
                    };
                    input.click();
                  }}
                  title="Cliquer pour changer la photo"
                />
              ) : (
                <div style={{ 
                  width: `${signatureData.imageSize || 80}px`, 
                  height: `${signatureData.imageSize || 80}px`,
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'block',
                  zIndex: 1
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: 1
                  }}>
                    <ImageDropZone
                      currentImage={signatureData.photo}
                      onImageChange={(file) => handleImageChange && handleImageChange('photo', file)}
                      placeholder="Photo de profil"
                      size="md"
                      type="profile"
                      style={{ 
                        width: '100%',
                        height: '100%',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        borderRadius: signatureData.imageShape === 'square' ? '8px' : '50%',
                        position: 'relative',
                        zIndex: 1
                      }}
                    />
                  </div>
                </div>
              )}
            </td>
            
            {/* Informations à droite */}
            <td style={{ verticalAlign: 'top', minWidth: '300px' }}>
              <table cellPadding="0" cellSpacing="0" border="0" style={{ borderCollapse: 'collapse', tableLayout: 'auto', width: '100%' }}>
                <tbody>
                  {/* Nom */}
                  <tr>
                    <td colSpan="2" style={{ 
                      textAlign: signatureData.nameAlignment || 'left',
                      paddingBottom: `${signatureData.spacings?.nameBottom || 2}px`
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
                          onChange={(value) => handleFieldChange && handleFieldChange("firstName", value)}
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
                          onChange={(value) => handleFieldChange && handleFieldChange("lastName", value)}
                          placeholder="Nom"
                          displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                          inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none !h-[1em] w-auto min-w-0 !leading-none"
                          className="!p-0 !m-0 !rounded-none inline-block w-auto"
                          style={{ width: 'auto', minWidth: '0', height: '1em', lineHeight: '1em' }}
                        />
                      </div>
                    </td>
                  </tr>
                  
                  {/* Poste */}
                  {(signatureData.position || !isPreview) && (
                    <tr>
                      <td colSpan="2" style={{ 
                        fontSize: '14px',
                        color: signatureData.colors?.position || '#666666',
                        paddingTop: '2px',
                        paddingBottom: `${signatureData.spacings?.positionBottom || 4}px`
                      }}>
                        <InlineEdit
                          value={signatureData.position}
                          onChange={(value) => handleFieldChange && handleFieldChange("position", value)}
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
                  {(signatureData.company || !isPreview) && (
                    <tr>
                      <td colSpan="2" style={{ 
                        fontSize: `${signatureData.fontSize?.company || 14}px`,
                        color: signatureData.colors?.company || '#2563eb',
                        paddingTop: '2px',
                        paddingBottom: `${signatureData.spacings?.companyBottom || 8}px`
                      }}>
                        <InlineEdit
                          value={signatureData.company}
                          onChange={(value) => handleFieldChange && handleFieldChange("company", value)}
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

                  {/* Téléphone */}
                  {(signatureData.phone || !isPreview) && (
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
                                  onChange={(value) => handleFieldChange && handleFieldChange("phone", value)}
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

                  {/* Email */}
                  {(signatureData.email || !isPreview) && (
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
                                  onChange={(value) => handleFieldChange && handleFieldChange("email", value)}
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

                  {/* Site web */}
                  {(signatureData.website || !isPreview) && (
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
                                  onChange={(value) => handleFieldChange && handleFieldChange("website", value)}
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
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  // Si customLayout existe, on utilise la grille personnalisée
  const layout = signatureData.customLayout;
  const { grid, cells } = layout;

  // Fonction pour rendre un élément avec inputs modifiables
  const renderElement = (element, index) => {
    const margins = element.margins || {};
    const styles = {
      ...element.styles,
      display: 'block',
      width: 'auto',
      marginTop: `${margins.top || 0}px`,
      marginBottom: `${margins.bottom || 0}px`,
      marginLeft: `${margins.left || 0}px`,
      marginRight: `${margins.right || 0}px`
    };

    switch (element.type) {
      case 'photo':
        return signatureData.photo ? (
          <div key={element.id || index} style={styles}>
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
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file && handleImageChange) {
                    handleImageChange('photo', file);
                  }
                };
                input.click();
              }}
              title="Cliquer pour changer la photo"
            />
          </div>
        ) : (
          <div key={element.id || index} style={{ ...styles, display: 'inline-block', width: 'auto' }}>
            <div style={{ 
              width: `${Math.max(signatureData.imageSize || 80, 120)}px`, 
              height: `${Math.max(signatureData.imageSize || 80, 120)}px`,
              position: 'relative',
              overflow: 'hidden',
              display: 'block',
              zIndex: 1
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1
              }}>
                <ImageDropZone
                  onImageChange={(file) => handleImageChange && handleImageChange('photo', file)}
                  currentImage={signatureData.photo}
                  size={signatureData.imageSize || 80}
                  shape={signatureData.imageShape}
                  className="cursor-pointer"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    borderRadius: signatureData.imageShape === 'square' ? '8px' : '50%',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'logo':
        return signatureData.logo ? (
          <div key={element.id || index} style={styles}>
            <img
              src={signatureData.logo}
              alt="Logo"
              style={{
                maxWidth: '120px',
                maxHeight: '40px',
                objectFit: 'contain',
                cursor: 'pointer'
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file && handleImageChange) {
                    handleImageChange('logo', file);
                  }
                };
                input.click();
              }}
              title="Cliquer pour changer le logo"
            />
          </div>
        ) : (
          <div key={element.id || index} style={{ ...styles, display: 'inline-block', width: 'auto' }}>
            <div style={{ 
              width: '160px', 
              height: '80px',
              position: 'relative',
              overflow: 'hidden',
              display: 'block',
              zIndex: 1
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1
              }}>
                <ImageDropZone
                  onImageChange={(file) => handleImageChange && handleImageChange('logo', file)}
                  currentImage={signatureData.logo}
                  className="cursor-pointer"
                  style={{ 
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    position: 'relative',
                    zIndex: 1
                  }}
                />
              </div>
            </div>
          </div>
        );
      
      case 'text':
        // Gestion des différents types de texte avec inputs modifiables
        if (element.content?.includes(signatureData.firstName) && element.content?.includes(signatureData.lastName)) {
          // Nom complet
          return (
            <div key={element.id || index} style={styles}>
              <InlineEdit
                value={signatureData.firstName}
                onChange={(value) => handleFieldChange && handleFieldChange("firstName", value)}
                placeholder="Prénom"
                displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none !h-[1em] w-auto min-w-0 !leading-none"
                className="!p-0 !m-0 !rounded-none inline-block w-auto"
                style={{ ...element.styles, width: 'auto', minWidth: '0', height: '1em', lineHeight: '1em' }}
              />
              {signatureData.firstName && signatureData.lastName && (
                <span style={{ margin: '0 4px' }}> </span>
              )}
              <InlineEdit
                value={signatureData.lastName}
                onChange={(value) => handleFieldChange && handleFieldChange("lastName", value)}
                placeholder="Nom"
                displayClassName="!p-0 !m-0 !rounded-none font-semibold inline-block w-auto"
                inputClassName="!p-0 !m-0 !rounded-none font-semibold border-0 shadow-none !h-[1em] w-auto min-w-0 !leading-none"
                className="!p-0 !m-0 !rounded-none inline-block w-auto"
                style={{ ...element.styles, width: 'auto', minWidth: '0', height: '1em', lineHeight: '1em' }}
              />
            </div>
          );
        } else if (element.content === signatureData.position) {
          // Poste
          return (
            <div key={element.id || index} style={styles}>
              <InlineEdit
                value={signatureData.position}
                onChange={(value) => handleFieldChange && handleFieldChange("position", value)}
                placeholder="Poste"
                displayClassName="!p-0 !m-0 !rounded-none inline-block w-auto"
                inputClassName="!p-0 !m-0 !rounded-none border-0 shadow-none !h-[1em] w-auto min-w-0 !leading-none"
                className="!p-0 !m-0 !rounded-none inline-block w-auto"
                style={{ ...element.styles, width: 'auto', minWidth: '0', height: '1em', lineHeight: '1em' }}
              />
            </div>
          );
        } else {
          // Texte personnalisé
          return (
            <div key={element.id || index} style={styles}>
              <InlineEdit
                value={element.content || ''}
                onChange={(value) => {
                  // Mettre à jour l'élément dans le layout custom
                  if (handleFieldChange) {
                    const updatedLayout = { ...layout };
                    const cellIndex = updatedLayout.cells.findIndex(c => c.id === element.cellId);
                    if (cellIndex !== -1) {
                      const elementIndex = updatedLayout.cells[cellIndex].elements.findIndex(e => e.id === element.id);
                      if (elementIndex !== -1) {
                        updatedLayout.cells[cellIndex].elements[elementIndex].content = value;
                        handleFieldChange('customLayout', updatedLayout);
                      }
                    }
                  }
                }}
                placeholder="Texte personnalisé"
                displayClassName="!p-0 !m-0 !rounded-none inline-block w-auto"
                inputClassName="!p-0 !m-0 !rounded-none border-0 shadow-none !h-[1em] w-auto min-w-0 !leading-none"
                className="!p-0 !m-0 !rounded-none inline-block w-auto"
                style={{ ...element.styles, width: 'auto', minWidth: '0', height: '1em', lineHeight: '1em' }}
              />
            </div>
          );
        }
      
      case 'custom':
        return (
          <div key={element.id || index} style={styles}>
            <InlineEdit
              value={element.content || ''}
              onChange={(value) => {
                // Mettre à jour l'élément dans le layout custom
                if (handleFieldChange) {
                  const updatedLayout = { ...layout };
                  const cellIndex = updatedLayout.cells.findIndex(c => c.id === element.cellId);
                  if (cellIndex !== -1) {
                    const elementIndex = updatedLayout.cells[cellIndex].elements.findIndex(e => e.id === element.id);
                    if (elementIndex !== -1) {
                      updatedLayout.cells[cellIndex].elements[elementIndex].content = value;
                      handleFieldChange('customLayout', updatedLayout);
                    }
                  }
                }
              }}
              placeholder="Contenu personnalisé"
              displayClassName="!p-0 !m-0 !rounded-none inline-block w-auto"
              inputClassName="!p-0 !m-0 !rounded-none border-0 shadow-none !h-[1em] w-auto min-w-0 !leading-none"
              className="!p-0 !m-0 !rounded-none inline-block w-auto"
              style={{ ...element.styles, width: 'auto', minWidth: '0', height: '1em', lineHeight: '1em' }}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  // Fonction pour ajouter un élément à une cellule
  const addElementToCell = (cellId, elementType) => {
    if (!handleFieldChange) return;

    // Vérifier s'il y a déjà une photo ou un logo dans la grille
    if (elementType === 'photo') {
      const hasPhoto = layout.cells.some(cell => 
        cell.elements?.some(element => element.type === 'photo')
      );
      if (hasPhoto) {
        alert('Une seule photo de profil est autorisée dans la signature.');
        return;
      }
    }

    if (elementType === 'logo') {
      const hasLogo = layout.cells.some(cell => 
        cell.elements?.some(element => element.type === 'logo')
      );
      if (hasLogo) {
        alert('Un seul logo d\'entreprise est autorisé dans la signature.');
        return;
      }
    }

    const newElement = {
      id: `element-${Date.now()}`,
      type: elementType,
      content: getDefaultElementContent(elementType),
      alignment: 'left',
      styles: getDefaultElementStyles(elementType)
    };

    const updatedCells = layout.cells.map(cell => {
      if (cell.id === cellId) {
        return {
          ...cell,
          elements: [...(cell.elements || []), newElement]
        };
      }
      return cell;
    });

    handleFieldChange('customLayout', {
      ...layout,
      cells: updatedCells
    });
  };

  // Contenu par défaut pour les nouveaux éléments
  const getDefaultElementContent = (type) => {
    switch (type) {
      case 'photo': return signatureData.photo || '';
      case 'logo': return signatureData.logo || '';
      case 'text': return `${signatureData.firstName || ''} ${signatureData.lastName || ''}`.trim() || 'Nouveau texte';
      case 'custom': return 'Contenu personnalisé';
      default: return '';
    }
  };

  // Styles par défaut pour les nouveaux éléments
  const getDefaultElementStyles = (type) => {
    switch (type) {
      case 'text':
        return { fontSize: '16px', color: '#000', fontWeight: 'bold' };
      case 'custom':
        return { fontSize: '14px', color: '#666' };
      default:
        return {};
    }
  };

  // Fonction pour rendre une cellule
  const renderCell = (cell) => {
    const { borders = {}, width, height, alignment = 'left' } = cell;
    
    const borderStyles = {
      borderTop: borders.top ? '2px solid #e5e7eb' : 'none',
      borderRight: borders.right ? '2px solid #e5e7eb' : 'none',
      borderBottom: borders.bottom ? '2px solid #e5e7eb' : 'none',
      borderLeft: borders.left ? '2px solid #e5e7eb' : 'none',
      padding: '10px',
      verticalAlign: 'top',
      width: width ? `${width}px` : 'auto',
      minWidth: '100px',
      height: height ? `${height}px` : 'auto',
      minHeight: '60px',
      wordWrap: 'break-word',
      position: 'relative'
    };

    return (
      <td key={cell.id} style={borderStyles}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0px',
          alignItems: alignment === 'center' ? 'center' : 
                     alignment === 'right' ? 'flex-end' : 'flex-start',
          minHeight: height ? `${height - 20}px` : '60px',
          height: '100%'
        }}>
          {cell.elements?.map((element, index) => renderElement(element, index))}
          
          {/* Boutons d'ajout inline */}
          {!isPreview && (
            <div style={{ 
              display: 'flex', 
              gap: '4px', 
              marginTop: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => addElementToCell(cell.id, 'photo')}
                style={{
                  background: '#f3f4f6',
                  border: '1px dashed #d1d5db',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Ajouter photo"
              >
                📷 +
              </button>
              <button
                onClick={() => addElementToCell(cell.id, 'logo')}
                style={{
                  background: '#f3f4f6',
                  border: '1px dashed #d1d5db',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Ajouter logo"
              >
                🏢 +
              </button>
              <button
                onClick={() => addElementToCell(cell.id, 'text')}
                style={{
                  background: '#f3f4f6',
                  border: '1px dashed #d1d5db',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Ajouter texte"
              >
                📝 +
              </button>
            </div>
          )}
        </div>
      </td>
    );
  };

  // Construire la grille
  const rows = [];
  for (let row = 0; row < grid.rows; row++) {
    const rowCells = cells.filter(cell => cell.row === row).sort((a, b) => a.col - b.col);
    rows.push(
      <tr key={row}>
        {rowCells.map(cell => renderCell(cell))}
      </tr>
    );
  }

  return (
    <table 
      cellPadding="0" 
      cellSpacing="0" 
      border="0" 
      style={{ 
        borderCollapse: 'collapse', 
        width: 'auto', // Largeur automatique basée sur le contenu
        maxWidth: '600px', 
        fontFamily: 'Arial, sans-serif',
        tableLayout: 'auto' // Permet aux cellules de s'adapter automatiquement
      }}
      className={cn("", className)}
    >
      <tbody>
        {rows}
      </tbody>
    </table>
  );
};

export default TemplateCustom;
