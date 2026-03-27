// Utilitaires pour traiter les données des graphiques
// Évite la duplication de code entre dashboard et transactions

// Helper : convertit une valeur de date en clé YYYY-MM-DD en timezone locale
// Évite le décalage UTC (+1/+2 en France) que cause toISOString()
const toLocalDateKey = (raw) => {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const processInvoicesForCharts = (paidInvoices) => {
  const now = new Date();
  const chartData = [];

  // Generate data for the last 90 days
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = toLocalDateKey(date);

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
          invoice.id,
        );
        return false;
      }

      return toLocalDateKey(invoiceDate) === dateStr;
    });

    // Calculate income for this day (UNIQUEMENT les factures payées)
    const dayIncome = dayInvoices.reduce(
      (sum, invoice) => sum + (invoice.finalTotalTTC || 0),
      0,
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
    const dateStr = toLocalDateKey(date);

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

      return toLocalDateKey(expenseDate) === dateStr;
    });

    // Calculate expenses for this day
    const dayExpenseAmount = dayExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0,
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _paidInvoices = [],
  bankTransactions = [],
  days = 365,
) => {
  const now = new Date();

  // Phase 1 : filtrer les transactions positives et les grouper par date locale dans une Map
  const incomeByDate = new Map(); // clé = "YYYY-MM-DD", valeur = { amount, count }
  let parseFails = 0;

  for (const t of bankTransactions) {
    if (t.amount <= 0) continue;
    const rawDate = t.date || t.processedAt || t.createdAt;
    const key = toLocalDateKey(rawDate);
    if (!key) {
      parseFails++;
      continue;
    }

    const entry = incomeByDate.get(key);
    if (entry) {
      entry.amount += t.amount;
      entry.count += 1;
    } else {
      incomeByDate.set(key, { amount: t.amount, count: 1 });
    }
  }

  // Phase 2 : générer les N jours de données en consultant la Map (lookup O(1))
  const chartData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = toLocalDateKey(date);

    const entry = incomeByDate.get(dateStr);
    chartData.push({
      date: dateStr,
      desktop: entry ? entry.amount : 0,
      mobile: entry ? entry.count : 0,
    });
  }

  // Debug: résumé des données générées
  const totalDesktop = chartData.reduce((sum, d) => sum + d.desktop, 0);
  const daysWithData = chartData.filter((d) => d.desktop > 0).length;
  const positiveCount = bankTransactions.filter((t) => t.amount > 0).length;
  console.warn("📊 [ChartProcessor] Entrées:", {
    totalTransactions: bankTransactions.length,
    positiveTransactions: positiveCount,
    uniqueDatesInMap: incomeByDate.size,
    parseFails,
    daysWithData,
    totalAmount: totalDesktop,
    dateRange:
      chartData.length > 0
        ? `${chartData[0].date} → ${chartData[chartData.length - 1].date}`
        : "vide",
    sampleEntries: [...incomeByDate.entries()].slice(0, 3),
  });

  return chartData;
};

// MODE BANCAIRE PUR : Sorties basées uniquement sur les transactions bancaires négatives
export const processExpensesWithBankForCharts = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _expenses = [],
  bankTransactions = [],
  days = 365,
) => {
  const now = new Date();

  // Phase 1 : filtrer les transactions négatives et les grouper par date locale dans une Map
  const expenseByDate = new Map(); // clé = "YYYY-MM-DD", valeur = { amount, count }
  let parseFails = 0;

  for (const t of bankTransactions) {
    if (t.amount >= 0) continue;
    const rawDate = t.date || t.processedAt || t.createdAt;
    const key = toLocalDateKey(rawDate);
    if (!key) {
      parseFails++;
      continue;
    }

    const absAmount = Math.abs(t.amount);
    const entry = expenseByDate.get(key);
    if (entry) {
      entry.amount += absAmount;
      entry.count += 1;
    } else {
      expenseByDate.set(key, { amount: absAmount, count: 1 });
    }
  }

  // Phase 2 : générer les N jours de données en consultant la Map (lookup O(1))
  const chartData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = toLocalDateKey(date);

    const entry = expenseByDate.get(dateStr);
    chartData.push({
      date: dateStr,
      desktop: entry ? entry.amount : 0,
      mobile: entry ? entry.count : 0,
    });
  }

  // Debug: résumé des données générées
  const totalDesktop = chartData.reduce((sum, d) => sum + d.desktop, 0);
  const daysWithData = chartData.filter((d) => d.desktop > 0).length;
  const negativeCount = bankTransactions.filter((t) => t.amount < 0).length;
  console.warn("📊 [ChartProcessor] Sorties:", {
    totalTransactions: bankTransactions.length,
    negativeTransactions: negativeCount,
    uniqueDatesInMap: expenseByDate.size,
    parseFails,
    daysWithData,
    totalAmount: totalDesktop,
    dateRange:
      chartData.length > 0
        ? `${chartData[0].date} → ${chartData[chartData.length - 1].date}`
        : "vide",
    sampleEntries: [...expenseByDate.entries()].slice(0, 3),
  });

  return chartData;
};

// Configuration des graphiques
export const getIncomeChartConfig = () => ({
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Montant",
    color: "#5b50ff", // Violet Newbi pour les entrées
  },
  mobile: {
    label: "Nombre de transactions",
    color: "#4840cc", // Violet plus foncé
  },
});

export const getExpenseChartConfig = () => ({
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Montant",
    color: "#000000", // Noir pour les sorties
  },
  mobile: {
    label: "Nombre de transactions",
    color: "#1a1a1a", // Noir légèrement plus clair
  },
});
