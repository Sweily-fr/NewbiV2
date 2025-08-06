"use client";
import { DataTable } from "@/src/components/data-table";
import { useQuery, gql } from '@apollo/client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

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

export default function SignaturesMail() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: queryData, loading, error, refetch } = useQuery(GET_MY_EMAIL_SIGNATURES, {
    skip: !isMounted,
    onCompleted: (data) => {
      console.log('📊 [FRONTEND] Signatures récupérées pour DataTable:', data);
    },
    onError: (error) => {
      console.error('❌ [FRONTEND] Erreur récupération signatures:', error);
    }
  });

  // Transformer les données des signatures pour le format DataTable
  const transformedData = (queryData?.getMyEmailSignatures || []).map(signature => ({
    id: signature.id,
    header: signature.signatureName,
    type: `${signature.firstName || ''} ${signature.lastName || ''}`.trim() || 'Sans nom',
    status: signature.isDefault ? 'Par défaut' : 'Active',
    target: signature.position || 'Non spécifié',
    limit: signature.email || 'Non spécifié',
    reviewer: signature.companyName || 'Non spécifié',
  }));

  console.log('🔄 [FRONTEND] Données transformées pour DataTable:', transformedData);

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
        />
      </div>
    </div>
  );
}
