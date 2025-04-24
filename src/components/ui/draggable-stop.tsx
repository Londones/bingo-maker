import React, { useState, useRef, useEffect, useCallback } from "react";
import { RadialGradientStop } from "@/types/types";

interface DraggableStopProps {
  stop: RadialGradientStop;
  index: number;
  onDragEnd: (index: number, x: number, y: number) => void;
  isHovered?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableStop: React.FC<DraggableStopProps> = ({ stop, index, onDragEnd, isHovered = false, containerRef }) => {
  const [isDragging, setIsDragging] = useState(false);
  const stopRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };

      const rect = containerRef.current.getBoundingClientRect();

      // Calculate position relative to container
      const relativeX = clientX - rect.left;
      const relativeY = clientY - rect.top;

      // Constrain to container boundaries
      const constrainedX = Math.max(0, Math.min(relativeX, rect.width));
      const constrainedY = Math.max(0, Math.min(relativeY, rect.height));

      return { x: constrainedX, y: constrainedY };
    },
    [containerRef]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || !stopRef.current) return;

      const { x, y } = calculatePosition(e.clientX, e.clientY);

      // Update visual position immediately during drag
      stopRef.current.style.left = `${x}px`;
      stopRef.current.style.top = `${y}px`;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!containerRef.current) return;

      // Important: Stop event propagation to prevent creating new stops
      e.stopPropagation();

      const { x, y } = calculatePosition(e.clientX, e.clientY);
      onDragEnd(index, x, y);
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, index, onDragEnd, containerRef, calculatePosition]);

  // Calculate initial position in pixels
  const getInitialPosition = () => {
    if (!containerRef.current) return { left: 0, top: 0 };

    const rect = containerRef.current.getBoundingClientRect();
    const left = (stop.position.x / 100) * rect.width;
    const top = (stop.position.y / 100) * rect.height;

    return { left, top };
  };

  const { left, top } = getInitialPosition();

  return (
    <div
      ref={stopRef}
      data-drag-stop="true"
      className={`absolute w-5 h-5 rounded-full cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
      style={{
        backgroundColor: stop.color,
        left: `${left}px`,
        top: `${top}px`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging ? 10 : 1,
        border: "1px solid white",
        boxShadow: isHovered || isDragging ? "0 0 0 2px rgba(0,0,0,0.5)" : "0 0 0 1px rgba(0,0,0,0.2)",
        transition: isDragging ? "none" : "box-shadow 0.2s ease",
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

export default DraggableStop;
