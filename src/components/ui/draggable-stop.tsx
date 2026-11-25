import React, { useState, useRef, useEffect, useCallback } from "react";
import { RadialGradientStop } from "@/types/types";

interface DraggableStopProps {
  stop: RadialGradientStop;
  index: number;
  onDragEnd: (index: number, x: number, y: number) => void;
  onSelect?: (index: number) => void;
  isSelected?: boolean;
  isHovered?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableStop: React.FC<DraggableStopProps> = ({
  stop,
  index,
  onDragEnd,
  onSelect,
  isSelected = false,
  isHovered = false,
  containerRef,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const stopRef = useRef<HTMLDivElement>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const calculatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      const constrainedX = Math.max(0, Math.min(relativeX, rect.width));
      const constrainedY = Math.max(0, Math.min(relativeY, rect.height));

      return { x: constrainedX, y: constrainedY };
    },
    [containerRef]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startPointRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    onSelect?.(index);
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !stopRef.current) return;

      if (startPointRef.current) {
        const dx = Math.abs(e.clientX - startPointRef.current.x);
        const dy = Math.abs(e.clientY - startPointRef.current.y);
        if (dx > 2 || dy > 2) {
          movedRef.current = true;
        }
      }

      const rect = containerRef.current.getBoundingClientRect();
      const { x, y } = calculatePosition(e.clientX, e.clientY);

      const pctX = rect.width ? (x / rect.width) * 100 : 0;
      const pctY = rect.height ? (y / rect.height) * 100 : 0;
      stopRef.current.style.left = `${pctX}%`;
      stopRef.current.style.top = `${pctY}%`;
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.stopPropagation();
      if (movedRef.current && containerRef.current) {
        const { x, y } = calculatePosition(e.clientX, e.clientY);
        onDragEnd(index, x, y);
      }
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, index, onDragEnd, containerRef, calculatePosition]);

  return (
    <div
      ref={stopRef}
      data-drag-stop="true"
      className={`absolute w-5 h-5 rounded-full cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
      style={{
        backgroundColor: stop.color,
        left: `${stop.position.x}%`,
        top: `${stop.position.y}%`,
        transform: `translate(-50%, -50%) scale(${isSelected || isDragging ? 1.18 : 1})`,
        zIndex: isDragging ? 20 : isSelected ? 10 : 1,
        border: isSelected ? "2px solid #ffffff" : "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: isSelected
          ? "0 0 0 2px rgba(236, 72, 153, 0.9), 0 2px 8px rgba(0,0,0,0.4)"
          : isHovered || isDragging
            ? "0 0 0 2px rgba(0,0,0,0.45)"
            : "0 1px 4px rgba(0,0,0,0.35)",
        transition: isDragging ? "none" : "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

export default DraggableStop;
