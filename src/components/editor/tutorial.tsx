"use client";
import { useEffect, useState } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

const TUTORIAL_SHOWN_KEY = "bingo-maker-tutorial-shown";

const shadcnDriverStyles = `
.driver-popover {
  border-radius: 0.5rem !important;
  background-color: hsl(var(--background)) !important;
  color: hsl(var(--foreground)) !important;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  border: 1px solid hsl(var(--border)) !important;
  padding: 1.25rem !important;
  font-family: var(--font-sans);
}

.driver-popover-title {
  font-size: 1rem !important;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: hsl(var(--foreground)) !important;
}

.driver-popover-description {
  font-size: 0.875rem;
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

.driver-popover-progress-container {
  margin-top: 0.5rem;
}

.driver-popover-progress {
  background-color: hsl(var(--primary) / 0.1) !important;
}

.driver-popover-progress-steps {
  background-color: hsl(var(--primary)) !important;
}

.driver-popover-prev-btn {
  background-color: hsl(var(--secondary)) !important;
  color: hsl(var(--secondary-foreground)) !important;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none !important;
  font-weight: 500;
}

.driver-popover-prev-btn:hover {
  background-color: hsl(var(--secondary) / 0.9);
}

.driver-popover-next-btn {
  background-color: hsl(var(--primary)) !important;
  color: hsl(var(--primary-foreground)) !important;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none !important;
  font-weight: 500;
}

.driver-popover-next-btn:hover {
  background-color: hsl(var(--primary) / 0.9);
}

.driver-popover-navigation-btns {
  gap: 0.5rem;
}`;

// Define the tutorial steps
const steps = [
  {
    element: "#editor-controls",
    popover: {
      title: "Editor Controls",
      description: "These controls allow you to manage your bingo card.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "#panel-toggle-btn",
    popover: {
      title: "Settings Panel Toggle",
      description: "Click this to show or hide the settings panel on the left.",
      side: "bottom",
    },
  },
  {
    element: "#publish-switch",
    popover: {
      title: "Publish Switch",
      description: "Toggle this switch to make your bingo public or private.",
      side: "bottom",
    },
  },
  {
    element: "#undo-btn",
    popover: {
      title: "Undo Button",
      description: "Click to undo your last change.",
      side: "bottom",
    },
  },
  {
    element: "#redo-btn",
    popover: {
      title: "Redo Button",
      description: "Click to redo a previously undone change.",
      side: "bottom",
    },
  },
  {
    element: "#save-btn",
    popover: {
      title: "Save Button",
      description: "Click to save your bingo card.",
      side: "bottom",
    },
  },
  {
    element: "#share-btn",
    popover: {
      title: "Share Button",
      description: "Click to copy a link to your bingo card.",
      side: "bottom",
    },
  },
  {
    element: "#bingo-title",
    popover: {
      title: "Bingo Title",
      description: "Click on the title to edit it.",
      side: "bottom",
    },
  },
  {
    element: ".bingo-cell",
    popover: {
      title: "Bingo Cell",
      description:
        "Left-click on a cell to add or edit text. Right-click to open the context menu for styling options.",
      side: "right",
    },
  },
  {
    element: "#cells-accordion",
    popover: {
      title: "Cells Controls",
      description: "These settings apply to all cells. Change font, size, colors, and more.",
      side: "left",
    },
  },
  {
    element: "#stamp-accordion",
    popover: {
      title: "Stamp Settings",
      description: "Customize the stamp that appears when a cell is validated.",
      side: "left",
    },
  },
  {
    element: "#background-accordion",
    popover: {
      title: "Background Settings",
      description: "Customize your bingo card's background gradient or image.",
      side: "left",
    },
  },
  {
    element: "#gradient-background",
    popover: {
      title: "Gradient Editor",
      description:
        "Left-click to add a new color spot. Drag spots to reposition. Right-click on the background to change its color.",
      side: "left",
    },
  },
  {
    element: "#image-tab",
    popover: {
      title: "Background Image",
      description: "Switch to this tab to add a background image (requires login).",
      side: "left",
    },
  },
  {
    element: "#grid-accordion",
    popover: {
      title: "Grid Controls",
      description: "Choose between 3×3 or 5×5 grid sizes and click on the displayed grid to validate cells.",
      side: "left",
    },
  },
] as DriveStep[];

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

    const timeoutId = setTimeout(() => {
      try {
        const driverInstance = driver({
          showProgress: true,
          steps: steps,
          overlayColor: "#000",
          animate: true,
          allowClose: true,
          onDestroyed: () => {
            // Mark tutorial as shown
            localStorage.setItem(TUTORIAL_SHOWN_KEY, "true");
            if (onComplete) {
              onComplete();
            }
          },
        });

        driverInstance.drive();

        return () => {
          driverInstance.destroy();
        };
      } catch (error) {
        console.error("Failed to initialize tutorial:", error);
      }
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, hasBeenShown, onComplete]);

  return null;
};

export default EditorTutorial;
