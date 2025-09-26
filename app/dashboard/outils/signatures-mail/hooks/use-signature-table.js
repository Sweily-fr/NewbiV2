"use client";

import {
  useQuery,
  useMutation,
  useLazyQuery,
  gql,
  useApolloClient,
} from "@apollo/client";
import { useState, useMemo, useCallback } from "react";
import { toast } from "@/src/components/ui/sonner";
import { useRouter } from "next/navigation";

// Query pour récupérer toutes les signatures de l'utilisateur
const GET_MY_EMAIL_SIGNATURES = gql`
  query GetMyEmailSignatures {
    getMyEmailSignatures {
      id
      signatureName
      firstName
      lastName
      email
      position
      companyName
      phone
      website
      address
      photo
      logo
      primaryColor
      isDefault
      createdAt
      updatedAt
    }
  }
`;

// Query pour récupérer une signature spécifique (pour l'édition)
const GET_EMAIL_SIGNATURE = gql`
  query GetEmailSignature($id: ID!) {
    getEmailSignature(id: $id) {
      id
      signatureName
      isDefault

      # Informations personnelles
      firstName
      lastName
      position

      # Informations de contact
      email
      phone
      mobile
      website
      address
      companyName

      # Options d'affichage des icônes
      showPhoneIcon
      showMobileIcon
      showEmailIcon
      showAddressIcon
      showWebsiteIcon

      # Couleurs
      primaryColor
      colors {
        name
        position
        company
        contact
        separatorVertical
        separatorHorizontal
      }

      # Configuration layout
      nameSpacing
      nameAlignment
      layout
      columnWidths {
        photo
        content
      }

      # Images
      photo
      photoKey
      logo
      logoKey
      imageSize
      imageShape
      logoSize

      # Séparateurs
      separatorVerticalWidth
      separatorHorizontalWidth

      # Espacements
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
        logoToSocial
        verticalSeparatorLeft
        verticalSeparatorRight
      }
      detailedSpacing

      # Typographie
      fontFamily
      fontSize {
        name
        position
        contact
      }
      typography {
        fullName {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        position {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        company {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        email {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        phone {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        mobile {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        website {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
        address {
          fontFamily
          fontSize
          color
          fontWeight
          fontStyle
          textDecoration
        }
      }

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

// Mutation pour supprimer plusieurs signatures
const DELETE_MULTIPLE_EMAIL_SIGNATURES = gql`
  mutation DeleteMultipleEmailSignatures($ids: [ID!]!) {
    deleteMultipleEmailSignatures(ids: $ids)
  }
`;

// Mutation pour définir une signature comme défaut
const SET_DEFAULT_EMAIL_SIGNATURE = gql`
  mutation SetDefaultEmailSignature($id: ID!) {
    setDefaultEmailSignature(id: $id) {
      id
      isDefault
    }
  }
`;

// Mutation pour créer une nouvelle signature (duplication)
const CREATE_EMAIL_SIGNATURE = gql`
  mutation CreateEmailSignature($input: EmailSignatureInput!) {
    createEmailSignature(input: $input) {
      id
      signatureName
      firstName
      lastName
      email
      position
      companyName
      phone
      website
      address
      photo
      logo
      primaryColor
      isDefault
      createdAt
      updatedAt
    }
  }
`;

// Hook pour récupérer les signatures
export const useSignatures = () => {
  const { data, loading, error, refetch } = useQuery(GET_MY_EMAIL_SIGNATURES, {
    fetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.error("❌ [QUERY] Erreur:", error);
    },
  });

  const signatures = data?.getMyEmailSignatures || [];

  return {
    signatures,
    loading,
    error,
    refetch,
  };
};

// Hook pour les actions de signature
export const useSignatureActions = () => {
  const router = useRouter();
  const client = useApolloClient();

  const [deleteSignature, { loading: deleting }] = useMutation(
    DELETE_EMAIL_SIGNATURE,
    {
      refetchQueries: [],
      awaitRefetchQueries: false,
      update: (cache, { data }) => {
        if (data?.deleteEmailSignature) {
          const existingData = cache.readQuery({
            query: GET_MY_EMAIL_SIGNATURES,
          });

          if (existingData?.getMyEmailSignatures) {
            const newSignatures = existingData.getMyEmailSignatures.filter(
              (sig) => sig.id !== data.deleteEmailSignature
            );

            cache.writeQuery({
              query: GET_MY_EMAIL_SIGNATURES,
              data: { getMyEmailSignatures: newSignatures },
            });
          }
        }
      },
      onCompleted: () => {
        toast.success("Signature supprimée avec succès");
      },
      onError: (error) => {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Erreur lors de la suppression de la signature");
      },
    }
  );

  const [deleteMultipleSignatures, { loading: deletingMultiple }] = useMutation(
    DELETE_MULTIPLE_EMAIL_SIGNATURES,
    {
      refetchQueries: ["GetMyEmailSignatures"],
      onCompleted: (data) => {
        const count = data?.deleteMultipleEmailSignatures || 0;
        toast.success(`${count} signature${count > 1 ? 's' : ''} supprimée${count > 1 ? 's' : ''} avec succès`);
      },
      onError: (error) => {
        console.error("Erreur lors de la suppression multiple:", error);
        toast.error("Erreur lors de la suppression des signatures");
      },
    }
  );

  const [setDefaultSignature, { loading: settingDefault }] = useMutation(
    SET_DEFAULT_EMAIL_SIGNATURE,
    {
      refetchQueries: ["GetMyEmailSignatures"],
      onCompleted: (data) => {
        toast.success("Signature définie comme défaut");
      },
      onError: (error) => {
        console.error("❌ Erreur définition défaut:", error);
        toast.error("Erreur lors de la définition par défaut");
      },
    }
  );

  const [getSignatureForEdit, { loading: loadingSignature }] = useLazyQuery(
    GET_EMAIL_SIGNATURE,
    {
      onCompleted: (data) => {
        if (data?.getEmailSignature) {
          const signatureData = data.getEmailSignature;

          localStorage.setItem(
            "editingSignature",
            JSON.stringify(signatureData)
          );

          router.push("/dashboard/outils/signatures-mail/new?edit=true");
        } else {
          console.error("❌ [EDIT] Aucune signature trouvée dans la réponse");
          toast.error("Signature introuvable");
        }
      },
      onError: (error) => {
        console.error("❌ [EDIT] Erreur lors de la récupération:", error);
        console.error(
          "❌ [EDIT] Détails de l'erreur:",
          error.message,
          error.graphQLErrors
        );
        toast.error("Erreur lors de la récupération de la signature");
      },
    }
  );

  const [createSignature, { loading: duplicating }] = useMutation(
    CREATE_EMAIL_SIGNATURE,
    {
      refetchQueries: ["GetMyEmailSignatures"],
      onCompleted: (data) => {
        toast.success("Signature dupliquée avec succès");
      },
      onError: (error) => {
        console.error("❌ Erreur duplication:", error);
        toast.error("Erreur lors de la duplication de la signature");
      },
    }
  );

  // Handlers pour les actions
  const handleEdit = async (signature) => {
    try {
      const result = await getSignatureForEdit({
        variables: { id: signature.id },
      });
    } catch (error) {
      console.error(
        "❌ [EDIT] Erreur lors de l'ouverture de l'éditeur:",
        error
      );
      console.error("❌ [EDIT] Détails:", error.message, error.graphQLErrors);
    }
  };

  const handleDelete = async (signature) => {
    const signatureId = signature?.id;

    if (!signatureId) {
      toast.error(
        "Erreur: Impossible de trouver l'identifiant de la signature"
      );
      return;
    }

    try {
      await deleteSignature({
        variables: { id: signatureId },
        optimisticResponse: {
          __typename: "Mutation",
          deleteEmailSignature: signatureId,
        },
        update: (cache) => {
          const existingData = cache.readQuery({
            query: GET_MY_EMAIL_SIGNATURES,
          });

          if (existingData?.getMyEmailSignatures) {
            const newSignatures = existingData.getMyEmailSignatures.filter(
              (sig) => sig.id !== signatureId
            );

            cache.writeQuery({
              query: GET_MY_EMAIL_SIGNATURES,
              data: { getMyEmailSignatures: newSignatures },
            });
          }
        },
      });

      toast.success("Signature supprimée avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la signature");
    }
  };

  const handleDuplicate = async (signature) => {
    try {
      const { data } = await getSignatureForEdit({
        variables: { id: signature.id },
      });
      if (data?.getEmailSignature) {
        const originalSignature = data.getEmailSignature;

        const duplicateData = {
          signatureName: `${originalSignature.signatureName} (Copie)`,
          firstName: originalSignature.firstName,
          lastName: originalSignature.lastName,
          email: originalSignature.email,
          position: originalSignature.position,
          companyName: originalSignature.companyName,
          phone: originalSignature.phone,
          website: originalSignature.website,
          address: originalSignature.address,
          photo: originalSignature.photo,
          logo: originalSignature.logo,
          primaryColor: originalSignature.primaryColor,
        };

        const filteredData = Object.fromEntries(
          Object.entries(duplicateData).filter(
            ([_, value]) =>
              value !== null && value !== undefined && value !== ""
          )
        );

        await createSignature({ variables: { input: filteredData } });
      }
    } catch (error) {
      console.error("Erreur lors de la duplication:", error);
      toast.error("Erreur lors de la duplication de la signature");
    }
  };

  const handleToggleFavorite = async (signature) => {
    const isFavorite = signature.isDefault;

    if (!isFavorite) {
      try {
        await setDefaultSignature({ variables: { id: signature.id } });
      } catch (error) {
        console.error("Erreur lors de la définition par défaut:", error);
      }
    } else {
      toast.info("Cette signature est déjà définie comme défaut");
    }
  };

  const handleDeleteMultiple = async (signatureIds) => {
    try {
      await deleteMultipleSignatures({ variables: { ids: signatureIds } });
    } catch (error) {
      console.error("Erreur lors de la suppression multiple:", error);
    }
  };

  return {
    handleEdit,
    handleDelete,
    handleDeleteMultiple,
    handleDuplicate,
    handleToggleFavorite,
    loading: deleting || settingDefault || loadingSignature || duplicating || deletingMultiple,
  };
};
