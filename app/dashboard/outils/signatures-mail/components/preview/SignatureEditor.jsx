"use client";

import React, { useEffect, useRef } from "react";
import { useSignatureData } from "@/src/hooks/use-signature-data";
import BlockCanvasAdvanced from "../blocks/BlockCanvasAdvanced";
import { createContainerFromWidget, getDefaultBlocksForTemplate } from "../../utils/block-registry";
import "@/src/styles/signature-text-selection.css";
import "./signature-preview.css";

/**
 * SignatureEditor - Modular signature editor with container-based system
 * Renders a drag & drop editable signature preview using nested containers
 */
export default function SignatureEditor({
  onImageUpload,
  templateId: templateIdProp,
  signatureData: signatureDataProp,
}) {
  const {
    signatureData: contextSignatureData,
    updateSignatureData,
    // Container system (new unified structure)
    rootContainer,
    setRootContainer,
    selectedContainerId,
    selectedElementId,
    hoveredContainerId,
    setHoveredContainerId,
    selectContainer,
    selectElement,
    addContainer,
    updateContainer,
    deleteContainer,
    updateElement,
    deleteElement,
    moveContainer,
    moveElement,
    reorderContainer,
    reorderElement,
    clearSelection,
  } = useSignatureData();

  // Use prop or context
  const signatureData = signatureDataProp || contextSignatureData;
  const templateId = templateIdProp || signatureData.templateId || "template1";

  // Track the last initialized template to detect changes
  const lastTemplateRef = useRef(null);

  // Initialize default structure based on template
  const initializeFromTemplate = (template) => {
    console.log("🎨 [SignatureEditor] Initializing root container for template:", template);
    const rootStructure = getDefaultBlocksForTemplate(template);
    console.log("🎨 [SignatureEditor] Generated root container:", rootStructure);
    setRootContainer(rootStructure);
  };

  // Initialize when template changes
  useEffect(() => {
    console.log("🔄 [SignatureEditor] useEffect triggered - templateId:", templateId, "lastTemplate:", lastTemplateRef.current, "rootContainer:", rootContainer?.id);

    // Initialize if rootContainer is null OR if template has changed
    if (!rootContainer || lastTemplateRef.current !== templateId) {
      console.log("✅ [SignatureEditor] Reinitializing for template:", templateId);
      initializeFromTemplate(templateId);
      lastTemplateRef.current = templateId;
    }
  }, [templateId, setRootContainer]);

  // Global click listener to deselect when clicking outside containers
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Only deselect if clicking directly on the signature canvas area
      const isSignatureCanvas = e.target.closest('.signature-editor-container');

      // If not clicking in the signature canvas area, don't do anything
      if (!isSignatureCanvas) {
        return;
      }

      // Check if click is on a container element
      const isContainerElement = e.target.closest('[data-container-id]');

      // Don't deselect if clicking on a container
      if (isContainerElement) {
        return;
      }

      // Only deselect if clicking on empty canvas area
      clearSelection();
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [clearSelection]);

  // Handle field changes from inline editing
  const handleFieldChange = (field, value) => {
    updateSignatureData(field, value);
  };

  // Handle container selection
  const handleContainerSelect = (containerId) => {
    selectContainer(containerId);
  };

  // Handle element selection
  const handleElementSelect = (elementId, containerId) => {
    selectElement(elementId, containerId);
  };

  // Handle adding a container as child of another container
  const handleAddContainer = (parentId, newContainer) => {
    addContainer(parentId, newContainer);
  };

  // Handle container update
  const handleContainerUpdate = (containerId, updates) => {
    updateContainer(containerId, updates);
  };

  // Handle container delete
  const handleContainerDelete = (containerId) => {
    deleteContainer(containerId);
  };

  // Handle element update
  const handleElementUpdate = (containerId, elementId, newProps) => {
    updateElement(containerId, elementId, newProps);
  };

  // Handle element delete
  const handleElementDelete = (containerId, elementId) => {
    deleteElement(containerId, elementId);
  };

  // Handle moving a container to another container
  const handleMoveContainer = (containerId, targetContainerId) => {
    moveContainer(containerId, targetContainerId);
  };

  // Handle moving an element to another container
  const handleMoveElement = (elementId, sourceContainerId, targetContainerId) => {
    moveElement(elementId, sourceContainerId, targetContainerId);
  };

  // Handle reordering elements within the same container
  const handleReorderElement = (containerId, draggedElementId, targetElementId, position) => {
    reorderElement(containerId, draggedElementId, targetElementId, position);
  };

  // Handle reordering containers within the same parent
  const handleReorderContainer = (draggedContainerId, targetContainerId, position) => {
    reorderContainer(draggedContainerId, targetContainerId, position);
  };

  return (
    <div
      className="signature-editor-container relative w-full"
      style={{
        fontFamily: signatureData?.fontFamily || "Arial, sans-serif",
      }}
    >
      <BlockCanvasAdvanced
        rootContainer={rootContainer}
        onRootContainerChange={setRootContainer}
        selectedContainerId={selectedContainerId}
        onContainerSelect={handleContainerSelect}
        selectedElementId={selectedElementId}
        onElementSelect={handleElementSelect}
        hoveredContainerId={hoveredContainerId}
        onContainerHover={setHoveredContainerId}
        onContainerUpdate={handleContainerUpdate}
        onContainerDelete={handleContainerDelete}
        onElementUpdate={handleElementUpdate}
        onElementDelete={handleElementDelete}
        onAddContainer={handleAddContainer}
        onMoveContainer={handleMoveContainer}
        onMoveElement={handleMoveElement}
        onReorderContainer={handleReorderContainer}
        onReorderElement={handleReorderElement}
        signatureData={signatureData}
        onFieldChange={handleFieldChange}
      />
    </div>
  );
}
