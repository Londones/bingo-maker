"use client";
import { useEffect, useState } from "react";
import type { DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const TUTORIAL_SHOWN_KEY = "bingo-maker-tutorial-shown";

const shadcnDriverStyles = `
.driver-popover {
  border-radius: 0.75rem !important;
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  box-shadow: 0 18px 36px -8px rgb(0 0 0 / 0.35), 0 6px 12px -4px rgb(0 0 0 / 0.2);
  border: 1px solid hsl(var(--border)) !important;
  padding: 1.15rem 1.25rem !important;
  font-family: var(--font-sans);
  max-width: 320px !important;
}

.driver-popover-title {
  font-size: 0.95rem !important;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: hsl(var(--foreground)) !important;
}

.driver-popover-description {
  font-size: 0.84rem;
  color: hsl(var(--muted-foreground)) !important;
  line-height: 1.5;
}

.driver-popover-footer {
  margin-top: 1rem;
}

.driver-popover-close-btn {
  color: hsl(var(--foreground)) !important;
  opacity: 0.7;
  transition: opacity 150ms;
}

.driver-popover-close-btn:hover {
  opacity: 1;
  background-color: hsl(var(--accent));
}

.driver-popover-arrow {
  color: hsl(var(--background)) !important;
  border-color: hsl(var(--border)) !important;
}

.driver-popover-progress-text {
  font-size: 0.75rem !important;
  color: hsl(var(--muted-foreground)) !important;
}

.driver-popover-prev-btn {
  background-color: hsl(var(--secondary)) !important;
  color: hsl(var(--secondary-foreground)) !important;
  padding: 0.4rem 0.85rem;
  border-radius: 0.5rem;
  border: none !important;
  font-weight: 500;
  text-shadow: none !important;
}

.driver-popover-prev-btn:hover {
  background-color: hsl(var(--secondary) / 0.85);
}

.driver-popover-next-btn {
  background-color: hsl(var(--primary)) !important;
  color: hsl(var(--primary-foreground)) !important;
  padding: 0.4rem 0.85rem;
  border-radius: 0.5rem;
  border: none !important;
  font-weight: 500;
  text-shadow: none !important;
}

.driver-popover-next-btn:hover {
  background-color: hsl(var(--primary) / 0.9);
}

.driver-popover-navigation-btns {
  gap: 0.5rem;
}`;

// Tutorial steps aligned with the floating Canvas Dock editor UI
const steps: DriveStep[] = [
  {
    element: "#editor-controls",
    popover: {
      title: "Top Controls",
      description: "Reset the board, switch between Draft and Published, undo or redo, save, export as PNG, or share.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#publish-switch",
    popover: {
      title: "Draft or Published",
      description: "Keep your board as a private draft while editing, or publish it so anyone with the link can view it.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#save-btn",
    popover: {
      title: "Save, Export & Share",
      description:
        "Save your changes here. Use the buttons right next to it to download a PNG image or open the shareable board.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#bingo-title",
    popover: {
      title: "Board Title",
      description: "Click the title directly on the canvas to rename your bingo card.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: ".bingo-cell",
    popover: {
      title: "Edit & Style Squares",
      description:
        "Click any square to type its text and select it. While selected, switch to Cell # in the Cells window to style or add an image to just that square.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#editor-tool-dock",
    popover: {
      title: "Floating Tool Dock",
      description:
        "Open or close inspector windows from this dock. On desktop, drag any window by its top bar to arrange your workspace.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#cells-accordion",
    popover: {
      title: "Cells & Typography",
      description: "Change fonts, text size, colors, cell size, gap, borders, and individual cell overrides.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#background-accordion",
    popover: {
      title: "Backdrop",
      description:
        "Pick a mesh gradient preset, drag color spots on the pad (double-click to add one), or upload a background image.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#stamp-accordion",
    popover: {
      title: "Stamp",
      description: "Choose the emoji or mark and opacity shown when squares are stamped.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#grid-accordion",
    popover: {
      title: "Grid & Marks",
      description: "Switch between 3x3 and 5x5 grids, and click squares in the mini grid to stamp or clear them.",
      side: "top",
      align: "center",
    },
  },
];

interface EditorTutorialProps {
  enabled?: boolean;
  onComplete?: () => void;
}

const EditorTutorial = ({ enabled = true, onComplete }: EditorTutorialProps) => {
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const styleId = "shadcn-driver-styles";
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = shadcnDriverStyles;
      document.head.appendChild(styleElement);
    }

    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tutorialShown = localStorage.getItem(TUTORIAL_SHOWN_KEY) === "true";
    setHasBeenShown(tutorialShown);
  }, []);

  useEffect(() => {
    if (!enabled || hasBeenShown) {
      return;
    }

    let driverInstance: { destroy: () => void } | null = null;
    let cancelled = false;

    const timeoutId = setTimeout(() => {
      void import("driver.js")
        .then(({ driver }) => {
          if (cancelled) return;
          const activeSteps = steps.filter((step) => {
            if (typeof step.element !== "string") return true;
            return document.querySelector(step.element) !== null;
          });
          if (activeSteps.length === 0) return;

          const instance = driver({
            showProgress: true,
            steps: activeSteps,
            overlayColor: "#000",
            animate: true,
            allowClose: true,
            onDestroyed: () => {
              localStorage.setItem(TUTORIAL_SHOWN_KEY, "true");
              if (onComplete) {
                onComplete();
              }
            },
          });

          driverInstance = instance;
          instance.drive();
        })
        .catch((error) => {
          console.error("Failed to initialize tutorial:", error);
        });
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      driverInstance?.destroy();
    };
  }, [enabled, hasBeenShown, onComplete]);

  return null;
};

export default EditorTutorial;
