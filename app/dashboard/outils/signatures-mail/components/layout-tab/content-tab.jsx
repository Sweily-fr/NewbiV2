"use client";

import React from "react";
import { Separator } from "@/src/components/ui/separator";
import { useSignatureData } from "@/src/hooks/use-signature-data";

// Import section components
import DisplayModeSection from "./sections/DisplayModeSection";
import ColumnWidthSection from "./sections/ColumnWidthSection";
import StructureSection from "./sections/StructureSection";
import SpacingSection from "./sections/SpacingSection";
import SaveSection from "./sections/SaveSection";

export default function ContentTab() {
  const { signatureData, updateSignatureData } = useSignatureData();

  return (
    <div className="flex flex-col gap-6">
      <DisplayModeSection
        signatureData={signatureData}
        updateSignatureData={updateSignatureData}
      />
      <Separator />

      <ColumnWidthSection
        signatureData={signatureData}
        updateSignatureData={updateSignatureData}
      />
      <Separator />

      <StructureSection
        signatureData={signatureData}
        updateSignatureData={updateSignatureData}
      />
      <Separator />

      <SpacingSection
        signatureData={signatureData}
        updateSignatureData={updateSignatureData}
      />
      {/* <Separator /> */}

      {/* <SaveSection /> */}
    </div>
  );
}
//                   <Label className="text-xs text-muted-foreground">Bordures des cellules</Label>
//                   {signatureData.customLayout.cells.map((cell) => (
//                     <div key={cell.id} className="border rounded p-2 space-y-2">
//                       <div className="text-xs font-medium text-center">
//                         Cellule {cell.row + 1}-{cell.col + 1}
//                       </div>
//                       <div className="grid grid-cols-4 gap-1">
//                         {/* Bordure haut */}
//                         <Button
//                           variant={cell.borders?.top ? "default" : "outline"}
//                           size="sm"
//                           onClick={() => handleCellBorderChange(cell.id, 'top', !cell.borders?.top)}
//                           className="h-6 p-0 text-xs"
//                           title="Bordure haut"
//                         >
//                           ↑
//                         </Button>
//                         {/* Bordure droite */}
//                         <Button
//                           variant={cell.borders?.right ? "default" : "outline"}
//                           size="sm"
//                           onClick={() => handleCellBorderChange(cell.id, 'right', !cell.borders?.right)}
//                           className="h-6 p-0 text-xs"
//                           title="Bordure droite"
//                         >
//                           →
//                         </Button>
//                         {/* Bordure bas */}
//                         <Button
//                           variant={cell.borders?.bottom ? "default" : "outline"}
//                           size="sm"
//                           onClick={() => handleCellBorderChange(cell.id, 'bottom', !cell.borders?.bottom)}
//                           className="h-6 p-0 text-xs"
//                           title="Bordure bas"
//                         >
//                           ↓
//                         </Button>
//                         {/* Bordure gauche */}
//                         <Button
//                           variant={cell.borders?.left ? "default" : "outline"}
//                           size="sm"
//                           onClick={() => handleCellBorderChange(cell.id, 'left', !cell.borders?.left)}
//                           className="h-6 p-0 text-xs"
//                           title="Bordure gauche"
//                         >
//                           ←
//                         </Button>
//                       </div>

//                       {/* Alignement de la cellule */}
//                       <div className="space-y-1">
//                         <Label className="text-xs text-muted-foreground">Alignement</Label>
//                         <div className="flex gap-1">
//                           <Button
//                             variant={cell.alignment === 'left' ? "default" : "outline"}
//                             size="sm"
//                             onClick={() => handleCellAlignmentChange(cell.id, 'left')}
//                             className="h-6 p-0 text-xs flex-1"
//                           >
//                             ←
//                           </Button>
//                           <Button
//                             variant={cell.alignment === 'center' ? "default" : "outline"}
//                             size="sm"
//                             onClick={() => handleCellAlignmentChange(cell.id, 'center')}
//                             className="h-6 p-0 text-xs flex-1"
//                           >
//                             ↔
//                           </Button>
//                           <Button
//                             variant={cell.alignment === 'right' ? "default" : "outline"}
//                             size="sm"
//                             onClick={() => handleCellAlignmentChange(cell.id, 'right')}
//                             className="h-6 p-0 text-xs flex-1"
//                           >
//                             →
//                           </Button>
//                         </div>
//                       </div>

//                       {/* Dimensions de la cellule */}
//                       <div className="space-y-2">
//                         <Label className="text-xs text-muted-foreground">Dimensions</Label>
//                         <div className="grid grid-cols-2 gap-2">
//                           <div>
//                             <Label className="text-xs">Largeur (px)</Label>
//                             <Input
//                               type="number"
//                               value={cell.width || ''}
//                               onChange={(e) => handleCellDimensionChange(cell.id, 'width', e.target.value)}
//                               placeholder="Auto"
//                               className="h-6 text-xs"
//                               min="50"
//                               max="500"
//                             />
//                           </div>
//                           <div>
//                             <Label className="text-xs">Hauteur (px)</Label>
//                             <Input
//                               type="number"
//                               value={cell.height || ''}
//                               onChange={(e) => handleCellDimensionChange(cell.id, 'height', e.target.value)}
//                               placeholder="Auto"
//                               className="h-6 text-xs"
//                               min="50"
//                               max="300"
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               {/* Gestion des éléments de la grille */}
//               {signatureData.customLayout?.cells && (
//                 <div className="space-y-3">
//                   <Label className="text-xs text-muted-foreground">Éléments de la grille</Label>
//                   {signatureData.customLayout.cells.map((cell) => (
//                     <div key={cell.id} className="border rounded p-2 space-y-2">
//                       <div className="text-xs font-medium text-center">
//                         Cellule {cell.row + 1}-{cell.col + 1}
//                       </div>

//                       {/* Ajouter un élément */}
//                       <div className="flex gap-1">
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleAddElementToCell(cell.id, 'photo')}
//                           className="h-6 px-2 text-xs flex-1"
//                           title="Ajouter photo"
//                         >
//                           📷
//                         </Button>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleAddElementToCell(cell.id, 'logo')}
//                           className="h-6 px-2 text-xs flex-1"
//                           title="Ajouter logo"
//                         >
//                           🏢
//                         </Button>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => handleAddElementToCell(cell.id, 'text')}
//                           className="h-6 px-2 text-xs flex-1"
//                           title="Ajouter texte"
//                         >
//                           📝
//                         </Button>
//                       </div>

//                       {/* Liste des éléments existants */}
//                       {cell.elements && cell.elements.length > 0 && (
//                         <div className="space-y-2">
//                           {cell.elements.map((element, index) => (
//                             <div key={element.id || index} className="border rounded p-2 bg-gray-50 space-y-2">
//                               {/* En-tête de l'élément */}
//                               <div className="flex items-center gap-2 text-xs">
//                                 <span className="flex-1 font-medium">
//                                   {element.type === 'photo' && '📷 Photo de profil'}
//                                   {element.type === 'logo' && '🏢 Logo entreprise'}
//                                   {element.type === 'text' && `📝 ${element.content?.substring(0, 20)}...`}
//                                   {element.type === 'custom' && `✨ ${element.content?.substring(0, 20)}...`}
//                                 </span>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => handleRemoveElementFromCell(cell.id, element.id)}
//                                   className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
//                                   title="Supprimer"
//                                 >
//                                   ×
//                                 </Button>
//                               </div>

//                               {/* Contrôles des marges */}
//                               <div className="space-y-2">
//                                 <Label className="text-xs text-muted-foreground">Marges (px)</Label>
//                                 <div className="grid grid-cols-2 gap-2">
//                                   <div>
//                                     <Label className="text-xs">Haut</Label>
//                                     <Input
//                                       type="number"
//                                       value={element.margins?.top || ''}
//                                       onChange={(e) => handleElementMarginChange(cell.id, element.id, 'top', e.target.value)}
//                                       placeholder="0"
//                                       className="h-6 text-xs"
//                                       min="0"
//                                       max="50"
//                                     />
//                                   </div>
//                                   <div>
//                                     <Label className="text-xs">Bas</Label>
//                                     <Input
//                                       type="number"
//                                       value={element.margins?.bottom || ''}
//                                       onChange={(e) => handleElementMarginChange(cell.id, element.id, 'bottom', e.target.value)}
//                                       placeholder="0"
//                                       className="h-6 text-xs"
//                                       min="0"
//                                       max="50"
//                                     />
//                                   </div>
//                                   <div>
//                                     <Label className="text-xs">Gauche</Label>
//                                     <Input
//                                       type="number"
//                                       value={element.margins?.left || ''}
//                                       onChange={(e) => handleElementMarginChange(cell.id, element.id, 'left', e.target.value)}
//                                       placeholder="0"
//                                       className="h-6 text-xs"
//                                       min="0"
//                                       max="50"
//                                     />
//                                   </div>
//                                   <div>
//                                     <Label className="text-xs">Droite</Label>
//                                     <Input
//                                       type="number"
//                                       value={element.margins?.right || ''}
//                                       onChange={(e) => handleElementMarginChange(cell.id, element.id, 'right', e.target.value)}
//                                       placeholder="0"
//                                       className="h-6 text-xs"
//                                       min="0"
//                                       max="50"
//                                     />
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//           <Separator />
//         </>
//       )}

//       <div className="flex flex-col gap-3">
//         <h2 className="text-sm font-medium">Photo de profil</h2>
//         <div className="flex flex-col gap-3 ml-4">
//           {/* Upload de la photo de profil */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Photo</Label>
//             <div className="flex items-center gap-3 w-30">
//               {signatureData.photo ? (
//                 <div className="flex items-center gap-3 w-30">
//                   <img
//                     src={signatureData.photo}
//                     alt="Photo"
//                     className="w-8 h-8 object-cover rounded border"
//                     style={{
//                       borderRadius: signatureData.imageShape === 'square' ? '4px' : '50%'
//                     }}
//                   />
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => {
//                       const input = document.createElement('input');
//                       input.type = 'file';
//                       input.accept = 'image/*';
//                       input.onchange = (e) => {
//                         const file = e.target.files[0];
//                         if (file) {
//                           const reader = new FileReader();
//                           reader.onload = (e) => updateSignatureData('photo', e.target.result);
//                           reader.readAsDataURL(file);
//                         }
//                       };
//                       input.click();
//                     }}
//                     className="h-7 px-2 text-xs"
//                   >
//                     Changer
//                   </Button>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={() => updateSignatureData('photo', null)}
//                     className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
//                   >
//                     Supprimer
//                   </Button>
//                 </div>
//               ) : (
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => {
//                     const input = document.createElement('input');
//                     input.type = 'file';
//                     input.accept = 'image/*';
//                     input.onchange = (e) => {
//                       const file = e.target.files[0];
//                       if (file) {
//                         const reader = new FileReader();
//                         reader.onload = (e) => updateSignatureData('photo', e.target.result);
//                         reader.readAsDataURL(file);
//                       }
//                     };
//                     input.click();
//                   }}
//                   className="h-7 px-3 text-xs"
//                 >
//                   Ajouter photo
//                 </Button>
//               )}
//             </div>
//           </div>

//           {/* Taille de la photo */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Taille</Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.imageSize || 80}
//                 onChange={(e) => handleImageSizeChange(e.target.value)}
//                 onBlur={(e) => handleImageSizeChange(e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleImageSizeChange(e.target.value);
//                   }
//                 }}
//                 aria-label="Taille de l'image de profil"
//                 placeholder="80"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.imageSize || 80]}
//                 onValueChange={(value) => handleImageSizeChange(value[0])}
//                 min={40}
//                 max={150}
//                 step={5}
//                 aria-label="Taille image profil"
//               />
//             </div>
//           </div>

//           {/* Forme de la photo */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Forme</Label>
//             <AlignmentSelector
//               items={[
//                 { value: "square", icon: Table2 },
//                 { value: "round", icon: CircleOff }
//               ]}
//               size="sm"
//               className="w-30"
//               value={signatureData.imageShape || 'round'}
//               onValueChange={handleImageShapeChange}
//             />
//           </div>

//           {/* Alignement de la photo */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Alignement</Label>
//             <AlignmentSelector
//               items={[
//                 { value: "left", icon: AlignLeft },
//                 { value: "center", icon: AlignCenter },
//                 { value: "right", icon: AlignRight }
//               ]}
//               size="sm"
//               className="w-30"
//               value={signatureData.imageAlignment || 'left'}
//               onValueChange={(value) => updateSignatureData('imageAlignment', value)}
//             />
//           </div>
//         </div>
//       </div>
//       <Separator />
//       <ProfileImageSection
//         signatureData={signatureData}
//         updateSignatureData={updateSignatureData}
//       />
//       <Separator />
//       <CompanyLogoSection
//         signatureData={signatureData}
//         updateSignatureData={updateSignatureData}
//       />
//       <Separator />

//       <SocialNetworksSection
//         signatureData={signatureData}
//         updateSignatureData={updateSignatureData}
//       />
//       <Separator />

//       <TypographySection
//         signatureData={signatureData}
//         updateSignatureData={updateSignatureData}
//       />
//       <Separator />

//       <ColorsSection
//         signatureData={signatureData}
//         updateSignatureData={updateSignatureData}
//       />
//       <Separator />

//       <StructureSection
//         signatureData={signatureData}
//         updateSignatureData={updateSignatureData}
//       />
//       <Separator />

//       <SpacingSection
//         signatureData={signatureData}
//         updateSignatureData={updateSignatureData}
//       />
//       <Separator />

//       <SaveSection />
//     </div>
//   );
// }
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.positionBottom || 8}
//                 onChange={(e) => handleSpacingChange('positionBottom', e.target.value)}
//                 onBlur={(e) => handleSpacingChange('positionBottom', e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleSpacingChange('positionBottom', e.target.value);
//                   }
//                 }}
//                 min={0}
//                 max={30}
//                 aria-label="Espacement poste"
//                 placeholder="8"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.positionBottom || 8]}
//                 onValueChange={(value) => handleSpacingChange('positionBottom', value[0])}
//                 min={0}
//                 max={30}
//                 step={2}
//                 aria-label="Espacement poste"
//               />
//             </div>
//           </div>

//           {/* Espacement sous l'entreprise - disponible pour les deux layouts */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">
//               {signatureData.layout === 'vertical' ? 'Sous entreprise' : 'Entreprise → Contacts'}
//             </Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.companyBottom || 12}
//                 onChange={(e) => handleSpacingChange('companyBottom', e.target.value)}
//                 onBlur={(e) => handleSpacingChange('companyBottom', e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleSpacingChange('companyBottom', e.target.value);
//                   }
//                 }}
//                 min={0}
//                 max={30}
//                 aria-label="Espacement entreprise"
//                 placeholder="12"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.companyBottom || 12]}
//                 onValueChange={(value) => handleSpacingChange('companyBottom', value[0])}
//                 min={0}
//                 max={30}
//                 step={2}
//                 aria-label="Espacement entreprise"
//               />
//             </div>
//           </div>

//           {/* Espacement entre téléphone et mobile - disponible pour les deux layouts */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">
//               {signatureData.layout === 'vertical' ? 'Téléphone → Mobile' : 'Téléphone → Téléphone 2'}
//             </Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.phoneToMobile || 4}
//                 onChange={(e) => handleSpacingChange('phoneToMobile', e.target.value)}
//                 onBlur={(e) => handleSpacingChange('phoneToMobile', e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleSpacingChange('phoneToMobile', e.target.value);
//                   }
//                 }}
//                 min={0}
//                 max={20}
//                 aria-label="Espacement téléphone vers mobile"
//                 placeholder="4"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.phoneToMobile || 4]}
//                 onValueChange={(value) => handleSpacingChange('phoneToMobile', value[0])}
//                 min={0}
//                 max={20}
//                 step={1}
//                 aria-label="Espacement téléphone vers mobile"
//               />
//             </div>
//           </div>

//           {/* Espacement entre mobile et email - disponible pour les deux layouts */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">
//               {signatureData.layout === 'vertical' ? 'Mobile → Email' : 'Téléphone 2 → Email'}
//             </Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.mobileToEmail || 4}
//                 onChange={(e) => handleSpacingChange('mobileToEmail', e.target.value)}
//                 onBlur={(e) => handleSpacingChange('mobileToEmail', e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleSpacingChange('mobileToEmail', e.target.value);
//                   }
//                 }}
//                 min={0}
//                 max={20}
//                 aria-label="Espacement mobile vers email"
//                 placeholder="4"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.mobileToEmail || 4]}
//                 onValueChange={(value) => handleSpacingChange('mobileToEmail', value[0])}
//                 min={0}
//                 max={20}
//                 step={1}
//                 aria-label="Espacement mobile vers email"
//               />
//             </div>
//           </div>

//           {/* Espacement entre email et site web - disponible pour les deux layouts */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Email → Site web</Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.emailToWebsite || 4}
//                 onChange={(e) => handleSpacingChange('emailToWebsite', e.target.value)}
//                 onBlur={(e) => handleSpacingChange('emailToWebsite', e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleSpacingChange('emailToWebsite', e.target.value);
//                   }
//                 }}
//                 min={0}
//                 max={20}
//                 aria-label="Espacement email vers site web"
//                 placeholder="4"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.emailToWebsite || 4]}
//                 onValueChange={(value) => handleSpacingChange('emailToWebsite', value[0])}
//                 min={0}
//                 max={20}
//                 step={1}
//                 aria-label="Espacement email vers site web"
//               />
//             </div>
//           </div>

//           {/* Espacement entre site web et adresse - disponible pour les deux layouts */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Site web → Adresse</Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.websiteToAddress || 4}
//                 onChange={(e) => handleSpacingChange('websiteToAddress', e.target.value)}
//                 onBlur={(e) => handleSpacingChange('websiteToAddress', e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleSpacingChange('websiteToAddress', e.target.value);
//                   }
//                 }}
//                 min={0}
//                 max={20}
//                 aria-label="Espacement site web vers adresse"
//                 placeholder="4"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.websiteToAddress || 4]}
//                 onValueChange={(value) => handleSpacingChange('websiteToAddress', value[0])}
//                 min={0}
//                 max={20}
//                 step={1}
//                 aria-label="Espacement site web vers adresse"
//               />
//             </div>
//           </div>

//           {/* Espacement entre les contacts - disponible pour les deux layouts */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Entre contacts</Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.contactBottom || 6}
//                 onChange={(e) => handleSpacingChange('contactBottom', e.target.value)}
//                 onBlur={(e) => handleSpacingChange('contactBottom', e.target.value)}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     handleSpacingChange('contactBottom', e.target.value);
//                   }
//                 }}
//                 min={0}
//                 max={30}
//                 aria-label="Espacement entre contacts"
//                 placeholder="6"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.contactBottom || 6]}
//                 onValueChange={(value) => handleSpacingChange('contactBottom', value[0])}
//                 min={0}
//                 max={30}
//                 step={2}
//                 aria-label="Espacement entre contacts"
//               />
//             </div>
//           </div>

//           {/* Espacement au-dessus du séparateur */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Avant séparateur</Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.separatorTop || 12}
//                 onChange={(e) => handleSpacingChange('separatorTop', e.target.value)}
//                 min={0}
//                 max={30}

//                 aria-label="Espacement avant le séparateur"
//                 placeholder="12"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.separatorTop || 12]}
//                 onValueChange={(value) => handleSpacingChange('separatorTop', value[0])}
//                 min={0}
//                 max={30}
//                 step={2}
//                 aria-label="Espacement avant séparateur"
//               />
//             </div>
//           </div>

//           {/* Espacement sous le séparateur */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">
//               {signatureData.layout === 'vertical' ? 'Après séparateur' : 'Logo entreprise → Logo réseau sociaux'}
//             </Label>
//             <div className="flex items-center gap-3 w-30">
//               <Input
//                 className="h-8 w-12 px-2 py-1"
//                 type="text"
//                 inputMode="decimal"
//                 value={signatureData.spacings?.separatorBottom || 12}
//                 onChange={(e) => handleSpacingChange('separatorBottom', e.target.value)}
//                 min={0}
//                 max={30}

//                 aria-label="Espacement après le séparateur"
//                 placeholder="12"
//               />
//               <Slider
//                 className="grow"
//                 value={[signatureData.spacings?.separatorBottom || 12]}
//                 onValueChange={(value) => handleSpacingChange('separatorBottom', value[0])}
//                 min={0}
//                 max={30}
//                 step={2}
//                 aria-label="Espacement après séparateur"
//               />
//             </div>
//           </div>

//         </div>
//         )}
//       </div>

//       <Separator />
//       <div className="flex flex-col gap-3">
//         <h2 className="text-sm font-medium">Couleurs</h2>
//         <div className="flex flex-col gap-3 ml-4">

//           {/* Couleur du nom */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Nom et prénom</Label>
//             <div className="flex items-center gap-3 w-30">
//               <input
//                 type="color"
//                 value={signatureData.colors?.name || "#2563eb"}
//                 onChange={(e) => handleColorChange('name', e.target.value)}
//                 className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
//                 title="Couleur du nom et prénom"
//               />
//               <span className="text-xs text-muted-foreground w-16 text-right">
//                 {signatureData.colors?.name || "#2563eb"}
//               </span>
//             </div>
//           </div>

//           {/* Couleur du poste */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Poste</Label>
//             <div className="flex items-center gap-3 w-30">
//               <input
//                 type="color"
//                 value={signatureData.colors?.position || "#666666"}
//                 onChange={(e) => handleColorChange('position', e.target.value)}
//                 className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
//                 title="Couleur du poste"
//               />
//               <span className="text-xs text-muted-foreground w-16 text-right">
//                 {signatureData.colors?.position || "#666666"}
//               </span>
//             </div>
//           </div>

//           {/* Couleur de l'entreprise */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Entreprise</Label>
//             <div className="flex items-center gap-3 w-30">
//               <input
//                 type="color"
//                 value={signatureData.colors?.company || "#2563eb"}
//                 onChange={(e) => handleColorChange('company', e.target.value)}
//                 className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
//                 title="Couleur du nom d'entreprise"
//               />
//               <span className="text-xs text-muted-foreground w-16 text-right">
//                 {signatureData.colors?.company || "#2563eb"}
//               </span>
//             </div>
//           </div>

//           {/* Couleur des contacts */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Contacts</Label>
//             <div className="flex items-center gap-3 w-30">
//               <input
//                 type="color"
//                 value={signatureData.colors?.contact || "#666666"}
//                 onChange={(e) => handleColorChange('contact', e.target.value)}
//                 className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
//                 title="Couleur des informations de contact"
//               />
//               <span className="text-xs text-muted-foreground w-16 text-right">
//                 {signatureData.colors?.contact || "#666666"}
//               </span>
//             </div>
//           </div>

//           {/* Couleur du séparateur vertical - uniquement pour layout vertical */}
//           {signatureData.layout === 'vertical' && (
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Séparateur vertical</Label>
//             <div className="flex items-center gap-3 w-30">
//               <input
//                 type="color"
//                 value={signatureData.colors?.separatorVertical || "#e0e0e0"}
//                 onChange={(e) => handleColorChange('separatorVertical', e.target.value)}
//                 className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
//                 title="Couleur du séparateur vertical"
//               />
//               <span className="text-xs text-muted-foreground w-16 text-right">
//                 {signatureData.colors?.separatorVertical || "#e0e0e0"}
//               </span>
//             </div>
//           </div>
//           )}

//           {/* Couleur du séparateur horizontal */}
//           <div className="flex items-center justify-between">
//             <Label className="text-xs text-muted-foreground">Séparateur horizontal</Label>
//             <div className="flex items-center gap-3 w-30">
//               <input
//                 type="color"
//                 value={signatureData.colors?.separatorHorizontal || "#e0e0e0"}
//                 onChange={(e) => handleColorChange('separatorHorizontal', e.target.value)}
//                 className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
//                 title="Couleur du séparateur horizontal"
//               />
//               <span className="text-xs text-muted-foreground w-16 text-right">
//                 {signatureData.colors?.separatorHorizontal || "#e0e0e0"}
//               </span>
//             </div>
//           </div>

//         </div>
//       </div>

//       {/* Bouton de sauvegarde */}
//       <Separator />
//       <div className="flex flex-col gap-3">
//         <h2 className="text-sm font-medium">Sauvegarde</h2>
//         <div className="flex justify-center">
//           <SignatureSave />
//         </div>
//       </div>
//     </div>
//   );
// }
