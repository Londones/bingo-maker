import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Bingo, BingoCell, Style, Background, Stamp, EditorState } from "@/types/types";
import { DEFAULT_STYLE, DEFAULT_STAMP, DEFAULT_GRADIENT_CONFIG_STRING } from "@/utils/constants";

const initialBingoState: Bingo = {
    id: "",
    title: "New Bingo",
    gridSize: 5,
    cells: Array(25)
        .fill(null)
        .map((_, index) => {
            const baseCell: BingoCell = {
                id: `temp-${index}`,
                content: "",
                position: index,
                validated: false,
            };

            if (index === 0) {
                return {
                    ...baseCell,
                    cellStyle: {
                        cellBackgroundImage:
                            "https://r6kb2iiay0.ufs.sh/f/d7e4677c-12c2-44da-98a7-2b375749e276-jcyyig.png",
                        cellBackgroundOpacity: 1,
                    },
                } as BingoCell;
            }

            return baseCell;
        }),
    style: DEFAULT_STYLE,
    background: {
        type: "gradient",
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
};

const pushToHistory = (state: EditorState) => {
    state.history.past.push({ ...state.history.present });
    state.canUndo = true;
    state.history.future = [];
    state.canRedo = false;
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
        },
        setBingo: (state, action: PayloadAction<Bingo>) => {
            state.history.present = action.payload;
            state.history.past = [];
            state.history.future = [];
            state.canUndo = false;
            state.canRedo = false;
        },
        setTitle: (state, action: PayloadAction<string>) => {
            pushToHistory(state);
            state.history.present.title = action.payload;
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
        },
        updateCell: (state, action: PayloadAction<{ index: number; cell: Partial<BingoCell> }>) => {
            pushToHistory(state);
            state.history.present.cells[action.payload.index] = {
                ...state.history.present.cells[action.payload.index],
                ...action.payload.cell,
            } as BingoCell;
        },
        updateStyle: (state, action: PayloadAction<Partial<Style>>) => {
            pushToHistory(state);
            state.history.present.style = {
                ...state.history.present.style,
                ...action.payload,
            };
        },
        updateBackground: (state, action: PayloadAction<Partial<Background>>) => {
            pushToHistory(state);
            state.history.present.background = {
                ...state.history.present.background,
                ...(action.payload as Background),
            };
        },
        updateStamp: (state, action: PayloadAction<Partial<Stamp>>) => {
            pushToHistory(state);
            state.history.present.stamp = {
                ...state.history.present.stamp,
                ...(action.payload as Stamp),
            };
        },
        toggleStamp: (state, action: PayloadAction<number>) => {
            pushToHistory(state);
            const cell = state.history.present.cells[action.payload];
            if (cell) {
                cell.validated = !cell.validated;
            }
        },
        resetEditor: () => initialState,
    },
});

export const {
    undo,
    redo,
    setBingo,
    setTitle,
    setGridSize,
    updateCell,
    updateStyle,
    updateBackground,
    updateStamp,
    toggleStamp,
    resetEditor,
} = editorSlice.actions;

export default editorSlice.reducer;
