"use client";

import React from "react";
import SignatureSave from "../../SignatureSave";

const SaveSection = () => {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">Sauvegarde</h2>
      <div className="flex justify-center">
        <SignatureSave />
      </div>
    </div>
  );
};

export default SaveSection;
