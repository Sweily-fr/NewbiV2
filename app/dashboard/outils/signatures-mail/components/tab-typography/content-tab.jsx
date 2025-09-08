"use client";

import React from "react";
import { Separator } from "@/src/components/ui/separator";
import { useSignatureData } from "@/src/hooks/use-signature-data";

// Import section components
import ProfileImageSection from "../layout-tab/sections/ProfileImageSection";
import CompanyLogoSection from "../layout-tab/sections/CompanyLogoSection";
import SocialNetworksSection from "../layout-tab/sections/SocialNetworksSection";
import TypographySection from "../layout-tab/sections/TypographySection";

export default function ContentTab() {
  const { signatureData, updateSignatureData } = useSignatureData();

  return (
    <div className="flex flex-col gap-6">
      <ProfileImageSection
        signatureData={signatureData}
        updateSignatureData={updateSignatureData}
      />
      <Separator />

      <CompanyLogoSection
        signatureData={signatureData}
        updateSignatureData={updateSignatureData}
      />
      <Separator />

      <SocialNetworksSection
        signatureData={signatureData}
        updateSignatureData={updateSignatureData}
      />
      <Separator />

      <TypographySection
        signatureData={signatureData}
        updateSignatureData={updateSignatureData}
      />
    </div>
  );
}
