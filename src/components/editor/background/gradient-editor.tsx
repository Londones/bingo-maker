"use client";

import React, { useState, useRef, useCallback, useEffect, memo } from "react";
import { HslStringColorPicker } from "react-colorful";
import { Plus, Shuffle, Trash2 } from "lucide-react";
import { useEditorActions, useEditorBackground } from "@/hooks/useEditor";
import { GradientConfig, RadialGradientStop } from "@/types/types";
import DraggableStop from "@/components/ui/draggable-stop";
import { deserializeGradientConfig } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface MeshPreset {
  name: string;
  config: GradientConfig;
}

const MESH_PRESETS: MeshPreset[] = [
  {
    name: "Movie Night",
    config: {
      backgroundColor: "hsla(258, 38%, 10%, 1)",
      stops: [
        { position: { x: 15, y: 15 }, color: "hsla(330, 86%, 70%, 0.65)", opacity: 0.65, radius: 0.55 },
        { position: { x: 85, y: 25 }, color: "hsla(27, 96%, 61%, 0.45)", opacity: 0.45, radius: 0.5 },
        { position: { x: 75, y: 88 }, color: "hsla(234, 89%, 74%, 0.65)", opacity: 0.65, radius: 0.55 },
        { position: { x: 20, y: 85 }, color: "hsla(224, 82%, 66%, 0.4)", opacity: 0.4, radius: 0.5 },
      ],
    },
  },
  {
    name: "Highway",
    config: {
      backgroundColor: "hsla(175, 36%, 8%, 1)",
      stops: [
        { position: { x: 18, y: 20 }, color: "hsla(171, 77%, 64%, 0.6)", opacity: 0.6, radius: 0.55 },
        { position: { x: 82, y: 82 }, color: "hsla(48, 96%, 53%, 0.5)", opacity: 0.5, radius: 0.55 },
      ],
    },
  },
  {
    name: "Game Night",
    config: {
      backgroundColor: "hsla(12, 44%, 9%, 1)",
      stops: [
        { position: { x: 20, y: 18 }, color: "hsla(27, 96%, 61%, 0.65)", opacity: 0.65, radius: 0.55 },
        { position: { x: 85, y: 80 }, color: "hsla(350, 89%, 60%, 0.55)", opacity: 0.55, radius: 0.55 },
      ],
    },
  },
  {
    name: "Cobalt",
    config: {
      backgroundColor: "hsla(222, 47%, 10%, 1)",
      stops: [
        { position: { x: 20, y: 20 }, color: "hsla(199, 89%, 60%, 0.6)", opacity: 0.6, radius: 0.55 },
        { position: { x: 80, y: 78 }, color: "hsla(239, 84%, 67%, 0.6)", opacity: 0.6, radius: 0.55 },
      ],
    },
  },
  {
    name: "Matcha",
    config: {
      backgroundColor: "hsla(156, 36%, 9%, 1)",
      stops: [
        { position: { x: 22, y: 18 }, color: "hsla(158, 64%, 52%, 0.55)", opacity: 0.55, radius: 0.55 },
        { position: { x: 78, y: 82 }, color: "hsla(173, 80%, 40%, 0.55)", opacity: 0.55, radius: 0.55 },
      ],
    },
  },
  {
    name: "Paper",
    config: {
      backgroundColor: "hsla(240, 5%, 96%, 1)",
      stops: [
        { position: { x: 20, y: 20 }, color: "hsla(330, 80%, 88%, 0.65)", opacity: 0.65, radius: 0.55 },
        { position: { x: 82, y: 78 }, color: "hsla(213, 94%, 88%, 0.65)", opacity: 0.65, radius: 0.55 },
      ],
    },
  },
];

function toMeshCss(config: GradientConfig): React.CSSProperties {
  return {
    backgroundColor: config.backgroundColor,
    backgroundImage: config.stops
      .map((stop) => `radial-gradient(at ${stop.position.x}% ${stop.position.y}%, ${stop.color} 0px, transparent 50%)`)
      .join(", "),
  };
}

const GradientEditor = () => {
  const background = useEditorBackground();
  const actions = useEditorActions();
  const [selectedStop, setSelectedStop] = useState<number>(0);
  const [hoveredStopIndex, setHoveredStopIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const colorDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
    };
  }, []);

  const { backgroundColor, stops } = deserializeGradientConfig(background.value);
  const activeStopIndex = stops.length > 0 ? Math.min(selectedStop, stops.length - 1) : -1;
  const activeStop = activeStopIndex >= 0 ? stops[activeStopIndex] : undefined;

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

  const debouncedUpdateGradient = useCallback(
    (newBackground: string, newStops: RadialGradientStop[]) => {
      if (colorDebounceRef.current) clearTimeout(colorDebounceRef.current);
      colorDebounceRef.current = setTimeout(() => {
        updateGradient(newBackground, newStops);
      }, 120);
    },
    [updateGradient]
  );

  const handleDragEnd = useCallback(
    (index: number, x: number, y: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(x, rect.width));
      const relativeY = Math.max(0, Math.min(y, rect.height));
      const percentageX = rect.width ? Math.round((relativeX / rect.width) * 100) : 0;
      const percentageY = rect.height ? Math.round((relativeY / rect.height) * 100) : 0;

      const newStops = [...stops];
      newStops[index] = {
        ...stops[index],
        color: stops[index]?.color || "hsla(0, 0%, 100%, 1)",
        position: { x: percentageX, y: percentageY },
      };
      updateGradient(backgroundColor, newStops);
    },
    [backgroundColor, stops, updateGradient]
  );

  const handleBaseColorChange = useCallback(
    (color: string) => {
      debouncedUpdateGradient(color, stops);
    },
    [stops, debouncedUpdateGradient]
  );

  const handleSelectedStopColorChange = useCallback(
    (color: string) => {
      if (activeStopIndex < 0) return;
      const newStops = [...stops];
      newStops[activeStopIndex] = {
        ...newStops[activeStopIndex],
        color,
        position: newStops[activeStopIndex]?.position || { x: 50, y: 50 },
      };
      debouncedUpdateGradient(backgroundColor, newStops);
    },
    [activeStopIndex, backgroundColor, stops, debouncedUpdateGradient]
  );

  const handleAddStop = useCallback(
    (pos?: { x: number; y: number }) => {
      const hue = Math.floor(Math.random() * 360);
      const nextPosition = pos ?? {
        x: Math.floor(20 + Math.random() * 60),
        y: Math.floor(20 + Math.random() * 60),
      };
      const newStops: RadialGradientStop[] = [
        ...stops,
        {
          color: `hsla(${hue}, 85%, 65%, 0.7)`,
          position: nextPosition,
          opacity: 0.7,
          radius: 0.55,
        },
      ];
      updateGradient(backgroundColor, newStops);
      setSelectedStop(newStops.length - 1);
    },
    [backgroundColor, stops, updateGradient]
  );

  const handleDoubleClickPad = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-drag-stop="true"]')) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const percentageX = rect.width ? Math.round(((e.clientX - rect.left) / rect.width) * 100) : 50;
      const percentageY = rect.height ? Math.round(((e.clientY - rect.top) / rect.height) * 100) : 50;

      handleAddStop({ x: percentageX, y: percentageY });
    },
    [handleAddStop]
  );

  const handleDeleteSelected = useCallback(() => {
    if (activeStopIndex < 0) return;
    const newStops = stops.filter((_, i) => i !== activeStopIndex);
    updateGradient(backgroundColor, newStops);
    setSelectedStop(Math.max(0, activeStopIndex - 1));
  }, [activeStopIndex, backgroundColor, stops, updateGradient]);

  const handleShuffle = useCallback(() => {
    const baseHue = Math.floor(Math.random() * 360);
    const newBg = `hsla(${baseHue}, 38%, 10%, 1)`;
    const count = 3;
    const newStops: RadialGradientStop[] = Array.from({ length: count }, (_, i) => {
      const hue = (baseHue + 35 + i * 75 + Math.floor(Math.random() * 30)) % 360;
      return {
        color: `hsla(${hue}, 86%, 64%, 0.65)`,
        position: {
          x: Math.floor(15 + Math.random() * 70),
          y: Math.floor(15 + Math.random() * 70),
        },
        opacity: 0.65,
        radius: 0.55,
      };
    });
    updateGradient(newBg, newStops);
    setSelectedStop(0);
  }, [updateGradient]);

  const backgroundStyle = toMeshCss({ backgroundColor, stops });

  return (
    <div className="space-y-3.5">
      {/* Presets + Shuffle */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">Presets</span>
          <button
            type="button"
            onClick={handleShuffle}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shuffle className="h-3 w-3" />
            <span>Shuffle</span>
          </button>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {MESH_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              title={preset.name}
              aria-label={`Apply ${preset.name} preset`}
              onClick={() => {
                updateGradient(preset.config.backgroundColor, preset.config.stops);
                setSelectedStop(0);
              }}
              style={toMeshCss(preset.config)}
              className="h-8 w-full rounded-lg border border-border/80 hover:scale-105 hover:border-foreground/60 transition-transform"
            />
          ))}
        </div>
      </div>

      {/* Interactive Mesh Pad */}
      <div className="space-y-1">
        <div ref={containerRef} className="relative w-full h-32 rounded-xl border border-border/80 overflow-hidden">
          <div
            id="gradient-background"
            className="w-full h-full"
            style={backgroundStyle}
            onDoubleClick={handleDoubleClickPad}
          >
            {stops.map((stop, index) => (
              <DraggableStop
                key={index}
                stop={stop}
                index={index}
                onDragEnd={handleDragEnd}
                onSelect={setSelectedStop}
                isSelected={index === activeStopIndex}
                isHovered={hoveredStopIndex === index}
                containerRef={containerRef}
              />
            ))}
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground/80">
          Drag spots to move · Double-click pad to add
        </div>
      </div>

      {/* Base Color + Selected Spot Actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <div className="flex items-center gap-2">
          {/* Base Color Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-2 rounded-lg border border-border bg-card/70 hover:bg-muted text-xs font-medium text-foreground transition-colors"
              >
                <span
                  className="h-4 w-4 rounded-[4px] border border-white/25 shrink-0"
                  style={{ backgroundColor }}
                />
                <span>Base</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2.5" side="bottom" align="start">
              <div className="text-xs font-medium text-muted-foreground mb-2">Base color</div>
              <HslStringColorPicker color={backgroundColor} onChange={handleBaseColorChange} />
            </PopoverContent>
          </Popover>

          {/* Selected Spot Color Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={!activeStop}
                className="inline-flex items-center gap-1.5 h-8 px-2 rounded-lg border border-border bg-card/70 hover:bg-muted disabled:opacity-40 text-xs font-medium text-foreground transition-colors"
              >
                <span
                  className="h-4 w-4 rounded-[4px] border border-white/25 shrink-0"
                  style={{ backgroundColor: activeStop?.color ?? "transparent" }}
                />
                <span>Spot</span>
              </button>
            </PopoverTrigger>
            {activeStop && (
              <PopoverContent className="w-auto p-2.5" side="bottom" align="start">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Spot {activeStopIndex + 1} color
                </div>
                <HslStringColorPicker color={activeStop.color} onChange={handleSelectedStopColorChange} />
              </PopoverContent>
            )}
          </Popover>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleAddStop()}
            aria-label="Add gradient spot"
            className="h-8 px-2 rounded-lg border border-border bg-card/70 hover:bg-muted inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={activeStopIndex < 0}
            aria-label="Delete selected spot"
            className="h-8 w-8 rounded-lg border border-border bg-card/70 hover:bg-destructive/15 hover:text-destructive disabled:opacity-40 inline-flex items-center justify-center text-muted-foreground transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Compact Spot Selector Strip */}
      {stops.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {stops.map((stop, index) => {
            const isSelected = index === activeStopIndex;
            return (
              <button
                key={index}
                type="button"
                aria-label={`Select spot ${index + 1}`}
                onClick={() => setSelectedStop(index)}
                onMouseEnter={() => setHoveredStopIndex(index)}
                onMouseLeave={() => setHoveredStopIndex(null)}
                className={`h-6 w-6 rounded-md border transition-transform ${
                  isSelected
                    ? "scale-110 border-foreground ring-2 ring-pink-500/70"
                    : "border-border/80 opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: stop.color }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(GradientEditor);
