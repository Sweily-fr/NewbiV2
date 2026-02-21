export const VAT_RATE_GROUPS = [
  {
    label: "Métropole",
    rates: [
      { value: "0", label: "0% - Exonéré" },
      { value: "2.1", label: "2,1% - Taux particulier" },
      { value: "5.5", label: "5,5% - Taux réduit" },
      { value: "10", label: "10% - Taux intermédiaire" },
      { value: "20", label: "20% - Taux normal" },
    ],
  },
  {
    label: "DOM-TOM",
    rates: [
      { value: "1.05", label: "1,05% - Taux réduit" },
      { value: "1.75", label: "1,75% - Taux réduit" },
      { value: "2.1", label: "2,1% - Taux réduit" },
      { value: "8.5", label: "8,5% - Taux normal" },
    ],
  },
];

// Flat list of all predefined rate values (for checking if a value is "custom")
export const ALL_PREDEFINED_RATES = VAT_RATE_GROUPS.flatMap((g) =>
  g.rates.map((r) => r.value)
);
