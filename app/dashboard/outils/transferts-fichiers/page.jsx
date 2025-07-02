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

export default function TransfertsFichiers() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 p-6">
      <h1 className="text-2xl font-semibold pl-6 mb-6">
        Gestion des Transferts Fichiers
      </h1>

      <div className="w-full">
        <DataTable data={data} />
      </div>
    </div>
  );
}
