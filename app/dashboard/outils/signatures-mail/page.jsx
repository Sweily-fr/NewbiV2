"use client";

import { Suspense } from "react";
import { Plus, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Card, CardContent } from "@/src/components/ui/card";
import SignatureTable from "./components/signature-table";
import { useRouter } from "next/navigation";
import { CompanyInfoGuard } from "@/src/components/guards/CompanyInfoGuard";
import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { gql } from "@apollo/client";

// Query pour récupérer toutes les signatures de l'utilisateur
const GET_MY_EMAIL_SIGNATURES = gql`
  query GetMyEmailSignatures {
    getMyEmailSignatures {
      id
      signatureName
      isDefault
      firstName
      lastName
      position
      email
      companyName
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour supprimer une signature
const DELETE_EMAIL_SIGNATURE = gql`
  mutation DeleteEmailSignature($id: ID!) {
    deleteEmailSignature(id: $id)
  }
`;

// Mutation pour définir une signature comme défaut
const SET_DEFAULT_EMAIL_SIGNATURE = gql`
  mutation SetDefaultEmailSignature($id: ID!) {
    setDefaultEmailSignature(id: $id) {
      id
      signatureName
      isDefault
    }
  }
`;

// Query pour récupérer une signature spécifique (pour l'édition) - Version complète avec tous les champs
const GET_EMAIL_SIGNATURE = gql`
  query GetEmailSignature($id: ID!) {
    getEmailSignature(id: $id) {
      id
      signatureName
      isDefault
      firstName
      lastName
      position
      email
      phone
      mobile
      website
      address
      companyName
      showPhoneIcon
      showMobileIcon
      showEmailIcon
      showAddressIcon
      showWebsiteIcon
      primaryColor
      colors {
        name
        position
        company
        contact
        separatorVertical
        separatorHorizontal
      }
      nameSpacing
      nameAlignment
      layout
      columnWidths {
        photo
        content
      }
      photo
      photoKey
      logo
      logoKey
      imageSize
      imageShape
      logoSize
      separatorVerticalWidth
      separatorHorizontalWidth
      spacings {
        global
        photoBottom
        logoBottom
        nameBottom
        positionBottom
        companyBottom
        contactBottom
        phoneToMobile
        mobileToEmail
        emailToWebsite
        websiteToAddress
        separatorTop
        separatorBottom
      }
      fontFamily
      fontSize {
        name
        position
        contact
      }
      createdAt
      updatedAt
    }
  }
`;

// Mutation pour créer une signature (duplication)
const CREATE_EMAIL_SIGNATURE = gql`
  mutation CreateEmailSignature($input: EmailSignatureInput!) {
    createEmailSignature(input: $input) {
      id
      signatureName
      isDefault
      createdAt
    }
  }
`;

function SignaturesContent() {
  const router = useRouter();

  const handleCreateSignature = () => {
    router.push("/dashboard/outils/signatures-mail/new");
  };

  return (
    <CompanyInfoGuard>
      {/* Mobile Desktop-Only Notice */}
      <div className="block lg:hidden">
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Monitor className="h-16 w-16 text-primary" />
                  {/* <div className="absolute -bottom-2 -right-2 bg-background border-2 border-border rounded-full p-1">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div> */}
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-foreground">
                  Fonctionnalité Desktop uniquement
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  La création et gestion des signatures mail nécessite un écran
                  plus large pour une expérience optimale.
                </p>
              </div>

              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Veuillez utiliser un ordinateur pour accéder à cette
                  fonctionnalité.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="hidden lg:block space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium mb-2">Signatures Mail</h1>
            <p className="text-muted-foreground text-sm">
              Gérez vos signatures mail et suivez les modifications
            </p>
          </div>
          <Button
            onClick={handleCreateSignature}
            className="gap-2 font-normal cursor-pointer"
          >
            Créer une signature
          </Button>
        </div>

        {/* Table */}
        <Suspense fallback={<SignatureTableSkeleton />}>
          <SignatureTable />
        </Suspense>
      </div>
    </CompanyInfoGuard>
  );
}

export default function SignaturesPage() {
  return (
    <ProRouteGuard pageName="Signatures Mail">
      <SignaturesContent />
    </ProRouteGuard>
  );
}

function SignatureTableSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[300px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
      </div>
      <div className="rounded-md border">
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 py-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
