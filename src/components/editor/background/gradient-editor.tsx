"use client";
import React, { useState, useRef, useCallback, memo } from "react";
import { useEditor } from "@/hooks/useEditor";
import { RadialGradientStop } from "@/types/types";
import DraggableStop from "@/components/ui/draggable-stop";
import ColorPickerPopover from "@/components/ui/color-picker-popover";
import { deserializeGradientConfig } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const GradientStopItem = memo(
  ({
    stop,
    index,
    onStopClick,
    onDeleteStop,
    onMouseEnter,
    onMouseLeave,
  }: {
    stop: RadialGradientStop;
    index: number;
    onStopClick: (index: number) => void;
    onDeleteStop: (index: number) => void;
    isHovered: boolean;
    onMouseEnter: (index: number) => void;
    onMouseLeave: () => void;
  }) => (
    <div className="flex items-center p-2 justify-center">
      <div
        className="w-6 h-6 rounded-full"
        onClick={() => onStopClick(index)}
        onMouseEnter={() => onMouseEnter(index)}
        onMouseLeave={() => onMouseLeave()}
        style={{ backgroundColor: stop.color, cursor: "pointer" }}
      />
      <Button variant="ghost" size="icon" onClick={() => onDeleteStop(index)}>
        <Trash2 size={16} />
      </Button>
    </div>
  )
);

GradientStopItem.displayName = "GradientStopItem";

const GradientEditor = () => {
  const { state, actions } = useEditor();
  const [selectedStop, setSelectedStop] = useState<number | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingBackground, setEditingBackground] = useState(false);
  const [hoveredStopIndex, setHoveredStopIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { backgroundColor, stops } = deserializeGradientConfig(state.background.value);

  const updateGradient = useCallback(
    (newBackground: string, newStops: RadialGradientStop[]) => {
      actions.updateBackground({
        value: JSON.stringify({
          backgroundColor: newBackground,
          stops: newStops,
        }),
      });
    },
    [actions]
  );

  const handleDragEnd = useCallback(
    (index: number, x: number, y: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      // Calculate position relative to container boundaries
      // and constrain within container
      const relativeX = Math.max(0, Math.min(x, rect.width));
      const relativeY = Math.max(0, Math.min(y, rect.height));

      const percentageX = Math.round((relativeX / rect.width) * 100);
      const percentageY = Math.round((relativeY / rect.height) * 100);

      const newStops = [...stops];
      newStops[index] = {
        ...stops[index],
        color: stops[index]?.color || "hsla(0, 0%, 100%, 1)",
        position: {
          x: percentageX,
          y: percentageY,
        },
      };
      updateGradient(backgroundColor, newStops);
    },
    [backgroundColor, stops, updateGradient]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      if (editingBackground) {
        updateGradient(color, stops);
      } else if (selectedStop !== null) {
        const newStops = [...stops];
        newStops[selectedStop] = {
          ...newStops[selectedStop],
          color,
          position: newStops[selectedStop]?.position || { x: 0, y: 0 },
        };
        updateGradient(backgroundColor, newStops);
      }
    },
    [editingBackground, selectedStop, backgroundColor, stops, updateGradient]
  );

  const handleClickBackground = useCallback(
    (e: React.MouseEvent) => {
      // Check if this is the result of a drag operation ending
      if ((e.target as HTMLElement).closest('[data-drag-stop="true"]')) {
        return;
      }

      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      const relativeX = e.clientX - rect.left;
      const relativeY = e.clientY - rect.top;

      const percentageX = Math.round((relativeX / rect.width) * 100);
      const percentageY = Math.round((relativeY / rect.height) * 100);

      const newStops = [
        ...stops,
        {
          color: "hsla(0, 0%, 100%, 1)",
          position: { x: percentageX, y: percentageY },
        },
      ];
      updateGradient(backgroundColor, newStops);
    },
    [backgroundColor, stops, updateGradient]
  );

  const handleStopClick = useCallback((index: number) => {
    setSelectedStop(index);
    setEditingBackground(false);
    setShowColorPicker(true);
  }, []);

  const handleDeleteStop = useCallback(
    (index: number) => {
      const newStops = [...stops];
      newStops.splice(index, 1);
      updateGradient(backgroundColor, newStops);
    },
    [backgroundColor, stops, updateGradient]
  );

  const handleMouseEnter = useCallback((index: number) => {
    setHoveredStopIndex(index);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredStopIndex(null);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setEditingBackground(true);
    setShowColorPicker(true);
  }, []);

  // Memoize background style to prevent unnecessary recalculations
  const backgroundStyle = {
    backgroundColor,
    backgroundImage: stops
      .map((stop) => `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`)
      .join(", "),
  };

  return (
    <div>
      <div ref={containerRef} className="relative w-full h-28 border rounded-lg">
        <div
          className="w-full h-full rounded-lg"
          style={backgroundStyle}
          onContextMenu={handleContextMenu}
          onClick={handleClickBackground}
        >
          {stops.map((stop, index) => (
            <DraggableStop
              key={index}
              stop={stop}
              index={index}
              onDragEnd={handleDragEnd}
              isHovered={hoveredStopIndex === index}
              containerRef={containerRef}
            />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 mt-4 overflow-y-auto rounded-md items-center border border-gray-100/10 small-scrollbar h-20">
        {stops.map((stop, index) => (
          <GradientStopItem
            key={index}
            stop={stop}
            index={index}
            onStopClick={handleStopClick}
            onDeleteStop={handleDeleteStop}
            isHovered={hoveredStopIndex === index}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        ))}
      </div>
      {showColorPicker && (
        <ColorPickerPopover
          color={editingBackground ? backgroundColor : stops[selectedStop!]?.color || "hsla(0, 0%, 100%, 1)"}
          onChange={handleColorChange}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
};

export default memo(GradientEditor);
