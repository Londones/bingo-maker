import { GradientConfig, RadialGradientStop, Stamp, Style } from "@/types/types";

const gradientStops: RadialGradientStop[] = [
  {
    position: { x: 15, y: 15 },
    color: "hsla(330, 86%, 70%, 0.65)",
    opacity: 0.65,
    radius: 0.55,
  },
  {
    position: { x: 85, y: 25 },
    color: "hsla(27, 96%, 61%, 0.45)",
    opacity: 0.45,
    radius: 0.5,
  },
  {
    position: { x: 75, y: 88 },
    color: "hsla(234, 89%, 74%, 0.65)",
    opacity: 0.65,
    radius: 0.55,
  },
  {
    position: { x: 20, y: 85 },
    color: "hsla(224, 82%, 66%, 0.4)",
    opacity: 0.4,
    radius: 0.5,
  },
];

const DEFAULT_GRADIENT_CONFIG: GradientConfig = {
  backgroundColor: "hsla(258, 38%, 10%, 1)",
  stops: gradientStops,
};

export const DEFAULT_GRADIENT_CONFIG_STRING = JSON.stringify(DEFAULT_GRADIENT_CONFIG);

export const DEFAULT_STYLE: Style = {
  fontFamily: "Arial",
  fontSize: 16,
  color: "#000000",
  cellSize: 100,
  gap: 10,
  cellBorderColor: "#000000",
  cellBorderWidth: 1,
  cellBackgroundColor: "#ffffff",
  fontWeight: "normal",
  fontStyle: "normal",
  cellBackgroundOpacity: 100,
};

export const DEFAULT_STAMP: Stamp = {
  type: "text",
  value: "✔️",
  size: 80,
  opacity: 1,
};

export const GRID_SIZES = [3, 5] as const;

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

export const FONT_FAMILIES = [
  { value: "Arial", label: "Arial" },
  { value: "Inter", label: "Inter" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Courier New", label: "Courier New" },
  { value: "Verdana", label: "Verdana" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Comic Sans MS", label: "Comic Sans MS" },
  { value: "Impact", label: "Impact" },
  { value: "Lucida Console", label: "Lucida Console" },
  { value: "Lucida Sans Unicode", label: "Lucida Sans Unicode" },
  { value: "Palatino Linotype", label: "Palatino Linotype" },
  { value: "Arial Black", label: "Arial Black" },
  { value: "Franklin Gothic Medium", label: "Franklin Gothic Medium" },
  { value: "Symbol", label: "Symbol" },
  { value: "Webdings", label: "Webdings" },
  { value: "Wingdings", label: "Wingdings" },
  { value: "MS Sans Serif", label: "MS Sans Serif" },
];

export const ITEMS_PER_PAGE = 9;
