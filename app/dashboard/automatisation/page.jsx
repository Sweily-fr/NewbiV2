import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Database,
  BarChart3,
  FileSpreadsheet,
  Package,
  FileText,
  ArrowRightLeft,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { Badge } from "@/src/components/ui/badge";

const IntegrationCard = ({ title, description, icon, status }) => {
  const isAvailable = status === "available";

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isAvailable ? "default" : "secondary"}
          disabled={!isAvailable}
        >
          {isAvailable ? "Connecter" : "Bientôt disponible"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function Automatisation() {
  const integrations = [
    {
      title: "Oracle",
      description:
        "Synchronisez vos données avec Oracle pour une gestion centralisée",
      icon: <Database className="h-5 w-5" />,
      status: "coming-soon",
    },
    {
      title: "Sage",
      description: "Intégrez vos données comptables et financières avec Sage",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      status: "coming-soon",
    },
    {
      title: "ACD",
      description:
        "Connectez vos logiciels ACD pour une gestion comptable optimisée",
      icon: <FileText className="h-5 w-5" />,
      status: "coming-soon",
    },
    {
      title: "Odoo",
      description:
        "Synchronisez vos données avec Odoo pour une gestion intégrée",
      icon: <Package className="h-5 w-5" />,
      status: "coming-soon",
    },
    {
      title: "Pennylane",
      description: "Intégrez vos données comptables avec Pennylane",
      icon: <BarChart3 className="h-5 w-5" />,
      status: "coming-soon",
    },
    {
      title: "Cegid Quadra",
      description:
        "Connectez vos logiciels Cegid Quadra pour une gestion comptable optimisée",
      icon: <FileText className="h-5 w-5" />,
      status: "coming-soon",
    },
    {
      title: "Cegid Loop",
      description:
        "Synchronisez vos données avec Cegid Loop pour une gestion intégrée",
      icon: <ArrowRightLeft className="h-5 w-5" />,
      status: "coming-soon",
    },
  ];

  return (
    <div className="flex flex-col p-6 md:py-6">
      <h1 className="text-2xl font-semibold mb-6">Intégrations</h1>
      <div className="flex flex-col mb-10 w-full">
        <Tabs
          defaultValue="outline"
          className="w-full flex-col justify-start gap-6"
        >
          <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
            <TabsTrigger value="outline">Toutes</TabsTrigger>
            <TabsTrigger value="past-performance">
              Brouillons <Badge variant="secondary">3</Badge>
            </TabsTrigger>
            <TabsTrigger value="key-personnel">
              À encaisser <Badge variant="secondary">2</Badge>
            </TabsTrigger>
            <TabsTrigger value="focus-documents">Terminées</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration, index) => (
          <IntegrationCard
            key={index}
            title={integration.title}
            description={integration.description}
            icon={integration.icon}
            status={integration.status}
          />
        ))}
      </div>
    </div>
  );
}
