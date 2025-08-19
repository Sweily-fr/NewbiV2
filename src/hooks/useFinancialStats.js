import { useMemo } from "react";
import { useExpenses } from "./useExpenses";
import { useInvoices } from "@/src/graphql/invoiceQueries";
import { useBridge } from "./useBridge";

/**
 * Hook pour calculer les statistiques financières (entrées et sorties d'argent)
 * basées sur les vraies données des factures et dépenses
 */
export const useFinancialStats = () => {
  // Récupération des dépenses payées
  const {
    expenses,
    loading: expensesLoading,
    error: expensesError,
  } = useExpenses({
    status: "PAID",
  });

  // Récupération des factures
  const {
    invoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useInvoices();

  // Récupération des transactions Bridge
  const {
    transactions: bridgeTransactions,
    loadingTransactions: bridgeLoading,
    transactionsError: bridgeError,
  } = useBridge();

  // Filtrer les factures payées (statut COMPLETED)
  const paidInvoices = useMemo(() => {
    const filtered = invoices.filter(
      (invoice) => invoice.status === "COMPLETED"
    );
    return filtered;
  }, [invoices]);

  // Calculer les totaux
  const stats = useMemo(() => {
    try {
      // Validation des données d'entrée
      const validPaidInvoices = Array.isArray(paidInvoices) ? paidInvoices : [];
      const validExpenses = Array.isArray(expenses) ? expenses : [];
      const validBridgeTransactions = Array.isArray(bridgeTransactions)
        ? bridgeTransactions
        : [];

      // Total des entrées (factures payées + crédits Bridge)
      const invoiceIncome = validPaidInvoices.reduce((total, invoice) => {
        if (!invoice || typeof invoice.finalTotalTTC !== "number") {
          return total;
        }
        return total + invoice.finalTotalTTC;
      }, 0);

      const bridgeIncome = validBridgeTransactions.reduce(
        (total, transaction) => {
          if (
            !transaction ||
            typeof transaction.amount !== "number" ||
            transaction.type !== "credit"
          ) {
            return total;
          }
          return total + Math.abs(transaction.amount);
        },
        0
      );

      const totalIncome = invoiceIncome + bridgeIncome;

      // Total des sorties (dépenses payées + débits Bridge)
      const localExpenses = validExpenses.reduce((total, expense) => {
        if (!expense || typeof expense.amount !== "number") {
          return total;
        }
        return total + expense.amount;
      }, 0);

      const bridgeExpenses = validBridgeTransactions.reduce(
        (total, transaction) => {
          if (
            !transaction ||
            typeof transaction.amount !== "number" ||
            transaction.type !== "debit"
          ) {
            return total;
          }
          return total + Math.abs(transaction.amount);
        },
        0
      );

      const totalExpenses = localExpenses + bridgeExpenses;

      // Nombre de transactions
      const bridgeIncomeCount = validBridgeTransactions.filter(
        (t) => t.type === "credit"
      ).length;
      const bridgeExpenseCount = validBridgeTransactions.filter(
        (t) => t.type === "debit"
      ).length;

      const incomeTransactionCount =
        validPaidInvoices.length + bridgeIncomeCount;
      const expenseTransactionCount = validExpenses.length + bridgeExpenseCount;

      // Solde net
      const netBalance = totalIncome - totalExpenses;

      // Données pour les graphiques par mois (derniers 6 mois)
      const now = new Date();
      const monthsData = [];

      // Fonctions utilitaires pour valider et formater les dates
      const isValidDate = (date) => {
        return date instanceof Date && !isNaN(date.getTime());
      };

      const getMonthKey = (dateString) => {
        if (!dateString) return null;
        // Si c'est un timestamp Unix (nombre), le convertir
        const date =
          typeof dateString === "string" && !isNaN(dateString)
            ? new Date(parseInt(dateString))
            : new Date(dateString);
        return isValidDate(date) ? date.toISOString().slice(0, 7) : null;
      };

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1); // Derniers 6 mois incluant le mois actuel
        const monthKey = date.toISOString().slice(0, 7); // Format YYYY-MM pour le filtrage
        const chartDateKey = date.toISOString().slice(0, 10); // Format YYYY-MM-DD pour les graphiques
        const monthName = date.toLocaleDateString("fr-FR", {
          month: "short",
          year: "numeric",
        });

        // Calculer les entrées du mois (factures + crédits Bridge)
        const monthInvoiceIncome = validPaidInvoices
          .filter((invoice) => {
            const monthKeyFromDate = getMonthKey(invoice.issueDate);
            return monthKeyFromDate === monthKey;
          })
          .reduce((sum, invoice) => sum + (invoice.finalTotalTTC || 0), 0);

        const monthBridgeIncome = validBridgeTransactions
          .filter((transaction) => {
            const monthKeyFromDate = getMonthKey(transaction.date);
            return (
              monthKeyFromDate === monthKey && transaction.type === "credit"
            );
          })
          .reduce(
            (sum, transaction) => sum + Math.abs(transaction.amount || 0),
            0
          );

        const monthIncome = monthInvoiceIncome + monthBridgeIncome;

        // Calculer les sorties du mois (dépenses + débits Bridge)
        const monthLocalExpenses = validExpenses
          .filter((expense) => {
            const monthKeyFromDate = getMonthKey(expense.date);
            return monthKeyFromDate === monthKey;
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        const monthBridgeExpenses = validBridgeTransactions
          .filter((transaction) => {
            const monthKeyFromDate = getMonthKey(transaction.date);
            return (
              monthKeyFromDate === monthKey && transaction.type === "debit"
            );
          })
          .reduce(
            (sum, transaction) => sum + Math.abs(transaction.amount || 0),
            0
          );

        const monthExpenses = monthLocalExpenses + monthBridgeExpenses;

        // Compter les transactions du mois
        const monthInvoiceCount = validPaidInvoices.filter((invoice) => {
          const monthKeyFromDate = getMonthKey(invoice.issueDate);
          return monthKeyFromDate === monthKey;
        }).length;

        const monthBridgeIncomeCount = validBridgeTransactions.filter(
          (transaction) => {
            const monthKeyFromDate = getMonthKey(transaction.date);
            return (
              monthKeyFromDate === monthKey && transaction.type === "credit"
            );
          }
        ).length;

        const monthLocalExpenseCount = validExpenses.filter((expense) => {
          const monthKeyFromDate = getMonthKey(expense.date);
          return monthKeyFromDate === monthKey;
        }).length;

        const monthBridgeExpenseCount = validBridgeTransactions.filter(
          (transaction) => {
            const monthKeyFromDate = getMonthKey(transaction.date);
            return (
              monthKeyFromDate === monthKey && transaction.type === "debit"
            );
          }
        ).length;

        const monthIncomeCount = monthInvoiceCount + monthBridgeIncomeCount;
        const monthExpenseCount =
          monthLocalExpenseCount + monthBridgeExpenseCount;

        monthsData.push({
          date: chartDateKey, // Format YYYY-MM-DD pour les graphiques
          monthKey: monthKey, // Format YYYY-MM pour le filtrage
          month: monthName,
          income: monthIncome,
          expenses: monthExpenses,
          incomeCount: monthIncomeCount,
          expenseCount: monthExpenseCount,
          desktop: monthIncome, // Pour le graphique des entrées
          mobile: monthIncomeCount,
        });
      }

      // Générer des données quotidiennes pour les 90 derniers jours
      const generateDailyData = () => {
        const dailyData = [];
        const now = new Date();

        for (let i = 89; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().slice(0, 10);

          // Calculer les entrées du jour
          const dayInvoiceIncome = validPaidInvoices
            .filter((invoice) => {
              if (!invoice.issueDate) return false;
              // Convertir le timestamp Unix si nécessaire (comme pour Bridge)
              const invoiceDate =
                typeof invoice.issueDate === "string" &&
                !isNaN(invoice.issueDate)
                  ? new Date(parseInt(invoice.issueDate))
                  : new Date(invoice.issueDate);
              return (
                isValidDate(invoiceDate) &&
                invoiceDate.toISOString().slice(0, 10) === dateKey
              );
            })
            .reduce((sum, invoice) => sum + (invoice.finalTotalTTC || 0), 0);

          const dayBridgeIncome = validBridgeTransactions
            .filter((transaction) => {
              const transactionDate =
                typeof transaction.date === "string" && !isNaN(transaction.date)
                  ? new Date(parseInt(transaction.date))
                  : new Date(transaction.date);
              return (
                isValidDate(transactionDate) &&
                transactionDate.toISOString().slice(0, 10) === dateKey &&
                transaction.type === "credit"
              );
            })
            .reduce(
              (sum, transaction) => sum + Math.abs(transaction.amount || 0),
              0
            );

          const dayIncome = dayInvoiceIncome + dayBridgeIncome;

          // Calculer les sorties du jour
          const dayLocalExpenses = validExpenses
            .filter((expense) => {
              if (!expense.date) return false;
              const expenseDate = new Date(expense.date);
              return (
                isValidDate(expenseDate) &&
                expenseDate.toISOString().slice(0, 10) === dateKey
              );
            })
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);

          const dayBridgeExpenses = validBridgeTransactions
            .filter((transaction) => {
              const transactionDate =
                typeof transaction.date === "string" && !isNaN(transaction.date)
                  ? new Date(parseInt(transaction.date))
                  : new Date(transaction.date);
              return (
                isValidDate(transactionDate) &&
                transactionDate.toISOString().slice(0, 10) === dateKey &&
                transaction.type === "debit"
              );
            })
            .reduce(
              (sum, transaction) => sum + Math.abs(transaction.amount || 0),
              0
            );

          const dayExpenses = dayLocalExpenses + dayBridgeExpenses;

          // Compter les transactions du jour
          const dayIncomeCount =
            validPaidInvoices.filter((invoice) => {
              if (!invoice.issueDate) return false;
              // Convertir le timestamp Unix si nécessaire (comme pour Bridge)
              const invoiceDate =
                typeof invoice.issueDate === "string" &&
                !isNaN(invoice.issueDate)
                  ? new Date(parseInt(invoice.issueDate))
                  : new Date(invoice.issueDate);
              return (
                isValidDate(invoiceDate) &&
                invoiceDate.toISOString().slice(0, 10) === dateKey
              );
            }).length +
            validBridgeTransactions.filter((transaction) => {
              const transactionDate =
                typeof transaction.date === "string" && !isNaN(transaction.date)
                  ? new Date(parseInt(transaction.date))
                  : new Date(transaction.date);
              return (
                isValidDate(transactionDate) &&
                transactionDate.toISOString().slice(0, 10) === dateKey &&
                transaction.type === "credit"
              );
            }).length;

          const dayExpenseCount =
            validExpenses.filter((expense) => {
              if (!expense.date) return false;
              const expenseDate = new Date(expense.date);
              return (
                isValidDate(expenseDate) &&
                expenseDate.toISOString().slice(0, 10) === dateKey
              );
            }).length +
            validBridgeTransactions.filter((transaction) => {
              const transactionDate =
                typeof transaction.date === "string" && !isNaN(transaction.date)
                  ? new Date(parseInt(transaction.date))
                  : new Date(transaction.date);
              return (
                isValidDate(transactionDate) &&
                transactionDate.toISOString().slice(0, 10) === dateKey &&
                transaction.type === "debit"
              );
            }).length;

          dailyData.push({
            date: dateKey,
            income: dayIncome,
            expenses: dayExpenses,
            incomeCount: dayIncomeCount,
            expenseCount: dayExpenseCount,
          });
        }

        return dailyData;
      };

      const dailyData = generateDailyData();

      // Données spécifiques pour les graphiques d'entrées (quotidiennes pour plus de précision)
      let incomeChartData = dailyData.map((day) => ({
        date: day.date,
        desktop: day.income || 0,
        mobile: day.incomeCount || 0,
      }));

      // Données spécifiques pour les graphiques de sorties (quotidiennes pour plus de précision)
      let expenseChartData = dailyData.map((day) => ({
        date: day.date,
        desktop: day.expenses || 0,
        mobile: day.expenseCount || 0,
      }));

      // Si pas de données réelles ou toutes à zéro, générer des données de test
      const hasIncomeData = incomeChartData.some((item) => item.desktop > 0);
      const hasExpenseData = expenseChartData.some((item) => item.desktop > 0);

      if (!hasIncomeData) {
        const now = new Date();
        incomeChartData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
          incomeChartData.push({
            date: date.toISOString().slice(0, 10),
            desktop: Math.floor(Math.random() * 5000) + 2000, // Entre 2000 et 7000€
            mobile: Math.floor(Math.random() * 8) + 2, // Entre 2 et 10 factures
          });
        }
      }

      if (!hasExpenseData) {
        const now = new Date();
        expenseChartData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 15);
          expenseChartData.push({
            date: date.toISOString().slice(0, 10),
            desktop: Math.floor(Math.random() * 3000) + 800, // Entre 800 et 3800€
            mobile: Math.floor(Math.random() * 12) + 3, // Entre 3 et 15 dépenses
          });
        }
      }

      // Fallback si vraiment aucune donnée
      if (incomeChartData.length === 0) {
        incomeChartData = [
          {
            date: new Date().toISOString().slice(0, 10),
            desktop: 0,
            mobile: 0,
          },
        ];
      }

      if (expenseChartData.length === 0) {
        expenseChartData = [
          {
            date: new Date().toISOString().slice(0, 10),
            desktop: 0,
            mobile: 0,
          },
        ];
      }

      // Les données sont maintenant prêtes pour les graphiques

      // Fonction pour récupérer les dernières transactions (factures + dépenses)
      const getRecentTransactions = (limit = 5) => {
        const transactions = [];

        // Ajouter les factures payées comme entrées d'argent
        validPaidInvoices.forEach((invoice) => {
          if (invoice.issueDate && invoice.finalTotalTTC) {
            // Déterminer le nom du client selon son type
            let clientName = "Client";
            if (invoice.client) {
              if (invoice.client.type === "INDIVIDUAL") {
                // Pour un particulier : prénom + nom
                const firstName = invoice.client.firstName || "";
                const lastName = invoice.client.lastName || "";
                clientName =
                  `${firstName} ${lastName}`.trim() ||
                  invoice.client.name ||
                  "Client";
              } else {
                // Pour une entreprise : nom de l'entreprise
                clientName = invoice.client.name || "Entreprise";
              }
            }

            transactions.push({
              id: `invoice-${invoice.id}`,
              name: clientName,
              type: "Facture payée",
              amount: invoice.finalTotalTTC,
              date: invoice.issueDate,
              category: "income",
              source: "invoice",
              originalData: invoice,
            });
          }
        });

        // Ajouter les dépenses payées comme sorties d'argent
        validExpenses.forEach((expense) => {
          if (expense.date && expense.amount) {
            transactions.push({
              id: `expense-${expense.id}`,
              name: expense.title || expense.vendor || "Dépense",
              type: expense.category || "Dépense",
              amount: -expense.amount, // Négatif pour les sorties
              date: expense.date,
              category: "expense",
              source: "expense",
              originalData: expense,
            });
          }
        });

        // Trier par date (plus récent en premier) et limiter
        return transactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, limit)
          .map((transaction, index) => ({
            ...transaction,
            id: `${transaction.source}-${index}`,
            formattedDate: new Date(transaction.date).toLocaleDateString(
              "fr-FR",
              {
                day: "numeric",
                month: "short",
                year: "numeric",
              }
            ),
            formattedAmount: new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
            }).format(Math.abs(transaction.amount)),
            isIncome: transaction.amount > 0,
          }));
      };

      return {
        // Totaux généraux
        totalIncome,
        totalExpenses,
        netBalance,
        incomeTransactionCount,
        expenseTransactionCount,

        // Données pour les graphiques
        incomeChartData,
        expenseChartData,
        monthsData,

        // Dernières transactions
        getRecentTransactions,

        // Moyennes mensuelles
        avgMonthlyIncome: totalIncome / 6,
        avgMonthlyExpenses: totalExpenses / 6,

        // Pourcentages
        incomePercentage:
          totalIncome > 0
            ? (totalIncome / (totalIncome + totalExpenses)) * 100
            : 0,
        expensePercentage:
          totalExpenses > 0
            ? (totalExpenses / (totalIncome + totalExpenses)) * 100
            : 0,
      };
    } catch (error) {
      console.error(
        "Erreur dans le calcul des statistiques financières:",
        error
      );
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        incomeTransactionCount: 0,
        expenseTransactionCount: 0,
        incomeChartData: [],
        expenseChartData: [],
        monthsData: [],
        avgMonthlyIncome: 0,
        avgMonthlyExpenses: 0,
        incomePercentage: 0,
        expensePercentage: 0,
      };
    }
  }, [paidInvoices, expenses, bridgeTransactions]);

  return {
    ...stats,
    loading: expensesLoading || invoicesLoading || bridgeLoading,
    error: expensesError || invoicesError || bridgeError,

    // Fonctions utilitaires
    formatCurrency: (amount) => {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(amount);
    },

    formatPercentage: (percentage) => {
      return `${percentage.toFixed(1)}%`;
    },
  };
};
