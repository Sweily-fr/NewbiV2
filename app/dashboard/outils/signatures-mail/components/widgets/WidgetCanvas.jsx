"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement } from "@dnd-kit/modifiers";

import { WIDGET_TYPES } from "../../utils/widget-registry";
import Widget from "./Widget";
import TextWidget from "./TextWidget";
import ImageWidget from "./ImageWidget";
import LogoWidget from "./LogoWidget";
import SeparatorWidget from "./SeparatorWidget";
import SpacerWidget from "./SpacerWidget";
import SocialIconsWidget from "./SocialIconsWidget";
import ContactRowWidget from "./ContactRowWidget";

/**
 * Renders the appropriate widget component based on type
 */
const WidgetRenderer = ({
  widget,
  signatureData,
  onFieldChange,
  onImageUpload,
  onUpdateWidget,
  isSelected,
}) => {
  const commonProps = {
    props: widget.props,
    signatureData,
    onFieldChange,
    onImageUpload,
    onUpdate: (newProps) => onUpdateWidget(widget.id, newProps),
    isSelected,
  };

  switch (widget.type) {
    case WIDGET_TYPES.TEXT:
      return <TextWidget {...commonProps} />;
    case WIDGET_TYPES.IMAGE:
      return <ImageWidget {...commonProps} />;
    case WIDGET_TYPES.LOGO:
      return <LogoWidget {...commonProps} />;
    case WIDGET_TYPES.SEPARATOR:
      return <SeparatorWidget {...commonProps} />;
    case WIDGET_TYPES.SPACER:
      return <SpacerWidget {...commonProps} />;
    case WIDGET_TYPES.SOCIAL_ICONS:
      return <SocialIconsWidget {...commonProps} />;
    case WIDGET_TYPES.CONTACT_ROW:
      return <ContactRowWidget {...commonProps} />;
    default:
      return <div className="text-red-500 text-xs">Widget inconnu: {widget.type}</div>;
  }
};

/**
 * WidgetCanvas - Main canvas for rendering and arranging widgets
 */
export default function WidgetCanvas({
  widgets = [],
  layout = "vertical",
  columns = null,
  signatureData,
  onFieldChange,
  onImageUpload,
  onWidgetsChange,
  onUpdateWidget,
  selectedWidgetId,
  onSelectWidget,
  onDeleteWidget,
}) {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newWidgets = arrayMove(widgets, oldIndex, newIndex);
        onWidgetsChange?.(newWidgets);
      }
    }
  };

  const handleCanvasClick = (e) => {
    // Deselect when clicking on canvas background
    if (e.target === e.currentTarget) {
      onSelectWidget?.(null);
    }
  };

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null;

  // Render for horizontal layout with columns
  if (layout === "horizontal" && columns) {
    return (
      <div
        className="signature-canvas"
        onClick={handleCanvasClick}
        style={{ fontFamily: signatureData?.fontFamily || "Arial, sans-serif" }}
      >
        <table
          cellPadding="0"
          cellSpacing="0"
          border="0"
          style={{ borderCollapse: "collapse" }}
        >
          <tbody>
            <tr>
              {columns.map((column, colIndex) => (
                <React.Fragment key={column.id}>
                  <td
                    style={{
                      verticalAlign: "top",
                      paddingRight: colIndex < columns.length - 1 ? "12px" : 0,
                    }}
                  >
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        setActiveId(null);

                        if (active.id !== over?.id) {
                          const oldIndex = column.widgets.findIndex(
                            (w) => w.id === active.id
                          );
                          const newIndex = column.widgets.findIndex(
                            (w) => w.id === over?.id
                          );

                          if (oldIndex !== -1 && newIndex !== -1) {
                            const newColumnWidgets = arrayMove(
                              column.widgets,
                              oldIndex,
                              newIndex
                            );
                            const newColumns = columns.map((col) =>
                              col.id === column.id
                                ? { ...col, widgets: newColumnWidgets }
                                : col
                            );
                            // TODO: Handle column widgets change
                          }
                        }
                      }}
                      modifiers={[restrictToParentElement]}
                    >
                      <SortableContext
                        items={column.widgets.map((w) => w.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col gap-1">
                          {column.widgets.map((widget) => (
                            <Widget
                              key={widget.id}
                              id={widget.id}
                              isSelected={selectedWidgetId === widget.id}
                              onSelect={onSelectWidget}
                              onDelete={onDeleteWidget}
                            >
                              <WidgetRenderer
                                widget={widget}
                                signatureData={signatureData}
                                onFieldChange={onFieldChange}
                                onImageUpload={onImageUpload}
                                onUpdateWidget={onUpdateWidget}
                                isSelected={selectedWidgetId === widget.id}
                              />
                            </Widget>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Render for vertical layout (simple list)
  return (
    <div
      className="signature-canvas"
      onClick={handleCanvasClick}
      style={{ fontFamily: signatureData?.fontFamily || "Arial, sans-serif" }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToParentElement]}
      >
        <SortableContext
          items={widgets.map((w) => w.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1">
            {widgets.map((widget) => (
              <Widget
                key={widget.id}
                id={widget.id}
                isSelected={selectedWidgetId === widget.id}
                onSelect={onSelectWidget}
                onDelete={onDeleteWidget}
              >
                <WidgetRenderer
                  widget={widget}
                  signatureData={signatureData}
                  onFieldChange={onFieldChange}
                  onImageUpload={onImageUpload}
                  onUpdateWidget={onUpdateWidget}
                  isSelected={selectedWidgetId === widget.id}
                />
              </Widget>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeWidget ? (
            <div className="opacity-80 bg-white shadow-lg rounded p-2">
              <WidgetRenderer
                widget={activeWidget}
                signatureData={signatureData}
                onFieldChange={onFieldChange}
                onImageUpload={onImageUpload}
                onUpdateWidget={onUpdateWidget}
                isSelected={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
