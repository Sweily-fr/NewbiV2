import { Building2, MapPin, CreditCard, FileText, Lock } from "lucide-react";

const tabs = [
  {
    id: "entreprise",
    label: "Informations",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    id: "address",
    label: "Adresse",
    icon: <MapPin className="h-4 w-4" />,
  },
  {
    id: "bank",
    label: "Coordonnées bancaires",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: "legal",
    label: "Informations légales",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "security",
    label: "Sécurité et confidentialité",
    icon: <Lock className="h-4 w-4" />,
  },
];

function SettingsSidebar({ activeTab = "entreprise", onTabChange }) {
  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 space-y-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            className={`flex items-center gap-2 cursor-pointer w-full text-left p-2 rounded-md ${activeTab === item.id ? "bg-muted" : "hover:bg-muted/50"}`}
            onClick={() => onTabChange && onTabChange(item.id)}
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { SettingsSidebar };
