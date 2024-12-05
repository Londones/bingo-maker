import { GradientConfig, RadialGradientStop } from "@/types/types";

const gradientStops: RadialGradientStop[] = [
    {
        position: { x: 40, y: 20 },
        color: "hsla(28,100%,74%,1)",
        opacity: 1,
        radius: 0.5,
    },
    {
        position: { x: 80, y: 0 },
        color: "hsla(189,100%,56%,1)",
        opacity: 1,
        radius: 0.5,
    },
    {
        position: { x: 0, y: 50 },
        color: "hsla(355,100%,93%,1)",
        opacity: 1,
        radius: 0.5,
    },
    {
        position: { x: 80, y: 50 },
        color: "hsla(340,100%,76%,1)",
        opacity: 1,
        radius: 0.5,
    },
    {
        position: { x: 0, y: 100 },
        color: "hsla(22,100%,77%,1)",
        opacity: 1,
        radius: 0.5,
    },
    {
        position: { x: 80, y: 100 },
        color: "hsla(242,100%,70%,1)",
        opacity: 1,
        radius: 0.5,
    },
    {
        position: { x: 0, y: 0 },
        color: "hsla(343,100%,76%,1)",
        opacity: 1,
        radius: 0.5,
    },
];

const DEFAULT_GRADIENT_CONFIG: GradientConfig = {
    backgroundColor: "hsla(0,100%,50%,1)",
    stops: gradientStops,
};

export const DEFAULT_GRADIENT_CONFIG_STRING = JSON.stringify(DEFAULT_GRADIENT_CONFIG);

export const DEFAULT_STYLE = {
    fontFamily: "Arial",
    fontSize: 16,
    color: "#000000",
    cellSize: 100,
    gap: 10,
};

export const DEFAULT_STAMP = {
    type: "emoji",
    value: "🎉",
    size: 100,
    opacity: 1,
};
