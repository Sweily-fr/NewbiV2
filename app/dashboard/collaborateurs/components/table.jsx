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
      <MembersTable 
        refreshTrigger={refreshTrigger} 
        onRefresh={onRefresh}
        handleAddUser={handleAddUser}
      />
    </div>
  );
}
