import React from "react";
import { motion } from "framer-motion";
import { RadialGradientStop } from "@/types/types";

type DraggableStopProps = {
    stop: RadialGradientStop;
    index: number;
    onDragEnd: (index: number, x: number, y: number) => void;
    onDoubleClick: (index: number) => void;
};

const DraggableStop = ({ stop, index, onDragEnd, onDoubleClick }: DraggableStopProps) => {
    return (
        <motion.div
            key={index}
            drag
            dragMomentum={false}
            onDragEnd={(_, info) => onDragEnd(index, info.point.x, info.point.y)}
            onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClick(index);
            }}
            style={{
                position: "absolute",
                left: `${stop.position.x}%`,
                top: `${stop.position.y}%`,
                backgroundColor: stop.color,
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: "1px solid white",
                transform: "translate(-50%, -50%)",
            }}
        />
    );
};

export default DraggableStop;
