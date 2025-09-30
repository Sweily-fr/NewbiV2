"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { PricingModal } from "@/src/components/pricing-modal";

/**
 * Composant de test pour la PricingModal
 * À utiliser temporairement pour tester la modal
 */
export function PricingModalTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="sm"
      >
        🧪 Test Pricing Modal
      </Button>
      
      <PricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
