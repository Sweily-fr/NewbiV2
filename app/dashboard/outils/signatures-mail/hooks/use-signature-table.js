"use client";

import {
  useQuery,
  useMutation,
  useLazyQuery,
  gql,
} from "@apollo/client";
import { toast } from "@/src/components/ui/sonner";
import { useRouter } from "next/navigation";
import { useRequiredWorkspace } from "@/src/hooks/useWorkspace";

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
      orientation
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

      # Réseaux sociaux
      socialNetworks {
        facebook
        instagram
        linkedin
        x
      }
      socialColors {
        facebook
        instagram
        linkedin
        x
      }
      customSocialIcons {
        facebook
        instagram
        linkedin
        x
      }
      socialGlobalColor
      socialSize

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
  const { data, loading: queryLoading, error: queryError, refetch } = useQuery(GET_MY_EMAIL_SIGNATURES, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const signatures = data?.getMyEmailSignatures || [];

  return {
    signatures,
    loading: queryLoading,
    error: queryError,
    refetch,
  };
};

// Hook pour les actions de signature
export const useSignatureActions = () => {
  const router = useRouter();
  const { workspaceId } = useRequiredWorkspace();

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
    }
  );

  const [deleteMultipleSignatures, { loading: deletingMultiple }] = useMutation(
    DELETE_MULTIPLE_EMAIL_SIGNATURES,
    {
      refetchQueries: [GET_MY_EMAIL_SIGNATURES],
    }
  );

  const [setDefaultSignature, { loading: settingDefault }] = useMutation(
    SET_DEFAULT_EMAIL_SIGNATURE,
    {
      refetchQueries: [GET_MY_EMAIL_SIGNATURES],
    }
  );

  const [getSignatureForEdit] = useLazyQuery(GET_EMAIL_SIGNATURE);

  const [createSignature, { loading: duplicating }] = useMutation(
    CREATE_EMAIL_SIGNATURE,
    {
      refetchQueries: [GET_MY_EMAIL_SIGNATURES],
    }
  );

  // Handlers pour les actions
  const handleEdit = async (signature) => {
    try {
      const { data } = await getSignatureForEdit({
        variables: { id: signature.id },
      });
      if (data?.getEmailSignature) {
        router.push(
          `/dashboard/outils/signatures-mail/new?edit=true&id=${data.getEmailSignature.id}`
        );
      } else {
        toast.error("Signature introuvable");
      }
    } catch (error) {
      console.error("❌ [EDIT] Erreur lors de l'ouverture de l'éditeur:", error);
      toast.error("Erreur lors de la récupération de la signature");
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
    } catch {
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
            ([key, value]) =>
              value !== null && value !== undefined && value !== ""
          )
        );

        await createSignature({ 
          variables: { 
            input: {
              ...filteredData,
              workspaceId,
            }
          } 
        });
        toast.success("Signature dupliquée avec succès");
      }
    } catch {
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
    loading: deleting || settingDefault || duplicating || deletingMultiple,
  };
};
