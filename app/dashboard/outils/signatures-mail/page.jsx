"use client";
import { DataTable } from "@/src/components/data-table";

const data = [
  {
    id: 1,
    header: "F-202504-000004",
    type: "MGE couverture",
    status: "In Process",
    target: "18",
    limit: "5",
    reviewer: "Eddie Lake",
  },
  {
    id: 2,
    header: "F-202504-000004",
    type: "Lemliste",
    status: "Done",
    target: "29",
    limit: "24",
    reviewer: "Eddie Lake",
  },
  {
    id: 3,
    header: "F-202504-000004",
    type: "SpimedAI",
    status: "Done",
    target: "10",
    limit: "13",
    reviewer: "Eddie Lake",
  },
  {
    id: 4,
    header: "F-202504-000004",
    type: "New3dge",
    status: "Done",
    target: "27",
    limit: "23",
    reviewer: "Jamik Tashpulatov",
  },
  {
    id: 5,
    header: "F-202504-000004",
    type: "Narrative",
    status: "In Process",
    target: "2",
    limit: "16",
    reviewer: "Jamik Tashpulatov",
  },
];

export default function SignaturesMail() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-xl font-medium mb-2">
            Gestion des Signatures Mail
          </h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos signatures mail et suivez les modifications
          </p>
        </div>
      </div>
      <div className="w-full">
        <DataTable
          data={data}
          textButton="Ajouter une signature"
          link="/dashboard/outils/signatures-mail/new"
        />
      </div>
    </div>
  );
}
