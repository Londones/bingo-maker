"use client";
import React from "react";
import { motion } from "framer-motion";
import { RadialGradientStop } from "@/types/types";

type DraggableStopProps = {
    stop: RadialGradientStop;
    index: number;
    onDragEnd: (index: number, x: number, y: number) => void;
    containerRef: React.RefObject<HTMLDivElement>;
    isHovered: boolean;
};

const DraggableStop = ({ stop, index, onDragEnd, containerRef, isHovered }: DraggableStopProps) => {
    if (!containerRef.current) return null;

    const pixelX = containerRef.current.clientWidth * (stop.position.x / 100) - 10;
    const pixelY = containerRef.current.clientHeight * (stop.position.y / 100) - 10;

    return (
        <motion.div
            key={index}
            drag
            dragMomentum={false}
            dragElastic={0}
            dragSnapToOrigin={false}
            dragConstraints={{
                left: -10,
                right: containerRef.current.clientWidth - 10,
                top: -10,
                bottom: containerRef.current.clientHeight - 10,
            }}
            initial={false}
            layout={false}
            animate={{ x: pixelX, y: pixelY }}
            dragTransition={{ power: 0, timeConstant: 0 }}
            onDragEnd={(_, info) => onDragEnd(index, info.point.x, info.point.y)}
            style={{
                position: "absolute",
                backgroundColor: stop.color,
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: isHovered ? "2px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.8)",
                boxShadow: isHovered
                    ? "0 0 0 1px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.5)"
                    : "0 0 0 1px rgba(0,0,0,0.3)",
                transform: `scale(${isHovered ? 1.2 : 1})`,
                transition: "transform 0.2s, border 0.2s, box-shadow 0.2s",
            }}
        />
    );
};

export default DraggableStop;
