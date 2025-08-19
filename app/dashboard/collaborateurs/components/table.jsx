"use client";

import { Button } from "@/src/components/ui/button";
import { PlusIcon } from "lucide-react";
import MembersTable from "./members-table";

export default function TableUser({
  className,
  handleAddUser,
  refreshTrigger,
  onRefresh,
}) {
  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-4">
        <Button size="sm" onClick={handleAddUser} className="font-normal">
          Ajouter un collaborateur
        </Button>
      </div>
      <MembersTable refreshTrigger={refreshTrigger} onRefresh={onRefresh} />
    </div>
  );
}
