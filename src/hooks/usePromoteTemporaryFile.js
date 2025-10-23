/**
 * Hook personnalisé pour promouvoir un fichier temporaire en fichier permanent
 */

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { PROMOTE_TEMPORARY_FILE } from "../graphql/mutations/documentUpload";

export const usePromoteTemporaryFile = () => {
  const [isPromoting, setIsPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState(null);
  const [promoteResult, setPromoteResult] = useState(null);

  const [promoteTemporaryFileMutation] = useMutation(PROMOTE_TEMPORARY_FILE, {
    onCompleted: (data) => {
      setIsPromoting(false);

      if (data.promoteTemporaryFile.success) {
        setPromoteResult(data.promoteTemporaryFile);
        setPromoteError(null);
      } else {
        setPromoteError(
          data.promoteTemporaryFile.message || "Erreur lors de la promotion du fichier"
        );
        setPromoteResult(null);
      }
    },
    onError: (error) => {
      console.error("❌ Erreur promotion fichier:", error);
      setIsPromoting(false);
      setPromoteError(error.message || "Erreur lors de la promotion du fichier");
      setPromoteResult(null);
    },
  });

  const promoteTemporaryFile = async (tempKey) => {
    try {
      setIsPromoting(true);
      setPromoteError(null);
      setPromoteResult(null);

      await promoteTemporaryFileMutation({
        variables: { 
          tempKey 
        },
      });
    } catch (error) {
      setIsPromoting(false);
      setPromoteError(error.message || "Erreur lors de la promotion du fichier");
      setPromoteResult(null);
    }
  };

  const resetPromote = () => {
    setIsPromoting(false);
    setPromoteError(null);
    setPromoteResult(null);
  };

  return {
    isPromoting,
    promoteError,
    promoteResult,
    promoteTemporaryFile,
    resetPromote,
  };
};
