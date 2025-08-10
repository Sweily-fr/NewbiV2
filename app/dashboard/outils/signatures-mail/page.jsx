"use client";
import { DataTable } from "@/src/components/data-table";
import { useQuery, useMutation, useLazyQuery, gql, useApolloClient } from '@apollo/client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from '@/src/components/ui/sonner';
import { useRouter } from 'next/navigation';

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

export default function SignaturesMail() {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const client = useApolloClient();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, loading, error, refetch } = useQuery(GET_MY_EMAIL_SIGNATURES, {
    skip: !isMounted,
    fetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      console.log('✅ [QUERY] Signatures récupérées:', data.getMyEmailSignatures?.length);
    },
    onError: (error) => {
      console.error('❌ [QUERY] Erreur:', error);
    }
  });

  const signatures = data?.getMyEmailSignatures || [];

  // Mutations
  const [deleteSignature] = useMutation(DELETE_EMAIL_SIGNATURE, {
    // Désactiver complètement le rechargement automatique
    refetchQueries: [],
    awaitRefetchQueries: false,
    
    // Mise à jour optimiste immédiate
    update: (cache, { data }) => {
      if (data?.deleteEmailSignature) {
        // Lire les données actuelles du cache
        const existingData = cache.readQuery({ query: GET_MY_EMAIL_SIGNATURES });
        
        if (existingData?.getMyEmailSignatures) {
          // Filtrer la signature supprimée (l'ID est passé dans les variables de la mutation)
          const newSignatures = existingData.getMyEmailSignatures.filter(
            sig => sig.id !== data.deleteEmailSignature
          );
          
          // Mettre à jour le cache sans déclencher de rechargement
          cache.writeQuery({
            query: GET_MY_EMAIL_SIGNATURES,
            data: { getMyEmailSignatures: newSignatures }
          });
        }
      }
    },
    onCompleted: () => {
      toast.success('Signature supprimée avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la signature');
    }
  });

  const [setDefaultSignature, { loading: settingDefault }] = useMutation(SET_DEFAULT_EMAIL_SIGNATURE, {
    refetchQueries: ['GetMyEmailSignatures'],
    onCompleted: (data) => {
      toast.success('Signature définie comme défaut');
    },
    onError: (error) => {
      console.error('❌ Erreur définition défaut:', error);
      toast.error('Erreur lors de la définition par défaut');
    }
  });

  const [getSignatureForEdit, { loading: loadingSignature }] = useLazyQuery(GET_EMAIL_SIGNATURE, {
    onCompleted: (data) => {
      console.log('📊 [EDIT] Données récupérées:', data);
      console.log('📊 [EDIT] Signature complète:', data?.getEmailSignature);
      
      if (data?.getEmailSignature) {
        const signatureData = data.getEmailSignature;
        console.log('✅ [EDIT] Signature trouvée:', {
          id: signatureData.id,
          nom: signatureData.signatureName,
          firstName: signatureData.firstName,
          lastName: signatureData.lastName,
          photo: signatureData.photo,
          logo: signatureData.logo,
          primaryColor: signatureData.primaryColor
        });
        
        // Stocker les données dans localStorage pour l'éditeur
        localStorage.setItem('editingSignature', JSON.stringify(signatureData));
        console.log('💾 [EDIT] Données sauvegardées dans localStorage');
        
        // Rediriger vers l'éditeur
        console.log("🔀 [EDIT] Redirection vers l'éditeur...");
        router.push('/dashboard/outils/signatures-mail/new?edit=true');
      } else {
        console.error('❌ [EDIT] Aucune signature trouvée dans la réponse');
        toast.error('Signature introuvable');
      }
    },
    onError: (error) => {
      console.error('❌ [EDIT] Erreur lors de la récupération:', error);
      console.error('❌ [EDIT] Détails de l’erreur:', error.message, error.graphQLErrors);
      toast.error('Erreur lors de la récupération de la signature');
    }
  });

  const [createSignature, { loading: duplicating }] = useMutation(CREATE_EMAIL_SIGNATURE, {
    refetchQueries: ['GetMyEmailSignatures'],
    onCompleted: (data) => {
      toast.success('Signature dupliquée avec succès');
    },
    onError: (error) => {
      console.error('❌ Erreur duplication:', error);
      toast.error('Erreur lors de la duplication de la signature');
    }
  });

  // Transformer les données des signatures pour le format DataTable
  const transformedData = useMemo(() => {
    console.log('🔄 [FRONTEND] Recalcul des données transformées');
    return signatures.map(signature => ({
      id: signature.id,
      header: signature.signatureName,
      type: `${signature.firstName || ''} ${signature.lastName || ''}`.trim() || 'Sans nom',
      status: signature.isDefault ? 'Par défaut' : 'Active',
      target: signature.position || 'Non spécifié',
      limit: signature.email || 'Non spécifié',
      reviewer: signature.companyName || 'Non spécifié',
    }));
  }, [signatures]);

  console.log('🔄 [FRONTEND] Données transformées pour DataTable:', transformedData.length, 'éléments');

  // Handlers pour les actions
  const handleEdit = async (rowData) => {
    console.log('📝 [ACTION] Édition de la signature:', rowData.id);
    console.log('📊 [EDIT] Données de la ligne:', rowData);
    
    try {
      console.log('🔍 [EDIT] Récupération de la signature complète...');
      const result = await getSignatureForEdit({ variables: { id: rowData.id } });
      console.log('📊 [EDIT] Résultat de la query:', result);
    } catch (error) {
      console.error('❌ [EDIT] Erreur lors de l\'ouverture de l\'éditeur:', error);
      console.error('❌ [EDIT] Détails:', error.message, error.graphQLErrors);
    }
  };

  const handleDelete = async (rowData) => {
    const signatureId = rowData?.id || rowData?.original?.id;
    
    if (!signatureId) {
      toast.error('Erreur: Impossible de trouver l\'identifiant de la signature');
      return;
    }
    
    try {
      await deleteSignature({
        variables: { id: signatureId },
        optimisticResponse: {
          __typename: 'Mutation',
          deleteEmailSignature: signatureId
        },
        update: (cache) => {
          // Mise à jour immédiate du cache
          const existingData = cache.readQuery({ query: GET_MY_EMAIL_SIGNATURES });
          
          if (existingData?.getMyEmailSignatures) {
            const newSignatures = existingData.getMyEmailSignatures.filter(
              sig => sig.id !== signatureId
            );
            
            cache.writeQuery({
              query: GET_MY_EMAIL_SIGNATURES,
              data: { getMyEmailSignatures: newSignatures }
            });
          }
        }
      });
      
      toast.success('Signature supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la signature');
    }
  };

  const handleDuplicate = async (rowData) => {
    console.log('📋 [ACTION] Duplication de la signature:', rowData.id);
    try {
      // Récupérer d'abord la signature complète
      const { data } = await getSignatureForEdit({ variables: { id: rowData.id } });
      if (data?.getEmailSignature) {
        const originalSignature = data.getEmailSignature;
        
        // Préparer les données pour la duplication (tous les champs disponibles)
        const duplicateData = {
          signatureName: `${originalSignature.signatureName} (Copie)`,
          isDefault: false, // La copie ne peut pas être défaut
          firstName: originalSignature.firstName,
          lastName: originalSignature.lastName,
          position: originalSignature.position,
          email: originalSignature.email,
          phone: originalSignature.phone,
          mobile: originalSignature.mobile,
          website: originalSignature.website,
          address: originalSignature.address,
          companyName: originalSignature.companyName,
          showPhoneIcon: originalSignature.showPhoneIcon,
          showMobileIcon: originalSignature.showMobileIcon,
          showEmailIcon: originalSignature.showEmailIcon,
          showAddressIcon: originalSignature.showAddressIcon,
          showWebsiteIcon: originalSignature.showWebsiteIcon,
          primaryColor: originalSignature.primaryColor,
          nameSpacing: originalSignature.nameSpacing,
          nameAlignment: originalSignature.nameAlignment,
          layout: originalSignature.layout,
          photo: originalSignature.photo,
          photoKey: originalSignature.photoKey,
          logo: originalSignature.logo,
          logoKey: originalSignature.logoKey,
          imageSize: originalSignature.imageSize,
          imageShape: originalSignature.imageShape,
          logoSize: originalSignature.logoSize,
          separatorVerticalWidth: originalSignature.separatorVerticalWidth,
          separatorHorizontalWidth: originalSignature.separatorHorizontalWidth,
          fontFamily: originalSignature.fontFamily
        };
        
        // Filtrer les valeurs null/undefined
        const filteredData = Object.fromEntries(
          Object.entries(duplicateData).filter(([_, value]) => 
            value !== null && value !== undefined && value !== ''
          )
        );
        
        await createSignature({ variables: { input: filteredData } });
      }
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
      toast.error('Erreur lors de la duplication de la signature');
    }
  };

  const handleToggleFavorite = async (rowData) => {
    const isFavorite = rowData.status === 'Par défaut';
    console.log(`⭐ [ACTION] ${isFavorite ? 'Retirer' : 'Définir'} comme défaut:`, rowData.id);
    
    if (!isFavorite) {
      try {
        await setDefaultSignature({ variables: { id: rowData.id } });
      } catch (error) {
        console.error('Erreur lors de la définition par défaut:', error);
      }
    } else {
      toast.info('Cette signature est déjà définie comme défaut');
    }
  };

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Chargement des signatures...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <span>Erreur lors du chargement des signatures</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-xl font-medium mb-2">
            Gestion des Signatures Mail
          </h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos signatures mail et suivez les modifications
          </p>
        </div>
      </div>
      <div className="w-full">
        <DataTable
          data={transformedData}
          textButton="Ajouter une signature"
          link="/dashboard/outils/signatures-mail/new"
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </div>
  );
}
