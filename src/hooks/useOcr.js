import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  PROCESS_DOCUMENT_OCR,
  PROCESS_DOCUMENT_OCR_FROM_URL,
} from "../graphql/mutations/ocr";

/**
 * Hook personnalisé pour gérer l'OCR de documents
 */
export const useOcr = () => {
  const [ocrResult, setOcrResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [processDocumentOcr] = useMutation(PROCESS_DOCUMENT_OCR, {
    onCompleted: (data) => {
      console.log("✅ OCR completed:", data);
      setOcrResult(data.processDocumentOcr);
      setIsProcessing(false);
      setError(null);
    },
    onError: (error) => {
      console.error("❌ OCR error:", error);
      setError(error.message);
      setIsProcessing(false);
      setOcrResult(null);
    },
  });

  const [processDocumentOcrFromUrl] = useMutation(
    PROCESS_DOCUMENT_OCR_FROM_URL,
    {
      onCompleted: (data) => {
        console.log("✅ OCR depuis URL completed:", data);
        setOcrResult(data.processDocumentOcrFromUrl);
        setIsProcessing(false);
        setError(null);
      },
      onError: (error) => {
        console.error("❌ OCR depuis URL error:", error);
        setError(error.message);
        setIsProcessing(false);
        setOcrResult(null);
      },
    }
  );

  const processDocument = async (file, options = {}) => {
    try {
      setIsProcessing(true);
      setError(null);
      setOcrResult(null);

      console.log("🔍 Starting OCR processing for:", file.name);

      await processDocumentOcr({
        variables: {
          file,
          options: {
            model: "mistral-ocr-latest",
            includeImageBase64: false,
            ...options,
          },
        },
      });
    } catch (err) {
      console.error("Error processing document:", err);
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const processDocumentFromUrl = async (
    cloudflareUrl,
    fileName,
    mimeType,
    fileSize,
    workspaceId,
    options = {}
  ) => {
    try {
      setIsProcessing(true);
      setError(null);
      setOcrResult(null);

      console.log("🔍 Starting OCR processing from URL:", cloudflareUrl);

      await processDocumentOcrFromUrl({
        variables: {
          cloudflareUrl,
          fileName,
          mimeType,
          fileSize,
          workspaceId,
          options: {
            model: "mistral-ocr-latest",
            includeImageBase64: false,
            ...options,
          },
        },
      });
    } catch (err) {
      console.error("Error processing document from URL:", err);
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const resetOcr = () => {
    setOcrResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return {
    processDocument,
    processDocumentFromUrl,
    ocrResult,
    isProcessing,
    error,
    resetOcr,
  };
};
