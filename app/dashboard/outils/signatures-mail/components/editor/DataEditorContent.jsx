"use client";

import React, { useRef } from "react";
import { User, Building2, Mail, Phone, Globe, MapPin, Upload, X } from "lucide-react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";

/**
 * Input field with icon
 */
function InputField({ icon: Icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </Label>
      <Input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9"
      />
    </div>
  );
}

/**
 * Image upload field
 */
function ImageUploadField({ label, icon: Icon, value, onUpload, onRemove, placeholder }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpload(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {value ? (
          <div className="flex items-center gap-2 flex-1">
            <img
              src={value}
              alt={label}
              className="w-10 h-10 object-cover rounded border"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              Changer
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={onRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-9 flex-1 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {placeholder || "Télécharger"}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * DataEditorContent - Sidebar content for editing signature data/variables
 */
export default function DataEditorContent() {
  const { signatureData, updateSignatureData } = useSignatureData();

  return (
    <div className="space-y-6">
      {/* Personal Info Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Informations personnelles
        </h4>

        <InputField
          icon={User}
          label="Nom complet"
          value={signatureData.fullName}
          onChange={(v) => updateSignatureData("fullName", v)}
          placeholder="Jean Dupont"
        />

        <InputField
          icon={Building2}
          label="Poste"
          value={signatureData.position}
          onChange={(v) => updateSignatureData("position", v)}
          placeholder="Directeur Marketing"
        />

        <InputField
          icon={Building2}
          label="Entreprise"
          value={signatureData.companyName}
          onChange={(v) => updateSignatureData("companyName", v)}
          placeholder="Ma Société"
        />
      </div>

      <Separator />

      {/* Contact Info Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Coordonnées
        </h4>

        <InputField
          icon={Phone}
          label="Téléphone"
          value={signatureData.phone}
          onChange={(v) => updateSignatureData("phone", v)}
          placeholder="+33 1 23 45 67 89"
          type="tel"
        />

        <InputField
          icon={Phone}
          label="Mobile"
          value={signatureData.mobile}
          onChange={(v) => updateSignatureData("mobile", v)}
          placeholder="+33 6 12 34 56 78"
          type="tel"
        />

        <InputField
          icon={Mail}
          label="Email"
          value={signatureData.email}
          onChange={(v) => updateSignatureData("email", v)}
          placeholder="contact@exemple.fr"
          type="email"
        />

        <InputField
          icon={Globe}
          label="Site web"
          value={signatureData.website}
          onChange={(v) => updateSignatureData("website", v)}
          placeholder="www.exemple.fr"
          type="url"
        />

        <InputField
          icon={MapPin}
          label="Adresse"
          value={signatureData.address}
          onChange={(v) => updateSignatureData("address", v)}
          placeholder="123 Rue Exemple, 75001 Paris"
        />
      </div>

      <Separator />

      {/* Images Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Images
        </h4>

        <ImageUploadField
          icon={User}
          label="Photo de profil"
          value={signatureData.photo}
          onUpload={(v) => updateSignatureData("photo", v)}
          onRemove={() => updateSignatureData("photo", null)}
          placeholder="Ajouter une photo"
        />

        <ImageUploadField
          icon={Building2}
          label="Logo entreprise"
          value={signatureData.logo}
          onUpload={(v) => updateSignatureData("logo", v)}
          onRemove={() => updateSignatureData("logo", null)}
          placeholder="Ajouter un logo"
        />
      </div>

      <Separator />

      {/* Social Networks Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Réseaux sociaux
        </h4>

        <InputField
          icon={Globe}
          label="LinkedIn"
          value={signatureData.socialNetworks?.linkedin?.url || signatureData.socialNetworks?.linkedin || ""}
          onChange={(v) => updateSignatureData("socialNetworks", {
            ...signatureData.socialNetworks,
            linkedin: v || undefined
          })}
          placeholder="https://linkedin.com/in/..."
          type="url"
        />

        <InputField
          icon={Globe}
          label="X (Twitter)"
          value={signatureData.socialNetworks?.x?.url || signatureData.socialNetworks?.x || ""}
          onChange={(v) => updateSignatureData("socialNetworks", {
            ...signatureData.socialNetworks,
            x: v || undefined
          })}
          placeholder="https://x.com/..."
          type="url"
        />

        <InputField
          icon={Globe}
          label="Facebook"
          value={signatureData.socialNetworks?.facebook?.url || signatureData.socialNetworks?.facebook || ""}
          onChange={(v) => updateSignatureData("socialNetworks", {
            ...signatureData.socialNetworks,
            facebook: v || undefined
          })}
          placeholder="https://facebook.com/..."
          type="url"
        />

        <InputField
          icon={Globe}
          label="Instagram"
          value={signatureData.socialNetworks?.instagram?.url || signatureData.socialNetworks?.instagram || ""}
          onChange={(v) => updateSignatureData("socialNetworks", {
            ...signatureData.socialNetworks,
            instagram: v || undefined
          })}
          placeholder="https://instagram.com/..."
          type="url"
        />

        <InputField
          icon={Globe}
          label="GitHub"
          value={signatureData.socialNetworks?.github?.url || signatureData.socialNetworks?.github || ""}
          onChange={(v) => updateSignatureData("socialNetworks", {
            ...signatureData.socialNetworks,
            github: v || undefined
          })}
          placeholder="https://github.com/..."
          type="url"
        />

        <InputField
          icon={Globe}
          label="YouTube"
          value={signatureData.socialNetworks?.youtube?.url || signatureData.socialNetworks?.youtube || ""}
          onChange={(v) => updateSignatureData("socialNetworks", {
            ...signatureData.socialNetworks,
            youtube: v || undefined
          })}
          placeholder="https://youtube.com/..."
          type="url"
        />
      </div>
    </div>
  );
}
