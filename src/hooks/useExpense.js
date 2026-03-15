import { useMutation } from "@apollo/client";
import {
  CREATE_EXPENSE,
  ADD_EXPENSE_FILE,
  UPDATE_EXPENSE_OCR_METADATA,
  APPLY_OCR_DATA_TO_EXPENSE,
} from "../graphql/mutations/expense";
import { GET_EXPENSES } from "../graphql/queries/expense";
import { useRequiredWorkspace } from "./useWorkspace";
import { mapCategoryToEnum } from "@/app/dashboard/outils/transactions/components/transactions/utils/mappers";

/**
 * Hook pour la gestion des dépenses
 */
export const useExpense = () => {
  const { workspaceId } = useRequiredWorkspace();
  // Mutations pour créer une dépense et gérer les fichiers/OCR
  const [
    createExpense,
    { loading: createExpenseLoading, error: createExpenseError },
  ] = useMutation(CREATE_EXPENSE);
  const [addExpenseFile, { loading: addFileLoading, error: addFileError }] =
    useMutation(ADD_EXPENSE_FILE);
  const [
    updateOcrMetadata,
    { loading: updateMetadataLoading, error: updateMetadataError },
  ] = useMutation(UPDATE_EXPENSE_OCR_METADATA);
  const [applyOcrData, { loading: applyOcrLoading, error: applyOcrError }] =
    useMutation(APPLY_OCR_DATA_TO_EXPENSE);

  /**
   * Créer une dépense depuis les données OCR
   * @param {Object} ocrData - Données OCR avec analyse financière
   * @param {Object} fileData - Informations du fichier source
   * @returns {Promise} - Promesse de création
   */
  const createExpenseFromOcrData = async (ocrData, fileData) => {
    try {
      // Parser l'analyse financière si c'est une string
      let financialAnalysis = ocrData.financialAnalysis;
      if (typeof financialAnalysis === "string") {
        try {
          financialAnalysis = JSON.parse(financialAnalysis);
        } catch (e) {
          console.warn("⚠️ Impossible de parser financialAnalysise:", e);
          financialAnalysis = null;
        }
      }

      // Mapper les méthodes de paiement
      const paymentMethodMapping = {
        card: "CREDIT_CARD",
        transfer: "BANK_TRANSFER",
        cash: "CASH",
        check: "CHECK",
        unknown: "OTHER",
      };

      // Extraire les données de transaction
      const transactionData = financialAnalysis?.transaction_data || {};

      // Préparer l'input pour la mutation
      const input = {
        // Données financières extraites
        title:
          transactionData.description ||
          `Facture ${transactionData.vendor_name || "Inconnue"}`,
        description: transactionData.description || "",
        amount: parseFloat(transactionData.amount) || 0,
        currency: transactionData.currency || "EUR",
        category: mapCategoryToEnum(transactionData.category),
        date: (() => {
          // Vérifier si transaction_date est valide
          if (transactionData.transaction_date) {
            const date = new Date(transactionData.transaction_date);
            if (!isNaN(date.getTime())) {
              return transactionData.transaction_date;
            }
          }
          // Fallback vers la date actuelle si invalide ou manquante
          return new Date().toISOString().split("T")[0];
        })(),
        vendor: transactionData.vendor_name || "",
        vendorVatNumber:
          financialAnalysis?.extracted_fields?.vendor_siret || "",
        invoiceNumber: transactionData.document_number || "",
        documentNumber: transactionData.document_number || "",
        vatAmount: transactionData.tax_amount
          ? parseFloat(transactionData.tax_amount)
          : undefined,
        vatRate: transactionData.tax_rate
          ? parseFloat(transactionData.tax_rate)
          : undefined,
        paymentMethod:
          paymentMethodMapping[transactionData.payment_method] ||
          "BANK_TRANSFER",
        paymentDate: transactionData.payment_date || null,
        notes: `Créé depuis OCR - ${financialAnalysis?.document_analysis?.document_type || "document"}`,
        tags: ["ocr", "automatique"],

        // Données du fichier source
        cloudflareUrl: fileData.cloudflareUrl,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize || 0,
        mimeType: fileData.mimeType,

        // Données OCR complètes
        ocrDocumentId: ocrData.id || null,
        financialAnalysis: JSON.stringify(financialAnalysis),
      };

      // 1. Créer d'abord la dépense sans fichier
      const expenseInput = {
        workspaceId, // ✅ Ajout du workspaceId requis
        title: input.title,
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        category: input.category,
        date: input.date,
        vendor: input.vendor,
        vendorVatNumber: input.vendorVatNumber,
        invoiceNumber: input.invoiceNumber,
        documentNumber: input.documentNumber,
        vatAmount: input.vatAmount,
        vatRate: input.vatRate,
        isVatDeductible: true, // ✅ Ajout du champ isVatDeductible
        status: "PAID", // Définir le statut à PAID pour que la dépense apparaisse dans le tableau
        paymentMethod: input.paymentMethod,
        paymentDate: input.paymentDate,
        notes: input.notes,
        tags: input.tags,
        expenseType: "ORGANIZATION", // ✅ Ajout du type de dépense
      };

      const expenseResult = await createExpense({
        variables: { input: expenseInput },
        // Rafraîchir le cache pour mettre à jour le tableau automatiquement
        refetchQueries: [
          {
            query: GET_EXPENSES,
            variables: {
              workspaceId,
              status: "PAID",
              page: 1,
              limit: 20,
            },
          },
          // Rafraîchir aussi d'autres variantes possibles
          {
            query: GET_EXPENSES,
            variables: {
              workspaceId,
              page: 1,
              limit: 20,
            },
          },
        ],
        // Mettre à jour le cache Apollo
        awaitRefetchQueries: true,
      });

      const createdExpense = expenseResult.data.createExpense;

      // 2. Ajouter les métadonnées OCR à la dépense créée
      if (financialAnalysis) {
        try {
          // Préparer les métadonnées OCR
          const ocrMetadata = {
            vendorName: transactionData.vendor_name || "",
            vendorAddress:
              financialAnalysis?.extracted_fields?.vendor_address || "",
            vendorVatNumber:
              financialAnalysis?.extracted_fields?.vendor_siret || "",
            invoiceNumber: transactionData.document_number || "",
            invoiceDate: (() => {
              if (transactionData.transaction_date) {
                const date = new Date(transactionData.transaction_date);
                if (!isNaN(date.getTime())) {
                  return transactionData.transaction_date;
                }
              }
              return "";
            })(),
            totalAmount: parseFloat(transactionData.amount) || 0,
            vatAmount: parseFloat(transactionData.tax_amount) || 0,
            currency: transactionData.currency || "EUR",
            confidenceScore:
              financialAnalysis?.document_analysis?.confidence || 0,
            rawExtractedText: ocrData.extractedText || "",
          };

          // Mettre à jour les métadonnées OCR
          const metadataResult = await updateOcrMetadata({
            variables: {
              expenseId: createdExpense.id,
              metadata: ocrMetadata,
            },
          });

          // 3. Ajouter le fichier Cloudflare à la dépense
          if (input.cloudflareUrl && fileData && fileData.cloudflareUrl) {
            try {
              // Préparer l'input pour l'ajout du fichier Cloudflare
              const fileInput = {
                cloudflareUrl: input.cloudflareUrl,
                fileName: input.fileName,
                mimeType: input.mimeType,
                fileSize: input.fileSize,
                ocrData: input.financialAnalysis,
                ocrDocumentId: input.ocrDocumentId,
                processOCR: false, // L'OCR a déjà été fait
              };

              const fileResult = await addExpenseFile({
                variables: {
                  expenseId: createdExpense.id,
                  input: fileInput,
                },
              });

              // 4. Appliquer les données OCR aux champs de la dépense
              const applyResult = await applyOcrData({
                variables: {
                  expenseId: createdExpense.id,
                },
              });

              return applyResult.data.applyOCRDataToExpense;
            } catch (fileError) {
              console.error("❌ Erreur lors de l'ajout du fichier:", fileError);
              // On retourne quand même la dépense avec métadonnées OCR
              return metadataResult.data.updateExpenseOCRMetadata;
            }
          }

          return metadataResult.data.updateExpenseOCRMetadata;
        } catch (metadataError) {
          console.error(
            "❌ Erreur lors de l'ajout des métadonnées OCR:",
            metadataError
          );
          // On retourne quand même la dépense créée
          return createdExpense;
        }
      }

      return createdExpense;
    } catch (error) {
      console.error("❌ Erreur création dépense depuis OCR:", error);
      throw error;
    }
  };

  // Note: useExpenses et useExpenseStats sont maintenant dans /src/hooks/useExpenses.js
  // pour éviter les doublons de code

  // Calcul de l'état de chargement global
  const isCreatingExpense =
    createExpenseLoading ||
    addFileLoading ||
    updateMetadataLoading ||
    applyOcrLoading;

  // Calcul de l'erreur globale
  const expenseError =
    createExpenseError || addFileError || updateMetadataError || applyOcrError;

  return {
    createExpenseFromOcrData,
    isCreatingExpense,
    expenseError,
  };
};
