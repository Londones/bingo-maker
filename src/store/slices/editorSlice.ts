import { ImageUploadResponse, BingoPatch } from "./../../types/types";
import { isCellLocalImage } from "@/lib/utils";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Bingo, BingoCell, Style, Background, Stamp, EditorState, LocalImage, ChangeTracker } from "@/types/types";
import { DEFAULT_STYLE, DEFAULT_STAMP, DEFAULT_GRADIENT_CONFIG_STRING } from "@/utils/constants";

// interface ChangeTracker {
//     title?: boolean;
//     titleWidth?: boolean;
//     style?: Partial<Style>;
//     background?: Partial<Background>;
//     stamp?: Partial<Stamp>;
//     cells?: { [id: string]: Partial<BingoCell> };
//     status?: boolean;
// }

const initialBingoState: Bingo = {
  title: "New Bingo",
  titleWidth: 540,
  gridSize: 5,
  cells: Array(25)
    .fill(null)
    .map((_, index) => {
      const baseCell: BingoCell = {
        content: "",
        position: index,
        validated: false,
      };

      return baseCell;
    }),
  style: DEFAULT_STYLE,
  background: {
    value: DEFAULT_GRADIENT_CONFIG_STRING,
  },
  stamp: DEFAULT_STAMP,
  status: "draft",
};

const initialState: EditorState = {
  history: {
    past: [],
    present: initialBingoState,
    future: [],
  },
  canUndo: false,
  canRedo: false,
  canSave: false,
  changes: {} as ChangeTracker, // Track changes for partial updates
};

const pushToHistory = (state: EditorState) => {
  state.history.past.push({ ...state.history.present });
  state.canUndo = true;
  state.history.future = [];
  state.canRedo = false;
  state.canSave = true;
};

export const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    undo: (state) => {
      if (state.history.past.length === 0) return;

      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, -1);

      state.history.future = [state.history.present, ...state.history.future];
      state.history.past = newPast;
      if (previous) {
        state.history.present = previous;
      }

      state.canUndo = newPast.length > 0;
      state.canRedo = true;
      state.canSave = state.canRedo || state.canUndo;
    },
    redo: (state) => {
      if (state.history.future.length === 0) return;

      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);

      state.history.past = [...state.history.past, state.history.present];
      if (next) {
        state.history.present = next;
      }
      state.history.future = newFuture;

      state.canUndo = true;
      state.canRedo = newFuture.length > 0;
      state.canSave = state.canRedo || state.canUndo;
    },
    clearFutureHistory: (state) => {
      state.history.future = [];
      state.canRedo = false;
      state.canSave = false;
    },
    setBingo: (state, action: PayloadAction<Bingo>) => {
      const sortedCells = action.payload.cells.sort((a, b) => a.position - b.position);
      state.history.present = {
        ...action.payload,
        cells: sortedCells,
      };
      const isWIP = action.payload.id === undefined || action.payload.id === null;
      state.canSave = isWIP;
      state.history.future = [];
      state.history.past = [];
      state.canRedo = false;
      state.canUndo = false;
      state.changes = {} as ChangeTracker;
    },
    setTitle: (state, action: PayloadAction<string>) => {
      pushToHistory(state);
      state.history.present.title = action.payload;
      if (state.changes) {
        state.changes.title = true; // Track that title changed
      }
    },
    switchStatus: (state, action: PayloadAction<"draft" | "published">) => {
      pushToHistory(state);
      state.history.present.status = action.payload;
      if (state.changes) {
        state.changes.status = true; // Track that status changed
      }
    },
    setGridSize: (state, action: PayloadAction<number>) => {
      pushToHistory(state);
      const newGridSize = action.payload;
      const oldCells = [...state.history.present.cells];
      const newCellCount = newGridSize * newGridSize;

      const newCells = Array(newCellCount)
        .fill(null)
        .map((_, index) => {
          if (oldCells[index]) {
            return oldCells[index];
          }

          return {
            content: "",
            validated: false,
          } as BingoCell;
        });

      state.history.present.gridSize = newGridSize;
      state.history.present.cells = newCells;

      state.history.present.titleWidth =
        state.history.present.gridSize * state.history.present.style.cellSize +
        state.history.present.style.gap * (state.history.present.gridSize - 1);

      if (state.changes) {
        state.changes.gridSize = true; // Track that grid size changed
        state.changes.titleWidth = true; // Track that title width changed
      }
    },
    updateCell: (state, action: PayloadAction<{ index: number; cell: Partial<BingoCell> }>) => {
      pushToHistory(state);
      state.history.present.cells[action.payload.index] = {
        ...state.history.present.cells[action.payload.index],
        ...action.payload.cell,
      } as BingoCell;
      // Track cell changes
      if (state.changes) {
        // Get the actual cell we're updating
        const currentCell = state.history.present.cells[action.payload.index];

        // Initialize cells object if needed
        if (!state.changes.cells) {
          state.changes.cells = {};
        }

        // Use cell ID if available, otherwise position as fallback
        const cellId = currentCell?.id || action.payload.index.toString();

        // Update the change tracker
        state.changes.cells[cellId] = {
          ...state.changes.cells[cellId],
          ...action.payload.cell,
          // Always include position for reference
          position: action.payload.index,
        };
      }
    },
    updateStyle: (state, action: PayloadAction<Partial<Style>>) => {
      pushToHistory(state);
      state.history.present.style = {
        ...state.history.present.style,
        ...action.payload,
      };
      // Track style changes
      if (state.changes)
        state.changes.style = {
          ...state.changes?.style,
          ...action.payload,
        };
    },
    updateBackground: (state, action: PayloadAction<Partial<Background>>) => {
      pushToHistory(state);
      state.history.present.background = {
        ...state.history.present.background,
        ...(action.payload as Background),
      };
      // Track background changes
      if (state.changes)
        state.changes.background = {
          ...state.changes?.background,
          ...action.payload,
        };
    },
    updateStamp: (state, action: PayloadAction<Partial<Stamp>>) => {
      pushToHistory(state);
      state.history.present.stamp = {
        ...state.history.present.stamp,
        ...(action.payload as Stamp),
      };
      // Track stamp changes
      if (state.changes)
        state.changes.stamp = {
          ...state.changes?.stamp,
          ...action.payload,
        };
    },
    toggleStamp: (state, action: PayloadAction<number>) => {
      pushToHistory(state);
      const cell = state.history.present.cells[action.payload];
      if (cell) {
        cell.validated = !cell.validated;
      }
      // Track cell changes
      if (state.changes) {
        state.changes.cells = {
          ...state.changes?.cells,
          [cell!.id!]: {
            ...state.changes?.cells?.[action.payload],
            validated: cell?.validated,
          },
        };
      }
    },
    setLocalImage: (state, action: PayloadAction<LocalImage | undefined>) => {
      pushToHistory(state);
      if (!action.payload) {
        state.history.present.localImages = action.payload;
      } else if (action.payload) {
        state.history.present.localImages = [...(state.history.present.localImages || []), action.payload];
        const image = action.payload;

        if (isCellLocalImage(image)) {
          const cell = state.history.present.cells[image.position];
          if (!cell) {
            console.error(`Cell at position ${image.position} does not exist`);
            return;
          } else {
            cell.cellStyle = {
              ...cell.cellStyle,
              cellBackgroundImage: image.url,
              cellBackgroundOpacity: state.history.present.background.backgroundImageOpacity
                ? state.history.present.background.backgroundImageOpacity
                : 100,
              cellBackgroundImageSize: 100,
              cellBackgroundImagePosition: "50% 50%",
            };
          }
        } else if (image.type === "background") {
          state.history.present.background = {
            ...state.history.present.background,
            backgroundImage: image.url,
            backgroundImageOpacity: state.history.present.background.backgroundImageOpacity
              ? state.history.present.background.backgroundImageOpacity
              : 100,
            backgroundImageSize: 100,
            backgroundImagePosition: "50% 50%",
          };
        } else if (image.type === "stamp") {
          state.history.present.stamp = {
            ...state.history.present.stamp,
            value: image.url,
          };
        }
      }
    },
    removeCellLocalImage: (state, action: PayloadAction<number>) => {
      const cell = state.history.present.cells[action.payload];
      if (cell && cell.cellStyle) {
        cell.cellStyle = {
          ...cell.cellStyle,
          cellBackgroundImage: undefined,
          cellBackgroundImageOpacity: undefined,
        };
      }

      state.history.present.localImages = state.history.present.localImages?.filter(
        (img) => !isCellLocalImage(img) || img.position !== action.payload
      );
    },
    removeLocalBackgroundImage: (state) => {
      pushToHistory(state);
      state.history.present.background = {
        ...state.history.present.background,
        backgroundImage: undefined,
        backgroundImageOpacity: undefined,
      };
      state.history.present.localImages = state.history.present.localImages?.filter((img) => img.type !== "background");
    },
    setImageUrls: (state, action: PayloadAction<ImageUploadResponse>) => {
      const { cellImages, backgroundImage, stampImage } = action.payload;
      if (cellImages && cellImages.length > 0) {
        for (const image of cellImages) {
          const cell = state.history.present.cells[image.position];
          if (!cell) {
            console.error(`Cell at position ${image.position} does not exist`);
            continue;
          }

          if (!cell.cellStyle) {
            cell.cellStyle = {};
          }

          cell.cellStyle = {
            ...cell.cellStyle,
            cellBackgroundImage: image.url,
            cellBackgroundOpacity: cell.cellStyle.cellBackgroundOpacity || 1,
          };
        }

        state.history.present.localImages = state.history.present.localImages?.filter((img) => !isCellLocalImage(img));
      }

      if (backgroundImage) {
        state.history.present.background = {
          ...state.history.present.background,
          backgroundImage: backgroundImage,
          backgroundImageOpacity: state.history.present.background.backgroundImageOpacity || 1,
        };
        state.history.present.localImages = state.history.present.localImages?.filter(
          (img) => img.type !== "background"
        );
      }

      if (stampImage) {
        state.history.present.stamp = {
          ...state.history.present.stamp,
          value: stampImage,
        };
        state.history.present.localImages = state.history.present.localImages?.filter((img) => img.type !== "stamp");
      }

      if (state.history.present.localImages?.length === 0) {
        state.history.present.localImages = undefined;
      }
    },
    extractChanges: {
      reducer: (state) => {
        // Reset change tracking after extraction
        state.changes = {} as ChangeTracker;
        return state;
      },
      prepare: () => {
        return { payload: undefined };
      },
    },
    resetEditor: (state) => {
      // Reset each property individually to maintain correct state reference
      state.history = {
        past: [],
        present: { ...initialBingoState },
        future: [],
      };
      state.canUndo = false;
      state.canRedo = false;
      state.canSave = false;
      state.changes = {} as ChangeTracker;
    },
  },
});

// Create a selector function outside the slice to extract changes
export const selectChanges = (state: EditorState): BingoPatch => {
  const changes: BingoPatch = {};

  console.log("Extracting changes:", state.changes);

  if (state.changes?.title) {
    changes.title = state.history.present.title;
    // Include titleWidth whenever title changes, if it exists
    if (state.history.present.titleWidth !== undefined) {
      changes.titleWidth = state.history.present.titleWidth;
    }
  }

  if (state.changes?.status) {
    changes.status = state.history.present.status;
  }

  if (state.changes?.style && Object.keys(state.changes.style).length > 0) {
    changes.style = state.changes.style;
  }

  if (state.changes?.background && Object.keys(state.changes.background).length > 0) {
    changes.background = state.changes.background;
  }

  if (state.changes?.stamp && Object.keys(state.changes.stamp).length > 0) {
    changes.stamp = state.changes.stamp;
  }

  if (state.changes?.cells) {
    changes.cells = Object.entries(state.changes.cells).map(([id, cellChanges]) => ({
      id: id,
      ...cellChanges,
    }));
  }

  return changes;
};

export const {
  undo,
  redo,
  setBingo,
  setTitle,
  switchStatus,
  setGridSize,
  updateCell,
  updateStyle,
  updateBackground,
  updateStamp,
  toggleStamp,
  setLocalImage,
  removeCellLocalImage,
  removeLocalBackgroundImage,
  setImageUrls,
  resetEditor,
  clearFutureHistory,
  extractChanges,
} = editorSlice.actions;

export default editorSlice.reducer;
