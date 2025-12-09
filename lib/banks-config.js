// Configuration des banques avec leurs logos via Brandfetch
export const BANKS = {
  // Banques traditionnelles françaises
  bnp: {
    name: "BNP Paribas",
    logo: "https://cdn.brandfetch.io/bnpparibas.com/w/400/h/400",
    patterns: ["bnp", "bnp paribas", "bnpparibas"],
  },
  sg: {
    name: "Société Générale",
    logo: "https://cdn.brandfetch.io/societegenerale.com/w/400/h/400",
    patterns: ["societe generale", "société générale", "sg ", "socgen"],
  },
  ca: {
    name: "Crédit Agricole",
    logo: "https://cdn.brandfetch.io/credit-agricole.com/w/400/h/400",
    patterns: ["credit agricole", "crédit agricole", "ca ", "crcam"],
  },
  lcl: {
    name: "LCL",
    logo: "https://cdn.brandfetch.io/lcl.fr/w/400/h/400",
    patterns: ["lcl"],
  },
  cm: {
    name: "Crédit Mutuel",
    logo: "https://cdn.brandfetch.io/creditmutuel.fr/w/400/h/400",
    patterns: ["credit mutuel", "crédit mutuel", "cm ", "cmb", "cic"],
  },
  cic: {
    name: "CIC",
    logo: "https://cdn.brandfetch.io/cic.fr/w/400/h/400",
    patterns: ["cic"],
  },
  bp: {
    name: "Banque Populaire",
    logo: "https://cdn.brandfetch.io/banquepopulaire.fr/w/400/h/400",
    patterns: ["banque populaire", "bp ", "bpce"],
  },
  ce: {
    name: "Caisse d'Épargne",
    logo: "https://cdn.brandfetch.io/caisse-epargne.fr/w/400/h/400",
    patterns: ["caisse d'epargne", "caisse d'épargne", "caisse epargne", "ce "],
  },
  labanquepostale: {
    name: "La Banque Postale",
    logo: "https://cdn.brandfetch.io/labanquepostale.fr/w/400/h/400",
    patterns: ["banque postale", "la banque postale", "lbp"],
  },
  hsbc: {
    name: "HSBC",
    logo: "https://cdn.brandfetch.io/hsbc.com/w/400/h/400",
    patterns: ["hsbc"],
  },

  // Banques en ligne
  boursorama: {
    name: "Boursorama",
    logo: "https://cdn.brandfetch.io/boursorama.com/w/400/h/400",
    patterns: ["boursorama", "boursobank"],
  },
  fortuneo: {
    name: "Fortuneo",
    logo: "https://cdn.brandfetch.io/fortuneo.fr/w/400/h/400",
    patterns: ["fortuneo"],
  },
  hellobank: {
    name: "Hello bank!",
    logo: "https://cdn.brandfetch.io/hellobank.fr/w/400/h/400",
    patterns: ["hello bank", "hellobank"],
  },
  ing: {
    name: "ING",
    logo: "https://cdn.brandfetch.io/ing.com/w/400/h/400",
    patterns: ["ing"],
  },
  monabanq: {
    name: "Monabanq",
    logo: "https://cdn.brandfetch.io/monabanq.com/w/400/h/400",
    patterns: ["monabanq"],
  },

  // Néobanques
  revolut: {
    name: "Revolut",
    logo: "https://cdn.brandfetch.io/revolut.com/w/400/h/400",
    patterns: ["revolut"],
  },
  n26: {
    name: "N26",
    logo: "https://cdn.brandfetch.io/n26.com/w/400/h/400",
    patterns: ["n26"],
  },
  qonto: {
    name: "Qonto",
    logo: "https://cdn.brandfetch.io/qonto.com/w/400/h/400",
    patterns: ["qonto"],
  },
  shine: {
    name: "Shine",
    logo: "https://cdn.brandfetch.io/shine.fr/w/400/h/400",
    patterns: ["shine"],
  },
  lydia: {
    name: "Lydia",
    logo: "https://cdn.brandfetch.io/lydia-app.com/w/400/h/400",
    patterns: ["lydia"],
  },
  sumup: {
    name: "SumUp",
    logo: "https://cdn.brandfetch.io/sumup.com/w/400/h/400",
    patterns: ["sumup", "sum up"],
  },
  blank: {
    name: "Blank",
    logo: "https://cdn.brandfetch.io/blank.app/w/400/h/400",
    patterns: ["blank"],
  },
  finom: {
    name: "Finom",
    logo: "https://cdn.brandfetch.io/finom.co/w/400/h/400",
    patterns: ["finom"],
  },

  // Autres
  paypal: {
    name: "PayPal",
    logo: "https://cdn.brandfetch.io/paypal.com/w/400/h/400",
    patterns: ["paypal"],
  },
  wise: {
    name: "Wise",
    logo: "https://cdn.brandfetch.io/wise.com/w/400/h/400",
    patterns: ["wise", "transferwise"],
  },
};

// Fonction pour trouver une banque par son nom
export const findBank = (bankName) => {
  if (!bankName) return null;

  const normalizedName = bankName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  for (const [key, bank] of Object.entries(BANKS)) {
    for (const pattern of bank.patterns) {
      if (normalizedName.includes(pattern.toLowerCase())) {
        return bank;
      }
    }
  }

  return null;
};

// Fonction pour obtenir le logo d'une banque
export const getBankLogo = (bankName) => {
  const bank = findBank(bankName);
  return bank?.logo || null;
};
