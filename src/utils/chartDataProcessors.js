// Utilitaires pour traiter les données des graphiques
// Évite la duplication de code entre dashboard et transactions

export const processInvoicesForCharts = (paidInvoices) => {
  const now = new Date();
  const chartData = [];

  // Generate data for the last 90 days
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Filter invoices for this day
    const dayInvoices = paidInvoices.filter((invoice) => {
      if (!invoice.issueDate) return false;

      let invoiceDate;
      if (typeof invoice.issueDate === "string") {
        // Si c'est un timestamp en string, le convertir en number
        const timestamp = parseInt(invoice.issueDate);
        invoiceDate = new Date(timestamp);
      } else if (typeof invoice.issueDate === "number") {
        invoiceDate = new Date(invoice.issueDate);
      } else {
        invoiceDate = new Date(invoice.issueDate);
      }

      // Vérifier si la date est valide
      if (isNaN(invoiceDate.getTime())) {
        console.warn(
          "Date de facture invalide:",
          invoice.issueDate,
          "pour la facture:",
          invoice.id
        );
        return false;
      }

      return invoiceDate.toISOString().split("T")[0] === dateStr;
    });

    // Calculate income for this day (UNIQUEMENT les factures payées)
    const dayIncome = dayInvoices.reduce(
      (sum, invoice) => sum + (invoice.finalTotalTTC || 0),
      0
    );
    const dayInvoiceCount = dayInvoices.length;

    chartData.push({
      date: dateStr,
      desktop: dayIncome,
      mobile: dayInvoiceCount,
    });
  }

  return chartData;
};

export const processExpensesForCharts = (expenses) => {
  const now = new Date();
  const chartData = [];

  // Generate data for the last 90 days
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Filter expenses for this day - TOUTES les dépenses (manuelles et OCR)
    const dayExpenses = expenses.filter((expense) => {
      if (!expense.date) return false;

      let expenseDate;
      if (typeof expense.date === "string") {
        // Si c'est un timestamp en string, le convertir en number
        const timestamp = parseInt(expense.date);
        if (!isNaN(timestamp) && timestamp > 1000000000000) {
          // Vérifier si c'est un timestamp
          expenseDate = new Date(timestamp);
        } else {
          expenseDate = new Date(expense.date);
        }
      } else if (typeof expense.date === "number") {
        expenseDate = new Date(expense.date);
      } else {
        expenseDate = new Date(expense.date);
      }

      // Vérifier si la date est valide
      if (isNaN(expenseDate.getTime())) return false;

      const isCorrectDate = expenseDate.toISOString().split("T")[0] === dateStr;

      return isCorrectDate;
    });

    // Calculate expenses for this day
    const dayExpenseAmount = dayExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );
    const dayExpenseCount = dayExpenses.length;

    chartData.push({
      date: dateStr,
      desktop: dayExpenseAmount,
      mobile: dayExpenseCount,
    });
  }

  return chartData;
};

// MODE BANCAIRE PUR : Entrées basées uniquement sur les transactions bancaires positives
export const processIncomeForCharts = (
  paidInvoices = [],
  bankTransactions = [],
  days = 365
) => {
  const now = new Date();
  const chartData = [];

  // Generate data for the last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // MODE BANCAIRE PUR : Uniquement les transactions bancaires positives
    const dayBankIncome = bankTransactions.filter((t) => {
      // Utiliser date, processedAt ou createdAt comme fallback
      const rawDate = t.date || t.processedAt || t.createdAt;
      if (!rawDate || t.amount <= 0) return false;

      let transactionDate;
      if (typeof rawDate === "string") {
        transactionDate = new Date(rawDate);
      } else {
        transactionDate = new Date(rawDate);
      }

      if (isNaN(transactionDate.getTime())) return false;
      return transactionDate.toISOString().split("T")[0] === dateStr;
    });

    const dayIncome = dayBankIncome.reduce((sum, t) => sum + t.amount, 0);
    const dayCount = dayBankIncome.length;

    chartData.push({
      date: dateStr,
      desktop: dayIncome,
      mobile: dayCount,
    });
  }

  return chartData;
};

// MODE BANCAIRE PUR : Sorties basées uniquement sur les transactions bancaires négatives
export const processExpensesWithBankForCharts = (
  expenses = [],
  bankTransactions = [],
  days = 365
) => {
  const now = new Date();
  const chartData = [];

  // Generate data for the last N days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // MODE BANCAIRE PUR : Uniquement les transactions bancaires négatives
    const dayBankExpenses = bankTransactions.filter((t) => {
      // Utiliser date, processedAt ou createdAt comme fallback
      const rawDate = t.date || t.processedAt || t.createdAt;
      if (!rawDate || t.amount >= 0) return false;

      let transactionDate;
      if (typeof rawDate === "string") {
        transactionDate = new Date(rawDate);
      } else {
        transactionDate = new Date(rawDate);
      }

      if (isNaN(transactionDate.getTime())) return false;
      return transactionDate.toISOString().split("T")[0] === dateStr;
    });

    const dayExpenseAmount = Math.abs(
      dayBankExpenses.reduce((sum, t) => sum + t.amount, 0)
    );
    const dayCount = dayBankExpenses.length;

    chartData.push({
      date: dateStr,
      desktop: dayExpenseAmount,
      mobile: dayCount,
    });
  }

  return chartData;
};

// Configuration des graphiques
export const getIncomeChartConfig = () => ({
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Montant",
    color: "#22c55e", // Vert pour les revenus
  },
  mobile: {
    label: "Nombre de transactions",
    color: "#16a34a", // Vert plus foncé
  },
});

export const getExpenseChartConfig = () => ({
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Montant",
    color: "#ef4444", // Rouge pour les dépenses
  },
  mobile: {
    label: "Nombre de transactions",
    color: "#dc2626", // Rouge plus foncé
  },
});
