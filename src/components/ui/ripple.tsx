"use client";
import React, { CSSProperties } from "react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

interface RippleProps {
    mainCircleSize?: number;
    numCircles?: number;
    className?: string;
}

const Ripple = React.memo(function Ripple({ mainCircleSize = 210, numCircles = 4, className }: RippleProps) {
    const { theme } = useTheme();
    const adjustedMainCircleOpacity = theme === "dark" ? 0.24 : 0.65;
    return (
        <div
            className={cn(
                "pointer-events-none select-none absolute inset-0 [mask-image:linear-gradient(to_bottom,white,transparent)]",
                className
            )}
        >
            {Array.from({ length: numCircles }, (_, i) => {
                const size = mainCircleSize + i * 200;
                const opacity = adjustedMainCircleOpacity - i * 0.03;
                const animationDelay = `${i * 0.06}s`;
                const borderStyle = i === numCircles - 1 ? "dashed" : "solid";

                return (
                    <div
                        key={i}
                        className={`absolute rounded-full bg-white/15 dark:bg-foreground/25 shadow-2xl border [--i:${i}]`}
                        style={
                            {
                                width: `${size}px`,
                                height: `${size}px`,
                                opacity,
                                animationDelay,
                                borderStyle,
                                borderWidth: "1px",
                                borderColor: `hsl(var(--border-ripple))`,
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%) scale(1)",
                            } as CSSProperties
                        }
                    />
                );
            })}
        </div>
    );
});

Ripple.displayName = "Ripple";

export default Ripple;
