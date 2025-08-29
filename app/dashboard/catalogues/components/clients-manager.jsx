"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Plus } from "lucide-react";
import ClientsModal from "./clients-modal";
import { useCreateClient, useUpdateClient } from "@/src/hooks/useClients";

export default function ClientsManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const { createClient, loading: createLoading } = useCreateClient();
  const { updateClient, loading: updateLoading } = useUpdateClient();

  const handleSaveClient = async (clientData) => {
    try {
      if (selectedClient) {
        // Mode modification
        await updateClient(selectedClient.id, clientData);
      } else {
        // Mode création
        await createClient(clientData);
      }
      setIsModalOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error("Error saving client:", error);
      throw error; // Re-throw pour que le modal puisse gérer l'erreur
    }
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des clients</h2>
        <Button onClick={handleAddClient} className="flex items-center gap-2">
          <Plus size={16} />
          Ajouter un client
        </Button>
      </div>

      {/* Ici vous pouvez ajouter votre tableau de clients */}
      <div className="text-gray-500 text-center py-8">
        Tableau des clients à implémenter
      </div>

      <ClientsModal
        open={isModalOpen}
        onOpenChange={handleCloseModal}
        client={selectedClient}
        onSave={handleSaveClient}
      />
    </div>
  );
}
